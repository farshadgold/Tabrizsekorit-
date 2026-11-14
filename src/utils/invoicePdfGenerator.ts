import { jsPDF } from 'jspdf';
import {
  ConfiguratorState,
  SYSTEM_SPECS,
  BALCONY_LAYOUTS,
  HARDWARE_COLORS,
  GLASS_TINTS,
  SystemType,
  BalconyLayout,
  GlassTintId,
  HardwareColorId,
} from '../types/configurator';

export interface CostBreakdown {
  mainAreaSqm: number;
  sideAreaSqm: number;
  totalAreaSqm: number;
  baseRatePerSqm: number;
  effectiveRatePerSqm: number;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  finalCost: number;
  finalCostRial: number;
  glassCost: number;
  profileCost: number;
  hardwareCost: number;
  installationCost: number;
  hasVolumeDiscount: boolean;
}

export function calculateProjectCost(
  systemType: SystemType,
  widthCm: number,
  heightCm: number,
  balconyLayout: BalconyLayout,
  sideWingWidthCm: number,
  glassTint: GlassTintId,
  glassThickness: 8 | 10,
  hardwareColor: HardwareColorId
): CostBreakdown {
  const mainAreaSqm = (widthCm * heightCm) / 10000;
  const sideMultiplier = balconyLayout === 'l_shape' ? 1 : balconyLayout === 'u_shape' ? 2 : 0;
  const sideAreaSqm = sideMultiplier * ((sideWingWidthCm * heightCm) / 10000);
  const totalAreaSqm = Number((mainAreaSqm + sideAreaSqm).toFixed(2));

  const spec = SYSTEM_SPECS[systemType];
  const glassFactorMap: Record<GlassTintId, number> = {
    clear: 1.0,
    cambalkon_cyan: 1.06,
    bronze: 1.12,
    smoked: 1.10,
    frosted: 1.14,
    reflective: 1.18,
    green: 1.08,
    blue_reflective: 1.18,
  };
  const glassFactor = glassFactorMap[glassTint] ?? 1.10;

  const hardwareFactorMap: Record<HardwareColorId, number> = {
    silver: 1.0,
    white: 1.0,
    black: 1.08,
    anthracite: 1.08,
    bronze: 1.10,
    stainless: 1.12,
    gold: 1.16,
  };
  const hardwareColorFactor = hardwareFactorMap[hardwareColor] ?? 1.05;
  const thicknessFactor = glassThickness === 10 ? 1.12 : 1.0;
  const layoutFactor = balconyLayout !== 'straight' ? 1.10 : 1.0;

  const effectiveRatePerSqm = Math.round(
    spec.basePricePerSqm * glassFactor * thicknessFactor * hardwareColorFactor * layoutFactor
  );

  const subtotal = Math.round(totalAreaSqm * effectiveRatePerSqm);

  // Volume discount: 5% discount for projects >= 12 m²
  const hasVolumeDiscount = totalAreaSqm >= 12;
  const discountPercent = hasVolumeDiscount ? 5 : 0;
  const discountAmount = hasVolumeDiscount ? Math.round(subtotal * 0.05) : 0;
  const finalCost = subtotal - discountAmount;
  const finalCostRial = finalCost * 10;

  return {
    mainAreaSqm,
    sideAreaSqm,
    totalAreaSqm,
    baseRatePerSqm: spec.basePricePerSqm,
    effectiveRatePerSqm,
    subtotal,
    discountPercent,
    discountAmount,
    finalCost,
    finalCostRial,
    glassCost: Math.round(finalCost * 0.45),
    profileCost: Math.round(finalCost * 0.30),
    hardwareCost: Math.round(finalCost * 0.15),
    installationCost: Math.round(finalCost * 0.10),
    hasVolumeDiscount,
  };
}

export interface InvoiceCustomerInfo {
  customerName: string;
  customerPhone: string;
  projectTitle: string;
  notes: string;
  invoiceNumber: string;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function loadImg(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Generates an ultra-crisp A4 Persian Proforma Invoice PDF using native Canvas2D shaping
 * (preserving connected Vazirmatn Persian glyphs & RTL layout) wrapped in jsPDF.
 */
export async function generateInvoicePdf(
  state: ConfiguratorState,
  customer: InvoiceCustomerInfo,
  snapshotDataUrl?: string | null
): Promise<void> {
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  // A4 at 200 DPI = 1654 x 2339 px
  const W = 1654;
  const H = 2339;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

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
  const sideLeafWidth = sideMultiplier > 0 ? Math.round(state.sideWingWidthCm / state.sideWingPanels) : 0;

  const persianDate = new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  const fontStack = '"Vazirmatn", Tahoma, Arial, sans-serif';

  // Background white sheet
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // Subtle top accent bar
  ctx.fillStyle = '#d97706';
  ctx.fillRect(0, 0, W, 18);

  const margin = 80;
  const innerW = W - margin * 2;
  let y = 70;

  // =====================================================
  // 1. HEADER BANNER (Brand + Invoice Metadata)
  // =====================================================
  drawRoundedRect(ctx, margin, y, innerW, 210, 20);
  ctx.fillStyle = '#0f172a';
  ctx.fill();
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.stroke();

  // TS Logo Badge on top right
  drawRoundedRect(ctx, W - margin - 135, y + 35, 100, 100, 18);
  const logoGrad = ctx.createLinearGradient(W - margin - 135, y + 35, W - margin - 35, y + 135);
  logoGrad.addColorStop(0, '#f59e0b');
  logoGrad.addColorStop(1, '#b45309');
  ctx.fillStyle = logoGrad;
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.font = `900 44px ${fontStack}`;
  ctx.textAlign = 'center';
  ctx.direction = 'ltr';
  ctx.fillText('TS', W - margin - 85, y + 100);

  // Brand Title (RTL right-aligned next to logo)
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.fillStyle = '#f8fafc';
  ctx.font = `900 38px ${fontStack}`;
  ctx.fillText('پیش‌فاکتور رسمی سیستم‌های شیشه سکوریت تبریز سکوریت', W - margin - 160, y + 80);

  ctx.fillStyle = '#fbbf24';
  ctx.font = `600 22px ${fontStack}`;
  ctx.fillText(
    'طراحی، مهندسی و تولید تخصصی شیشه بالکن تاشو، ریلی و آکاردئونی (CamBalkon 3D)',
    W - margin - 160,
    y + 124
  );

  ctx.fillStyle = '#94a3b8';
  ctx.font = `500 18px ${fontStack}`;
  ctx.fillText(
    'استاندارد ملی ایران ISIRI 3772 • پروفیل آلومینیوم ۶۰۶۳ • یراق‌آلات استیل ۳۰۴ بلبرینگی',
    W - margin - 160,
    y + 165
  );

  // Invoice Metadata Box (left side of header)
  ctx.textAlign = 'left';
  ctx.direction = 'rtl';
  ctx.fillStyle = '#e2e8f0';
  ctx.font = `700 20px ${fontStack}`;
  ctx.fillText(`شماره پیش‌فاکتور: ${customer.invoiceNumber}`, margin + 35, y + 72);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = `500 19px ${fontStack}`;
  ctx.fillText(`تاریخ صدور: ${persianDate}`, margin + 35, y + 112);

  ctx.fillStyle = '#38bdf8';
  ctx.font = `600 18px ${fontStack}`;
  ctx.fillText('اعتبار پیش‌فاکتور: ۱۵ روز کاری', margin + 35, y + 152);

  y += 240;

  // =====================================================
  // 2. CUSTOMER & PROJECT INFO + 3D PREVIEW THUMBNAIL
  // =====================================================
  const hasSnapshot = Boolean(snapshotDataUrl);
  const infoSectionH = 260;
  const thumbW = hasSnapshot ? 440 : 0;
  const customerBoxW = hasSnapshot ? innerW - thumbW - 28 : innerW;

  // Customer Info Box (Right side)
  drawRoundedRect(ctx, W - margin - customerBoxW, y, customerBoxW, infoSectionH, 16);
  ctx.fillStyle = '#f8fafc';
  ctx.fill();
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.fillStyle = '#0f172a';
  ctx.font = `800 23px ${fontStack}`;
  ctx.fillText('مشخصات کارفرما و پروژه:', W - margin - 30, y + 48);

  // Divider line
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(W - margin - customerBoxW + 25, y + 66);
  ctx.lineTo(W - margin - 25, y + 66);
  ctx.stroke();

  ctx.font = `600 20px ${fontStack}`;
  const infoRows = [
    { label: 'نام کارفرما / مشتری:', val: customer.customerName.trim() || 'مشتری محترم' },
    { label: 'عنوان پروژه:', val: customer.projectTitle.trim() || 'اجرای سیستم شیشه بالکن اختصاصی' },
    { label: 'شماره تماس:', val: customer.customerPhone.trim() || 'ثبت نشده' },
    {
      label: 'توضیحات تکمیلی:',
      val: customer.notes.trim() || 'محاسبه شده از طریق پیکربندی زنده ۳D تبریز سکوریت',
    },
  ];

  infoRows.forEach((row, idx) => {
    const ry = y + 108 + idx * 40;
    ctx.fillStyle = '#64748b';
    ctx.font = `600 19px ${fontStack}`;
    ctx.fillText(row.label, W - margin - 30, ry);

    ctx.fillStyle = '#0f172a';
    ctx.font = `700 20px ${fontStack}`;
    ctx.fillText(row.val, W - margin - 235, ry);
  });

  // 3D Scene Snapshot Thumbnail (Left side if available)
  if (hasSnapshot && snapshotDataUrl) {
    const img = await loadImg(snapshotDataUrl);
    drawRoundedRect(ctx, margin, y, thumbW, infoSectionH, 16);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (img) {
      ctx.save();
      drawRoundedRect(ctx, margin + 6, y + 6, thumbW - 12, infoSectionH - 40, 12);
      ctx.clip();
      const imgAspect = img.width / (img.height || 1);
      const boxW = thumbW - 12;
      const boxH = infoSectionH - 40;
      const boxAspect = boxW / boxH;
      let dw = boxW;
      let dh = boxH;
      let ox = margin + 6;
      let oy = y + 6;
      if (imgAspect > boxAspect) {
        dw = boxH * imgAspect;
        ox = margin + 6 - (dw - boxW) / 2;
      } else {
        dh = boxW / imgAspect;
        oy = y + 6 - (dh - boxH) / 2;
      }
      ctx.drawImage(img, ox, oy, dw, dh);
      ctx.restore();
    }

    ctx.fillStyle = '#fbbf24';
    ctx.font = `700 16px ${fontStack}`;
    ctx.textAlign = 'center';
    ctx.fillText('پیش‌نمایش سه‌بعدی پیکربندی انتخابی', margin + thumbW / 2, y + infoSectionH - 12);
  }

  y += infoSectionH + 34;

  // =====================================================
  // 3. TECHNICAL SPECIFICATIONS TABLE (مشخصات فنی سیستم)
  // =====================================================
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.fillStyle = '#0f172a';
  ctx.font = `800 25px ${fontStack}`;
  ctx.fillText('۱. مشخصات فنی و مهندسی پروژه', W - margin, y);

  y += 20;
  const specRows: [string, string, string, string][] = [
    [
      'مکانیزم و نوع سیستم',
      SYSTEM_SPECS[state.systemType].nameFa,
      'پلان معماری بالکن',
      BALCONY_LAYOUTS[state.balconyLayout].nameFa,
    ],
    [
      'ابعاد دهانه جلو (عرض × ارتفاع)',
      `${state.widthCm} × ${state.heightCm} سانتی‌متر`,
      'تعداد و عرض پنل‌های جلو',
      `${state.panelCount} لنگه (هر لنگه ~${mainLeafWidth} cm)`,
    ],
    [
      'بال‌های کناری (L / U)',
      sideMultiplier > 0
        ? `${sideMultiplier} بال کناری به عرض ${state.sideWingWidthCm} سانتی‌متر`
        : 'ندارد (دهانه مستقیم)',
      'تعداد کل لنگه‌های پروژه',
      `${totalPanels} لنگه متحرک (${sideMultiplier > 0 ? `بغل ~${sideLeafWidth}cm` : 'تک ضلع'})`,
    ],
    [
      'نوع و ضخامت شیشه سکوریت',
      `${GLASS_TINTS[state.glassTint].nameFa} (${state.glassThickness} میل)`,
      'رنگ و پوشش پروفیل و یراق',
      HARDWARE_COLORS[state.hardwareColor].nameFa,
    ],
    [
      'مساحت کل پروژه (مترمربع)',
      `${calc.totalAreaSqm.toFixed(2)} مترمربع`,
      'نحوه جمع‌شدن و ریل کف',
      `${
        state.openingMode === 'center_split'
          ? 'دوطرفه از وسط'
          : state.openingMode === 'stack_right'
          ? 'جمع‌شو به راست'
          : 'جمع‌شو به چپ'
      } • ${state.recessedFloorTrack ? 'ریل توکار همسطح' : 'ریل روکار'}`,
    ],
    [
      'نوع درزگیر مابین پنل‌ها',
      state.sealType === 'polycarbonate_h'
        ? 'درزگیر شفاف پلی‌کربنات H مگنت‌دار'
        : 'درزگیر آلومینیومی با نوار مویی وکیوم',
      'نرخ مبنای هر مترمربع',
      `${calc.effectiveRatePerSqm.toLocaleString('fa-IR')} تومان`,
    ],
  ];

  const specRowH = 62;
  const specBoxH = specRows.length * specRowH;
  drawRoundedRect(ctx, margin, y, innerW, specBoxH, 16);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.stroke();

  const colW = innerW / 4;
  specRows.forEach((row, rIdx) => {
    const ry = y + rIdx * specRowH;
    if (rIdx % 2 === 0) {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(margin + 2, ry + 2, innerW - 4, specRowH - 2);
    }
    if (rIdx > 0) {
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(margin, ry);
      ctx.lineTo(W - margin, ry);
      ctx.stroke();
    }

    // Center vertical divider
    ctx.strokeStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(margin + innerW / 2, ry);
    ctx.lineTo(margin + innerW / 2, ry + specRowH);
    ctx.stroke();

    // Right pair (Label 1, Val 1)
    ctx.textAlign = 'right';
    ctx.fillStyle = '#475569';
    ctx.font = `600 18px ${fontStack}`;
    ctx.fillText(row[0] + ':', W - margin - 20, ry + 39);

    ctx.fillStyle = '#0f172a';
    ctx.font = `800 18px ${fontStack}`;
    ctx.fillText(row[1], W - margin - colW * 0.92, ry + 39);

    // Left pair (Label 2, Val 2)
    ctx.fillStyle = '#475569';
    ctx.font = `600 18px ${fontStack}`;
    ctx.fillText(row[2] + ':', W - margin - colW * 2 - 20, ry + 39);

    ctx.fillStyle = '#0f172a';
    ctx.font = `800 18px ${fontStack}`;
    ctx.fillText(row[3], W - margin - colW * 2.95, ry + 39);
  });

  y += specBoxH + 46;

  // =====================================================
  // 4. FINANCIAL BREAKDOWN TABLE (ریزاقلام و آنالیز قیمت)
  // =====================================================
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.fillStyle = '#0f172a';
  ctx.font = `800 25px ${fontStack}`;
  ctx.fillText('۲. آنالیز مالی و برآورد هزینه پروژه', W - margin, y);

  y += 20;
  const tableHeaderH = 58;
  const lineRowH = 66;
  const lineItems = [
    {
      no: '۱',
      title: `شیشه سکوریت حرارت‌دیده (${state.glassThickness} میل ${GLASS_TINTS[state.glassTint].nameFa})`,
      share: '۴۵٪ سهم',
      qty: `${calc.totalAreaSqm.toFixed(2)} م²`,
      amount: calc.glassCost,
    },
    {
      no: '۲',
      title: `پروفیل آلومینیوم آلیاژ ۶۰۶۳ سختی ۱۲ وبستر (${HARDWARE_COLORS[state.hardwareColor].nameFa})`,
      share: '۳۰٪ سهم',
      qty: `${totalPanels} قاب`,
      amount: calc.profileCost,
    },
    {
      no: '۳',
      title: 'یراق‌آلات مکانیکی، چرخ‌های بلبرینگی ضدزنگ و درزگیرها',
      share: '۱۵٪ سهم',
      qty: '۱ دست کامل',
      amount: calc.hardwareCost,
    },
    {
      no: '۴',
      title: 'خدمات برش لیزری، مونتاژ کارخانه‌ای، حمل و نصب تخصصی',
      share: '۱۰٪ سهم',
      qty: 'پروژه کامل',
      amount: calc.installationCost,
    },
  ];

  // Header Row
  drawRoundedRect(ctx, margin, y, innerW, tableHeaderH, 12);
  ctx.fillStyle = '#1e293b';
  ctx.fill();

  ctx.fillStyle = '#fbbf24';
  ctx.font = `800 19px ${fontStack}`;
  ctx.textAlign = 'right';
  ctx.fillText('ردیف', W - margin - 24, y + 37);
  ctx.fillText('شرح اقلام و خدمات اجرایی', W - margin - 105, y + 37);
  ctx.textAlign = 'center';
  ctx.fillText('مقدار / سهم', margin + 455, y + 37);
  ctx.textAlign = 'left';
  ctx.fillText('مبلغ برآوردی (تومان)', margin + 28, y + 37);

  y += tableHeaderH;

  lineItems.forEach((item, idx) => {
    const ry = y + idx * lineRowH;
    ctx.fillStyle = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
    ctx.fillRect(margin, ry, innerW, lineRowH);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(margin, ry, innerW, lineRowH);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#475569';
    ctx.font = `800 20px ${fontStack}`;
    ctx.fillText(item.no, W - margin - 32, ry + 41);

    ctx.fillStyle = '#0f172a';
    ctx.font = `700 19px ${fontStack}`;
    ctx.fillText(item.title, W - margin - 105, ry + 41);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#64748b';
    ctx.font = `600 18px ${fontStack}`;
    ctx.fillText(`${item.qty} (${item.share})`, margin + 455, ry + 41);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#0f172a';
    ctx.font = `800 21px ${fontStack}`;
    ctx.fillText(`${item.amount.toLocaleString('fa-IR')} تومان`, margin + 28, ry + 41);
  });

  y += lineItems.length * lineRowH + 22;

  // =====================================================
  // 5. TOTALS & DISCOUNT SUMMARY CARD
  // =====================================================
  const summaryH = calc.hasVolumeDiscount ? 190 : 140;
  drawRoundedRect(ctx, margin, y, innerW, summaryH, 16);
  ctx.fillStyle = '#0f172a';
  ctx.fill();
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  let sy = y + 48;
  if (calc.hasVolumeDiscount) {
    ctx.textAlign = 'right';
    ctx.fillStyle = '#cbd5e1';
    ctx.font = `600 20px ${fontStack}`;
    ctx.fillText('جمع کل پیش از تخفیف:', W - margin - 35, sy);
    ctx.textAlign = 'left';
    ctx.fillText(`${calc.subtotal.toLocaleString('fa-IR')} تومان`, margin + 35, sy);

    sy += 42;
    ctx.textAlign = 'right';
    ctx.fillStyle = '#34d399';
    ctx.font = `700 20px ${fontStack}`;
    ctx.fillText('تخفیف ویژه پروژه‌های بالای ۱۲ مترمربع (۵٪):', W - margin - 35, sy);
    ctx.textAlign = 'left';
    ctx.fillText(`- ${calc.discountAmount.toLocaleString('fa-IR')} تومان`, margin + 35, sy);
    sy += 46;
  } else {
    sy += 12;
  }

  ctx.textAlign = 'right';
  ctx.fillStyle = '#fbbf24';
  ctx.font = `900 28px ${fontStack}`;
  ctx.fillText('مبلغ قابل پرداخت برآورد نهایی پروژه:', W - margin - 35, sy);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#34d399';
  ctx.font = `900 32px ${fontStack}`;
  ctx.fillText(`${calc.finalCost.toLocaleString('fa-IR')} تومان`, margin + 35, sy);

  ctx.fillStyle = '#94a3b8';
  ctx.font = `600 18px ${fontStack}`;
  ctx.fillText(`معادل ${calc.finalCostRial.toLocaleString('fa-IR')} ریال`, margin + 35, sy + 32);

  y += summaryH + 34;

  // =====================================================
  // 6. TERMS, WARRANTY & SIGNATURE FOOTER
  // =====================================================
  const footerBoxH = 220;
  drawRoundedRect(ctx, margin, y, innerW, footerBoxH, 16);
  ctx.fillStyle = '#f8fafc';
  ctx.fill();
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.textAlign = 'right';
  ctx.fillStyle = '#0f172a';
  ctx.font = `800 20px ${fontStack}`;
  ctx.fillText('شرایط فنی، ضمانت‌نامه و تعهدات اجرایی:', W - margin - 28, y + 42);

  const terms = [
    '• تمامی شیشه‌ها دارای نشان استاندارد ملی ایران (ISIRI 3772) و سکوریت تمام حرارتی ضدضربه می‌باشند.',
    '• یراق‌آلات بلبرینگی استیل ۳۰۴ و پروفیل‌های آنودایز شامل ۵ سال ضمانت کتبی عملکرد روان و ثبات رنگ هستند.',
    '• مبالغ درج‌شده بر اساس ابعاد ورودی در پیکربندی ۳D محاسبه شده و مبلغ نهایی پس از برداشت لیزری کارشناس قطعی می‌گردد.',
    '• زمان تحویل و نصب پس از تایید نهایی ابعاد و پیش‌پرداخت، حدود ۷ الی ۱۰ روز کاری می‌باشد.',
  ];

  ctx.fillStyle = '#475569';
  ctx.font = `500 17px ${fontStack}`;
  terms.forEach((line, i) => {
    ctx.fillText(line, W - margin - 28, y + 82 + i * 33);
  });

  // Signature areas at bottom
  const sigY = H - 125;
  ctx.textAlign = 'right';
  ctx.fillStyle = '#334155';
  ctx.font = `700 19px ${fontStack}`;
  ctx.fillText('مهر و امضای واحد مهندسی فروش تبریز سکوریت', W - margin - 40, sigY);
  ctx.textAlign = 'left';
  ctx.fillText('تایید و امضای کارفرمای محترم', margin + 40, sigY);

  // Bottom bar
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, H - 55, W, 55);
  ctx.fillStyle = '#fbbf24';
  ctx.font = `700 17px ${fontStack}`;
  ctx.textAlign = 'center';
  ctx.fillText(
    'تولید شده توسط سیستم شبیه‌ساز هوشمند سه‌بعدی تبریز سکوریت | CamBalkon 3D Engineering Engine',
    W / 2,
    H - 22
  );

  // Convert high-res canvas to A4 PDF using jsPDF
  const imgData = canvas.toDataURL('image/jpeg', 0.94);
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
  const safeFileSlug = `${state.systemType}-${state.panelCount}panels-${state.widthCm}x${state.heightCm}`;
  pdf.save(`Tabriz-Securit-Invoice-${safeFileSlug}.pdf`);
}
