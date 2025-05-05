'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { convertLatLonToXYZ } from '../utils/geoMath';
import { DecalGeometry } from 'three/examples/jsm/Addons.js';

gsap.registerPlugin(ScrollTrigger);

const DEBUG = false;

function checkGLError(gl: WebGLRenderingContext, stage: string) {
  if (!DEBUG) return;
  const err = gl.getError();
  if (err !== gl.NO_ERROR) {
    console.error(`🛑 WebGL error at "${stage}":`, err);
  }
}

/**
 * Returns a CanvasTexture: a dark umbra + penumbra fading
 * to full transparency, perfect for a sunspot sprite.
 */
function makeSunspotTexture(size = 128): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const cx = size / 2;
  const cy = size / 2;
  const innerR = size * 0.2; // solid dark core
  const outerR = size * 0.5; // fade to transparent

  const grad = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
  grad.addColorStop(0.0, 'rgba(0,0,0,1)'); // umbra
  grad.addColorStop(0.6, 'rgba(0,0,0,0.6)'); // penumbra
  grad.addColorStop(1.0, 'rgba(0,0,0,0)'); // fully transparent

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function makeHaloTexture(size = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grd = ctx.createRadialGradient(
    size / 2,
    size / 2, // center
    size * 0.3, // inner radius
    size / 2,
    size / 2, // center
    size * 0.5, // outer radius
  );
  // center is bright
  grd.addColorStop(0, 'rgba(255,255,200,0.6)');
  // fall off to fully transparent
  grd.addColorStop(1, 'rgba(255,255,200,0.0)');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

// Helper: initialize WebGL renderer
function initRenderer(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  const gl = renderer.getContext() as WebGLRenderingContext;
  const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
  const w = window.innerWidth;
  const h = window.innerHeight;
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

// Helper: create scene and camera
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

// Helper: create Sun group for rotation + markers
function initSunGroup(events: Ev[]) {
  const group = new THREE.Group();
  const loader = new THREE.TextureLoader();

  // 1) Load your albedo, bump and emissive maps
  const colorMap = loader.load('/textures/8k_sun.jpg');
  const bumpMap = loader.load('/textures/normal_map.png');
  const emissiveMap = colorMap;

  // Sun mesh
  const sunGeo = new THREE.SphereGeometry(2, 64, 64);
  const sunMat = new THREE.MeshStandardMaterial({
    map: colorMap,
    bumpMap: bumpMap,
    bumpScale: 0.05,
    emissiveMap: emissiveMap,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.5,
    roughness: 1,
    metalness: 0,
  });
  const sunMesh = new THREE.Mesh(sunGeo, sunMat);
  group.add(sunMesh);

  //   halo
  const haloTex = makeHaloTexture(512);
  const haloMat = new THREE.SpriteMaterial({
    map: haloTex,
    color: 0xffffaa,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const haloSprite = new THREE.Sprite(haloMat);

  // 3) scale it so it envelopes your sun (radius=2 → diameter=4)
  const haloSize = 5; // tweak until it looks good
  haloSprite.scale.set(haloSize, haloSize, 1);

  // 4) add it to the same group as your sun mesh
  group.add(haloSprite);

  // 5) Realistic sunspots: procedurally generate a circular gradient
  const spotTex = makeSunspotTexture(256);
  spotTex.minFilter = THREE.LinearMipMapLinearFilter;
  spotTex.magFilter = THREE.LinearFilter;

  const decalMat = new THREE.MeshStandardMaterial({
    map: spotTex,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    roughness: 1,
    metalness: 0,
  });

  // project each sunspot and collect into markers[]
  const markers: THREE.Mesh[] = events.map(evt => {
    const pos = new THREE.Vector3(
      ...Object.values(convertLatLonToXYZ(evt.lat, evt.lon, 2)),
    );
    const normal = pos.clone().normalize();
    const orient = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      normal,
    );
    const euler = new THREE.Euler().setFromQuaternion(orient);
    const size = new THREE.Vector3(evt.size * 4, evt.size * 4, 0.2);
    const decalGeo = new DecalGeometry(sunMesh, pos, euler, size);
    const decalMesh = new THREE.Mesh(decalGeo, decalMat);
    group.add(decalMesh);
    return decalMesh;
  });

  return { group, markers };
}

// Helper: init orbit controls
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
  selectedIdx: number,
) {
  const markersRef = useRef<THREE.Object3D[]>([]);
  const groupRef = useRef<THREE.Group | null>(null);

  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const controlsRef = useRef<OrbitControls>(null);
  const initialCamPos = useRef<THREE.Vector3>(null);
  const initialTargetPos = useRef<THREE.Vector3>(null);

  // Init on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = initRenderer(canvas);
    const { scene, camera } = initSceneCamera();
    cameraRef.current = camera;

    const loader = new THREE.TextureLoader();
    scene.background = loader.load('/textures/8k_stars_milky_way.jpg');

    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    const point = new THREE.PointLight(0xffffff, 1);
    point.position.set(0, 0, 8); // place at camera (or wherever you like)
    scene.add(ambient, point);

    const { group, markers } = initSunGroup(events);
    markersRef.current = markers;
    scene.add(group);
    groupRef.current = group;

    const controls = initControls(camera, renderer);
    controlsRef.current = controls;

    // snapshot initial state once
    if (!initialCamPos.current) {
      initialCamPos.current = camera.position.clone();
      initialTargetPos.current = controls.target.clone();
    }

    // continuous rotation
    function rotateSun() {
      if (groupRef.current) groupRef.current.rotation.y += 0.0055;
    }

    // render loop
    const animate = () => {
      requestAnimationFrame(animate);
      rotateSun();
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // resize
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    window.addEventListener('resize', onResize);

    // cleanup
    return () => {
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      group.traverse(obj => {
        if ((obj as THREE.Mesh).geometry)
          (obj as THREE.Mesh).geometry.dispose();
        const material = (obj as THREE.Mesh).material;
        if (material) {
          if (Array.isArray(material)) {
            material.forEach(m => m.dispose());
          } else {
            material.dispose();
          }
        }
      });
    };
  }, [canvasRef, events]);

  // Update marker visibility and animate on slider change
  useEffect(() => {
    // toggle visibility
    markersRef.current.forEach((m, i) => (m.visible = i === selectedIdx));
    // animate rotation to bring selected marker front
    const group = groupRef.current;
    if (group) {
      const targetMarker = markersRef.current[selectedIdx];
      const worldPos = new THREE.Vector3();
      targetMarker?.getWorldPosition(worldPos);
      // compute desired rotation angle around Y
      const angle = Math.atan2(worldPos.x, worldPos.z);
      gsap.to(group.rotation, { y: -angle, duration: 1 });
    }
  }, [selectedIdx]);

  return {
    cameraRef,
    controlsRef,
    initialCamPos,
    initialTargetPos,
  };
}
