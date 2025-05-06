'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { convertLatLonToXYZ } from '../utils/geoMath';
import { DecalGeometry } from 'three/examples/jsm/Addons.js';

type Ev = { lat: number; lon: number; sizeRad: number };

const SUN_RADIUS = 2;
const MIN_DIAMETER = 0.03;

const initRenderer = (canvas: HTMLCanvasElement) => {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  const gl = renderer.getContext() as WebGLRenderingContext;
  const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
  const w = window.innerWidth,
    h = window.innerHeight;
  const dpr = Math.min(
    window.devicePixelRatio,
    Math.floor(maxTex / w),
    Math.floor(maxTex / h),
    1.5,
  );
  renderer.setPixelRatio(dpr);
  renderer.setSize(w, h, false);
  return renderer;
};

const initSceneCamera = () => {
  const isMobile = window.innerWidth < 600;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );
  camera.position.set(0, 0, isMobile ? 12 : 8);
  return { scene, camera };
};

const initControls = (
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer,
) => {
  const ctrls = new OrbitControls(camera, renderer.domElement);
  ctrls.enableDamping = true;
  ctrls.minDistance = 4;
  ctrls.maxDistance = 20;
  return ctrls;
};

const makeSun = () => {
  const loader = new THREE.TextureLoader();
  const mat = new THREE.MeshStandardMaterial({
    map: loader.load('/textures/8k_sun.jpg'),
    bumpMap: loader.load('/textures/normal_map.png'),
    bumpScale: 0.05,
    emissiveMap: loader.load('/textures/8k_sun.jpg'),
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.5,
    roughness: 1,
    metalness: 0,
  });
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(SUN_RADIUS, 64, 64),
    mat,
  );
  return mesh;
};

const makeHalo = () => {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grd = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.3,
    size / 2,
    size / 2,
    size * 0.5,
  );
  grd.addColorStop(0, 'rgba(255,255,200,0.6)');
  grd.addColorStop(1, 'rgba(255,255,200,0)');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: tex,
      color: 0xffffaa,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  sprite.scale.set(5, 5, 1);
  return sprite;
};

const makeDecalMat = () => {
  const loader = new THREE.TextureLoader();
  const mask = loader.load('/textures/sunspot_mask.png');
  mask.minFilter = THREE.LinearFilter;
  mask.magFilter = THREE.LinearFilter;
  mask.generateMipmaps = false;
  return new THREE.MeshStandardMaterial({
    color: 0x8b4513,
    alphaMap: mask,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    roughness: 1,
    metalness: 0,
  });
};

export function useSunScene(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  events: Ev[],
  spin = true,
) {
  const spinRef = useRef(spin);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const controlsRef = useRef<OrbitControls>(null);
  const initialCamPos = useRef<THREE.Vector3>(null);
  const initialTarget = useRef<THREE.Vector3>(null);

  const sunRootRef = useRef<THREE.Group>(null);
  const currentSpots = useRef<THREE.Group>(null);

  // keep spinRef in sync
  useEffect(() => {
    spinRef.current = spin;
  }, [spin]);

  // mount scene, sun + halo
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = initRenderer(canvas);
    const { scene, camera } = initSceneCamera();
    cameraRef.current = camera;

    scene.background = new THREE.TextureLoader().load(
      '/textures/8k_stars_milky_way.jpg',
    );
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const pt = new THREE.PointLight(0xffffff, 1);
    pt.position.set(0, 0, 8);
    scene.add(pt);

    // root group
    const root = new THREE.Group();
    root.add(makeSun());
    root.add(makeHalo());
    scene.add(root);
    sunRootRef.current = root;

    // controls + loop
    const ctrls = initControls(camera, renderer);
    controlsRef.current = ctrls;
    if (!initialCamPos.current) {
      initialCamPos.current = camera.position.clone();
      initialTarget.current = ctrls.target.clone();
    }

    const tick = () => {
      requestAnimationFrame(tick);
      if (spinRef.current) root.rotation.y += 0.0055;
      ctrls.update();
      renderer.render(scene, camera);
    };
    tick();

    const onR = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight, false);
    };
    window.addEventListener('resize', onR);

    return () => {
      window.removeEventListener('resize', onR);
      renderer.dispose();
      root.traverse(o => {
        if ((o as THREE.Mesh).geometry) (o as THREE.Mesh).geometry.dispose();
        const m = (o as any).material;
        if (Array.isArray(m)) m.forEach(x => x.dispose());
        else m?.dispose();
      });
    };
  }, [canvasRef]);

  // cross‑fade decals on `events` change
  useEffect(() => {
    const root = sunRootRef.current;
    if (!root) return;

    // build new group
    const newGroup = new THREE.Group();
    const sphere = root.children.find(
      c => (c as THREE.Mesh).geometry instanceof THREE.SphereGeometry,
    ) as THREE.Mesh;
    const decalMat = makeDecalMat();

    for (const ev of events) {
      const { x, y, z } = convertLatLonToXYZ(ev.lat, ev.lon, SUN_RADIUS);
      const pos = new THREE.Vector3(x, y, z);
      const orient = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        pos.clone().normalize(),
      );
      const euler = new THREE.Euler().setFromQuaternion(orient);
      const worldR = SUN_RADIUS * Math.sin(ev.sizeRad);
      const dia = Math.max(worldR * 2, MIN_DIAMETER);

      const geo = new DecalGeometry(
        sphere,
        pos,
        euler,
        new THREE.Vector3(dia, dia, 0.2),
      );
      const mesh = new THREE.Mesh(geo, decalMat.clone());
      mesh.material.transparent = true;
      mesh.material.opacity = 0;
      newGroup.add(mesh);
    }

    // add & fade‑in
    root.add(newGroup);
    gsap.to(
      newGroup.children.map(m => (m as THREE.Mesh).material),
      { opacity: 1, duration: 1, ease: 'power1.inOut' },
    );

    // fade‑out & remove old
    if (currentSpots.current) {
      const old = currentSpots.current;
      gsap.to(
        old.children.map(m => (m as THREE.Mesh).material),
        {
          opacity: 0,
          duration: 1,
          ease: 'power1.inOut',
          onComplete: () => {
            root.remove(old);
            old.traverse(o => {
              if ((o as THREE.Mesh).geometry)
                (o as THREE.Mesh).geometry.dispose();
              const m = (o as any).material;
              if (Array.isArray(m)) m.forEach(x => x.dispose());
              else m?.dispose();
            });
          },
        },
      );
    }

    currentSpots.current = newGroup;
  }, [events]);

  return { cameraRef, controlsRef, initialCamPos, initialTarget };
}
