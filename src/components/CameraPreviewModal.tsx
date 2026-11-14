import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  X,
  Camera,
  RefreshCw,
  Lock,
  Unlock,
  Upload,
  Sliders,
  Maximize2,
  Eye,
  Ruler,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Move,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';
import {
  ConfiguratorState,
  GLASS_TINTS,
  HARDWARE_COLORS,
  SYSTEM_SPECS,
  BALCONY_LAYOUTS,
} from '../types/configurator';
import { playMechanicalClick, playUiClick } from '../audio/soundEffects';

interface CameraPreviewModalProps {
  state: ConfiguratorState;
  isOpen: boolean;
  onClose: () => void;
  onUpdateState: (patch: Partial<ConfiguratorState>) => void;
  onCaptureComposite: (dataUrl: string) => void;
}

type BackgroundSource = 'camera' | 'uploaded' | 'demo_balcony';

export const CameraPreviewModal: React.FC<CameraPreviewModalProps> = ({
  state,
  isOpen,
  onClose,
  onUpdateState,
  onCaptureComposite,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const uploadedImgRef = useRef<HTMLImageElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [bgSource, setBgSource] = useState<BackgroundSource>('camera');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraStatus, setCameraStatus] = useState<'loading' | 'active' | 'error'>('loading');
  const [cameraErrorMsg, setCameraErrorMsg] = useState<string>('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  // Interactive Overlay Positioning & Alignment State
  const [overlayPos, setOverlayPos] = useState<{ x: number; y: number }>({ x: 0, y: -15 });
  const [overlayScale, setOverlayScale] = useState<number>(1.0);
  const [overlayOpacity, setOverlayOpacity] = useState<number>(0.55);
  const [perspectiveYaw, setPerspectiveYaw] = useState<number>(0); // -35 to +35 deg
  const [perspectivePitch, setPerspectivePitch] = useState<number>(0); // -20 to +20 deg
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [showControlsDrawer, setShowControlsDrawer] = useState<boolean>(true);
  const [showRulers, setShowRulers] = useState<boolean>(true);
  const [showPanelSpecs, setShowPanelSpecs] = useState<boolean>(true);

  // Dragging state
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number; origX: number; origY: number }>({
    x: 0,
    y: 0,
    origX: 0,
    origY: 0,
  });

  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setCameraStatus('loading');
    setCameraErrorMsg('');
    stopCameraStream();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraStatus('error');
      setCameraErrorMsg('مرورگر یا محیط فعلی از دسترسی مستقیم به دوربین پشتیبانی نمی‌کند.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraStatus('active');
      setBgSource('camera');
    } catch (err: unknown) {
      // Fallback without facingMode constraint (common on desktop webcams)
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        streamRef.current = fallbackStream;
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          await videoRef.current.play().catch(() => {});
        }
        setCameraStatus('active');
        setBgSource('camera');
      } catch (fallbackErr: unknown) {
        setCameraStatus('error');
        const msg =
          fallbackErr instanceof Error && fallbackErr.name === 'NotAllowedError'
            ? 'دسترسی به دوربین توسط کاربر مسدود شده است. می‌توانید عکس بالکن خود را بارگذاری کنید یا از نمای شبیه‌ساز استفاده نمایید.'
            : 'دوربین در دسترس نیست. می‌توانید عکس بالکن خود را آپلود کنید یا از حالت نمای نمونه استفاده کنید.';
        setCameraErrorMsg(msg);
      }
    }
  }, [facingMode, stopCameraStream]);

  useEffect(() => {
    if (!isOpen) {
      stopCameraStream();
      return;
    }
    if (bgSource === 'camera') {
      startCamera();
    }
    return () => {
      stopCameraStream();
    };
  }, [isOpen, facingMode, bgSource, startCamera, stopCameraStream]);

  if (!isOpen) return null;

  const glass = GLASS_TINTS[state.glassTint];
  const hardware = HARDWARE_COLORS[state.hardwareColor];
  const panelWidthCm = Math.round(state.widthCm / state.panelCount);
  const sidePanelWidthCm = Math.round(state.sideWingWidthCm / state.sideWingPanels);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isLocked) return;
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      origX: overlayPos.x,
      origY: overlayPos.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || isLocked) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setOverlayPos({
      x: dragStartRef.current.origX + dx,
      y: dragStartRef.current.origY + dy,
    });
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const handleResetTransform = () => {
    setOverlayPos({ x: 0, y: -15 });
    setOverlayScale(1.0);
    setPerspectiveYaw(0);
    setPerspectivePitch(0);
    setOverlayOpacity(0.55);
    playUiClick(state.soundEnabled);
  };

  const handleUploadPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        stopCameraStream();
        setUploadedImageUrl(reader.result);
        setBgSource('uploaded');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCapturePhoto = () => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 1280;
    const height = container.clientHeight || 720;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Draw Background (Camera Video, Uploaded Photo, or Architectural Balcony Demo)
    if (bgSource === 'camera' && videoRef.current && videoRef.current.readyState >= 2) {
      const video = videoRef.current;
      const vRatio = video.videoWidth / video.videoHeight;
      const cRatio = width / height;
      let drawW = width;
      let drawH = height;
      let offsetX = 0;
      let offsetY = 0;
      if (vRatio > cRatio) {
        drawW = height * vRatio;
        offsetX = -(drawW - width) / 2;
      } else {
        drawH = width / vRatio;
        offsetY = -(drawH - height) / 2;
      }
      ctx.drawImage(video, offsetX, offsetY, drawW, drawH);
    } else if (bgSource === 'uploaded' && uploadedImgRef.current && uploadedImgRef.current.complete) {
      const img = uploadedImgRef.current;
      const iRatio = img.naturalWidth / (img.naturalHeight || 1);
      const cRatio = width / height;
      let drawW = width;
      let drawH = height;
      let offsetX = 0;
      let offsetY = 0;
      if (iRatio > cRatio) {
        drawW = height * iRatio;
        offsetX = -(drawW - width) / 2;
      } else {
        drawH = width / iRatio;
        offsetY = -(drawH - height) / 2;
      }
      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
    } else {
      // Architectural terrace background gradient
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#38bdf8');
      grad.addColorStop(0.55, '#bae6fd');
      grad.addColorStop(0.55, '#475569');
      grad.addColorStop(1, '#1e293b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Draw Overlay Schematic Snapshot in Center with User's Position & Scale
    ctx.save();
    const centerX = width / 2 + overlayPos.x;
    const centerY = height / 2 + overlayPos.y;
    ctx.translate(centerX, centerY);
    ctx.scale(overlayScale, overlayScale);

    // Aspect ratio of balcony
    const baseW = Math.min(width * 0.72, 680);
    const ratio = state.heightCm / state.widthCm;
    const baseH = Math.min(Math.max(baseW * ratio, 180), height * 0.62);

    const startX = -baseW / 2;
    const startY = -baseH / 2;

    // Outer frame
    ctx.lineWidth = 5;
    ctx.strokeStyle = hardware.hex;
    ctx.strokeRect(startX, startY, baseW, baseH);

    // Draw panels
    const panelW = baseW / state.panelCount;
    for (let i = 0; i < state.panelCount; i++) {
      const px = startX + i * panelW;
      ctx.fillStyle = glass.color;
      ctx.globalAlpha = overlayOpacity * 0.48;
      ctx.fillRect(px + 2, startY + 6, panelW - 4, baseH - 12);

      ctx.globalAlpha = Math.min(1, overlayOpacity + 0.3);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.strokeRect(px + 2, startY + 6, panelW - 4, baseH - 12);

      // Panel width label
      ctx.globalAlpha = 0.95;
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${panelWidthCm} cm`, px + panelW / 2, 5);
    }

    // Total Width Ruler Banner
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(-105, startY - 34, 210, 24);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1;
    ctx.strokeRect(-105, startY - 34, 210, 24);
    ctx.fillStyle = '#fef3c7';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      `عرض کل: ${state.widthCm} cm (${state.panelCount} پنل)`,
      0,
      startY - 17
    );

    // Total Height Label
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(startX - 90, -14, 80, 26);
    ctx.strokeRect(startX - 90, -14, 80, 26);
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`${state.heightCm} cm`, startX - 50, 4);

    ctx.restore();

    // Watermark
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(16, height - 42, 290, 28);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(
      `Tabriz Securit AR | ${SYSTEM_SPECS[state.systemType].nameFa}`,
      26,
      height - 23
    );

    playMechanicalClick(state.soundEnabled);
    onCaptureComposite(canvas.toDataURL('image/png'));
  };

  // Calculate visual frame size proportionally to widthCm / heightCm
  const aspectRatio = state.widthCm / state.heightCm;
  const maxVisualWidth = 520;
  const visualHeight = Math.min(Math.max(Math.round(maxVisualWidth / aspectRatio), 210), 350);
  const visualWidth = Math.round(visualHeight * aspectRatio);

  // Side wing width visual projection for L/U shapes
  const hasLeftWing = state.balconyLayout === 'u_shape';
  const hasRightWing = state.balconyLayout === 'l_shape' || state.balconyLayout === 'u_shape';
  const sideWingVisualWidth = Math.min(Math.max(Math.round((state.sideWingWidthCm / state.widthCm) * visualWidth), 95), 220);

  return (
    <div
      className="fixed inset-0 z-50 bg-neutral-950 flex flex-col overflow-hidden select-none"
      dir="rtl"
    >
      {/* Top AR Header Bar */}
      <div className="relative z-30 flex items-center justify-between px-3 sm:px-5 py-2.5 bg-neutral-950/85 backdrop-blur-md border-b border-neutral-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-cyan-600 flex items-center justify-center text-neutral-950 shadow-md shadow-sky-500/20">
            <Camera className="w-4 h-4 stroke-[2.4]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-black text-white">
                پیش‌نمایش دوربین واقعی (AR Preview)
              </h2>
              <span className="text-[10px] bg-sky-500/20 border border-sky-400/40 text-sky-300 px-2 py-0.5 rounded-full font-bold hidden sm:inline-block">
                لایه شفاف ابعاد در محیط واقعی
              </span>
            </div>
            <p className="text-[10px] text-neutral-400">
              کادر را روی دهانه بالکن بکشید تا ابعاد {state.panelCount} پنل ({panelWidthCm} سانتی‌متری) را در مقیاس واقعی تجسم کنید
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Switch Camera Front/Rear */}
          <button
            onClick={() => {
              setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
              setBgSource('camera');
              playUiClick(state.soundEnabled);
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs text-neutral-200 cursor-pointer transition-colors"
            title="تغییر دوربین جلو و عقب گوشی"
          >
            <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">چرخش دوربین</span>
          </button>

          {/* Upload Balcony Photo Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs text-neutral-200 cursor-pointer transition-colors"
            title="بارگذاری عکس بالکن یا پنجره از گالری"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">عکس بالکن</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUploadPhoto}
            className="hidden"
          />

          {/* Demo Balcony Background Toggle (useful when no camera) */}
          <button
            onClick={() => {
              if (bgSource === 'demo_balcony') {
                setBgSource('camera');
              } else {
                stopCameraStream();
                setBgSource('demo_balcony');
              }
              playUiClick(state.soundEnabled);
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs cursor-pointer transition-colors ${
              bgSource === 'demo_balcony'
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-700 text-neutral-300'
            }`}
            title="پیش‌نمایش روی نمای شبیه‌ساز بالکن"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span className="hidden md:inline">فضای نمونه</span>
          </button>

          {/* Close AR Preview */}
          <button
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold cursor-pointer transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>خروج</span>
          </button>
        </div>
      </div>

      {/* Main AR Camera & Transparent Overlay Viewport */}
      <div
        ref={containerRef}
        className="relative flex-1 w-full overflow-hidden flex items-center justify-center bg-neutral-950"
      >
        {/* LAYER 1: Live Camera Video Feed */}
        {bgSource === 'camera' && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover ${
              facingMode === 'user' ? '-scale-x-100' : ''
            }`}
          />
        )}

        {/* LAYER 1B: Uploaded Balcony Photo */}
        {bgSource === 'uploaded' && uploadedImageUrl && (
          <img
            ref={uploadedImgRef}
            src={uploadedImageUrl}
            alt="تصویر بالکن بارگذاری شده"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* LAYER 1C: Architectural Simulated Balcony Fallback (if camera fails or demo selected) */}
        {(bgSource === 'demo_balcony' || (bgSource === 'camera' && cameraStatus === 'error')) && (
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            {/* Realistic Sky & Distant Skyline Silhouette */}
            <div className="absolute inset-0 bg-gradient-to-b from-sky-500/50 via-sky-200/30 to-slate-800" />
            <div className="absolute inset-x-0 bottom-0 h-[44%] bg-gradient-to-b from-stone-400/90 to-stone-700 border-t-4 border-stone-300/60" />
            {/* Balcony Parapet Wall & Tile Perspective */}
            <div
              className="absolute inset-x-0 bottom-0 h-[28%] bg-gradient-to-b from-stone-600 to-stone-900 border-t-8 border-stone-400/80 shadow-2xl"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 80px)',
              }}
            />
            {/* Ceiling Slab Top */}
            <div className="absolute inset-x-0 top-0 h-[14%] bg-gradient-to-b from-neutral-900 to-stone-700/90 border-b-4 border-stone-500/50 shadow-xl" />
            {/* Side Wall Columns */}
            <div className="absolute inset-y-0 left-0 w-[8%] bg-gradient-to-r from-stone-800 to-stone-700/70 border-r border-stone-500/30" />
            <div className="absolute inset-y-0 right-0 w-[8%] bg-gradient-to-l from-stone-800 to-stone-700/70 border-l border-stone-500/30" />
          </div>
        )}

        {/* Camera Error / Permission Banner (Non-blocking with direct photo upload action) */}
        {bgSource === 'camera' && cameraStatus === 'error' && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 max-w-md w-[92%] bg-neutral-950/90 border border-amber-500/50 rounded-2xl p-3 shadow-2xl flex items-start gap-2.5 text-xs backdrop-blur-md">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-amber-300 mb-0.5">دوربین زنده در دسترس نیست</div>
              <p className="text-[11px] text-neutral-300 leading-relaxed">{cameraErrorMsg}</p>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => startCamera()}
                  className="px-2.5 py-1 rounded-lg bg-sky-500/20 border border-sky-400/40 text-sky-300 font-bold text-[10px] cursor-pointer hover:bg-sky-500/30"
                >
                  تلاش مجدد دوربین
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-lg bg-amber-500 text-neutral-950 font-bold text-[10px] cursor-pointer hover:bg-amber-400"
                >
                  انتخاب عکس از گوشی / سیستم
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Camera Alignment Crosshair Frame (AR Viewfinder Corners) */}
        <div className="pointer-events-none absolute inset-4 sm:inset-8 border border-white/10 rounded-3xl">
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-sky-400/70 rounded-tr-xl" />
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-sky-400/70 rounded-tl-xl" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-sky-400/70 rounded-br-xl" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-sky-400/70 rounded-bl-xl" />
        </div>

        {/* LAYER 2: TRANSPARENT INTERACTIVE DIMENSION & PANEL OVERLAY */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{
            transform: `translate3d(${overlayPos.x}px, ${overlayPos.y}px, 0) scale(${overlayScale}) perspective(1000px) rotateY(${perspectiveYaw}deg) rotateX(${perspectivePitch}deg)`,
            cursor: isLocked ? 'default' : 'grab',
            touchAction: 'none',
          }}
          className="relative z-20 transition-shadow select-none"
        >
          {/* Floating Drag Hint Badge above Frame */}
          {!isLocked && (
            <div className="absolute -top-14 left-1/2 -translate-x-1/2 whitespace-nowrap bg-neutral-950/80 border border-sky-400/40 text-sky-300 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-md">
              <Move className="w-3 h-3 text-sky-400" />
              <span>برای تطبیق روی بالکن واقعی، کادر را بکشید و جابجا کنید</span>
            </div>
          )}

          {/* Top Overall Dimension Ruler (Total Width) */}
          {showRulers && (
            <div className="relative mb-2 flex flex-col items-center">
              <div className="bg-neutral-950/90 border border-amber-400/80 px-3 py-1 rounded-xl shadow-xl flex items-center gap-2 text-xs font-mono">
                <Ruler className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-black text-amber-300">
                  عرض کل دهانه جلو: {state.widthCm} cm ({(state.widthCm / 100).toFixed(2)} m)
                </span>
                <span className="text-neutral-500">|</span>
                <span className="text-sky-300 font-bold">{state.panelCount} پنل</span>
              </div>
              {/* Dimension Arrow Line */}
              <div className="w-full flex items-center justify-between mt-1 px-1">
                <div className="w-2 h-2 border-r-2 border-t-2 border-amber-400 rotate-45" />
                <div className="flex-1 h-[2px] bg-amber-400/80 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                <div className="w-2 h-2 border-l-2 border-b-2 border-amber-400 rotate-45" />
              </div>
            </div>
          )}

          {/* Balcony Composite Assembly (Main Wing + Optional L/U Side Wings) */}
          <div className="relative flex items-center justify-center">
            {/* Height Vertical Dimension Ruler on Right Side */}
            {showRulers && (
              <div
                className="flex flex-col items-center justify-center ml-2.5"
                style={{ height: `${visualHeight}px` }}
              >
                <div className="w-2 h-2 border-t-2 border-l-2 border-sky-400 rotate-45" />
                <div className="w-[2px] flex-1 bg-sky-400/80 shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
                <div className="my-1.5 bg-neutral-950/90 border border-sky-400/70 px-2 py-1 rounded-lg text-[10px] font-mono font-bold text-sky-300 whitespace-nowrap shadow-lg">
                  ارتفاع: {state.heightCm} cm
                </div>
                <div className="w-[2px] flex-1 bg-sky-400/80 shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
                <div className="w-2 h-2 border-b-2 border-r-2 border-sky-400 rotate-45" />
              </div>
            )}

            {/* Left Side Wing (for U-shape) */}
            {hasLeftWing && (
              <div
                style={{
                  width: `${sideWingVisualWidth * 0.65}px`,
                  height: `${visualHeight}px`,
                  borderColor: hardware.hex,
                  transform: 'perspective(600px) rotateY(-42deg)',
                  transformOrigin: 'left center',
                }}
                className="relative border-[4px] rounded-r-sm flex overflow-hidden shadow-2xl mr-0.5"
              >
                {Array.from({ length: state.sideWingPanels }).map((_, idx) => (
                  <div
                    key={`left-wing-${idx}`}
                    style={{
                      backgroundColor: glass.color,
                      opacity: overlayOpacity,
                    }}
                    className="flex-1 h-full border-x border-white/40 flex flex-col items-center justify-center relative"
                  >
                    <span className="text-[9px] font-mono font-bold text-white drop-shadow bg-black/50 px-1 rounded">
                      {sidePanelWidthCm}cm
                    </span>
                  </div>
                ))}
                {/* Side wing bottom label */}
                <div className="absolute bottom-1 inset-x-0 text-center text-[9px] font-mono font-bold text-sky-300 bg-black/75 py-0.5">
                  ضلع چپ: {state.sideWingWidthCm}cm
                </div>
              </div>
            )}

            {/* MAIN WING TRANSPARENT FRAME & GLASS PANELS */}
            <div
              style={{
                width: `${visualWidth}px`,
                height: `${visualHeight}px`,
                borderColor: hardware.hex,
              }}
              className="relative border-[5px] rounded-md flex overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.6)]"
            >
              {/* Top & Bottom Aluminum Rail Profile Indicator */}
              <div
                style={{ backgroundColor: hardware.hex }}
                className="absolute top-0 inset-x-0 h-2.5 z-20 opacity-90 border-b border-white/20"
              />
              <div
                style={{ backgroundColor: hardware.hex }}
                className="absolute bottom-0 inset-x-0 h-2.5 z-20 opacity-90 border-t border-white/20"
              />

              {/* Individual Glass Leaf Panels */}
              {Array.from({ length: state.panelCount }).map((_, idx) => {
                // Visual simulation of openProgress inside AR overlay
                const progress = state.openProgress;
                let transformStyle = '';
                if (progress > 0.02) {
                  if (state.systemType === 'sliding') {
                    const shift =
                      state.openingMode === 'stack_right'
                        ? -(idx * 82 * progress)
                        : idx * 82 * progress;
                    transformStyle = `translateX(${shift}%)`;
                  } else {
                    // Folding / Accordion visual stacking compression
                    const foldAngle = progress * 72;
                    const shift =
                      state.openingMode === 'stack_right'
                        ? -(idx * 55 * progress)
                        : idx * 55 * progress;
                    transformStyle = `translateX(${shift}%) rotateY(${foldAngle}deg)`;
                  }
                }

                return (
                  <div
                    key={`ar-panel-${idx}`}
                    style={{
                      transform: transformStyle,
                      transformOrigin:
                        state.openingMode === 'stack_right' ? 'right center' : 'left center',
                    }}
                    className="relative flex-1 h-full flex flex-col items-center justify-between py-4 border-x border-dashed border-white/45 transition-transform duration-150"
                  >
                    {/* Translucent Glass Tint Fill */}
                    <div
                      style={{
                        backgroundColor: glass.color,
                        opacity: overlayOpacity * (state.glassTint === 'frosted' ? 1.15 : 0.65),
                      }}
                      className="absolute inset-0 pointer-events-none"
                    />

                    {/* Specular Diagonal Glass Highlight */}
                    <div
                      style={{ opacity: overlayOpacity * 0.5 }}
                      className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/25 to-transparent pointer-events-none"
                    />

                    {/* Top Panel Index Badge */}
                    {showPanelSpecs && (
                      <div className="relative z-10 px-1.5 py-0.5 rounded bg-neutral-950/80 border border-white/20 text-[9px] font-bold text-neutral-200 shadow-sm">
                        لنگه {idx + 1}
                      </div>
                    )}

                    {/* Center Dimension Callout */}
                    {showRulers && (
                      <div className="relative z-10 flex flex-col items-center gap-0.5 w-full px-1">
                        <div className="w-full flex items-center justify-between opacity-90">
                          <div className="w-1.5 h-1.5 border-r border-t border-amber-300 rotate-45" />
                          <div className="flex-1 h-[1px] bg-amber-300/80" />
                          <div className="w-1.5 h-1.5 border-l border-b border-amber-300 rotate-45" />
                        </div>
                        <span className="px-1.5 py-0.5 rounded-md bg-neutral-950/90 border border-amber-400/60 text-[10px] sm:text-[11px] font-mono font-black text-amber-300 shadow-md">
                          {panelWidthCm} cm
                        </span>
                      </div>
                    )}

                    {/* Bottom Height & Thickness Tag */}
                    {showPanelSpecs && (
                      <div className="relative z-10 text-[9px] font-mono text-white/85 bg-black/65 px-1.5 py-0.5 rounded border border-white/10">
                        {state.heightCm}×{panelWidthCm}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right Side Wing (for L-shape or U-shape) */}
            {hasRightWing && (
              <div
                style={{
                  width: `${sideWingVisualWidth * 0.65}px`,
                  height: `${visualHeight}px`,
                  borderColor: hardware.hex,
                  transform: 'perspective(600px) rotateY(42deg)',
                  transformOrigin: 'right center',
                }}
                className="relative border-[4px] rounded-l-sm flex overflow-hidden shadow-2xl ml-0.5"
              >
                {Array.from({ length: state.sideWingPanels }).map((_, idx) => (
                  <div
                    key={`right-wing-${idx}`}
                    style={{
                      backgroundColor: glass.color,
                      opacity: overlayOpacity,
                    }}
                    className="flex-1 h-full border-x border-white/40 flex flex-col items-center justify-center relative"
                  >
                    <span className="text-[9px] font-mono font-bold text-white drop-shadow bg-black/50 px-1 rounded">
                      {sidePanelWidthCm}cm
                    </span>
                  </div>
                ))}
                {/* Side wing bottom label */}
                <div className="absolute bottom-1 inset-x-0 text-center text-[9px] font-mono font-bold text-sky-300 bg-black/75 py-0.5">
                  ضلع نبش: {state.sideWingWidthCm}cm
                </div>
              </div>
            )}
          </div>

          {/* Bottom Summary Bar under Overlay Frame */}
          {showPanelSpecs && (
            <div className="mt-2.5 flex items-center justify-center gap-2 text-[10px] font-medium">
              <div className="bg-neutral-950/85 border border-neutral-700/80 px-2.5 py-1 rounded-lg text-neutral-200 flex items-center gap-1.5 shadow-lg">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>{SYSTEM_SPECS[state.systemType].nameFa}</span>
                <span className="text-neutral-500">•</span>
                <span className="text-sky-300">{BALCONY_LAYOUTS[state.balconyLayout].nameFa}</span>
                <span className="text-neutral-500">•</span>
                <span className="font-mono text-amber-300">شیشه {state.glassThickness}mm</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Floating Actions on Viewport Side */}
        <div className="absolute top-3 left-3 z-30 flex flex-col gap-2">
          <button
            onClick={() => {
              setIsLocked(!isLocked);
              playUiClick(state.soundEnabled);
            }}
            className={`p-2.5 rounded-xl border shadow-xl backdrop-blur-md cursor-pointer transition-all flex items-center gap-1.5 text-xs font-bold ${
              isLocked
                ? 'bg-amber-500 text-neutral-950 border-amber-400'
                : 'bg-neutral-950/85 text-neutral-200 border-neutral-700 hover:border-neutral-500'
            }`}
            title={isLocked ? 'باز کردن قفل کادر برای جابجایی' : 'قفل موقعیت کادر روی تصویر'}
          >
            {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            <span className="hidden sm:inline">{isLocked ? 'کادر قفل شد' : 'قفل موقعیت'}</span>
          </button>

          <button
            onClick={() => setShowRulers(!showRulers)}
            className={`p-2.5 rounded-xl border shadow-xl backdrop-blur-md cursor-pointer transition-all flex items-center gap-1.5 text-xs font-bold ${
              showRulers
                ? 'bg-sky-500/20 text-sky-300 border-sky-400/50'
                : 'bg-neutral-950/85 text-neutral-400 border-neutral-700'
            }`}
            title="نمایش یا مخفی‌سازی خط‌کش ابعاد"
          >
            <Ruler className="w-4 h-4" />
            <span className="hidden sm:inline">خط‌کش ابعاد</span>
          </button>

          <button
            onClick={() => setShowControlsDrawer(!showControlsDrawer)}
            className="p-2.5 rounded-xl border bg-neutral-950/85 text-neutral-200 border-neutral-700 hover:border-amber-400/50 shadow-xl backdrop-blur-md cursor-pointer transition-all flex items-center gap-1.5 text-xs font-bold"
            title="نمایش / مخفی‌سازی پنل تنظیمات شفافیت و زاویه"
          >
            <Sliders className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">تنظیم کادر</span>
          </button>
        </div>
      </div>

      {/* Bottom AR Calibration & Action Dock */}
      {showControlsDrawer && (
        <div className="relative z-30 bg-neutral-950/95 border-t border-neutral-800 px-3 sm:px-6 py-3 backdrop-blur-md">
          <div className="max-w-5xl mx-auto space-y-3">
            {/* Calibration Sliders Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 text-xs">
              {/* 1. Overlay Opacity */}
              <div>
                <div className="flex justify-between items-center mb-1 text-[11px]">
                  <span className="text-neutral-300 flex items-center gap-1">
                    <Eye className="w-3 h-3 text-sky-400" />
                    شفافیت لایه:
                  </span>
                  <span className="font-mono text-sky-400 font-bold">
                    {Math.round(overlayOpacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.15"
                  max="0.9"
                  step="0.05"
                  value={overlayOpacity}
                  onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                />
              </div>

              {/* 2. Scale Size */}
              <div>
                <div className="flex justify-between items-center mb-1 text-[11px]">
                  <span className="text-neutral-300 flex items-center gap-1">
                    <Maximize2 className="w-3 h-3 text-amber-400" />
                    مقیاس (Scale):
                  </span>
                  <span className="font-mono text-amber-400 font-bold">
                    {Math.round(overlayScale * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.45"
                  max="1.75"
                  step="0.05"
                  value={overlayScale}
                  onChange={(e) => setOverlayScale(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>

              {/* 3. Perspective Yaw (Left/Right Wall Angle) */}
              <div>
                <div className="flex justify-between items-center mb-1 text-[11px]">
                  <span className="text-neutral-300">زاویه افقی دیوار:</span>
                  <span className="font-mono text-emerald-400 font-bold">{perspectiveYaw}°</span>
                </div>
                <input
                  type="range"
                  min="-35"
                  max="35"
                  step="1"
                  value={perspectiveYaw}
                  onChange={(e) => setPerspectiveYaw(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
              </div>

              {/* 4. Perspective Pitch (Up/Down Camera Tilt) */}
              <div>
                <div className="flex justify-between items-center mb-1 text-[11px]">
                  <span className="text-neutral-300">زاویه عمودی (شیب):</span>
                  <span className="font-mono text-emerald-400 font-bold">{perspectivePitch}°</span>
                </div>
                <input
                  type="range"
                  min="-20"
                  max="20"
                  step="1"
                  value={perspectivePitch}
                  onChange={(e) => setPerspectivePitch(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
              </div>

              {/* 5. Open / Close Panels Live inside AR */}
              <div className="col-span-2 sm:col-span-4 lg:col-span-1">
                <div className="flex justify-between items-center mb-1 text-[11px]">
                  <span className="text-neutral-300">بازشوی پنل‌ها:</span>
                  <span className="font-mono text-amber-300 font-bold">
                    {Math.round(state.openProgress * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.02"
                  value={state.openProgress}
                  onChange={(e) =>
                    onUpdateState({
                      openProgress: parseFloat(e.target.value),
                      isPlayingAnimation: false,
                    })
                  }
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-800/80">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetTransform}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs font-medium cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>تنظیم مجدد کادر</span>
                </button>

                <button
                  onClick={() => setShowPanelSpecs(!showPanelSpecs)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                    showPanelSpecs
                      ? 'bg-neutral-800 border-neutral-600 text-neutral-100'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>مشخصات روی لنگه‌ها</span>
                </button>
              </div>

              <button
                onClick={handleCapturePhoto}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 text-xs font-black shadow-lg shadow-amber-500/25 cursor-pointer transition-all hover:scale-[1.02]"
              >
                <Camera className="w-4 h-4 stroke-[2.4]" />
                <span>ثبت عکس از ترکیب دوربین و ابعاد</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
