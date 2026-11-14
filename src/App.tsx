/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback } from 'react';
import { Palette, Smartphone } from 'lucide-react';
import { ConfiguratorState, CameraPreset } from './types/configurator';
import { ThreeCanvas, ThreeCanvasHandle } from './components/ThreeCanvas';
import { TopBar } from './components/TopBar';
import { BottomDock } from './components/BottomDock';
import { DimensionsOverlay } from './components/DimensionsOverlay';
import { ScreenshotModal } from './components/ScreenshotModal';
import { ReferenceVideoModal } from './components/ReferenceVideoModal';
import { MaterialSelectionPanel } from './components/MaterialSelectionPanel';
import { CameraPreviewModal } from './components/CameraPreviewModal';
import { InvoiceModal } from './components/InvoiceModal';

export default function App() {
  const canvasRef = useRef<ThreeCanvasHandle>(null);

  // Initialized with video-inspired CamBalkon 3D configuration
  const [state, setState] = useState<ConfiguratorState>({
    systemType: 'folding', // CamBalkon folding system
    balconyLayout: 'l_shape', // L-Shape Corner Balcony (as in the video)
    panelCount: 5, // 5 front panels
    sideWingPanels: 3, // 3 corner return panels
    openingMode: 'stack_left',
    hardwareColor: 'black',
    glassTint: 'cambalkon_cyan', // Crystalline cyan glass from the video
    sealType: 'polycarbonate_h',
    recessedFloorTrack: false,
    glassThickness: 10,
    widthCm: 380,
    sideWingWidthCm: 180,
    heightCm: 240,
    openProgress: 0,
    isPlayingAnimation: false,
    environment: 'cambalkon_bright', // Crisp bright architectural background
    lightingCondition: 'morning', // شرایط نوری: صبح، ظهر، غروب
    weather: 'sunny', // شبیه‌ساز آب‌وهوا: آفتابی، بارانی، ابری
    showDimensions: true,
    showFloorGrid: true, // Engineering coordinate grid on floor (as in the video)
    soundEnabled: true,
    autoRotate: false,
    autoCalculatePanels: true,
  });

  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isMaterialPanelOpen, setIsMaterialPanelOpen] = useState(false);
  const [isCameraPreviewOpen, setIsCameraPreviewOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceSnapshotUrl, setInvoiceSnapshotUrl] = useState<string | null>(null);

  const handleUpdateState = useCallback((patch: Partial<ConfiguratorState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleSliderChange = useCallback((value: number) => {
    setState((prev) => ({
      ...prev,
      openProgress: value,
      isPlayingAnimation: false, // pause automatic playback when user drags slider
    }));
    if (canvasRef.current) {
      canvasRef.current.setOpenProgress(value);
    }
  }, []);

  const handleTogglePlayAnimation = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isPlayingAnimation: !prev.isPlayingAnimation,
    }));
  }, []);

  const handleCameraPreset = useCallback((preset: CameraPreset) => {
    if (canvasRef.current) {
      canvasRef.current.setCameraPreset(preset);
    }
  }, []);

  const handleResetCamera = useCallback(() => {
    if (canvasRef.current) {
      canvasRef.current.resetCamera();
    }
  }, []);

  const handleTakeScreenshot = useCallback(() => {
    if (canvasRef.current) {
      const url = canvasRef.current.takeScreenshot();
      if (url) {
        setScreenshotUrl(url);
      }
    }
  }, []);

  const handleOpenInvoiceModal = useCallback(() => {
    if (canvasRef.current) {
      const url = canvasRef.current.takeScreenshot();
      setInvoiceSnapshotUrl(url || null);
    }
    setIsInvoiceModalOpen(true);
  }, []);

  const handleProgressUpdateFrom3D = useCallback((progress: number) => {
    setState((prev) => {
      if (prev.isPlayingAnimation) {
        return { ...prev, openProgress: progress };
      }
      return prev;
    });
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-neutral-950 font-sans select-none">
      {/* 1. Full-Bleed 3D Scene Canvas */}
      <ThreeCanvas
        ref={canvasRef}
        state={state}
        onProgressUpdate={handleProgressUpdateFrom3D}
      />

      {/* 2. Top Navigation & Action Bar */}
      <TopBar
        state={state}
        onUpdateState={handleUpdateState}
        onCameraPreset={handleCameraPreset}
        onResetCamera={handleResetCamera}
        onTakeScreenshot={handleTakeScreenshot}
        onOpenVideoModal={() => setIsVideoModalOpen(true)}
        onOpenMaterialPanel={() => setIsMaterialPanelOpen(true)}
        onOpenCameraPreview={() => setIsCameraPreviewOpen(true)}
        onOpenInvoiceModal={handleOpenInvoiceModal}
      />

      {/* 3. Floating Quick Material Palette Trigger on 3D Viewport */}
      <div className="absolute top-20 left-4 sm:left-6 z-10 flex flex-col gap-2">
        <button
          onClick={() => setIsMaterialPanelOpen(true)}
          className="flex items-center gap-2.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl bg-neutral-900/90 hover:bg-neutral-850 border border-neutral-700/80 hover:border-amber-400/60 text-neutral-100 shadow-2xl backdrop-blur-md transition-all cursor-pointer group hover:scale-[1.02]"
          title="باز کردن پالت انتخاب متریال (شیشه برنز، رفلکس، مات و پوشش‌های پروفیل)"
        >
          <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 group-hover:bg-amber-500/30 group-hover:rotate-12 transition-all">
            <Palette className="w-4 h-4" />
          </div>
          <div className="text-right">
            <div className="text-[10px] text-neutral-400 font-medium">پالت متریال شیشه و پروفیل</div>
            <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <span>
                {state.glassTint === 'bronze'
                  ? 'برنز متالیک'
                  : state.glassTint === 'reflective'
                  ? 'رفلکس آینه‌ای'
                  : state.glassTint === 'frosted'
                  ? 'ساتینا مات'
                  : state.glassTint === 'clear'
                  ? 'سوپرکلیر'
                  : state.glassTint === 'cambalkon_cyan'
                  ? 'فیروزه‌ای کریستال'
                  : state.glassTint === 'smoked'
                  ? 'دودی زغالی'
                  : state.glassTint === 'green'
                  ? 'سبز سولار'
                  : 'آبی درباری'}
              </span>
              <span className="text-[10px] text-neutral-400 font-normal">|</span>
              <span className="text-neutral-300">
                {state.hardwareColor === 'black'
                  ? 'مشکی'
                  : state.hardwareColor === 'gold'
                  ? 'طلایی'
                  : state.hardwareColor === 'silver'
                  ? 'نقره‌ای'
                  : state.hardwareColor === 'bronze'
                  ? 'شامپاینی'
                  : state.hardwareColor === 'white'
                  ? 'سفید'
                  : state.hardwareColor === 'stainless'
                  ? 'استیل'
                  : 'آنتراسیت'}
              </span>
            </div>
          </div>
        </button>

        <button
          onClick={() => setIsCameraPreviewOpen(true)}
          className="flex items-center gap-2.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl bg-neutral-900/90 hover:bg-neutral-850 border border-emerald-500/40 hover:border-emerald-400/80 text-neutral-100 shadow-2xl backdrop-blur-md transition-all cursor-pointer group hover:scale-[1.02]"
          title="تجسم لایه شفاف ابعاد پنل‌ها روی تصویر دوربین گوشی (AR Preview Mode)"
        >
          <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/30 group-hover:scale-110 transition-all">
            <Smartphone className="w-4 h-4" />
          </div>
          <div className="text-right">
            <div className="text-[10px] text-neutral-400 font-medium">حالت نمایش دوربین (AR)</div>
            <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <span>{state.panelCount} پنل × {Math.round(state.widthCm / state.panelCount)}cm</span>
              <span className="text-[10px] text-neutral-500">|</span>
              <span className="text-[10px] text-sky-300">نمایش روی محیط واقعی</span>
            </div>
          </div>
        </button>
      </div>

      {/* 4. Architectural Dimension Rulers & Project Specs Overlay */}
      <DimensionsOverlay state={state} />

      {/* 5. Collapsible Bottom Control Dock */}
      <BottomDock
        state={state}
        onUpdateState={handleUpdateState}
        onSliderChange={handleSliderChange}
        onTogglePlayAnimation={handleTogglePlayAnimation}
        onOpenMaterialPanel={() => setIsMaterialPanelOpen(true)}
        onOpenInvoiceModal={handleOpenInvoiceModal}
      />

      {/* 6. Comprehensive Real-Time Material Selection Panel */}
      <MaterialSelectionPanel
        state={state}
        isOpen={isMaterialPanelOpen}
        onClose={() => setIsMaterialPanelOpen(false)}
        onUpdateState={handleUpdateState}
      />

      {/* 7. Live AR Camera Preview Mode with Transparent Dimensions Overlay */}
      <CameraPreviewModal
        state={state}
        isOpen={isCameraPreviewOpen}
        onClose={() => setIsCameraPreviewOpen(false)}
        onUpdateState={handleUpdateState}
        onCaptureComposite={(url) => setScreenshotUrl(url)}
      />

      {/* 8. Official Draft PDF Invoice Generator Modal */}
      <InvoiceModal
        state={state}
        isOpen={isInvoiceModalOpen}
        snapshotDataUrl={invoiceSnapshotUrl}
        onClose={() => setIsInvoiceModalOpen(false)}
      />

      {/* 7. Screenshot Download & Preview Modal */}
      {screenshotUrl && (
        <ScreenshotModal
          imageUrl={screenshotUrl}
          state={state}
          onClose={() => setScreenshotUrl(null)}
        />
      )}

      {/* 8. Video Reference Player Modal */}
      {isVideoModalOpen && (
        <ReferenceVideoModal onClose={() => setIsVideoModalOpen(false)} />
      )}
    </div>
  );
}
