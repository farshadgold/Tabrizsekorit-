import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  X,
  Palette,
  ShieldCheck,
  Sun,
  Eye,
  Layers,
  ChevronRight,
  SlidersHorizontal,
  Info,
} from 'lucide-react';
import {
  ConfiguratorState,
  HARDWARE_COLORS,
  GLASS_TINTS,
  HardwareColorId,
  GlassTintId,
  GlassTint,
  HardwareColor,
} from '../types/configurator';
import { playMechanicalClick, playUiClick } from '../audio/soundEffects';

interface MaterialSelectionPanelProps {
  state: ConfiguratorState;
  isOpen: boolean;
  onClose: () => void;
  onUpdateState: (patch: Partial<ConfiguratorState>) => void;
}

type MaterialTab = 'all' | 'glass' | 'hardware' | 'presets';
type GlassCategoryFilter = 'all' | 'transparent' | 'reflective' | 'privacy' | 'tinted';

interface PresetCombo {
  id: string;
  nameFa: string;
  nameEn: string;
  taglineFa: string;
  glassId: GlassTintId;
  hardwareId: HardwareColorId;
  thickness: 8 | 10;
  badgeFa: string;
  themeGradient: string;
}

const PRESET_COMBOS: PresetCombo[] = [
  {
    id: 'modern_minimal',
    nameFa: 'مدرن مینیمال اسکاندیناوی',
    nameEn: 'Modern Scandinavian Minimal',
    taglineFa: 'پروفیل مشکی مات با شیشه سوپرکلیر کریستال شفاف',
    glassId: 'clear',
    hardwareId: 'black',
    thickness: 10,
    badgeFa: 'پرفروش‌ترین مدرن',
    themeGradient: 'from-neutral-900 to-sky-950',
  },
  {
    id: 'luxury_bronze',
    nameFa: 'پنت‌هاوس برنز و طلایی تیتانیوم',
    nameEn: 'Luxury Warm Bronze & Gold',
    taglineFa: 'شیشه برنز متالیک گرم همراه با یراق‌آلات طلایی PVD لوکس',
    glassId: 'bronze',
    hardwareId: 'gold',
    thickness: 10,
    badgeFa: 'لوکس و درباری',
    themeGradient: 'from-amber-950 to-yellow-900',
  },
  {
    id: 'solar_mirror',
    nameFa: 'نمای برج رفلکس آینه‌ای',
    nameEn: 'High-Tech Solar Mirror Reflective',
    taglineFa: 'حداکثر دفع حرارت خورشید و حفظ دید یک‌طرفه با نقره‌ای مات',
    glassId: 'reflective',
    hardwareId: 'silver',
    thickness: 10,
    badgeFa: 'آینه‌ای ضدحرارت',
    themeGradient: 'from-slate-900 to-cyan-950',
  },
  {
    id: 'private_satin',
    nameFa: 'حریم خصوصی کامل (پرایوسی)',
    nameEn: 'Full Privacy Frosted Satin',
    taglineFa: 'شیشه ساتینا مات سندبلاست با فریم خاکستری آنتراسیت',
    glassId: 'frosted',
    hardwareId: 'anthracite',
    thickness: 8,
    badgeFa: '۱۰۰٪ حریم خصوصی',
    themeGradient: 'from-neutral-900 to-slate-900',
  },
  {
    id: 'cambalkon_signature',
    nameFa: 'امضای پروژه (مطابق فیلم نمونه)',
    nameEn: 'Signature CamBalkon 3D',
    taglineFa: 'شیشه کریستال فیروزه‌ای لایت همراه با یراق‌آلات مشکی آنودایز',
    glassId: 'cambalkon_cyan',
    hardwareId: 'black',
    thickness: 10,
    badgeFa: 'مشابه فیلم معرفی',
    themeGradient: 'from-sky-950 to-neutral-900',
  },
  {
    id: 'smoked_executive',
    nameFa: 'دودی مدیریتی وی‌آی‌پی',
    nameEn: 'Executive Smoked & Stainless',
    taglineFa: 'شیشه دودی اروپایی زغالی با استیل ۳۰۴ ضدزنگ براق',
    glassId: 'smoked',
    hardwareId: 'stainless',
    thickness: 10,
    badgeFa: 'کنترل تابش خورشید',
    themeGradient: 'from-zinc-950 to-slate-900',
  },
];

export const MaterialSelectionPanel: React.FC<MaterialSelectionPanelProps> = ({
  state,
  isOpen,
  onClose,
  onUpdateState,
}) => {
  const [activeTab, setActiveTab] = useState<MaterialTab>('all');
  const [glassFilter, setGlassFilter] = useState<GlassCategoryFilter>('all');

  if (!isOpen) return null;

  const handleGlassSelect = (id: GlassTintId) => {
    onUpdateState({ glassTint: id });
    playMechanicalClick(state.soundEnabled);
  };

  const handleHardwareSelect = (id: HardwareColorId) => {
    onUpdateState({ hardwareColor: id });
    playMechanicalClick(state.soundEnabled);
  };

  const handleThicknessSelect = (thickness: 8 | 10) => {
    onUpdateState({ glassThickness: thickness });
    playUiClick(state.soundEnabled);
  };

  const handleApplyPreset = (preset: PresetCombo) => {
    onUpdateState({
      glassTint: preset.glassId,
      hardwareColor: preset.hardwareId,
      glassThickness: preset.thickness,
    });
    playMechanicalClick(state.soundEnabled);
  };

  const currentGlass = GLASS_TINTS[state.glassTint];
  const currentHardware = HARDWARE_COLORS[state.hardwareColor];

  const filteredGlassTints = Object.values(GLASS_TINTS).filter((tint) => {
    if (glassFilter === 'all') return true;
    if (glassFilter === 'transparent') return tint.categoryFa === 'شفاف و کریستال';
    if (glassFilter === 'reflective') return tint.categoryFa === 'رفلکس و آینه‌ای';
    if (glassFilter === 'privacy') return tint.categoryFa === 'مات و حریم خصوصی';
    if (glassFilter === 'tinted') return tint.categoryFa === 'رنگی و متالیک';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-neutral-950/75 backdrop-blur-md transition-opacity animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-neutral-900 border border-neutral-700/80 rounded-2xl shadow-2xl overflow-hidden text-neutral-100"
        dir="rtl"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-md shadow-amber-500/20 text-neutral-950">
              <Palette className="w-5 h-5 text-neutral-950 stroke-[2.4]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                  پالت متریال و فینیشینگ تبریز سکوریت
                </h2>
                <span className="text-[10px] bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  بروزرسانی زنده صحنه ۳D
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                شبیه‌سازی فیزیکی شیشه سکوریت (برنز، رفلکس، مات و شفاف) و پروفیل‌های آلومینیومی و استیل
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="بستن پنجره متریال‌ها"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Active Selection Summary Bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-neutral-950/60 border-b border-neutral-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-neutral-400 font-medium text-[11px]">ترکیب فعال فعلی:</span>
            <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-700/80 px-2.5 py-1 rounded-lg">
              <span
                className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-xs"
                style={{ background: currentGlass.gradientBg }}
              />
              <span className="font-bold text-amber-300">{currentGlass.nameFa}</span>
              <span className="text-neutral-500 font-mono text-[10px]">({state.glassThickness}mm)</span>
            </div>
            <span className="text-neutral-600">+</span>
            <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-700/80 px-2.5 py-1 rounded-lg">
              <span
                className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-xs"
                style={{ backgroundColor: currentHardware.hex }}
              />
              <span className="font-bold text-neutral-200">{currentHardware.nameFa}</span>
            </div>
          </div>

          {/* Quick Thickness Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-neutral-400">ضخامت شیشه:</span>
            <div className="flex items-center bg-neutral-950 p-0.5 rounded-lg border border-neutral-800 text-[11px]">
              <button
                onClick={() => handleThicknessSelect(8)}
                className={`px-2.5 py-0.5 rounded-md font-mono font-bold transition-all cursor-pointer ${
                  state.glassThickness === 8
                    ? 'bg-amber-500 text-neutral-950 shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                ۸ میلی‌متر
              </button>
              <button
                onClick={() => handleThicknessSelect(10)}
                className={`px-2.5 py-0.5 rounded-md font-mono font-bold transition-all cursor-pointer ${
                  state.glassThickness === 10
                    ? 'bg-amber-500 text-neutral-950 shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                ۱۰ میلی‌متر (استاندارد برج)
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-800 bg-neutral-900/90 px-4 sm:px-6 gap-2 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-2.5 px-3 border-b-2 font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'all'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>نمای کامل (شیشه و یراق)</span>
          </button>

          <button
            onClick={() => setActiveTab('glass')}
            className={`py-2.5 px-3 border-b-2 font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'glass'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>انواع شیشه سکوریت ({Object.keys(GLASS_TINTS).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('hardware')}
            className={`py-2.5 px-3 border-b-2 font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'hardware'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>پوشش و رنگ پروفیل‌ها ({Object.keys(HARDWARE_COLORS).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('presets')}
            className={`py-2.5 px-3 border-b-2 font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'presets'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>ترکیب‌های مهندسی پیشنهادی ({PRESET_COMBOS.length})</span>
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* 1. GLASS SELECTION SECTION */}
          {(activeTab === 'all' || activeTab === 'glass') && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-black text-neutral-200 flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-amber-400" />
                    انواع شیشه سکوریت (Glass Types):
                  </h3>
                  <span className="text-[11px] text-neutral-400">
                    سکوریت حرارت‌دیده درجه یک با مقاومت ۷ برابری در برابر ضربه و باد
                  </span>
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-[10px]">
                  {[
                    { id: 'all', label: 'همه انواع' },
                    { id: 'reflective', label: 'رفلکس و آینه‌ای' },
                    { id: 'privacy', label: 'مات و پرایوسی' },
                    { id: 'tinted', label: 'برنز و دودی' },
                    { id: 'transparent', label: 'شفاف کریستال' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setGlassFilter(f.id as GlassCategoryFilter)}
                      className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                        glassFilter === f.id
                          ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                          : 'text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Glass Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {filteredGlassTints.map((tint: GlassTint) => {
                  const isSelected = state.glassTint === tint.id;
                  return (
                    <button
                      key={tint.id}
                      onClick={() => handleGlassSelect(tint.id)}
                      className={`relative p-3 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between group overflow-hidden ${
                        isSelected
                          ? 'bg-gradient-to-b from-amber-500/15 to-neutral-900 border-amber-400 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/40'
                          : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/60'
                      }`}
                    >
                      {/* Badge if present */}
                      {tint.badgeFa && (
                        <div className="absolute top-2.5 left-2.5 z-10">
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold tracking-tight shadow-sm ${
                              isSelected
                                ? 'bg-amber-400 text-neutral-950'
                                : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                            }`}
                          >
                            {tint.badgeFa}
                          </span>
                        </div>
                      )}

                      <div>
                        {/* Realistic Glass Swatch Preview */}
                        <div className="relative w-full h-16 rounded-xl overflow-hidden mb-2.5 border border-white/10 shadow-inner group-hover:scale-[1.01] transition-transform">
                          {/* Background gradient simulating glass depth */}
                          <div
                            className="absolute inset-0 w-full h-full"
                            style={{ background: tint.gradientBg }}
                          />

                          {/* Specular glass reflection diagonal sheen */}
                          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none" />

                          {/* Glass corner bevel line */}
                          <div className="absolute bottom-1 right-2 text-[9px] font-mono text-white/80 font-bold drop-shadow-sm">
                            VLT: {tint.vltPercent}%
                          </div>

                          {/* Category Tag */}
                          <div className="absolute bottom-1 left-2 text-[9px] text-white/70 bg-black/40 px-1.5 py-0.2 rounded backdrop-blur-xs">
                            {tint.categoryFa}
                          </div>

                          {isSelected && (
                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-neutral-950 shadow-md">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}
                        </div>

                        {/* Title & English Subtitle */}
                        <div className="text-xs font-black text-neutral-100 group-hover:text-amber-300 transition-colors">
                          {tint.nameFa}
                        </div>
                        <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                          {tint.nameEn}
                        </div>

                        {/* Detailed Description */}
                        <p className="text-[11px] text-neutral-400 line-clamp-2 mt-1.5 leading-relaxed">
                          {tint.description}
                        </p>
                      </div>

                      {/* Technical Specs Footer */}
                      <div className="mt-2.5 pt-2 border-t border-neutral-850 flex items-center justify-between text-[10px] text-neutral-500">
                        <span>کنترل گرما: <strong className="text-neutral-300">{tint.solarControlScore}</strong></span>
                        <span className="font-mono text-amber-400 font-semibold">
                          IOR: {tint.ior}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. HARDWARE FINISHES SECTION */}
          {(activeTab === 'all' || activeTab === 'hardware') && (
            <div className="pt-4 border-t border-neutral-800">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-black text-neutral-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    پوشش و رنگ پروفیل‌ها و یراق‌آلات (Hardware Finishes):
                  </h3>
                  <span className="text-[11px] text-neutral-400">
                    آلیاژ آلومینیوم ۶۰۶۳ سختی ۱۲ وبستر با پوشش آنودایز اروپایی و رنگ الکترواستاتیک ضدخش
                  </span>
                </div>
              </div>

              {/* Hardware Finishes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {Object.values(HARDWARE_COLORS).map((color: HardwareColor) => {
                  const isSelected = state.hardwareColor === color.id;
                  return (
                    <button
                      key={color.id}
                      onClick={() => handleHardwareSelect(color.id)}
                      className={`relative p-3 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between group overflow-hidden ${
                        isSelected
                          ? 'bg-gradient-to-b from-amber-500/15 to-neutral-900 border-amber-400 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/40'
                          : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/60'
                      }`}
                    >
                      <div>
                        {/* Hardware Swatch Preview */}
                        <div className="relative w-full h-14 rounded-xl overflow-hidden mb-2.5 border border-white/10 shadow-inner flex items-center justify-between px-3 group-hover:scale-[1.01] transition-transform"
                             style={{ background: color.gradientBg }}>
                          {/* Inner Metallic Bevel Sheen */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

                          <div className="relative z-10 flex items-center gap-2">
                            <span
                              className="w-7 h-7 rounded-lg border border-white/30 shadow-md"
                              style={{ backgroundColor: color.hex }}
                            />
                            <span className="text-[10px] font-mono font-bold text-white drop-shadow-md">
                              {color.hex.toUpperCase()}
                            </span>
                          </div>

                          {isSelected && (
                            <div className="relative z-10 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-neutral-950 shadow-md">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}
                        </div>

                        {/* Title & English Subtitle */}
                        <div className="text-xs font-black text-neutral-100 group-hover:text-amber-300 transition-colors">
                          {color.nameFa}
                        </div>
                        <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                          {color.nameEn}
                        </div>

                        {/* Finish Type Tag */}
                        <div className="inline-block mt-1.5 px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-800 text-[10px] text-amber-300 font-medium">
                          {color.finishTypeFa}
                        </div>

                        {/* Description */}
                        <p className="text-[11px] text-neutral-400 line-clamp-2 mt-1.5 leading-relaxed">
                          {color.descriptionFa}
                        </p>
                      </div>

                      {/* Technical Specs Footer */}
                      <div className="mt-2.5 pt-2 border-t border-neutral-850 flex items-center justify-between text-[10px] text-neutral-500">
                        <span>متالیک: <strong className="text-neutral-300">{Math.round(color.metalness * 100)}%</strong></span>
                        <span className="font-mono text-neutral-400">
                          زبری: {Math.round(color.roughness * 100)}%
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. ARCHITECTURAL PRESET COMBOS */}
          {(activeTab === 'all' || activeTab === 'presets') && (
            <div className="pt-4 border-t border-neutral-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-black text-neutral-200 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    ترکیب‌های هماهنگ معماری (Architectural Style Combos):
                  </h3>
                  <span className="text-[11px] text-neutral-400">
                    اعمال همزمان شیشه، یراق‌آلات و ضخامت استاندارد با یک کلیک
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {PRESET_COMBOS.map((combo) => {
                  const isCurrent =
                    state.glassTint === combo.glassId &&
                    state.hardwareColor === combo.hardwareId &&
                    state.glassThickness === combo.thickness;

                  const g = GLASS_TINTS[combo.glassId];
                  const h = HARDWARE_COLORS[combo.hardwareId];

                  return (
                    <button
                      key={combo.id}
                      onClick={() => handleApplyPreset(combo)}
                      className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group ${
                        isCurrent
                          ? 'bg-amber-500/15 border-amber-400 shadow-md ring-1 ring-amber-400/40'
                          : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                          {combo.badgeFa}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            فعال در صحنه
                          </span>
                        )}
                      </div>

                      <div className="mb-3">
                        <div className="text-xs font-bold text-neutral-100 group-hover:text-amber-300 transition-colors">
                          {combo.nameFa}
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                          {combo.taglineFa}
                        </p>
                      </div>

                      {/* Swatch chips preview */}
                      <div className="flex items-center justify-between pt-2.5 border-t border-neutral-850 text-[11px]">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <span
                              className="w-3 h-3 rounded-full border border-white/20"
                              style={{ background: g.gradientBg }}
                            />
                            <span className="text-neutral-300 text-[10px] font-medium">{g.nameFa.split(' ')[0]}</span>
                          </div>
                          <span className="text-neutral-600">+</span>
                          <div className="flex items-center gap-1">
                            <span
                              className="w-3 h-3 rounded-full border border-white/20"
                              style={{ backgroundColor: h.hex }}
                            />
                            <span className="text-neutral-300 text-[10px] font-medium">{h.nameFa.split(' ')[0]}</span>
                          </div>
                        </div>

                        <span className="text-[10px] font-mono text-amber-400 font-bold">
                          {combo.thickness}mm
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[11px] text-neutral-400">
            <Info className="w-3.5 h-3.5 text-amber-400" />
            <span>
              تمام شیشه‌ها دارای نشان استاندارد ملی ایران (ISIRI 3772) و حک لیزری اختصاصی «تبریز سکوریت» می‌باشند.
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold transition-colors cursor-pointer shadow-md"
          >
            تأیید و بازگشت به صحنه ۳D
          </button>
        </div>
      </div>
    </div>
  );
};
