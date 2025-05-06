'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { convertLatLonToXYZ } from '../utils/geoMath';
import { DecalGeometry } from 'three/examples/jsm/Addons.js';

const SUN_RADIUS = 2;
const MIN_DIAMETER = 0.03; // tweak as needed

const generateHaloTexture = () => {
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
  return new THREE.CanvasTexture(canvas);
};

const generateSunMaterial = () => {
  const textureloader = new THREE.TextureLoader();

  const colorMap = textureloader.load('/textures/8k_sun.jpg');
  const bumpMap = textureloader.load('/textures/normal_map.png');

  const sunMat = new THREE.MeshStandardMaterial({
    map: colorMap,
    bumpMap: bumpMap,
    bumpScale: 0.05,
    emissiveMap: colorMap,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.5,
    roughness: 1,
    metalness: 0,
  });
  return sunMat;
};

const generateDecalMaterial = () => {
  const textureloader = new THREE.TextureLoader();
  const spotMask = textureloader.load('/textures/sunspot_mask.png');
  spotMask.minFilter = THREE.LinearFilter;
  spotMask.magFilter = THREE.LinearFilter;
  spotMask.generateMipmaps = false;
  const decalMat = new THREE.MeshStandardMaterial({
    color: 0x8b4513,
    alphaMap: spotMask,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    roughness: 1,
    metalness: 0,
  });
  return decalMat;
};

function initRenderer(canvas: HTMLCanvasElement) {
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
}

function initSceneCamera() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );
  camera.position.set(0, 0, 8);
  return { scene, camera };
}

function initControls(
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer,
) {
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.minDistance = 4;
  controls.maxDistance = 20;
  return controls;
}

export function useSunScene(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  events: Ev[],
  spin?: boolean,
) {
  const spinRef = useRef<boolean>(!!spin);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const controlsRef = useRef<OrbitControls>(null);
  const initialCamPos = useRef<THREE.Vector3>(null);
  const initialTargetPos = useRef<THREE.Vector3>(null);

  // -- internal scene graph refs:
  const sunRootRef = useRef<THREE.Group>(null);
  const spotGroupRef = useRef<THREE.Group>(null);

  // keep spinRef in sync
  useEffect(() => {
    spinRef.current = !!spin;
  }, [spin]);

  // mount: build renderer, scene, sun+halo, empty spot‐group, etc.
  useEffect(() => {
    if (typeof document === 'undefined') return; // guard
    const canvas = canvasRef.current;
    if (!canvas) return;
    const textureloader = new THREE.TextureLoader();

    const renderer = initRenderer(canvas);
    const { scene, camera } = initSceneCamera();
    cameraRef.current = camera;

    scene.background = textureloader.load('/textures/8k_stars_milky_way.jpg');
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const pt = new THREE.PointLight(0xffffff, 1);
    pt.position.set(0, 0, 8);
    scene.add(pt);

    // Sun root
    const sunRoot = new THREE.Group();
    const sunMat = generateSunMaterial();
    // sphere
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(SUN_RADIUS, 64, 64),
      sunMat,
    );
    sunRoot.add(sphere);
    // halo
    const haloTexture = generateHaloTexture();
    const halo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: haloTexture,
        color: 0xffffaa,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    halo.scale.set(5, 5, 1);
    sunRoot.add(halo);

    // spot‐container
    const spotGroup = new THREE.Group();
    sunRoot.add(spotGroup);

    scene.add(sunRoot);
    sunRootRef.current = sunRoot;
    spotGroupRef.current = spotGroup;

    // controls + animate
    const controls = initControls(camera, renderer);
    controlsRef.current = controls;

    // capture initial positions once
    if (!initialCamPos.current) {
      initialCamPos.current = camera.position.clone();
      initialTargetPos.current = controls.target.clone();
    }

    const animate = () => {
      requestAnimationFrame(animate);
      // only spin when play is on
      if (spinRef.current && sunRootRef.current) {
        sunRootRef.current.rotation.y += 0.0055;
      }
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight, false);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      sunRoot.traverse(o => {
        if ((o as THREE.Mesh).geometry) (o as THREE.Mesh).geometry.dispose();
        const m = (o as any).material;
        if (Array.isArray(m)) m.forEach(x => x.dispose());
        else m?.dispose();
      });
    };
  }, [canvasRef]);

  // update spots whenever `events` changes
  useEffect(() => {
    const sunRoot = sunRootRef.current;
    const spotGroup = spotGroupRef.current;
    if (!sunRoot || !spotGroup) return;

    // clear old
    spotGroup.clear();

    // find the sphere mesh to project onto
    const sphere = sunRoot.children.find(
      c => (c as THREE.Mesh).geometry instanceof THREE.SphereGeometry,
    ) as THREE.Mesh;

    // recreate decals
    for (const ev of events) {
      const { x, y, z } = convertLatLonToXYZ(ev.lat, ev.lon, SUN_RADIUS);
      const pos = new THREE.Vector3(x, y, z);
      const orient = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        pos.clone().normalize(),
      );
      const euler = new THREE.Euler().setFromQuaternion(orient);

      // world radius = R * sin(angular)
      const r = SUN_RADIUS * Math.sin(ev.sizeRad);
      const dia = Math.max(2 * r, MIN_DIAMETER);

      const geo = new DecalGeometry(
        sphere,
        pos,
        euler,
        new THREE.Vector3(dia, dia, 0.2),
      );
      const decalMat = generateDecalMaterial();
      const mesh = new THREE.Mesh(geo, decalMat);
      spotGroup.add(mesh);
    }
  }, [events]);

  return {
    cameraRef,
    controlsRef,
    initialCamPos,
    initialTargetPos,
  };
}
