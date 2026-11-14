import React, { useState } from 'react';
import {
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  Sliders,
  Palette,
  Wrench,
  FileText,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  BookOpen,
  Maximize2,
  Copy,
  CornerDownRight,
  Minus,
  Maximize,
  Split,
  ArrowLeft,
  ArrowRight,
  Sun,
  CloudRain,
  Cloud,
  Droplets,
  Calculator,
  TrendingDown,
  Percent,
  Info,
  Coins,
  Receipt,
  Scale,
  SlidersHorizontal,
  FileDown,
  PackageSearch,
} from 'lucide-react';
import {
  ConfiguratorState,
  SystemType,
  BalconyLayout,
  PanelCount,
  SideWingPanelCount,
  OpeningMode,
  HardwareColorId,
  GlassTintId,
  GlassSealType,
  LIGHTING_CONDITIONS,
  HARDWARE_COLORS,
  GLASS_TINTS,
  BALCONY_LAYOUTS,
  SYSTEM_SPECS,
  WeatherSimulation,
  WEATHER_SIMULATIONS,
  calculateDynamicPanels,
  calculateDynamicSidePanels,
  PanelOption,
} from '../types/configurator';
import { playSlideRollerSound, playMechanicalClick, playUiClick, playWeatherSound } from '../audio/soundEffects';
import { calculateProjectCost, CostBreakdown } from '../utils/invoicePdfGenerator';
import { OrderTrackingTab } from './OrderTrackingTab';

export type { CostBreakdown };
export { calculateProjectCost };

interface BottomDockProps {
  state: ConfiguratorState;
  onUpdateState: (patch: Partial<ConfiguratorState>) => void;
  onSliderChange: (value: number) => void;
  onTogglePlayAnimation: () => void;
  onOpenMaterialPanel?: () => void;
  onOpenInvoiceModal?: () => void;
}

type TabId = 'layout' | 'system' | 'colors' | 'hardware' | 'quote' | 'tracking';

export const BottomDock: React.FC<BottomDockProps> = ({
  state,
  onUpdateState,
  onSliderChange,
  onTogglePlayAnimation,
  onOpenMaterialPanel,
  onOpenInvoiceModal,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('layout');
  const [copiedQuote, setCopiedQuote] = useState(false);

  // Current project cost calculation
  const currentCalc = calculateProjectCost(
    state.systemType,
    state.widthCm,
    state.heightCm,
    state.balconyLayout,
    state.sideWingWidthCm,
    state.glassTint,
    state.glassThickness,
    state.hardwareColor
  );

  // Calculations for all 3 systems for live real-time comparison
  const slidingCalc = calculateProjectCost(
    'sliding',
    state.widthCm,
    state.heightCm,
    state.balconyLayout,
    state.sideWingWidthCm,
    state.glassTint,
    state.glassThickness,
    state.hardwareColor
  );

  const foldingCalc = calculateProjectCost(
    'folding',
    state.widthCm,
    state.heightCm,
    state.balconyLayout,
    state.sideWingWidthCm,
    state.glassTint,
    state.glassThickness,
    state.hardwareColor
  );

  const accordionCalc = calculateProjectCost(
    'accordion',
    state.widthCm,
    state.heightCm,
    state.balconyLayout,
    state.sideWingWidthCm,
    state.glassTint,
    state.glassThickness,
    state.hardwareColor
  );

  const sideMultiplier = state.balconyLayout === 'l_shape' ? 1 : state.balconyLayout === 'u_shape' ? 2 : 0;

  const handleSliderInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onSliderChange(val);
    playSlideRollerSound(state.soundEnabled, Math.abs(val - state.openProgress));
  };

  const stepSlider = (delta: number) => {
    const next = Math.max(0, Math.min(1, state.openProgress + delta));
    onSliderChange(next);
    playSlideRollerSound(state.soundEnabled, 0.4);
  };

  const handleLayoutSelect = (layout: BalconyLayout) => {
    onUpdateState({ balconyLayout: layout });
    playMechanicalClick(state.soundEnabled);
  };

  const handleSystemSelect = (type: SystemType) => {
    onUpdateState({ systemType: type });
    playMechanicalClick(state.soundEnabled);
  };

  // Dynamic variable panel calculation based on balcony size
  const dynamicPanels = calculateDynamicPanels(state.widthCm, state.heightCm, state.glassThickness);
  const dynamicSidePanels = calculateDynamicSidePanels(state.sideWingWidthCm);

  const handleWidthChange = (newWidth: number) => {
    const patch: Partial<ConfiguratorState> = { widthCm: newWidth };
    if (state.autoCalculatePanels) {
      const calculated = calculateDynamicPanels(newWidth, state.heightCm, state.glassThickness);
      patch.panelCount = calculated.recommendedCount;
    } else {
      // Validate safe bounds so panel width is between 38cm and 88cm
      const minCount = Math.max(2, Math.floor(newWidth / 88));
      const maxCount = Math.min(14, Math.ceil(newWidth / 38));
      if (state.panelCount < minCount || state.panelCount > maxCount) {
        const calculated = calculateDynamicPanels(newWidth, state.heightCm, state.glassThickness);
        patch.panelCount = calculated.recommendedCount;
      }
    }
    onUpdateState(patch);
  };

  const handleSideWingWidthChange = (newSideWidth: number) => {
    const patch: Partial<ConfiguratorState> = { sideWingWidthCm: newSideWidth };
    if (state.autoCalculatePanels) {
      const calculated = calculateDynamicSidePanels(newSideWidth);
      patch.sideWingPanels = calculated.recommendedCount;
    } else {
      const minCount = Math.max(2, Math.floor(newSideWidth / 80));
      const maxCount = Math.min(6, Math.ceil(newSideWidth / 40));
      if (state.sideWingPanels < minCount || state.sideWingPanels > maxCount) {
        const calculated = calculateDynamicSidePanels(newSideWidth);
        patch.sideWingPanels = calculated.recommendedCount;
      }
    }
    onUpdateState(patch);
  };

  const handlePanelCountSelect = (count: number) => {
    onUpdateState({ panelCount: count, autoCalculatePanels: false });
    playMechanicalClick(state.soundEnabled);
  };

  const handleSidePanelCountSelect = (count: number) => {
    onUpdateState({ sideWingPanels: count });
    playMechanicalClick(state.soundEnabled);
  };

  const handleOpeningModeSelect = (mode: OpeningMode) => {
    onUpdateState({ openingMode: mode });
    playMechanicalClick(state.soundEnabled);
  };

  const handleHardwareColorSelect = (id: HardwareColorId) => {
    onUpdateState({ hardwareColor: id });
    playUiClick(state.soundEnabled);
  };

  const handleGlassTintSelect = (id: GlassTintId) => {
    onUpdateState({ glassTint: id });
    playUiClick(state.soundEnabled);
  };

  const handleCopyQuote = () => {
    const text = `پیش‌فاکتور و برآورد زنده تبریز سکوریت (تبریز سکوریت):
=============================================
طرح معماری بالکن: ${BALCONY_LAYOUTS[state.balconyLayout].nameFa}
مکانیزم سیستم انتخابی: ${SYSTEM_SPECS[state.systemType].nameFa}
ابعاد پروژه: عرض جلو ${state.widthCm}cm × ارتفاع ${state.heightCm}cm ${sideMultiplier > 0 ? `+ عرض بغل ${state.sideWingWidthCm}cm (${sideMultiplier} بال)` : ''}
مساحت کل دهانه: ${currentCalc.totalAreaSqm.toFixed(2)} متر مربع
تعداد پنل‌ها: ${state.panelCount} لنگه متحرک اصلی ${sideMultiplier > 0 ? `+ ${state.sideWingPanels * sideMultiplier} لنگه کناری` : ''}
رنگ یراق‌آلات و پروفیل‌ها: ${HARDWARE_COLORS[state.hardwareColor].nameFa}
نوع شیشه: ${GLASS_TINTS[state.glassTint].nameFa} (${state.glassThickness} میلی‌متر سکوریت حرارت‌دیده درجه ۱)
حالت بازشو: ${state.openingMode === 'center_split' ? 'دوطرفه از وسط' : state.openingMode === 'stack_right' ? 'جمع‌شو به راست' : 'جمع‌شو به چپ'}
نوع ریل کف: ${state.recessedFloorTrack ? 'همسطح توکار (Flush)' : 'روکار با شیار تخلیه آب'}
درزگیر: ${state.sealType === 'polycarbonate_h' ? 'شفاف پلی‌کربنات H با مگنت' : 'آلومینیومی با نوار مویی'}

آنالیز و تفکیک مبالغ:
- شیشه سکوریت سوپرکلیر (۴۵٪): ${currentCalc.glassCost.toLocaleString('fa-IR')} تومان
- پروفیل‌ها و ریل‌های آلومینیومی (۳۰٪): ${currentCalc.profileCost.toLocaleString('fa-IR')} تومان
- یراق‌آلات، چرخ‌های بلبرینگی و درزگیرها (۱۵٪): ${currentCalc.hardwareCost.toLocaleString('fa-IR')} تومان
- هزینه ساخت کارخانه‌ای و نصب تخصصی (۱۰٪): ${currentCalc.installationCost.toLocaleString('fa-IR')} تومان
${currentCalc.hasVolumeDiscount ? `* تخفیف ویژه متراژ بالا (۵٪): ${currentCalc.discountAmount.toLocaleString('fa-IR')} تومان کسر گردید` : ''}

مبلغ برآورد نهایی: ${currentCalc.finalCost.toLocaleString('fa-IR')} تومان (${(currentCalc.finalCost * 10).toLocaleString('fa-IR')} ریال)
مقایسه سیستم‌های دیگر برای همین ابعاد:
- ریلی چندخطه: ${slidingCalc.finalCost.toLocaleString('fa-IR')} تومان
- تاشو بالکنی: ${foldingCalc.finalCost.toLocaleString('fa-IR')} تومان
- آکاردئونی: ${accordionCalc.finalCost.toLocaleString('fa-IR')} تومان`;

    navigator.clipboard.writeText(text);
    setCopiedQuote(true);
    setTimeout(() => setCopiedQuote(false), 2500);
    playUiClick(state.soundEnabled);
  };

  const percentClosed = Math.round(state.openProgress * 100);

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-20 w-[95vw] max-w-[960px] pointer-events-auto transition-transform duration-300 ease-out">
      {/* Collapse / Expand Toggle Button */}
      <div className="flex justify-center -mb-px">
        <button
          onClick={() => {
            setIsCollapsed(!isCollapsed);
            playUiClick(state.soundEnabled);
          }}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-neutral-900 border border-neutral-700/80 rounded-t-xl text-neutral-300 hover:text-amber-400 hover:bg-neutral-800 shadow-lg transition-colors cursor-pointer"
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
              <span>نمایش پنل تنظیمات و ماژول محاسباتی</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              <span>بستن پنل و حالت تمام‌صفحه</span>
            </>
          )}
        </button>
      </div>

      {/* Main Glassmorphic Dock Container */}
      <div className="bg-neutral-950/95 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md">
        {/* Top Control Bar: Open/Close Slider, Animation & Persistent LIVE PRICE MODULE TICKER */}
        <div className="px-3.5 py-2.5 bg-neutral-900/95 border-b border-neutral-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Controls: Play Animation & Progress Display */}
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onTogglePlayAnimation();
                  playUiClick(state.soundEnabled);
                }}
                className={`flex items-center justify-center w-8 h-8 rounded-xl transition-colors cursor-pointer ${
                  state.isPlayingAnimation
                    ? 'bg-amber-500 text-neutral-950 font-bold'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                }`}
                title={state.isPlayingAnimation ? 'توقف انیمیشن' : 'پخش خودکار انیمیشن باز و بسته شدن مرحله‌ای (مشابه فیلم)'}
              >
                {state.isPlayingAnimation ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current mr-0.5" />}
              </button>

              <span className="text-xs font-bold text-neutral-200 whitespace-nowrap">
                حرکت:
              </span>

              <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-neutral-800 border border-neutral-700/60 text-amber-400 font-mono min-w-[50px] text-center">
                {percentClosed === 0 ? 'بسته کامل' : percentClosed === 100 ? 'باز کامل' : `${percentClosed}٪`}
              </span>
            </div>

            {/* Mobile-only Price Pill */}
            <button
              onClick={() => {
                setIsCollapsed(false);
                setActiveTab('quote');
                playUiClick(state.soundEnabled);
              }}
              className="sm:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono font-bold"
            >
              <Calculator className="w-3 h-3 text-emerald-400" />
              <span>{currentCalc.finalCost.toLocaleString('fa-IR')}</span>
              <span className="text-[9px] font-sans">ت</span>
            </button>
          </div>

          {/* Interactive Range Slider */}
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <button
              onClick={() => stepSlider(-0.1)}
              className="text-[11px] px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg cursor-pointer"
              title="بستن ۱۰٪"
            >
              -۱۰٪
            </button>

            <div className="relative flex-1 flex items-center">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={state.openProgress}
                onChange={handleSliderInput}
                className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <button
              onClick={() => stepSlider(0.1)}
              className="text-[11px] px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg cursor-pointer"
              title="باز کردن ۱۰٪"
            >
              +۱۰٪
            </button>

            <button
              onClick={() => {
                onSliderChange(state.openProgress > 0.5 ? 0 : 1);
                playMechanicalClick(state.soundEnabled);
              }}
              className="text-[11px] px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-amber-400 font-medium rounded-lg whitespace-nowrap cursor-pointer"
            >
              {state.openProgress > 0.5 ? 'بستن کامل' : 'بازشوی کامل'}
            </button>
          </div>

          {/* Persistent Desktop Live Calculation Ticker Module */}
          <button
            onClick={() => {
              setIsCollapsed(false);
              setActiveTab('quote');
              playUiClick(state.soundEnabled);
            }}
            className="hidden sm:flex items-center justify-between gap-3 px-3 py-1.5 rounded-xl bg-gradient-to-r from-neutral-900 to-neutral-800 hover:from-neutral-850 hover:to-neutral-750 border border-emerald-500/30 hover:border-emerald-400/60 text-neutral-200 transition-all cursor-pointer group shadow-sm"
            title="کلیک برای باز کردن ماژول محاسبه دقیق قیمت و پیش‌فاکتور زنده"
          >
            <div className="flex items-center gap-2 text-right">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/25 transition-colors">
                <Calculator className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-[10px] text-neutral-400 font-medium flex items-center gap-1">
                  <span>محاسبه زنده</span>
                  <span className="font-mono text-neutral-300">({currentCalc.totalAreaSqm} م²)</span>
                </div>
                <div className="text-xs font-black text-emerald-400 font-mono tracking-tight flex items-baseline gap-1">
                  <span>{currentCalc.finalCost.toLocaleString('fa-IR')}</span>
                  <span className="text-[9px] font-sans text-neutral-400">تومان</span>
                </div>
              </div>
            </div>
            <div className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-md font-medium group-hover:bg-emerald-500/30 transition-colors">
              آنالیز قیمت ←
            </div>
          </button>
        </div>

        {/* Tab Navigation */}
        {!isCollapsed && (
          <div className="flex border-b border-neutral-800/80 bg-neutral-900/60 overflow-x-auto text-xs">
            <button
              onClick={() => {
                setActiveTab('layout');
                playUiClick(state.soundEnabled);
              }}
              className={`flex-1 min-w-[105px] py-2.5 px-2 flex items-center justify-center gap-1.5 font-bold transition-colors cursor-pointer border-b-2 ${
                activeTab === 'layout'
                  ? 'border-amber-400 text-amber-400 bg-neutral-900'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <CornerDownRight className="w-3.5 h-3.5" />
              <span>پلان بالکن</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('system');
                playUiClick(state.soundEnabled);
              }}
              className={`flex-1 min-w-[105px] py-2.5 px-2 flex items-center justify-center gap-1.5 font-bold transition-colors cursor-pointer border-b-2 ${
                activeTab === 'system'
                  ? 'border-amber-400 text-amber-400 bg-neutral-900'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>سیستم و ابعاد</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('colors');
                playUiClick(state.soundEnabled);
              }}
              className={`flex-1 min-w-[115px] py-2.5 px-2 flex items-center justify-center gap-1.5 font-bold transition-colors cursor-pointer border-b-2 ${
                activeTab === 'colors'
                  ? 'border-amber-400 text-amber-400 bg-neutral-900'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {state.weather === 'rainy' ? (
                <CloudRain className="w-3.5 h-3.5 text-sky-400" />
              ) : state.weather === 'cloudy' ? (
                <Cloud className="w-3.5 h-3.5 text-slate-300" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>آب‌وهوا، نور و رنگ</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('hardware');
                playUiClick(state.soundEnabled);
              }}
              className={`flex-1 min-w-[105px] py-2.5 px-2 flex items-center justify-center gap-1.5 font-bold transition-colors cursor-pointer border-b-2 ${
                activeTab === 'hardware'
                  ? 'border-amber-400 text-amber-400 bg-neutral-900'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>یراق‌آلات و ریل</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('quote');
                playUiClick(state.soundEnabled);
              }}
              className={`flex-1 min-w-[130px] py-2.5 px-2.5 flex items-center justify-center gap-1.5 font-bold transition-colors cursor-pointer border-b-2 relative ${
                activeTab === 'quote'
                  ? 'border-emerald-400 text-emerald-300 bg-neutral-900 shadow-inner'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Calculator className="w-3.5 h-3.5 text-emerald-400" />
              <span>ماژول محاسبه قیمت</span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded-full font-mono hidden md:inline">
                زنده
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('tracking');
                playUiClick(state.soundEnabled);
              }}
              className={`flex-1 min-w-[125px] py-2.5 px-2.5 flex items-center justify-center gap-1.5 font-bold transition-colors cursor-pointer border-b-2 relative ${
                activeTab === 'tracking'
                  ? 'border-sky-400 text-sky-300 bg-neutral-900 shadow-inner'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <PackageSearch className="w-3.5 h-3.5 text-sky-400" />
              <span>پیگیری سفارش</span>
              <span className="text-[9px] bg-sky-500/20 text-sky-300 border border-sky-500/40 px-1.5 py-0.2 rounded-full font-mono hidden md:inline">
                خط تولید
              </span>
            </button>
          </div>
        )}

        {/* Tab Content Panel */}
        {!isCollapsed && (
          <div className="p-3.5 max-h-[42vh] overflow-y-auto">
            {/* TAB 0: BALCONY LAYOUT & OPENING MODE */}
            {activeTab === 'layout' && (
              <div className="space-y-4">
                {/* Balcony Shape Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                      <CornerDownRight className="w-3.5 h-3.5 text-amber-400" />
                      فرم معماری بالکن (مطابق پروژه شما یا فیلم):
                    </span>
                    <span className="text-[11px] text-amber-400 font-medium">
                      {BALCONY_LAYOUTS[state.balconyLayout].nameFa}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    {/* L-Shape Corner (As in video!) */}
                    <button
                      onClick={() => handleLayoutSelect('l_shape')}
                      className={`p-3 rounded-xl border text-right transition-all cursor-pointer relative ${
                        state.balconyLayout === 'l_shape'
                          ? 'bg-amber-500/15 border-amber-400 shadow-md'
                          : 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="absolute top-2.5 left-2.5">
                        <span className="text-[9px] bg-sky-500/20 text-sky-300 border border-sky-500/40 px-1.5 py-0.5 rounded font-mono">
                          مشابه فیلم
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <CornerDownRight className={`w-4 h-4 ${state.balconyLayout === 'l_shape' ? 'text-amber-400' : 'text-neutral-400'}`} />
                        <span className={`text-xs font-bold ${state.balconyLayout === 'l_shape' ? 'text-amber-400' : 'text-neutral-200'}`}>
                          بالکن ال‌شکل نبش‌دار (Corner L)
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400">
                        دو ضلع متقاطع ۹۰ درجه با ستون اتصال نبش؛ لنگه‌ها در دو بالکن جلو و بغل حرکت می‌کنند.
                      </p>
                    </button>

                    {/* Straight */}
                    <button
                      onClick={() => handleLayoutSelect('straight')}
                      className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                        state.balconyLayout === 'straight'
                          ? 'bg-amber-500/15 border-amber-400 shadow-md'
                          : 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Minus className={`w-4 h-4 ${state.balconyLayout === 'straight' ? 'text-amber-400' : 'text-neutral-400'}`} />
                        <span className={`text-xs font-bold ${state.balconyLayout === 'straight' ? 'text-amber-400' : 'text-neutral-200'}`}>
                          بالکن مستقیم (یک‌طرفه)
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400">
                        طرح استاندارد خطی برای دهانه‌های صاف بین دو دیوار یا نرده تراس.
                      </p>
                    </button>

                    {/* U-Shape */}
                    <button
                      onClick={() => handleLayoutSelect('u_shape')}
                      className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                        state.balconyLayout === 'u_shape'
                          ? 'bg-amber-500/15 border-amber-400 shadow-md'
                          : 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Maximize className={`w-4 h-4 ${state.balconyLayout === 'u_shape' ? 'text-amber-400' : 'text-neutral-400'}`} />
                        <span className={`text-xs font-bold ${state.balconyLayout === 'u_shape' ? 'text-amber-400' : 'text-neutral-200'}`}>
                          بالکن یو‌شکل (سه‌طرفه)
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400">
                        ضلع اصلی جلو به همراه دو بال کناری چپ و راست با دید کامل ۱۸۰ درجه.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Opening Mode / Stacking Direction */}
                <div className="pt-2 border-t border-neutral-800/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-neutral-200">
                      جهت بازشو و پارک لنگه‌ها (CamBalkon Stacking):
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'stack_left' as OpeningMode, title: 'جمع شدن به چپ', desc: 'لنگه‌ها به دیوار سمت چپ هدایت و تا می‌شوند', icon: ArrowLeft },
                      { id: 'center_split' as OpeningMode, title: 'بازشوی دوطرفه از وسط (مشابه فیلم)', desc: 'باز شدن لنگه‌ها از وسط به دو طرفین', icon: Split },
                      { id: 'stack_right' as OpeningMode, title: 'جمع شدن به راست', desc: 'لنگه‌ها به سمت راست پارک می‌شوند', icon: ArrowRight },
                    ].map((mode) => {
                      const Icon = mode.icon;
                      const isSelected = state.openingMode === mode.id;
                      return (
                        <button
                          key={mode.id}
                          onClick={() => handleOpeningModeSelect(mode.id)}
                          className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-amber-500/15 border-amber-400 text-amber-300 shadow-sm'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-neutral-400'}`} />
                            <div>
                              <div className="text-xs font-bold">{mode.title}</div>
                              <div className="text-[10px] text-neutral-400">{mode.desc}</div>
                            </div>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Side Wing Controls (if L-shape or U-shape) */}
                {state.balconyLayout !== 'straight' && (
                  <div className="pt-2 border-t border-neutral-800/80 bg-neutral-900/60 p-3 rounded-xl border border-neutral-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                        تنظیمات ضلع کناری (Side Wing):
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between items-center mb-1 text-xs">
                          <span className="text-neutral-300">تعداد پنل ضلع کناری:</span>
                          <span className="font-mono text-sky-400 font-bold">{state.sideWingPanels} لنگه</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {dynamicSidePanels.options.map((count) => (
                            <button
                              key={count}
                              onClick={() => handleSidePanelCountSelect(count)}
                              className={`py-1.5 px-2 rounded-lg border text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center ${
                                state.sideWingPanels === count
                                  ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                              }`}
                            >
                              <span>{count} پنل</span>
                              <span className="text-[9px] font-mono opacity-70">
                                {Math.round(state.sideWingWidthCm / count)} cm
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1 text-xs">
                          <span className="text-neutral-300">عرض ضلع کناری (Depth):</span>
                          <span className="font-mono text-sky-400 font-bold">{state.sideWingWidthCm} cm</span>
                        </div>
                        <input
                          type="range"
                          min="120"
                          max="300"
                          step="10"
                          value={state.sideWingWidthCm}
                          onChange={(e) => handleSideWingWidthChange(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 1: SYSTEM & DIMENSIONS */}
            {activeTab === 'system' && (
              <div className="space-y-4">
                {/* System Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-amber-400" />
                      مکانیزم و نوع سیستم:
                    </span>
                    <span className="text-[11px] text-amber-400 font-medium">
                      {SYSTEM_SPECS[state.systemType].tagline}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    {/* Folding (CamBalkon) */}
                    <button
                      onClick={() => handleSystemSelect('folding')}
                      className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                        state.systemType === 'folding'
                          ? 'bg-amber-500/10 border-amber-400/80 shadow-md shadow-amber-500/5'
                          : 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <BookOpen className={`w-4 h-4 ${state.systemType === 'folding' ? 'text-amber-400' : 'text-neutral-400'}`} />
                          <span className={`text-xs font-bold ${state.systemType === 'folding' ? 'text-amber-400' : 'text-neutral-200'}`}>
                            سیستم تاشو (بالکن شیشه‌ای - CamBalkon)
                          </span>
                        </div>
                        {state.systemType === 'folding' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                      <p className="text-[11px] text-neutral-400 line-clamp-2">
                        لنگه‌ها تک‌تک در امتداد ریل سر خورده و ۹۰ درجه مانند صفحات کتاب به گوشه تا می‌شوند (مشابه فیلم).
                      </p>
                    </button>

                    {/* Sliding */}
                    <button
                      onClick={() => handleSystemSelect('sliding')}
                      className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                        state.systemType === 'sliding'
                          ? 'bg-amber-500/10 border-amber-400/80 shadow-md shadow-amber-500/5'
                          : 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Sliders className={`w-4 h-4 ${state.systemType === 'sliding' ? 'text-amber-400' : 'text-neutral-400'}`} />
                          <span className={`text-xs font-bold ${state.systemType === 'sliding' ? 'text-amber-400' : 'text-neutral-200'}`}>
                            سیستم ریلی (اسلایدینگ چندخطه)
                          </span>
                        </div>
                        {state.systemType === 'sliding' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                      <p className="text-[11px] text-neutral-400 line-clamp-2">
                        حرکت موازی لنگه‌ها روی ریل‌های چندردیفه، بدون اشغال فضای داخلی یا خارجی.
                      </p>
                    </button>

                    {/* Accordion */}
                    <button
                      onClick={() => handleSystemSelect('accordion')}
                      className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                        state.systemType === 'accordion'
                          ? 'bg-amber-500/10 border-amber-400/80 shadow-md shadow-amber-500/5'
                          : 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Maximize2 className={`w-4 h-4 ${state.systemType === 'accordion' ? 'text-amber-400' : 'text-neutral-400'}`} />
                          <span className={`text-xs font-bold ${state.systemType === 'accordion' ? 'text-amber-400' : 'text-neutral-200'}`}>
                            سیستم آکاردئونی (زیگزاگ)
                          </span>
                        </div>
                        {state.systemType === 'accordion' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                      <p className="text-[11px] text-neutral-400 line-clamp-2">
                        لولاهای متصل جفتی و جمع شدن پیوسته هماهنگ؛ مناسب پارتیشن و فضاهای باز لوکس.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Main Wing Panel Count - Dynamic Size-Based Calculation */}
                <div className="pt-2 border-t border-neutral-800/80">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-200">
                        محاسبه و تعداد پنل‌های ضلع جلو:
                      </span>
                      <button
                        onClick={() => {
                          const nextAuto = !state.autoCalculatePanels;
                          if (nextAuto) {
                            onUpdateState({
                              autoCalculatePanels: true,
                              panelCount: dynamicPanels.recommendedCount,
                            });
                          } else {
                            onUpdateState({ autoCalculatePanels: false });
                          }
                          playUiClick(state.soundEnabled);
                        }}
                        className={`text-[11px] px-2.5 py-0.5 rounded-lg border font-medium transition-all cursor-pointer flex items-center gap-1 ${
                          state.autoCalculatePanels
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                        }`}
                        title="محاسبه هوشمند تعداد پنل متناسب با عرض دهانه بالکن"
                      >
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>محاسبه خودکار بر اساس ابعاد {state.autoCalculatePanels ? '(فعال)' : ''}</span>
                      </button>
                    </div>

                    <span className="text-xs text-neutral-400">
                      عرض هر لنگه: <strong className="text-amber-400 font-mono">{(state.widthCm / state.panelCount).toFixed(1)} cm</strong>
                    </span>
                  </div>

                  {/* Dynamic Panel Count Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {dynamicPanels.options.map((opt) => {
                      const isSelected = state.panelCount === opt.count;
                      return (
                        <button
                          key={opt.count}
                          onClick={() => handlePanelCountSelect(opt.count)}
                          className={`relative py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                            isSelected
                              ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-extrabold shadow-sm ring-1 ring-amber-400/30'
                              : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 text-neutral-300 font-medium'
                          }`}
                        >
                          {opt.isOptimal && (
                            <span className="absolute -top-2 px-1.5 py-0.2 bg-amber-400 text-neutral-950 font-black text-[9px] rounded-full shadow-xs">
                              استاندارد
                            </span>
                          )}
                          <div className="text-xs font-bold">{opt.count} پنل</div>
                          <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                            {opt.panelWidthCm} cm
                          </div>
                          <div className="text-[9px] text-neutral-500 font-mono">
                            ~{opt.estimatedPanelWeightKg} kg
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Engineering & Ergonomics Indicator Banner */}
                  <div className="mt-2.5 p-2 rounded-xl bg-neutral-900/70 border border-neutral-800 flex flex-wrap items-center justify-between text-[11px] text-neutral-400 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>
                        معیار مهندسی تبریز سکوریت: عرض بهینه ۵۰ الی ۶۸ سانتیمتر به ازای هر لنگه جهت ارگونومی بازشو و طول عمر غلطک‌های بلبرینگی.
                      </span>
                    </div>
                    <div className="font-mono text-neutral-300">
                      وزن تقریبی هر لنگه: <span className="text-amber-400 font-bold">{dynamicPanels.options.find((o) => o.count === state.panelCount)?.estimatedPanelWeightKg || Math.round((state.widthCm / state.panelCount / 100) * (state.heightCm / 100) * state.glassThickness * 2.5)} kg</span>
                    </div>
                  </div>
                </div>

                {/* Width & Height Dimension Sliders */}
                <div className="pt-2 border-t border-neutral-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-1 text-xs">
                      <span className="text-neutral-300 font-semibold">عرض ضلع جلو (Width):</span>
                      <span className="font-mono text-amber-400 font-bold">{state.widthCm} سانتی‌متر</span>
                    </div>
                    <input
                      type="range"
                      min="200"
                      max="700"
                      step="10"
                      value={state.widthCm}
                      onChange={(e) => handleWidthChange(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-neutral-500 mt-1 font-mono">
                      <span>200 cm (2.0m)</span>
                      <span>700 cm (7.0m)</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1 text-xs">
                      <span className="text-neutral-300 font-semibold">ارتفاع بازشو (Height):</span>
                      <span className="font-mono text-amber-400 font-bold">{state.heightCm} سانتی‌متر</span>
                    </div>
                    <input
                      type="range"
                      min="180"
                      max="300"
                      step="10"
                      value={state.heightCm}
                      onChange={(e) => onUpdateState({ heightCm: parseInt(e.target.value) })}
                      className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-neutral-500 mt-1 font-mono">
                      <span>180 cm (1.8m)</span>
                      <span>300 cm (3.0m)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: WEATHER, LIGHTING, HARDWARE & GLASS COLORS */}
            {activeTab === 'colors' && (
              <div className="space-y-4">
                {/* 1. Weather Simulation & Glass Transparency Reaction Toggle */}
                <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-950 p-3 rounded-xl border border-neutral-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-neutral-100 flex items-center gap-1.5">
                      <CloudRain className="w-4 h-4 text-sky-400" />
                      شبیه‌ساز وضعیت آب‌وهوا و واکنش شفافیت شیشه (Weather Simulation):
                    </span>
                    <span className="text-xs font-bold text-amber-400 font-mono">
                      {WEATHER_SIMULATIONS[state.weather].nameFa}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    {/* Sunny */}
                    <button
                      onClick={() => {
                        onUpdateState({ weather: 'sunny' });
                        playWeatherSound('sunny', state.soundEnabled);
                      }}
                      className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                        state.weather === 'sunny'
                          ? 'bg-amber-500/15 border-amber-400 shadow-md shadow-amber-500/10 ring-1 ring-amber-400/40'
                          : 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <Sun className="w-4 h-4 text-amber-400" />
                            <span className="text-xs font-bold text-neutral-100">آفتابی و درخشان</span>
                          </div>
                          {state.weather === 'sunny' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                        </div>
                        <p className="text-[10px] text-neutral-400 line-clamp-2 leading-relaxed">
                          تابش مستقیم نور آفتاب، رفلکس‌های تیز آینه‌ای و شفافیت کریستالی حداکثری
                        </p>
                      </div>
                      <div className="mt-2 pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[10px]">
                        <span className="text-neutral-500">شفافیت شیشه:</span>
                        <span className="font-mono text-amber-400 font-bold">۹۴٪ (دید بلورین)</span>
                      </div>
                    </button>

                    {/* Rainy */}
                    <button
                      onClick={() => {
                        onUpdateState({ weather: 'rainy' });
                        playWeatherSound('rainy', state.soundEnabled);
                      }}
                      className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between relative ${
                        state.weather === 'rainy'
                          ? 'bg-sky-500/15 border-sky-400 shadow-md shadow-sky-500/10 ring-1 ring-sky-400/40'
                          : 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="absolute top-2 left-2">
                        <span className="text-[8px] bg-sky-500/20 text-sky-300 border border-sky-500/40 px-1.5 py-0.2 rounded font-mono">
                          بارش زنده
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <CloudRain className="w-4 h-4 text-sky-400" />
                            <span className="text-xs font-bold text-neutral-100">بارانی و قطرات آب</span>
                          </div>
                          {state.weather === 'rainy' && <Check className="w-3.5 h-3.5 text-sky-400" />}
                        </div>
                        <p className="text-[10px] text-neutral-400 line-clamp-2 leading-relaxed">
                          بارش فعال قطرات باران، تشکیل لایه رطوبت بر شیشه و انعکاس براق زمین خیس
                        </p>
                      </div>
                      <div className="mt-2 pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[10px]">
                        <span className="text-neutral-500">پاسخ شیشه:</span>
                        <span className="font-mono text-sky-400 font-bold">۸۲٪ (پراکندگی رطوبت)</span>
                      </div>
                    </button>

                    {/* Cloudy */}
                    <button
                      onClick={() => {
                        onUpdateState({ weather: 'cloudy' });
                        playWeatherSound('cloudy', state.soundEnabled);
                      }}
                      className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                        state.weather === 'cloudy'
                          ? 'bg-slate-700/40 border-slate-400 shadow-md ring-1 ring-slate-400/40'
                          : 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <Cloud className="w-4 h-4 text-slate-300" />
                            <span className="text-xs font-bold text-neutral-100">ابری و نور دیفیوز</span>
                          </div>
                          {state.weather === 'cloudy' && <Check className="w-3.5 h-3.5 text-slate-300" />}
                        </div>
                        <p className="text-[10px] text-neutral-400 line-clamp-2 leading-relaxed">
                          نور ملایم و یکنواخت بدون سایه تند، دید بدون بازتاب خیره‌کننده به داخل
                        </p>
                      </div>
                      <div className="mt-2 pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[10px]">
                        <span className="text-neutral-500">شفافیت شیشه:</span>
                        <span className="font-mono text-slate-300 font-bold">۹۶٪ (دید عمیق)</span>
                      </div>
                    </button>
                  </div>

                  {/* Glass reaction detail badge */}
                  <div className="mt-2.5 pt-2 border-t border-neutral-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-neutral-400">
                    <div className="flex items-center gap-2">
                      <Droplets className="w-3.5 h-3.5 text-sky-400" />
                      <span>
                        واکنش شیشه در وضعیت فعلی: <strong className="text-neutral-200">{WEATHER_SIMULATIONS[state.weather].glassBehaviorFa}</strong>
                      </span>
                    </div>
                    <span className="text-[10px] font-mono bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800 text-amber-400">
                      {WEATHER_SIMULATIONS[state.weather].reflectionType}
                    </span>
                  </div>
                </div>

                {/* 2. Lighting Conditions (Morning, Noon, Sunset, Night) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
                      شرایط نوری صحنه و بازتاب خورشید (صبح، ظهر، غروب):
                    </span>
                    <span className="text-xs font-semibold text-amber-400">
                      {LIGHTING_CONDITIONS[state.lightingCondition].nameFa}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                    {Object.values(LIGHTING_CONDITIONS).map((light) => {
                      const isSelected = state.lightingCondition === light.id;
                      return (
                        <button
                          key={light.id}
                          onClick={() => {
                            onUpdateState({ lightingCondition: light.id });
                            playUiClick(state.soundEnabled);
                          }}
                          className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-amber-500/15 border-amber-400 shadow-md shadow-amber-500/10'
                              : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/40'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-3.5 h-3.5 rounded-full bg-gradient-to-r ${light.colorBadge} shadow-sm`} />
                              <span className={`text-xs font-bold ${isSelected ? 'text-amber-300' : 'text-neutral-200'}`}>
                                {light.nameFa.split(' ')[0]}
                              </span>
                            </div>
                            {isSelected ? (
                              <Check className="w-3.5 h-3.5 text-amber-400" />
                            ) : (
                              <span className="text-[10px] text-neutral-500 font-mono">{light.sunElevation.split(' ')[1] || ''}</span>
                            )}
                          </div>
                          <div>
                            <div className="text-[10px] text-amber-400/90 font-mono mb-0.5">{light.sunElevation}</div>
                            <div className="text-[10px] text-neutral-400 line-clamp-2 leading-tight">{light.description}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Hardware Color Swatches */}
                <div className="pt-2 border-t border-neutral-800/80">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-200">
                        رنگ و پوشش یراق‌آلات و پروفیل‌ها:
                      </span>
                      <span className="text-xs font-semibold text-amber-400">
                        {HARDWARE_COLORS[state.hardwareColor].nameFa}
                      </span>
                    </div>

                    {onOpenMaterialPanel && (
                      <button
                        onClick={() => {
                          onOpenMaterialPanel();
                          playUiClick(state.soundEnabled);
                        }}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/50 text-amber-300 font-bold flex items-center gap-1 cursor-pointer transition-all"
                        title="مشاهده مشخصات فنی، ضریب بازتاب و فینیشینگ در پالت متریال"
                      >
                        <Palette className="w-3 h-3 text-amber-400" />
                        <span>پالت کامل متریال و فینیشینگ ←</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2">
                    {Object.values(HARDWARE_COLORS).map((color) => {
                      const isSelected = state.hardwareColor === color.id;
                      return (
                        <button
                          key={color.id}
                          onClick={() => handleHardwareColorSelect(color.id)}
                          className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex flex-col gap-2 ${
                            isSelected
                              ? 'bg-amber-500/10 border-amber-400 shadow-md'
                              : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className="w-6 h-6 rounded-full border border-neutral-600 shadow-inner"
                              style={{ backgroundColor: color.hex }}
                            />
                            {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-neutral-200">{color.nameFa}</div>
                            <div className="text-[10px] text-neutral-500">{color.nameEn}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Glass Tint Options */}
                <div className="pt-2 border-t border-neutral-800/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-neutral-200">
                      نوع و رنگ شیشه سکوریت:
                    </span>
                    <span className="text-xs font-semibold text-amber-400">
                      {GLASS_TINTS[state.glassTint].nameFa}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.values(GLASS_TINTS).map((tint) => {
                      const isSelected = state.glassTint === tint.id;
                      const isCamBalkonCyan = tint.id === 'cambalkon_cyan';
                      return (
                        <button
                          key={tint.id}
                          onClick={() => handleGlassTintSelect(tint.id)}
                          className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between relative ${
                            isSelected
                              ? 'bg-amber-500/10 border-amber-400 shadow-md'
                              : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                          }`}
                        >
                          {isCamBalkonCyan && (
                            <div className="absolute top-2 left-2">
                              <span className="text-[9px] bg-sky-500/20 text-sky-300 border border-sky-500/40 px-1 py-0.5 rounded font-mono">
                                ویژه فیلم
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between mb-1.5">
                            <span
                              className="w-6 h-6 rounded-lg border border-neutral-600 shadow-inner"
                              style={{ backgroundColor: tint.color }}
                            />
                            {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-neutral-200">{tint.nameFa}</div>
                            <div className="text-[10px] text-neutral-400 line-clamp-2 mt-0.5">{tint.description}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: HARDWARE & TECHNICAL SPECS */}
            {activeTab === 'hardware' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Glass Seal Type */}
                  <div>
                    <label className="text-xs font-bold text-neutral-200 block mb-2">
                      درزگیر و آب‌بندی بین شیشه‌ها (فریم‌لس):
                    </label>
                    <div className="space-y-1.5">
                      {[
                        { id: 'polycarbonate_h' as GlassSealType, title: 'درزگیر شفاف پلی‌کربنات H با مگنت', desc: 'دید ۱۰۰٪ بدون مانع و فریم‌لس' },
                        { id: 'aluminum_brush' as GlassSealType, title: 'درزگیر آلومینیومی با نوار مویی', desc: 'عایق حداکثری باد، باران و گردوغبار' },
                      ].map((s) => (
                        <button
                          key={s.id}
                          onClick={() => {
                            onUpdateState({ sealType: s.id });
                            playUiClick(state.soundEnabled);
                          }}
                          className={`w-full p-2.5 rounded-xl border text-right flex items-center justify-between transition-all cursor-pointer ${
                            state.sealType === s.id
                              ? 'bg-amber-500/15 border-amber-400 text-amber-300'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold">{s.title}</div>
                            <div className="text-[10px] text-neutral-400">{s.desc}</div>
                          </div>
                          {state.sealType === s.id && <Check className="w-4 h-4 text-amber-400" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Glass Thickness */}
                  <div>
                    <label className="text-xs font-bold text-neutral-200 block mb-2">
                      ضخامت شیشه سکوریت استاندارد:
                    </label>
                    <div className="space-y-1.5">
                      {[
                        { val: 10, title: '۱۰ میلی‌متر سکوریت نشکن (پیشنهادی)', desc: 'حداکثر استحکام در برابر باد و ضربه بالکن' },
                        { val: 8, title: '۸ میلی‌متر سکوریت نشکن', desc: 'وزن سبک‌تر، مناسب پارتیشن داخلی' },
                      ].map((t) => (
                        <button
                          key={t.val}
                          onClick={() => {
                            onUpdateState({ glassThickness: t.val as 8 | 10 });
                            playUiClick(state.soundEnabled);
                          }}
                          className={`w-full p-2.5 rounded-xl border text-right flex items-center justify-between transition-all cursor-pointer ${
                            state.glassThickness === t.val
                              ? 'bg-amber-500/15 border-amber-400 text-amber-300'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold">{t.title}</div>
                            <div className="text-[10px] text-neutral-400">{t.desc}</div>
                          </div>
                          {state.glassThickness === t.val && <Check className="w-4 h-4 text-amber-400" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Floor Track Profile */}
                  <div>
                    <label className="text-xs font-bold text-neutral-200 block mb-2">
                      نوع ریل تحتانی (کف):
                    </label>
                    <div className="space-y-1.5">
                      {[
                        { val: false, title: 'ریل روکار با شیار تخلیه آب باران', desc: 'مناسب بالکن و فضاهای بیرونی با شیب آب' },
                        { val: true, title: 'ریل همسطح توکار (Flush Threshold)', desc: 'کف‌سازی بدون مانع برای عبور ویلچر و تردد آسان' },
                      ].map((r) => (
                        <button
                          key={String(r.val)}
                          onClick={() => {
                            onUpdateState({ recessedFloorTrack: r.val });
                            playUiClick(state.soundEnabled);
                          }}
                          className={`w-full p-2.5 rounded-xl border text-right flex items-center justify-between transition-all cursor-pointer ${
                            state.recessedFloorTrack === r.val
                              ? 'bg-amber-500/15 border-amber-400 text-amber-300'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold">{r.title}</div>
                            <div className="text-[10px] text-neutral-400">{r.desc}</div>
                          </div>
                          {state.recessedFloorTrack === r.val && <Check className="w-4 h-4 text-amber-400" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: LIVE CALCULATION MODULE & ESTIMATION STUDIO */}
            {activeTab === 'quote' && (
              <div className="space-y-4">
                {/* 1. Main Live Pricing Card Header */}
                <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border border-emerald-500/40 rounded-2xl p-4 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 mb-3 border-b border-neutral-800/90 gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                        <h3 className="text-sm font-black text-neutral-100 flex items-center gap-2">
                          <span>ماژول محاسباتی برآورد زنده قیمت پروژه</span>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono">
                            نرخ روز کارخانه تبریز سکوریت
                          </span>
                        </h3>
                      </div>
                      <p className="text-[11px] text-neutral-400">
                        محاسبه بلادرنگ بر اساس ابعاد دهانه (عرض {state.widthCm}cm × ارتفاع {state.heightCm}cm) و سیستم {SYSTEM_SPECS[state.systemType].nameFa}
                      </p>
                    </div>

                    {/* Prominent Price Display Box */}
                    <div className="bg-neutral-950/90 border border-emerald-500/50 rounded-xl px-4 py-2.5 text-left w-full md:w-auto shadow-inner">
                      <div className="text-[11px] text-neutral-400 flex items-center justify-between md:justify-end gap-2">
                        {currentCalc.hasVolumeDiscount && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-mono font-bold">
                            ۵٪ تخفیف اعمال شد
                          </span>
                        )}
                        <span>برآورد قیمت تقریبی کل پروژه:</span>
                      </div>
                      <div className="flex items-baseline justify-between md:justify-end gap-2 mt-0.5">
                        <span className="text-xl md:text-2xl font-black text-emerald-400 font-mono tracking-tight">
                          {currentCalc.finalCost.toLocaleString('fa-IR')}
                        </span>
                        <span className="text-xs font-bold text-neutral-300">تومان</span>
                      </div>
                      <div className="text-[10px] text-neutral-500 font-mono text-left">
                        معادل {currentCalc.finalCostRial.toLocaleString('fa-IR')} ریال
                      </div>
                    </div>
                  </div>

                  {/* 2. Interactive Dimension Sliders Inside Calculator */}
                  <div className="bg-neutral-950/70 border border-neutral-800/80 rounded-xl p-3 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                        تغییر زنده ابعاد برای مشاهده آنی تأثیر بر قیمت:
                      </span>
                      <span className="text-xs font-mono text-emerald-400 font-bold bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                        مساحت کل دهانه: {currentCalc.totalAreaSqm.toFixed(2)} مترمربع
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Width Quick Controls */}
                      <div>
                        <div className="flex justify-between items-center mb-1 text-xs">
                          <span className="text-neutral-300">عرض دهانه (Width):</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleWidthChange(Math.max(200, state.widthCm - 10))}
                              className="px-1.5 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[10px] cursor-pointer"
                            >
                              -۱۰
                            </button>
                            <span className="font-mono text-amber-400 font-bold min-w-[50px] text-center">
                              {state.widthCm} cm
                            </span>
                            <button
                              onClick={() => handleWidthChange(Math.min(700, state.widthCm + 10))}
                              className="px-1.5 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[10px] cursor-pointer"
                            >
                              +۱۰
                            </button>
                          </div>
                        </div>
                        <input
                          type="range"
                          min="200"
                          max="700"
                          step="10"
                          value={state.widthCm}
                          onChange={(e) => handleWidthChange(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                        />
                        <div className="flex justify-between text-[10px] text-neutral-500 mt-0.5 font-mono">
                          <span>۲ متر (200cm)</span>
                          <span>۷ متر (700cm)</span>
                        </div>
                      </div>

                      {/* Height Quick Controls */}
                      <div>
                        <div className="flex justify-between items-center mb-1 text-xs">
                          <span className="text-neutral-300">ارتفاع دهانه (Height):</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => onUpdateState({ heightCm: Math.max(160, state.heightCm - 10) })}
                              className="px-1.5 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[10px] cursor-pointer"
                            >
                              -۱۰
                            </button>
                            <span className="font-mono text-amber-400 font-bold min-w-[50px] text-center">
                              {state.heightCm} cm
                            </span>
                            <button
                              onClick={() => onUpdateState({ heightCm: Math.min(320, state.heightCm + 10) })}
                              className="px-1.5 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[10px] cursor-pointer"
                            >
                              +۱۰
                            </button>
                          </div>
                        </div>
                        <input
                          type="range"
                          min="160"
                          max="320"
                          step="10"
                          value={state.heightCm}
                          onChange={(e) => onUpdateState({ heightCm: parseInt(e.target.value) })}
                          className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                        />
                        <div className="flex justify-between text-[10px] text-neutral-500 mt-0.5 font-mono">
                          <span>۱.۶ متر (160cm)</span>
                          <span>۳.۲ متر (320cm)</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Preset Dimensions */}
                    <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-neutral-850 text-xs">
                      <span className="text-neutral-400 text-[11px]">ابعاد پیش‌فرض متداول:</span>
                      {[
                        { label: 'کوچک (۲.۵ × ۲.۲ متر)', w: 250, h: 220 },
                        { label: 'استاندارد (۳.۵ × ۲.۴ متر)', w: 350, h: 240 },
                        { label: 'بزرگ (۵.۰ × ۲.۶ متر)', w: 500, h: 260 },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          onClick={() => {
                            handleWidthChange(preset.w);
                            onUpdateState({ heightCm: preset.h });
                          }}
                          className="px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[11px] text-neutral-300 hover:text-amber-300 cursor-pointer transition-colors"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Live 3-Way System Cost Comparison Cards */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-emerald-400" />
                        مقایسه زنده قیمت ۳ سیستم برای همین متراژ ({currentCalc.totalAreaSqm} مترمربع):
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        کلیک روی هر کارت، سیستم را بلادرنگ تغییر می‌دهد
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                      {/* 1. Sliding */}
                      <button
                        onClick={() => handleSystemSelect('sliding')}
                        className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                          state.systemType === 'sliding'
                            ? 'bg-amber-500/15 border-amber-400 shadow-md ring-1 ring-amber-400/50'
                            : 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-neutral-200">سیستم ریلی (اسلایدینگ)</span>
                            {state.systemType === 'sliding' ? (
                              <span className="text-[9px] bg-amber-500/30 text-amber-300 px-1.5 py-0.2 rounded font-bold">
                                فعال
                              </span>
                            ) : (
                              <span className="text-[9px] text-neutral-500">پایه ۲,۸۵۰,۰۰۰ ت/م²</span>
                            )}
                          </div>
                          <p className="text-[10px] text-neutral-400 line-clamp-1 mb-2">
                            حرکت موازی لنگه‌ها روی ریل چندخطه
                          </p>
                        </div>
                        <div className="flex items-baseline justify-between pt-2 border-t border-neutral-800/60">
                          <span className="text-[10px] text-neutral-400">برآورد سیستم:</span>
                          <div className="text-sm font-black text-amber-400 font-mono">
                            {slidingCalc.finalCost.toLocaleString('fa-IR')} <span className="text-[9px] font-sans text-neutral-400">تومان</span>
                          </div>
                        </div>
                      </button>

                      {/* 2. Folding (CamBalkon - Video Reference) */}
                      <button
                        onClick={() => handleSystemSelect('folding')}
                        className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between relative ${
                          state.systemType === 'folding'
                            ? 'bg-emerald-500/15 border-emerald-400 shadow-md ring-1 ring-emerald-400/50'
                            : 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900'
                        }`}
                      >
                        <div className="absolute -top-2 left-3">
                          <span className="text-[8px] bg-emerald-500 text-neutral-950 font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                            پرفروش‌ترین (فیلم)
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1 mt-0.5">
                            <span className="text-xs font-bold text-neutral-100">تاشو بالکنی (CamBalkon)</span>
                            {state.systemType === 'folding' ? (
                              <span className="text-[9px] bg-emerald-500/30 text-emerald-300 px-1.5 py-0.2 rounded font-bold">
                                فعال
                              </span>
                            ) : (
                              <span className="text-[9px] text-neutral-500">پایه ۳,۲۰۰,۰۰۰ ت/م²</span>
                            )}
                          </div>
                          <p className="text-[10px] text-neutral-400 line-clamp-1 mb-2">
                            تا شدن ۹۰ درجه کتابی در انتهای ریل
                          </p>
                        </div>
                        <div className="flex items-baseline justify-between pt-2 border-t border-neutral-800/60">
                          <span className="text-[10px] text-neutral-400">برآورد سیستم:</span>
                          <div className="text-sm font-black text-emerald-400 font-mono">
                            {foldingCalc.finalCost.toLocaleString('fa-IR')} <span className="text-[9px] font-sans text-neutral-400">تومان</span>
                          </div>
                        </div>
                      </button>

                      {/* 3. Accordion */}
                      <button
                        onClick={() => handleSystemSelect('accordion')}
                        className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                          state.systemType === 'accordion'
                            ? 'bg-amber-500/15 border-amber-400 shadow-md ring-1 ring-amber-400/50'
                            : 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-neutral-200">سیستم آکاردئونی</span>
                            {state.systemType === 'accordion' ? (
                              <span className="text-[9px] bg-amber-500/30 text-amber-300 px-1.5 py-0.2 rounded font-bold">
                                فعال
                              </span>
                            ) : (
                              <span className="text-[9px] text-neutral-500">پایه ۳,۶۰۰,۰۰۰ ت/م²</span>
                            )}
                          </div>
                          <p className="text-[10px] text-neutral-400 line-clamp-1 mb-2">
                            جمع شدن جفتی زیگزاگ لوکس
                          </p>
                        </div>
                        <div className="flex items-baseline justify-between pt-2 border-t border-neutral-800/60">
                          <span className="text-[10px] text-neutral-400">برآورد سیستم:</span>
                          <div className="text-sm font-black text-amber-400 font-mono">
                            {accordionCalc.finalCost.toLocaleString('fa-IR')} <span className="text-[9px] font-sans text-neutral-400">تومان</span>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* 4. Cost Breakdown (آنالیز ریزاقلام پیش‌فاکتور) */}
                  <div className="mt-4 pt-3 border-t border-neutral-800/80">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                        آنالیز و تفکیک اجزای پیش‌فاکتور (درصد ساختار هزینه):
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        استاندارد ملی شیشه سکوریت ISIRI 3772
                      </span>
                    </div>

                    {/* Progress Bar Distribution */}
                    <div className="h-2.5 w-full bg-neutral-800 rounded-full overflow-hidden flex mb-2.5 border border-neutral-700/50">
                      <div style={{ width: '45%' }} className="bg-sky-500 h-full" title="شیشه سکوریت ۴۵٪" />
                      <div style={{ width: '30%' }} className="bg-amber-500 h-full" title="پروفیل آلومینیومی ۳۰٪" />
                      <div style={{ width: '15%' }} className="bg-emerald-500 h-full" title="یراق‌آلات و چرخ‌ها ۱۵٪" />
                      <div style={{ width: '10%' }} className="bg-purple-500 h-full" title="نصب و ساخت ۱۰٪" />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {/* Glass */}
                      <div className="bg-neutral-950/80 p-2.5 rounded-lg border border-neutral-800/80">
                        <div className="flex items-center gap-1 text-[11px] text-sky-400 font-bold mb-1">
                          <span className="w-2 h-2 rounded-full bg-sky-400" />
                          <span>شیشه سکوریت (۴۵٪)</span>
                        </div>
                        <div className="text-xs font-black text-neutral-100 font-mono">
                          {currentCalc.glassCost.toLocaleString('fa-IR')} <span className="text-[9px] font-sans text-neutral-400">تومان</span>
                        </div>
                        <div className="text-[10px] text-neutral-500 mt-0.5">
                          {state.glassThickness}mm {GLASS_TINTS[state.glassTint].nameFa}
                        </div>
                      </div>

                      {/* Aluminum Profiles */}
                      <div className="bg-neutral-950/80 p-2.5 rounded-lg border border-neutral-800/80">
                        <div className="flex items-center gap-1 text-[11px] text-amber-400 font-bold mb-1">
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                          <span>پروفیل ریل (۳۰٪)</span>
                        </div>
                        <div className="text-xs font-black text-neutral-100 font-mono">
                          {currentCalc.profileCost.toLocaleString('fa-IR')} <span className="text-[9px] font-sans text-neutral-400">تومان</span>
                        </div>
                        <div className="text-[10px] text-neutral-500 mt-0.5">
                          آلیاژ ۶۰۶۳ {HARDWARE_COLORS[state.hardwareColor].nameFa}
                        </div>
                      </div>

                      {/* Bearings & Hardware */}
                      <div className="bg-neutral-950/80 p-2.5 rounded-lg border border-neutral-800/80">
                        <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold mb-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span>یراق و چرخ (۱۵٪)</span>
                        </div>
                        <div className="text-xs font-black text-neutral-100 font-mono">
                          {currentCalc.hardwareCost.toLocaleString('fa-IR')} <span className="text-[9px] font-sans text-neutral-400">تومان</span>
                        </div>
                        <div className="text-[10px] text-neutral-500 mt-0.5">
                          بلبرینگ استیل و درزگیرها
                        </div>
                      </div>

                      {/* Installation & Fabrication */}
                      <div className="bg-neutral-950/80 p-2.5 rounded-lg border border-neutral-800/80">
                        <div className="flex items-center gap-1 text-[11px] text-purple-400 font-bold mb-1">
                          <span className="w-2 h-2 rounded-full bg-purple-400" />
                          <span>ساخت و نصب (۱۰٪)</span>
                        </div>
                        <div className="text-xs font-black text-neutral-100 font-mono">
                          {currentCalc.installationCost.toLocaleString('fa-IR')} <span className="text-[9px] font-sans text-neutral-400">تومان</span>
                        </div>
                        <div className="text-[10px] text-neutral-500 mt-0.5">
                          ریگلاژ و خدمات تبریز سکوریت
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Volume Discount Notice */}
                  {currentCalc.hasVolumeDiscount ? (
                    <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Percent className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-300 font-semibold">
                          تخفیف ویژه متراژ بالای ۱۲ متر مربع فعال گردید:
                        </span>
                      </div>
                      <span className="font-mono text-emerald-400 font-bold">
                        صرفه‌جویی {currentCalc.discountAmount.toLocaleString('fa-IR')} تومان (۵٪)
                      </span>
                    </div>
                  ) : (
                    <div className="mt-3 p-2 rounded-xl bg-neutral-900 border border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
                      <div className="flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-neutral-400" />
                        <span>پیشنهاد متراژ بالا: برای پروژه‌های ۱۲ متر مربع و بالاتر، ۵٪ تخفیف کل فاکتور اعمال می‌شود.</span>
                      </div>
                      <span className="font-mono text-amber-400 font-medium">
                        تنها {(12 - currentCalc.totalAreaSqm).toFixed(2)} مترمربع تا تخفیف
                      </span>
                    </div>
                  )}

                  {/* Copy Quote, Generate PDF Invoice & Official Consultation CTA */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 mt-3 border-t border-neutral-800">
                    <div className="text-[11px] text-neutral-400 text-right">
                      * برآورد قیمت تقریبی بوده و هزینه دقیق پس از بازدید کارشناسی و برداشت ابعاد لیزری قطعی خواهد شد.
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        onClick={handleCopyQuote}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                      >
                        {copiedQuote ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span>کپی شد!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 text-neutral-300" />
                            <span>کپی متن پیش‌فاکتور</span>
                          </>
                        )}
                      </button>

                      {onOpenInvoiceModal && (
                        <button
                          onClick={() => {
                            onOpenInvoiceModal();
                            playUiClick(state.soundEnabled);
                          }}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-neutral-950 font-black text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
                        >
                          <FileDown className="w-4 h-4 stroke-[2.3]" />
                          <span>صدور و دانلود پیش‌فاکتور PDF</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: LIVE ORDER MANUFACTURING TRACKER */}
            {activeTab === 'tracking' && (
              <OrderTrackingTab state={state} onUpdateState={onUpdateState} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
