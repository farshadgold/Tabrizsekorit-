import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  X,
  Check,
  User,
  Phone,
  Building2,
  Receipt,
  Sparkles,
  Image as ImageIcon,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import {
  ConfiguratorState,
  SYSTEM_SPECS,
  BALCONY_LAYOUTS,
  HARDWARE_COLORS,
  GLASS_TINTS,
} from '../types/configurator';
import {
  calculateProjectCost,
  generateInvoicePdf,
  InvoiceCustomerInfo,
} from '../utils/invoicePdfGenerator';
import { playMechanicalClick, playUiClick } from '../audio/soundEffects';

interface InvoiceModalProps {
  state: ConfiguratorState;
  isOpen: boolean;
  snapshotDataUrl: string | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  state,
  isOpen,
  snapshotDataUrl,
  onClose,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [projectTitle, setProjectTitle] = useState('پروژه شیشه بالکن اختصاصی');
  const [notes, setNotes] = useState('');
  const [include3DSnapshot, setInclude3DSnapshot] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

  const invoiceNumber = useMemo(() => {
    const now = new Date();
    const num = `${now.getFullYear().toString().slice(-2)}${String(now.getMonth() + 1).padStart(
      2,
      '0'
    )}${String(now.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
    return `TS-${num}`;
  }, []);

  if (!isOpen) return null;

  const calc = calculateProjectCost(
    state.systemType,
    state.widthCm,
    state.heightCm,
    state.balconyLayout,
    state.sideWingWidthCm,
    state.glassTint,
    state.glassThickness,
    state.hardwareColor
  );

  const sideMultiplier =
    state.balconyLayout === 'l_shape' ? 1 : state.balconyLayout === 'u_shape' ? 2 : 0;
  const totalPanels = state.panelCount + state.sideWingPanels * sideMultiplier;
  const mainLeafWidth = Math.round(state.widthCm / state.panelCount);

  const persianDate = new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  const handleDownloadPdf = async () => {
    setIsGenerating(true);
    try {
      const customerInfo: InvoiceCustomerInfo = {
        customerName,
        customerPhone,
        projectTitle,
        notes,
        invoiceNumber,
      };
      await generateInvoicePdf(
        state,
        customerInfo,
        include3DSnapshot ? snapshotDataUrl : null
      );
      setIsDownloaded(true);
      playMechanicalClick(state.soundEnabled);
      setTimeout(() => setIsDownloaded(false), 3500);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-neutral-950/80 backdrop-blur-md"
      dir="rtl"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-neutral-900 border border-neutral-700/80 rounded-2xl shadow-2xl overflow-hidden text-neutral-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-neutral-950 shadow-md shadow-emerald-500/20">
              <FileText className="w-5 h-5 stroke-[2.3]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-white">
                  تولید پیش‌نویس فاکتور رسمی (خروجی PDF)
                </h2>
                <span className="text-[10px] font-mono bg-amber-500/15 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded-full">
                  {invoiceNumber}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                تمام ابعاد، تعداد پنل‌ها، متریال و مبالغ زنده از پیکربندی فعلی صحنه استخراج شده است
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* 1. Optional Customer & Project Details Form */}
          <div className="bg-neutral-950/70 border border-neutral-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                اطلاعات کارفرما و پروژه برای درج در فاکتور (اختیاری):
              </span>
              <span className="text-[10px] text-neutral-400 font-mono">
                تاریخ صدور: {persianDate}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">نام کارفرما / مشتری:</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-neutral-500 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="مثلاً: مهندس رضایی"
                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-400 rounded-xl pr-9 pl-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-600 outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">عنوان / محل پروژه:</label>
                <div className="relative">
                  <Building2 className="w-3.5 h-3.5 text-neutral-500 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    placeholder="مثلاً: تراس برج ولیعصر"
                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-400 rounded-xl pr-9 pl-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-600 outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">شماره تماس:</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-neutral-500 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    dir="ltr"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="0914xxxxxxx"
                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-400 rounded-xl pr-9 pl-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-600 outline-none transition-colors text-right font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-[11px] text-neutral-400 mb-1">توضیحات یا شرایط اختصاصی:</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مثلاً: شامل آب‌بندی سیلیکون آنتی‌باکتریال و تحویل فوری..."
                className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-600 outline-none transition-colors"
              />
            </div>
          </div>

          {/* 2. Live Draft Sheet Summary (Preview of what goes into PDF) */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <span className="text-xs sm:text-sm font-black text-neutral-100">
                  پیش‌نمایش ساختار پیش‌فاکتور چاپی (A4):
                </span>
              </div>

              {snapshotDataUrl && (
                <button
                  onClick={() => {
                    setInclude3DSnapshot(!include3DSnapshot);
                    playUiClick(state.soundEnabled);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium cursor-pointer transition-colors ${
                    include3DSnapshot
                      ? 'bg-sky-500/15 border-sky-400/50 text-sky-300'
                      : 'bg-neutral-900 border-neutral-700 text-neutral-400'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>{include3DSnapshot ? 'تصویر سه‌بعدی در PDF درج شود' : 'بدون تصویر ۳D'}</span>
                </button>
              )}
            </div>

            {/* Specs + Snapshot Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Technical Summary Cards */}
              <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-2.5">
                  <div className="text-[10px] text-neutral-400 mb-0.5">سیستم و پلان بالکن</div>
                  <div className="font-bold text-amber-300">{SYSTEM_SPECS[state.systemType].nameFa}</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">{BALCONY_LAYOUTS[state.balconyLayout].nameFa}</div>
                </div>

                <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-2.5">
                  <div className="text-[10px] text-neutral-400 mb-0.5">ابعاد و مساحت کل</div>
                  <div className="font-mono font-bold text-neutral-100">
                    {state.widthCm} × {state.heightCm} cm
                  </div>
                  <div className="text-[10px] font-mono text-emerald-400 mt-0.5">
                    مساحت: {calc.totalAreaSqm.toFixed(2)} مترمربع
                  </div>
                </div>

                <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-2.5">
                  <div className="text-[10px] text-neutral-400 mb-0.5">تعداد و عرض پنل‌ها</div>
                  <div className="font-bold text-sky-300">{totalPanels} لنگه متحرک</div>
                  <div className="text-[10px] font-mono text-neutral-400 mt-0.5">
                    عرض هر لنگه جلو: ~{mainLeafWidth} cm
                  </div>
                </div>

                <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-2.5">
                  <div className="text-[10px] text-neutral-400 mb-0.5">نوع شیشه سکوریت</div>
                  <div className="font-bold text-neutral-100">{GLASS_TINTS[state.glassTint].nameFa}</div>
                  <div className="text-[10px] font-mono text-amber-400 mt-0.5">
                    ضخامت {state.glassThickness} میلی‌متر سکوریت
                  </div>
                </div>

                <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-2.5">
                  <div className="text-[10px] text-neutral-400 mb-0.5">پروفیل و یراق‌آلات</div>
                  <div className="font-bold text-neutral-100">{HARDWARE_COLORS[state.hardwareColor].nameFa}</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">
                    {state.recessedFloorTrack ? 'ریل توکار همسطح' : 'ریل روکار آب‌بندی‌شده'}
                  </div>
                </div>

                <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-2.5">
                  <div className="text-[10px] text-neutral-400 mb-0.5">نرخ مبنای مترمربع</div>
                  <div className="font-mono font-bold text-neutral-100">
                    {calc.effectiveRatePerSqm.toLocaleString('fa-IR')}
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">تومان به ازای هر مترمربع</div>
                </div>
              </div>

              {/* Snapshot Preview Box */}
              {snapshotDataUrl && include3DSnapshot && (
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden flex flex-col">
                  <div className="flex-1 min-h-[110px] relative">
                    <img
                      src={snapshotDataUrl}
                      alt="پیش‌نمایش ۳ بعدی پروژه"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="px-2 py-1 text-[10px] text-center text-amber-300 font-medium bg-neutral-950 border-t border-neutral-800">
                    تصویر پیوست شده از نمای سه‌بعدی
                  </div>
                </div>
              )}
            </div>

            {/* Itemized Breakdown Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-2 border-t border-neutral-800/80">
              <div className="bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800/60">
                <div className="text-[10px] text-sky-400 font-bold">شیشه سکوریت (۴۵٪)</div>
                <div className="font-mono font-bold text-neutral-100 mt-0.5">
                  {calc.glassCost.toLocaleString('fa-IR')} تومان
                </div>
              </div>
              <div className="bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800/60">
                <div className="text-[10px] text-amber-400 font-bold">پروفیل آلومینیوم (۳۰٪)</div>
                <div className="font-mono font-bold text-neutral-100 mt-0.5">
                  {calc.profileCost.toLocaleString('fa-IR')} تومان
                </div>
              </div>
              <div className="bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800/60">
                <div className="text-[10px] text-emerald-400 font-bold">یراق و بلبرینگ (۱۵٪)</div>
                <div className="font-mono font-bold text-neutral-100 mt-0.5">
                  {calc.hardwareCost.toLocaleString('fa-IR')} تومان
                </div>
              </div>
              <div className="bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800/60">
                <div className="text-[10px] text-purple-400 font-bold">مونتاژ و نصب (۱۰٪)</div>
                <div className="font-mono font-bold text-neutral-100 mt-0.5">
                  {calc.installationCost.toLocaleString('fa-IR')} تومان
                </div>
              </div>
            </div>

            {/* Grand Total Strip */}
            <div className="bg-gradient-to-r from-emerald-950/60 to-neutral-900 border border-emerald-500/40 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>جمع کل قابل پرداخت برآورد نهایی:</span>
                </div>
                {calc.hasVolumeDiscount && (
                  <div className="text-[11px] text-emerald-400/90 mt-0.5">
                    شامل ۵٪ تخفیف ویژه متراژ بالای ۱۲ مترمربع ({calc.discountAmount.toLocaleString('fa-IR')} تومان کسر شد)
                  </div>
                )}
              </div>

              <div className="text-left">
                <div className="text-lg sm:text-xl font-black font-mono text-emerald-400">
                  {calc.finalCost.toLocaleString('fa-IR')} <span className="text-xs font-sans text-neutral-300">تومان</span>
                </div>
                <div className="text-[10px] font-mono text-neutral-400">
                  معادل {calc.finalCostRial.toLocaleString('fa-IR')} ریال
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-neutral-800 bg-neutral-950 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] text-neutral-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>خروجی استاندارد A4 فارسی با پشتیبانی کامل از فونت و جدول‌بندی چاپی</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-colors cursor-pointer"
            >
              بستن
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="flex items-center justify-center gap-2 px-5 py-2 text-xs font-black bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-60 text-neutral-950 rounded-xl shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>در حال تولید PDF...</span>
                </>
              ) : isDownloaded ? (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>فایل PDF دانلود شد!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 stroke-[2.4]" />
                  <span>تولید و دانلود پیش‌فاکتور PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
