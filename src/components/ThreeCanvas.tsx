import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { ConfiguratorState, CameraPreset } from '../types/configurator';
import { SceneManager } from '../three/SceneManager';

export interface ThreeCanvasHandle {
  setCameraPreset: (preset: CameraPreset) => void;
  resetCamera: () => void;
  takeScreenshot: () => string;
  setOpenProgress: (val: number) => void;
}

interface ThreeCanvasProps {
  state: ConfiguratorState;
  onProgressUpdate?: (progress: number) => void;
}

export const ThreeCanvas = forwardRef<ThreeCanvasHandle, ThreeCanvasProps>(
  ({ state, onProgressUpdate }, ref) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const sceneManagerRef = useRef<SceneManager | null>(null);
    const stateRef = useRef<ConfiguratorState>(state);

    // Keep ref in sync
    stateRef.current = state;

    useEffect(() => {
      if (!mountRef.current) return;

      const sceneManager = new SceneManager(mountRef.current, (progress) => {
        if (onProgressUpdate) {
          onProgressUpdate(progress);
        }
      });
      sceneManagerRef.current = sceneManager;

      // Initial config update
      sceneManager.updateConfig(stateRef.current);

      return () => {
        sceneManager.dispose();
        sceneManagerRef.current = null;
      };
    }, []); // Initialize once!

    // Reactively update scene when state changes
    useEffect(() => {
      if (sceneManagerRef.current) {
        sceneManagerRef.current.updateConfig(state);
      }
    }, [
      state.systemType,
      state.balconyLayout,
      state.panelCount,
      state.sideWingPanels,
      state.sideWingWidthCm,
      state.openingMode,
      state.hardwareColor,
      state.glassTint,
      state.sealType,
      state.recessedFloorTrack,
      state.glassThickness,
      state.widthCm,
      state.heightCm,
      state.autoRotate,
      state.environment,
      state.lightingCondition,
      state.weather,
      state.showFloorGrid,
    ]);

    // Handle automated demo animation loop when isPlayingAnimation is true
    useEffect(() => {
      if (!state.isPlayingAnimation) return;

      let animFrameId: number;
      let last = performance.now();

      const step = (now: number) => {
        const delta = Math.min((now - last) / 1000, 0.1);
        last = now;
        if (sceneManagerRef.current) {
          sceneManagerRef.current.stepAnimationCycle(stateRef.current, delta);
        }
        animFrameId = requestAnimationFrame(step);
      };

      animFrameId = requestAnimationFrame(step);

      return () => {
        cancelAnimationFrame(animFrameId);
      };
    }, [state.isPlayingAnimation]);

    // Expose imperative methods to parent
    useImperativeHandle(ref, () => ({
      setCameraPreset: (preset: CameraPreset) => {
        if (sceneManagerRef.current) {
          const widthM = stateRef.current.widthCm / 100;
          const heightM = stateRef.current.heightCm / 100;
          sceneManagerRef.current.setCameraPreset(preset, widthM, heightM);
        }
      },
      resetCamera: () => {
        if (sceneManagerRef.current) {
          const widthM = stateRef.current.widthCm / 100;
          const heightM = stateRef.current.heightCm / 100;
          sceneManagerRef.current.setCameraPreset('perspective', widthM, heightM);
        }
      },
      takeScreenshot: () => {
        if (sceneManagerRef.current) {
          return sceneManagerRef.current.captureScreenshot();
        }
        return '';
      },
      setOpenProgress: (val: number) => {
        if (sceneManagerRef.current) {
          sceneManagerRef.current.setOpenProgress(val, stateRef.current);
        }
      },
    }));

    return (
      <div
        ref={mountRef}
        className="absolute inset-0 w-full h-full overflow-hidden bg-neutral-950"
      />
    );
  }
);

ThreeCanvas.displayName = 'ThreeCanvas';
