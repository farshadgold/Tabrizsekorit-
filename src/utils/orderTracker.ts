import { ConfiguratorState } from '../types/configurator';

export type OrderStageId =
  | 'survey'
  | 'cutting'
  | 'tempering'
  | 'hardware_prep'
  | 'qc_pack'
  | 'delivery_install';

export interface OrderStageRecord {
  id: OrderStageId;
  titleFa: string;
  stationFa: string;
  descriptionFa: string;
  status: 'completed' | 'in_progress' | 'pending';
  timestampFa?: string;
  telemetryTagFa?: string;
}

export interface TrackedOrder {
  trackingCode: string;
  customerName: string;
  projectTitle: string;
  createdAtFa: string;
  estimatedDeliveryFa: string;
  currentStageIndex: number; // 0 to 5
  stageProgressPercent: number; // 0 to 100
  lastUpdatedFa: string;
  totalPriceToman: number;
  config: {
    systemType: ConfiguratorState['systemType'];
    balconyLayout: ConfiguratorState['balconyLayout'];
    widthCm: number;
    heightCm: number;
    panelCount: number;
    sideWingPanels: number;
    sideWingWidthCm: number;
    glassTint: ConfiguratorState['glassTint'];
    glassThickness: 8 | 10;
    hardwareColor: ConfiguratorState['hardwareColor'];
  };
  stages: OrderStageRecord[];
  isUserCreated?: boolean;
}

const STORAGE_KEY = 'tabriz_securit_orders_v1';

export const STAGE_BLUEPRINTS: Omit<OrderStageRecord, 'status' | 'timestampFa' | 'telemetryTagFa'>[] = [
  {
    id: 'survey',
    titleFa: 'ثبت سفارش و تایید ابعاد مهندسی',
    stationFa: 'واحد طراحی و نقشه‌کشی لیزری',
    descriptionFa: 'بررسی نقشه کارگاهی، تایید لقی‌های ریل و تخصیص کد برش اختصاصی شیشه',
  },
  {
    id: 'cutting',
    titleFa: 'برش لیزری CNC و دیاموند لبه‌زنی',
    stationFa: 'خط برش اتوماتیک CNC شماره ۲',
    descriptionFa: 'برش دقیق شیشه خام سوپرکلیر، سوراخ‌کاری لولاها و ابزار دیاموند لبه‌های شیشه',
  },
  {
    id: 'tempering',
    titleFa: 'شستشو و کوره سکوریت حرارتی ۶۸۰°C',
    stationFa: 'کوره افقی سکوریت با گرمایش همرفتی',
    descriptionFa: 'حرارت‌دهی کنترل‌شده تا ۶۸۵ درجه سانتی‌گراد و خنک‌کاری سریع جهت افزایش ۷ برابری مقاومت',
  },
  {
    id: 'hardware_prep',
    titleFa: 'تولید پروفیل ۶۰۶۳ و مونتاژ یراق',
    stationFa: 'واحد برش آلومینیوم و نصب چرخ‌های بلبرینگی',
    descriptionFa: 'برش پروفیل‌های آنودایز با زاویه ۴۵ درجه، نصب درپوش‌ها و چسب‌کاری چسب پلی‌اورتان آلمانی',
  },
  {
    id: 'qc_pack',
    titleFa: 'کنترل کیفیت (ISIRI 3772) و بسته‌بندی',
    stationFa: 'آزمایشگاه کنترل کیفیت و لیزر حک نشان استاندارد',
    descriptionFa: 'بررسی نوری بدون موج، تست ضربه استاندارد، حک لیزری لوگو تبریز سکوریت و وکیوم فوم‌دار',
  },
  {
    id: 'delivery_install',
    titleFa: 'ارسال به پروژه و نصب تخصصی',
    stationFa: 'ناوگان حمل شیشه و اکیپ نصب کارگاهی',
    descriptionFa: 'حمل ایمن با خرک مخصوص، تراز لیزری ریل‌ها، آب‌بندی نهایی و رگلاژ روان حرکت پنل‌ها',
  },
];

export function buildStagesForIndex(
  activeIndex: number,
  customTelemetries?: Partial<Record<OrderStageId, string>>
): OrderStageRecord[] {
  const defaultTelemetry: Record<OrderStageId, string> = {
    survey: 'تلرانس اندازه‌گیری: ±۰.۵ mm',
    cutting: 'ابزار دیاموند براق بدون لب‌پریدگی',
    tempering: 'دمای کوره: ۶۸۴°C • فشار باد: ۶.۲ bar',
    hardware_prep: 'آلیاژ ۶۰۶۳ T6 • پیچ استیل ۳۰۴',
    qc_pack: 'تایید استاندارد ISIRI 3772',
    delivery_install: 'تراز لیزری ±۱ mm • گارانتی ۵ ساله',
  };

  return STAGE_BLUEPRINTS.map((bp, idx) => {
    const status: OrderStageRecord['status'] =
      idx < activeIndex ? 'completed' : idx === activeIndex ? 'in_progress' : 'pending';
    return {
      ...bp,
      status,
      timestampFa:
        idx < activeIndex
          ? `تکمیل شده`
          : idx === activeIndex
          ? `در حال انجام هم‌اکنون`
          : `در صف انتظار`,
      telemetryTagFa: customTelemetries?.[bp.id] || defaultTelemetry[bp.id],
    };
  });
}

export const SEED_FACTORY_ORDERS: TrackedOrder[] = [
  {
    trackingCode: 'TS-403-1024',
    customerName: 'مهندس سهرابی',
    projectTitle: 'تراس پنت‌هاوس برج آفتاب ولیعصر',
    createdAtFa: '۲۱ آبان ۱۴۰۳',
    estimatedDeliveryFa: '۲ آذر ۱۴۰۳',
    currentStageIndex: 2,
    stageProgressPercent: 68,
    lastUpdatedFa: 'لحظاتی پیش',
    totalPriceToman: 34250000,
    config: {
      systemType: 'folding',
      balconyLayout: 'l_shape',
      widthCm: 420,
      heightCm: 250,
      panelCount: 7,
      sideWingPanels: 3,
      sideWingWidthCm: 180,
      glassTint: 'cambalkon_cyan',
      glassThickness: 10,
      hardwareColor: 'black',
    },
    stages: buildStagesForIndex(2, {
      tempering: 'کوره ۲ فعال: ۶۸۴°C (دقیقه ۸ از ۱۲)',
    }),
  },
  {
    trackingCode: 'TS-403-2088',
    customerName: 'شرکت ساختمانی اطلس',
    projectTitle: 'پروژه مسکونی نگین زعفرانیه (واحد ۴)',
    createdAtFa: '۲۳ آبان ۱۴۰۳',
    estimatedDeliveryFa: '۵ آذر ۱۴۰۳',
    currentStageIndex: 1,
    stageProgressPercent: 45,
    lastUpdatedFa: '۲ دقیقه پیش',
    totalPriceToman: 26800000,
    config: {
      systemType: 'sliding',
      balconyLayout: 'straight',
      widthCm: 360,
      heightCm: 240,
      panelCount: 6,
      sideWingPanels: 2,
      sideWingWidthCm: 150,
      glassTint: 'bronze',
      glassThickness: 10,
      hardwareColor: 'gold',
    },
    stages: buildStagesForIndex(1, {
      cutting: 'برش پنل ۴ از ۶ روی میز CNC',
    }),
  },
  {
    trackingCode: 'TS-403-3095',
    customerName: 'دکتر امیری',
    projectTitle: 'ویلای باغ‌شهر باسمنج (آلاچیق شیشه‌ای)',
    createdAtFa: '۱۶ آبان ۱۴۰۳',
    estimatedDeliveryFa: 'فردا ساعت ۱۰:۰۰ صبح',
    currentStageIndex: 4,
    stageProgressPercent: 92,
    lastUpdatedFa: 'هم‌اکنون',
    totalPriceToman: 48900000,
    config: {
      systemType: 'accordion',
      balconyLayout: 'u_shape',
      widthCm: 500,
      heightCm: 260,
      panelCount: 8,
      sideWingPanels: 4,
      sideWingWidthCm: 240,
      glassTint: 'reflective',
      glassThickness: 10,
      hardwareColor: 'anthracite',
    },
    stages: buildStagesForIndex(4, {
      qc_pack: 'حک لیزری انجام شد • در حال وکیوم فوم',
    }),
  },
];

/**
 * Normalizes Persian/Arabic numerals to ASCII digits and uppercase prefix
 */
export function normalizeTrackingCode(input: string): string {
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
  let out = input.trim().toUpperCase();
  for (let i = 0; i < 10; i++) {
    out = out.replaceAll(persianDigits[i], String(i)).replaceAll(arabicDigits[i], String(i));
  }
  return out;
}

export function getUserRegisteredOrders(): TrackedOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveUserRegisteredOrders(orders: TrackedOrder[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export function findOrderByTrackingCode(rawCode: string): TrackedOrder | null {
  const norm = normalizeTrackingCode(rawCode);
  if (!norm) return null;

  const userOrders = getUserRegisteredOrders();
  const allOrders = [...userOrders, ...SEED_FACTORY_ORDERS];

  return (
    allOrders.find((o) => {
      const code = normalizeTrackingCode(o.trackingCode);
      return code === norm || code.endsWith(norm);
    }) || null
  );
}

export function registerOrderFromCurrentState(
  state: ConfiguratorState,
  customerName: string,
  projectTitle: string,
  totalPriceToman: number
): TrackedOrder {
  const randomSuffix = Math.floor(4000 + Math.random() * 5900);
  const trackingCode = `TS-403-${randomSuffix}`;

  const nowFa = new Intl.DateTimeFormat('fa-IR', {
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 9);
  const deliveryFa = new Intl.DateTimeFormat('fa-IR', {
    month: 'long',
    day: 'numeric',
  }).format(deliveryDate);

  const newOrder: TrackedOrder = {
    trackingCode,
    customerName: customerName.trim() || 'مشتری گرامی تبریز سکوریت',
    projectTitle: projectTitle.trim() || 'سفارش اختصاصی شیشه بالکن ۳D',
    createdAtFa: `${nowFa} (ثبت آنلاین)`,
    estimatedDeliveryFa: `${deliveryFa} (تخمینی)`,
    currentStageIndex: 1, // Starts at survey completed, active CNC cutting queue
    stageProgressPercent: 25,
    lastUpdatedFa: 'هم‌اکنون',
    totalPriceToman,
    isUserCreated: true,
    config: {
      systemType: state.systemType,
      balconyLayout: state.balconyLayout,
      widthCm: state.widthCm,
      heightCm: state.heightCm,
      panelCount: state.panelCount,
      sideWingPanels: state.sideWingPanels,
      sideWingWidthCm: state.sideWingWidthCm,
      glassTint: state.glassTint,
      glassThickness: state.glassThickness,
      hardwareColor: state.hardwareColor,
    },
    stages: buildStagesForIndex(1, {
      survey: 'تایید دیجیتال از پیکربندی ۳D',
      cutting: 'تخصیص شیشه سکوریت در صف برش CNC',
    }),
  };

  const existing = getUserRegisteredOrders();
  saveUserRegisteredOrders([newOrder, ...existing].slice(0, 15));
  return newOrder;
}

export function updateSavedUserOrderProgress(
  trackingCode: string,
  nextStageIndex: number,
  nextProgressPercent: number
): TrackedOrder | null {
  const existing = getUserRegisteredOrders();
  const idx = existing.findIndex(
    (o) => normalizeTrackingCode(o.trackingCode) === normalizeTrackingCode(trackingCode)
  );
  if (idx === -1) return null;

  const clampedStage = Math.max(0, Math.min(5, nextStageIndex));
  const clampedProg = Math.max(5, Math.min(100, nextProgressPercent));
  const updated: TrackedOrder = {
    ...existing[idx],
    currentStageIndex: clampedStage,
    stageProgressPercent: clampedProg,
    lastUpdatedFa: 'بروزرسانی زنده خط تولید',
    stages: buildStagesForIndex(clampedStage),
  };

  existing[idx] = updated;
  saveUserRegisteredOrders(existing);
  return updated;
}
