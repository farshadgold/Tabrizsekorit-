import React, { useState } from 'react';
import {
  RotateCw,
  Sun,
  Moon,
  Ruler,
  Volume2,
  VolumeX,
  Camera as CameraIcon,
  Compass,
  ChevronDown,
  Film,
  Grid,
  Sunrise,
  SunMedium,
  Sunset,
  Sparkles,
  CloudRain,
  Cloud,
  Palette,
  Smartphone,
  FileDown,
} from 'lucide-react';
import {
  ConfiguratorState,
  CameraPreset,
  LightingCondition,
  LIGHTING_CONDITIONS,
  WeatherSimulation,
  WEATHER_SIMULATIONS,
  HARDWARE_COLORS,
  GLASS_TINTS,
} from '../types/configurator';
import { playUiClick, playWeatherSound } from '../audio/soundEffects';

interface TopBarProps {
  state: ConfiguratorState;
  onUpdateState: (patch: Partial<ConfiguratorState>) => void;
  onCameraPreset: (preset: CameraPreset) => void;
  onResetCamera: () => void;
  onTakeScreenshot: () => void;
  onOpenVideoModal: () => void;
  onOpenMaterialPanel: () => void;
  onOpenCameraPreview: () => void;
  onOpenInvoiceModal: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  state,
  onUpdateState,
  onCameraPreset,
  onResetCamera,
  onTakeScreenshot,
  onOpenVideoModal,
  onOpenMaterialPanel,
  onOpenCameraPreview,
  onOpenInvoiceModal,
}) => {
  const [showCameraMenu, setShowCameraMenu] = useState(false);
  const [showLightingMenu, setShowLightingMenu] = useState(false);
  const [showWeatherMenu, setShowWeatherMenu] = useState(false);

  const toggleSound = () => {
    const next = !state.soundEnabled;
    onUpdateState({ soundEnabled: next });
    playUiClick(next);
  };

  const toggleAutoRotate = () => {
    onUpdateState({ autoRotate: !state.autoRotate });
    playUiClick(state.soundEnabled);
  };

  const handleCameraChange = (preset: CameraPreset) => {
    onCameraPreset(preset);
    setShowCameraMenu(false);
    playUiClick(state.soundEnabled);
  };

  const handleLightingChange = (cond: LightingCondition) => {
    onUpdateState({ lightingCondition: cond });
    setShowLightingMenu(false);
    playUiClick(state.soundEnabled);
  };

  const handleWeatherChange = (w: WeatherSimulation) => {
    onUpdateState({ weather: w });
    setShowWeatherMenu(false);
    playWeatherSound(w, state.soundEnabled);
  };

  const currentLighting = LIGHTING_CONDITIONS[state.lightingCondition];
  const currentWeather = WEATHER_SIMULATIONS[state.weather];

  return (
    <header className="absolute top-0 left-0 right-0 z-20 pointer-events-none p-3 md:p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
      {/* Brand & Badge */}
      <div className="pointer-events-auto bg-neutral-900/90 border border-neutral-700/60 rounded-2xl px-4 py-2.5 shadow-xl flex items-center gap-3">
        {/* Logo Icon */}
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-md shadow-amber-500/20 text-neutral-950 font-black text-lg">
          TS
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-extrabold text-sm md:text-base text-neutral-100 tracking-tight">
              تبریز سکوریت
            </h1>
            <span className="text-[10px] bg-amber-500/15 border border-amber-500/30 text-amber-400 font-medium px-2 py-0.5 rounded-full">
              CamBalkon 3D
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 font-normal hidden sm:block">
            طراحی سه‌بعدی شیشه بالکن تاشو و ریلی (مستقیم، نبش‌دار و گوشه)
          </p>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="pointer-events-auto flex items-center flex-wrap gap-1.5 bg-neutral-900/90 border border-neutral-700/60 rounded-2xl p-1.5 shadow-xl">
        {/* Reference Video Button */}
        <button
          onClick={() => {
            onOpenVideoModal();
            playUiClick(state.soundEnabled);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/40 text-sky-300 rounded-xl transition-all cursor-pointer shadow-sm"
          title="مشاهده فیلم مرجع شبیه‌سازی CamBalkon-3D"
        >
          <Film className="w-3.5 h-3.5 text-sky-400" />
          <span>فیلم مرجع</span>
        </button>

        {/* Material Selection Panel Button */}
        <button
          onClick={() => {
            onOpenMaterialPanel();
            playUiClick(state.soundEnabled);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-amber-500/20 to-amber-600/15 hover:from-amber-500/30 hover:to-amber-600/25 border border-amber-400/60 text-amber-300 rounded-xl transition-all cursor-pointer shadow-sm group hover:scale-[1.02]"
          title="باز کردن پالت انتخاب انواع شیشه سکوریت و فینیشینگ پروفیل‌ها"
        >
          <Palette className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
          <span>پالت متریال</span>
          <div className="flex items-center gap-1 mr-0.5 bg-neutral-950/70 px-1.5 py-0.5 rounded-md border border-neutral-800">
            <span
              className="w-2.5 h-2.5 rounded-full border border-white/30 shadow-xs"
              style={{ backgroundColor: GLASS_TINTS[state.glassTint]?.color ?? '#72c8ea' }}
              title={GLASS_TINTS[state.glassTint]?.nameFa}
            />
            <span
              className="w-2.5 h-2.5 rounded-full border border-white/30 shadow-xs"
              style={{ backgroundColor: HARDWARE_COLORS[state.hardwareColor]?.hex ?? '#171717' }}
              title={HARDWARE_COLORS[state.hardwareColor]?.nameFa}
            />
          </div>
        </button>

        {/* Live Camera AR Preview Button */}
        <button
          onClick={() => {
            onOpenCameraPreview();
            playUiClick(state.soundEnabled);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-emerald-500/20 to-sky-500/20 hover:from-emerald-500/30 hover:to-sky-500/30 border border-emerald-400/60 text-emerald-300 rounded-xl transition-all cursor-pointer shadow-sm group hover:scale-[1.02]"
          title="نمایش لایه شفاف ابعاد پنل‌ها روی تصویر دوربین گوشی (AR Preview)"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span>پیش‌نمایش دوربین (AR)</span>
        </button>

        {/* Weather Simulation Toggle (Sunny, Rainy, Cloudy) */}
        <div className="relative">
          <button
            onClick={() => {
              setShowWeatherMenu(!showWeatherMenu);
              setShowLightingMenu(false);
              setShowCameraMenu(false);
              playUiClick(state.soundEnabled);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer shadow-sm ${
              state.weather === 'rainy'
                ? 'bg-sky-500/20 text-sky-300 border-sky-400/50 hover:bg-sky-500/30'
                : state.weather === 'cloudy'
                ? 'bg-slate-700/50 text-slate-200 border-slate-500/50 hover:bg-slate-700/70'
                : 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
            }`}
            title="شبیه‌ساز آب‌وهوا (آفتابی، بارانی، ابری) و واکنش شفافیت شیشه"
          >
            {state.weather === 'rainy' ? (
              <CloudRain className="w-3.5 h-3.5 text-sky-400" />
            ) : state.weather === 'cloudy' ? (
              <Cloud className="w-3.5 h-3.5 text-slate-300" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>{currentWeather.nameFa.split(' ')[0]}</span>
            <span className="text-[10px] text-neutral-400 font-normal hidden sm:inline">
              ({currentWeather.transparencyPercent}٪ شفاف)
            </span>
            <ChevronDown className="w-3 h-3 text-neutral-400/80" />
          </button>

          {showWeatherMenu && (
            <div className="absolute left-0 mt-2 w-72 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl py-1.5 z-30 text-xs">
              <div className="px-3 py-1.5 text-[11px] font-bold text-neutral-300 border-b border-neutral-800 mb-1 flex items-center justify-between">
                <span>شبیه‌ساز آب‌وهوا و واکنش شیشه:</span>
                <span className="text-[10px] text-amber-400 font-mono">Weather FX</span>
              </div>

              {Object.values(WEATHER_SIMULATIONS).map((w) => {
                const isSelected = state.weather === w.id;
                return (
                  <button
                    key={w.id}
                    onClick={() => handleWeatherChange(w.id)}
                    className={`w-full text-right px-3 py-2.5 hover:bg-neutral-800/80 flex items-start justify-between cursor-pointer border-b border-neutral-800/40 last:border-b-0 ${
                      isSelected ? 'bg-amber-500/15 text-neutral-100 font-bold' : 'text-neutral-200'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5">
                        {w.id === 'rainy' ? (
                          <CloudRain className="w-4 h-4 text-sky-400" />
                        ) : w.id === 'cloudy' ? (
                          <Cloud className="w-4 h-4 text-slate-300" />
                        ) : (
                          <Sun className="w-4 h-4 text-amber-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={isSelected ? 'text-amber-400 font-bold' : 'text-neutral-100'}>
                            {w.nameFa}
                          </span>
                          <span className="text-[9px] bg-neutral-800 px-1 py-0.2 rounded font-mono text-neutral-400">
                            {w.nameEn}
                          </span>
                        </div>
                        <div className="text-[10px] text-neutral-400 font-normal line-clamp-1 mt-0.5">
                          {w.glassBehaviorFa}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400 shrink-0 mr-1">
                      {w.transparencyPercent}٪
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Lighting Condition Dropdown (Morning, Noon, Sunset, Night) */}
        <div className="relative">
          <button
            onClick={() => {
              setShowLightingMenu(!showLightingMenu);
              setShowWeatherMenu(false);
              setShowCameraMenu(false);
              playUiClick(state.soundEnabled);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-300 hover:text-white bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl transition-colors cursor-pointer"
            title="تغییر شرایط نوری صحنه (صبح، ظهر، غروب)"
          >
            {state.lightingCondition === 'morning' ? (
              <Sunrise className="w-3.5 h-3.5 text-amber-400" />
            ) : state.lightingCondition === 'noon' ? (
              <SunMedium className="w-3.5 h-3.5 text-yellow-400" />
            ) : state.lightingCondition === 'sunset' ? (
              <Sunset className="w-3.5 h-3.5 text-orange-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-blue-400" />
            )}
            <span className="font-semibold">
              {state.lightingCondition === 'morning'
                ? 'صبحگاهی'
                : state.lightingCondition === 'noon'
                ? 'ظهر'
                : state.lightingCondition === 'sunset'
                ? 'غروب'
                : 'شب'}
            </span>
            <ChevronDown className="w-3 h-3 text-amber-400/80" />
          </button>

          {showLightingMenu && (
            <div className="absolute left-0 mt-2 w-60 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl py-1.5 z-30 text-xs">
              <div className="px-3 py-1 text-[11px] font-bold text-neutral-400 border-b border-neutral-800 mb-1">
                شرایط نوری و زاویه تابش خورشید:
              </div>

              {/* Morning */}
              <button
                onClick={() => handleLightingChange('morning')}
                className={`w-full text-right px-3 py-2 hover:bg-neutral-800 flex items-center justify-between cursor-pointer ${
                  state.lightingCondition === 'morning' ? 'bg-amber-500/15 text-amber-300 font-bold' : 'text-neutral-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sunrise className="w-4 h-4 text-amber-400" />
                  <div>
                    <div>صبح (طلوع طلایی)</div>
                    <div className="text-[10px] text-neutral-400 font-normal">بازتاب ملایم و سایه‌های کشیده</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-amber-400/80">25°</span>
              </button>

              {/* Noon */}
              <button
                onClick={() => handleLightingChange('noon')}
                className={`w-full text-right px-3 py-2 hover:bg-neutral-800 flex items-center justify-between cursor-pointer ${
                  state.lightingCondition === 'noon' ? 'bg-amber-500/15 text-amber-300 font-bold' : 'text-neutral-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <SunMedium className="w-4 h-4 text-yellow-400" />
                  <div>
                    <div>ظهر (آفتاب مستقیم)</div>
                    <div className="text-[10px] text-neutral-400 font-normal">شفافیت کریستالی و رفلکس آسمان</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-yellow-400/80">75°</span>
              </button>

              {/* Sunset */}
              <button
                onClick={() => handleLightingChange('sunset')}
                className={`w-full text-right px-3 py-2 hover:bg-neutral-800 flex items-center justify-between cursor-pointer ${
                  state.lightingCondition === 'sunset' ? 'bg-amber-500/15 text-amber-300 font-bold' : 'text-neutral-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sunset className="w-4 h-4 text-orange-400" />
                  <div>
                    <div>غروب (ساعت طلایی)</div>
                    <div className="text-[10px] text-neutral-400 font-normal">بازتاب‌های آتشین مسی روی شیشه</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-orange-400/80">10°</span>
              </button>

              {/* Night */}
              <button
                onClick={() => handleLightingChange('night')}
                className={`w-full text-right px-3 py-2 hover:bg-neutral-800 flex items-center justify-between border-t border-neutral-800 cursor-pointer ${
                  state.lightingCondition === 'night' ? 'bg-amber-500/15 text-amber-300 font-bold' : 'text-neutral-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-blue-400" />
                  <div>
                    <div>شب (پنت‌هاوس مدرن)</div>
                    <div className="text-[10px] text-neutral-400 font-normal">نورپردازی معماری و مهتاب</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-blue-400/80">Night</span>
              </button>
            </div>
          )}
        </div>

        {/* Camera Views dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowCameraMenu(!showCameraMenu);
              setShowLightingMenu(false);
              playUiClick(state.soundEnabled);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-200 hover:text-white bg-neutral-800/80 hover:bg-neutral-700/80 rounded-xl transition-colors cursor-pointer"
            title="زاویه دید دوربین"
          >
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>زاویه دوربین</span>
            <ChevronDown className="w-3 h-3 text-neutral-400" />
          </button>

          {showCameraMenu && (
            <div className="absolute left-0 mt-2 w-48 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl py-1 z-30 text-xs">
              <button
                onClick={() => handleCameraChange('perspective')}
                className="w-full text-right px-3 py-2 hover:bg-neutral-800 flex items-center justify-between text-neutral-200 cursor-pointer"
              >
                <span>زاویه سه‌بعدی (پرسپکتیو)</span>
                <span className="text-[10px] text-neutral-500">3D</span>
              </button>
              <button
                onClick={() => handleCameraChange('front')}
                className="w-full text-right px-3 py-2 hover:bg-neutral-800 flex items-center justify-between text-neutral-200 cursor-pointer"
              >
                <span>نمای روبه‌رو (مستقیم)</span>
                <span className="text-[10px] text-neutral-500">Front</span>
              </button>
              <button
                onClick={() => handleCameraChange('corner_view')}
                className="w-full text-right px-3 py-2 hover:bg-neutral-800 flex items-center justify-between text-amber-400 font-semibold cursor-pointer"
              >
                <span>نمای نبش و گوشه (ال‌شکل)</span>
                <span className="text-[10px] text-amber-400/80">Corner</span>
              </button>
              <button
                onClick={() => handleCameraChange('side')}
                className="w-full text-right px-3 py-2 hover:bg-neutral-800 flex items-center justify-between text-neutral-200 cursor-pointer"
              >
                <span>نمای کناری (پروفیل ریل)</span>
                <span className="text-[10px] text-neutral-500">Side</span>
              </button>
              <button
                onClick={() => handleCameraChange('top')}
                className="w-full text-right px-3 py-2 hover:bg-neutral-800 flex items-center justify-between text-neutral-200 cursor-pointer"
              >
                <span>نمای از بالا (پلان حرکتی)</span>
                <span className="text-[10px] text-neutral-500">Top</span>
              </button>
              <button
                onClick={() => handleCameraChange('close_hardware')}
                className="w-full text-right px-3 py-2 hover:bg-neutral-800 flex items-center justify-between text-neutral-200 border-t border-neutral-800 text-amber-400 font-medium cursor-pointer"
              >
                <span>نمای نزدیک چرخ و ریل</span>
                <span className="text-[10px] text-neutral-500">Hardware</span>
              </button>
            </div>
          )}
        </div>

        {/* Reset Camera button */}
        <button
          onClick={() => {
            onResetCamera();
            playUiClick(state.soundEnabled);
          }}
          className="p-2 text-neutral-300 hover:text-white bg-neutral-800/60 hover:bg-neutral-700/80 rounded-xl transition-colors cursor-pointer"
          title="تنظیم مجدد زاویه دوربین"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        {/* 360 Auto-rotate */}
        <button
          onClick={toggleAutoRotate}
          className={`p-2 rounded-xl transition-colors cursor-pointer ${
            state.autoRotate
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              : 'text-neutral-300 hover:text-white bg-neutral-800/60 hover:bg-neutral-700/80'
          }`}
          title={state.autoRotate ? 'توقف چرخش خودکار' : 'چرخش خودکار ۳۶۰ درجه'}
        >
          <RotateCw className={`w-4 h-4 ${state.autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
        </button>

        {/* Floor Grid toggle */}
        <button
          onClick={() => {
            onUpdateState({ showFloorGrid: !state.showFloorGrid });
            playUiClick(state.soundEnabled);
          }}
          className={`p-2 rounded-xl transition-colors cursor-pointer ${
            state.showFloorGrid
              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
              : 'text-neutral-300 hover:text-white bg-neutral-800/60 hover:bg-neutral-700/80'
          }`}
          title="نمایش / مخفی‌سازی خطوط آکس و شبکه مهندسی کف (مشابه فیلم)"
        >
          <Grid className="w-4 h-4" />
        </button>

        {/* Dimensions toggle */}
        <button
          onClick={() => {
            onUpdateState({ showDimensions: !state.showDimensions });
            playUiClick(state.soundEnabled);
          }}
          className={`p-2 rounded-xl transition-colors cursor-pointer ${
            state.showDimensions
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              : 'text-neutral-300 hover:text-white bg-neutral-800/60 hover:bg-neutral-700/80'
          }`}
          title="نمایش / مخفی‌سازی اندازه‌گذاری مهندسی"
        >
          <Ruler className="w-4 h-4" />
        </button>

        {/* Sound toggle */}
        <button
          onClick={toggleSound}
          className="p-2 text-neutral-300 hover:text-white bg-neutral-800/60 hover:bg-neutral-700/80 rounded-xl transition-colors cursor-pointer"
          title={state.soundEnabled ? 'قطع صدا' : 'فعال‌سازی افکت‌های صوتی مکانیکی'}
        >
          {state.soundEnabled ? (
            <Volume2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <VolumeX className="w-4 h-4 text-neutral-500" />
          )}
        </button>

        {/* High-res Screenshot */}
        <button
          onClick={() => {
            onTakeScreenshot();
            playUiClick(state.soundEnabled);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl transition-colors shadow-md shadow-amber-500/20 cursor-pointer"
          title="ذخیره و دانلود عکس از پروژه"
        >
          <CameraIcon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">دانلود تصویر</span>
        </button>

        {/* Export Draft PDF Invoice */}
        <button
          onClick={() => {
            onOpenInvoiceModal();
            playUiClick(state.soundEnabled);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded-xl transition-colors shadow-md shadow-emerald-500/20 cursor-pointer"
          title="تولید و دانلود پیش‌نویس فاکتور رسمی PDF"
        >
          <FileDown className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">فاکتور PDF</span>
        </button>
      </div>
    </header>
  );
};
