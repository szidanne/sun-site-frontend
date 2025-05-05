'use client';
import React, { useRef } from 'react';
import { useSunScene } from '../hooks/useSunScene';
import CanvasControls from './CanvasControls';
import gsap from 'gsap';
import { CameraRear } from '@mui/icons-material';
import { Vector3 } from 'three';

interface Props {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  events: Ev[];
  selectedIdx: number;
}

const SunCanvas: React.FC<Props> = ({ canvasRef, events, selectedIdx }) => {
  const { cameraRef, controlsRef, initialCamPos, initialTargetPos } =
    useSunScene(canvasRef, events, selectedIdx);

  const zoom = (factor: number) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera) return;
    gsap.to(camera.position, {
      x: camera.position.x * factor,
      y: camera.position.y * factor,
      z: camera.position.z * factor,
      duration: 0.6,
      ease: 'power2.out',
      onUpdate: () => {
        controls?.update();
      },
    });
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
      <CanvasControls
        onZoomIn={() => zoom(0.8)}
        onZoomOut={() => zoom(1.2)}
        onReset={() => {
          const camera = cameraRef.current;
          const controls = controlsRef.current;
          const initCam = initialCamPos.current;
          const initTgt = initialTargetPos.current;
          const init = controls?.target.clone().multiplyScalar(0);
          // or store initial pos as before
          if (!camera || !controls || !initCam || !initTgt) return;
          // tween camera back
          gsap.to(camera.position, {
            x: initCam.x,
            y: initCam.y,
            z: initCam.z,
            duration: 1,
            ease: 'power2.out',
            onUpdate: () => {
              controls.update();
            },
          });

          // tween controls.target back
          gsap.to(controls.target, {
            x: initTgt.x,
            y: initTgt.y,
            z: initTgt.z,
            duration: 1,
            ease: 'power2.out',
            onUpdate: () => {
              controls.update();
            },
          });
        }}
      />
    </div>
  );
};

export default SunCanvas;
