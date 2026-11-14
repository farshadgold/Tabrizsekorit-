export type SystemType = 'sliding' | 'folding' | 'accordion';

export type BalconyLayout = 'straight' | 'l_shape' | 'u_shape';

export type PanelCount = number;

export type SideWingPanelCount = number;

export type OpeningMode = 'stack_left' | 'stack_right' | 'center_split';

export type HardwareColorId = 'black' | 'gold' | 'silver' | 'bronze' | 'white' | 'stainless' | 'anthracite';

export interface HardwareColor {
  id: HardwareColorId;
  nameFa: string;
  nameEn: string;
  hex: string;
  metalness: number;
  roughness: number;
  clearcoat?: number;
  finishTypeFa: string;
  finishCategory: 'anodized' | 'powder_coated' | 'pvd_plating' | 'stainless_steel';
  gradientBg: string;
  descriptionFa: string;
}

export type GlassTintId =
  | 'cambalkon_cyan'
  | 'clear'
  | 'bronze'
  | 'reflective'
  | 'frosted'
  | 'smoked'
  | 'green'
  | 'blue_reflective';

export interface GlassTint {
  id: GlassTintId;
  nameFa: string;
  nameEn: string;
  color: string;
  transmission: number;
  opacity: number;
  roughness: number;
  ior: number;
  metalness?: number;
  reflectivity?: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
  description: string;
  categoryFa: 'شفاف و کریستال' | 'رفلکس و آینه‌ای' | 'مات و حریم خصوصی' | 'رنگی و متالیک';
  vltPercent: number;
  solarControlScore: 'عالی' | 'خیلی خوب' | 'استاندارد';
  badgeFa?: string;
  gradientBg: string;
}

export type GlassSealType = 'polycarbonate_h' | 'aluminum_brush';

export type LightingCondition = 'morning' | 'noon' | 'sunset' | 'night';

export interface LightingConditionMeta {
  id: LightingCondition;
  nameFa: string;
  nameEn: string;
  sunElevation: string;
  description: string;
  colorBadge: string;
}

export type WeatherSimulation = 'sunny' | 'rainy' | 'cloudy';

export interface WeatherSimulationMeta {
  id: WeatherSimulation;
  nameFa: string;
  nameEn: string;
  tagline: string;
  description: string;
  glassBehaviorFa: string;
  badgeColor: string;
  transparencyPercent: number;
  reflectionType: string;
}

export type EnvironmentPreset = 'patio_day' | 'penthouse_night' | 'minimal_studio' | 'cambalkon_bright';

export type CameraPreset = 'front' | 'perspective' | 'side' | 'top' | 'close_hardware' | 'corner_view';

export interface ConfiguratorState {
  systemType: SystemType;
  balconyLayout: BalconyLayout;
  panelCount: PanelCount;
  sideWingPanels: SideWingPanelCount;
  openingMode: OpeningMode;
  hardwareColor: HardwareColorId;
  glassTint: GlassTintId;
  sealType: GlassSealType;
  lightingCondition: LightingCondition; // صبح، ظهر، غروب، شب
  weather: WeatherSimulation; // آفتابی، بارانی، ابری
  recessedFloorTrack: boolean;
  glassThickness: 8 | 10;
  widthCm: number;  // 240 to 600 cm (Main wing)
  sideWingWidthCm: number; // 120 to 300 cm (Corner return wing)
  heightCm: number; // 180 to 300 cm
  openProgress: number; // 0 (closed) to 1 (fully open)
  isPlayingAnimation: boolean;
  environment: EnvironmentPreset;
  showDimensions: boolean;
  showFloorGrid: boolean;
  soundEnabled: boolean;
  autoRotate: boolean;
  autoCalculatePanels: boolean; // محاسبه هوشمند و متغیر تعداد پنل‌ها بر مبنای عرض بالکن
}

export const WEATHER_SIMULATIONS: Record<WeatherSimulation, WeatherSimulationMeta> = {
  sunny: {
    id: 'sunny',
    nameFa: 'آفتابی و درخشان',
    nameEn: 'Bright Sunny',
    tagline: 'تابش مستقیم آفتاب با وضوح بلورین',
    description: 'تابش مستقیم و زنده نور خورشید با ایجاد بازتاب‌های شفاف و تیز بر لبه‌های تراش‌خورده شیشه سکوریت',
    glassBehaviorFa: 'حداکثر شفافیت بلورین (۹۴٪) با بازتاب‌های آینه‌ای پرقدرت نور خورشید',
    badgeColor: 'from-amber-400 via-amber-500 to-yellow-500',
    transparencyPercent: 94,
    reflectionType: 'رفلکس تیز و آینه‌ای',
  },
  rainy: {
    id: 'rainy',
    nameFa: 'بارانی و قطرات آب',
    nameEn: 'Rainy Shower',
    tagline: 'بارش زنده باران و رطوبت محیط',
    description: 'شبیه‌سازی بارش فعال قطرات باران به همراه جلوه زمین خیس، قطرات شبنم و انکسار نور روی شیشه‌ها',
    glassBehaviorFa: 'رفتار آب‌گریز شیشه سکوریت، انعکاس براق رطوبت و کاهش جزئی وضوح در اثر قطرات باران',
    badgeColor: 'from-sky-400 via-blue-500 to-cyan-600',
    transparencyPercent: 82,
    reflectionType: 'انعکاس براق زمین خیس و قطرات',
  },
  cloudy: {
    id: 'cloudy',
    nameFa: 'ابری و نور دیفیوز',
    nameEn: 'Overcast Cloudy',
    tagline: 'روشنایی ملایم بدون خیرگی آفتاب',
    description: 'نور ملایم، یکدست و بدون سایه‌های تند؛ ایده‌آل برای ارزیابی رنگ و عبور نور طبیعی به فضای داخلی',
    glassBehaviorFa: 'دید شفاف و عمیق بدون بازتاب‌های زننده خورشید با تفکیک عالی رنگ و بافت داخل بالکن',
    badgeColor: 'from-slate-400 via-zinc-500 to-slate-600',
    transparencyPercent: 96,
    reflectionType: 'بازتاب ملایم و مات محیطی',
  },
};

export const LIGHTING_CONDITIONS: Record<LightingCondition, LightingConditionMeta> = {
  morning: {
    id: 'morning',
    nameFa: 'صبحگاهی (نور ملایم طلایی)',
    nameEn: 'Golden Morning',
    sunElevation: 'زاویه ۲۵° مایل شرق',
    description: 'زاویه تابش مایل و کشیده خورشید صبح با بازتاب‌های گرم هلویی-طلایی روی لبه‌های شیشه',
    colorBadge: 'from-amber-300 via-orange-300 to-sky-300',
  },
  noon: {
    id: 'noon',
    nameFa: 'ظهر (آفتاب مستقیم و درخشان)',
    nameEn: 'Bright Midday Noon',
    sunElevation: 'زاویه ۷۵° عمودی',
    description: 'نور پرقدرت و شفاف عمودی خورشید با حداکثر شفافیت کریستالی و رفلکس شدید آسمان',
    colorBadge: 'from-sky-300 via-blue-200 to-amber-100',
  },
  sunset: {
    id: 'sunset',
    nameFa: 'غروب (ساعت طلایی و درخشان)',
    nameEn: 'Golden Sunset',
    sunElevation: 'زاویه ۱۰° افق غرب',
    description: 'نور آتشین و درام افق با بازتاب‌های تماشایی مسی-سرخ بر سطح شیشه‌ها و فریم‌های فلزی',
    colorBadge: 'from-rose-500 via-orange-500 to-amber-500',
  },
  night: {
    id: 'night',
    nameFa: 'شب (نورپردازی معماری و مهتاب)',
    nameEn: 'Architectural Night',
    sunElevation: 'نورپردازی اسپات‌لایت',
    description: 'تم شبانه لوکس پنت‌هاوس با انعکاس ملایم چراغ‌های دکوراتیو و هاله مهتاب',
    colorBadge: 'from-indigo-600 via-slate-800 to-neutral-900',
  },
};

export const HARDWARE_COLORS: Record<HardwareColorId, HardwareColor> = {
  black: {
    id: 'black',
    nameFa: 'مشکی مات آنودایز',
    nameEn: 'Matte Black Anodized',
    hex: '#171717',
    metalness: 0.35,
    roughness: 0.38,
    finishTypeFa: 'آنودایز مات سمباده‌ای ضدخش ۲۰ میکرون',
    finishCategory: 'anodized',
    gradientBg: 'linear-gradient(135deg, #262626 0%, #171717 60%, #0a0a0a 100%)',
    descriptionFa: 'پرفروش‌ترین فینیشینگ در معماری مدرن و مینیمال با دوام مادام‌العمر در برابر شرایط جوی',
  },
  gold: {
    id: 'gold',
    nameFa: 'طلایی تیتانیوم لوکس',
    nameEn: 'Titanium Brushed Gold (PVD)',
    hex: '#d4af37',
    metalness: 0.92,
    roughness: 0.18,
    clearcoat: 0.7,
    finishTypeFa: 'پوشش نانومتالیک PVD تیتانیوم براق',
    finishCategory: 'pvd_plating',
    gradientBg: 'linear-gradient(135deg, #fef08a 0%, #eab308 50%, #a16207 100%)',
    descriptionFa: 'جلوه فوق‌العاده لوکس و چشم‌نواز با مقاومت حرارتی و ضدفرسایش ویژه پنت‌هاوس‌ها',
  },
  silver: {
    id: 'silver',
    nameFa: 'نقره‌ای آنودایز مات',
    nameEn: 'Satin Natural Silver Anodized',
    hex: '#d1d5db',
    metalness: 0.80,
    roughness: 0.28,
    finishTypeFa: 'آنودایز نچرال مات استاندارد DIN 17611',
    finishCategory: 'anodized',
    gradientBg: 'linear-gradient(135deg, #f3f4f6 0%, #cbd5e1 50%, #94a3b8 100%)',
    descriptionFa: 'رنگ طبیعی آلومینیوم با بازتاب خنک نقره‌ای؛ هماهنگ با انواع سنگ نما و آجر',
  },
  bronze: {
    id: 'bronze',
    nameFa: 'شامپاینی برنز متالیک',
    nameEn: 'Champagne Bronze Metallic',
    hex: '#8c6b4f',
    metalness: 0.84,
    roughness: 0.26,
    finishTypeFa: 'آنودایز رنگی شامپاینی برنز متالیک',
    finishCategory: 'anodized',
    gradientBg: 'linear-gradient(135deg, #bfa07d 0%, #8c6b4f 50%, #5c412b 100%)',
    descriptionFa: 'هارمونی بی‌نظیر با نماهای چوبی، ترمووود، سنگ تراورتن کرم و فضاهای گرم',
  },
  white: {
    id: 'white',
    nameFa: 'سفید الکترواستاتیک (RAL 9016)',
    nameEn: 'Pure White Electrostatic',
    hex: '#f8fafc',
    metalness: 0.12,
    roughness: 0.32,
    finishTypeFa: 'رنگ پودری الکترواستاتیک کوره‌ای براق',
    finishCategory: 'powder_coated',
    gradientBg: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 60%, #e2e8f0 100%)',
    descriptionFa: 'پوشش پلی‌استر کوره‌ای با ماندگاری بالا و ثبات رنگ تضمینی در برابر تابش UV',
  },
  stainless: {
    id: 'stainless',
    nameFa: 'استیل ۳۰۴ ضدزنگ خش‌دار',
    nameEn: 'Brushed Stainless Steel 304',
    hex: '#e5e7eb',
    metalness: 0.96,
    roughness: 0.14,
    clearcoat: 0.8,
    finishTypeFa: 'استیل نگیر گرید ۳۰۴ خش‌دار فابریک',
    finishCategory: 'stainless_steel',
    gradientBg: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 40%, #94a3b8 70%, #cbd5e1 100%)',
    descriptionFa: 'حداکثر مقاومت مکانیکی و ضدخوردگی در مناطق مرطوب ساحلی و آب‌وهوای صنعتی',
  },
  anthracite: {
    id: 'anthracite',
    nameFa: 'خاکستری آنتراسیت (RAL 7016)',
    nameEn: 'Anthracite Grey Metallic',
    hex: '#374151',
    metalness: 0.50,
    roughness: 0.32,
    finishTypeFa: 'رنگ پودری متالیک سمباده‌ای سوپردورابل',
    finishCategory: 'powder_coated',
    gradientBg: 'linear-gradient(135deg, #4b5563 0%, #374151 50%, #1f2937 100%)',
    descriptionFa: 'محبوب‌ترین رنگ در سبک معماری صنعتی و مدرن اروپایی با بافت ظریف دانه‌دار',
  },
};

export const GLASS_TINTS: Record<GlassTintId, GlassTint> = {
  clear: {
    id: 'clear',
    nameFa: 'سوپرکلیر شفاف کریستال',
    nameEn: 'Ultra-Clear Low-Iron Crystal',
    color: '#eef9fc',
    transmission: 0.95,
    opacity: 0.16,
    roughness: 0.02,
    ior: 1.52,
    metalness: 0.0,
    reflectivity: 0.95,
    clearcoat: 1.0,
    clearcoatRoughness: 0.02,
    categoryFa: 'شفاف و کریستال',
    vltPercent: 95,
    solarControlScore: 'استاندارد',
    badgeFa: 'شفافیت حداکثری',
    gradientBg: 'linear-gradient(135deg, rgba(238,249,252,0.85) 0%, rgba(200,230,245,0.4) 100%)',
    description: 'شیشه سکوریت با خلوص آهن صفر (Low-Iron)، بدون رگه سبز، با حداکثر عبور نور طبیعی و دید بلورین بدون تحریف',
  },
  cambalkon_cyan: {
    id: 'cambalkon_cyan',
    nameFa: 'جام بالکن فیروزه‌ای کریستال (مطابق فیلم)',
    nameEn: 'CamBalkon Cyan Crystal',
    color: '#72c8ea',
    transmission: 0.88,
    opacity: 0.26,
    roughness: 0.03,
    ior: 1.53,
    metalness: 0.02,
    reflectivity: 0.94,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
    categoryFa: 'شفاف و کریستال',
    vltPercent: 88,
    solarControlScore: 'خیلی خوب',
    badgeFa: 'ویژه ویدیوی نمونه',
    gradientBg: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 50%, #0369a1 100%)',
    description: 'شیشه کریستال فیروزه‌ای لایت با بازتاب درخشان لبه‌های تراش‌خورده دقیقاً مطابق ویدیوی مرجع پروژه تبریز سکوریت',
  },
  bronze: {
    id: 'bronze',
    nameFa: 'برنز متالیک شامپاینی',
    nameEn: 'Warm Bronze Metallic',
    color: '#66462c',
    transmission: 0.68,
    opacity: 0.42,
    roughness: 0.035,
    ior: 1.54,
    metalness: 0.12,
    reflectivity: 0.94,
    clearcoat: 1.0,
    clearcoatRoughness: 0.035,
    categoryFa: 'رنگی و متالیک',
    vltPercent: 68,
    solarControlScore: 'عالی',
    badgeFa: 'گرم و لوکس',
    gradientBg: 'linear-gradient(135deg, #a16207 0%, #78350f 50%, #451a03 100%)',
    description: 'رنگ گرم برنز با فیلتر اشعه فروسرخ، کاهش خیرگی نور خورشید و تناسب ایده‌آل با نمای چوب، ترمووود و یراق طلایی',
  },
  reflective: {
    id: 'reflective',
    nameFa: 'شیشه رفلکس نقره‌ای آینه‌ای (Solar Mirror)',
    nameEn: 'Silver Mirror Reflective Solar',
    color: '#c2d4e7',
    transmission: 0.38,
    opacity: 0.68,
    roughness: 0.015,
    ior: 1.62,
    metalness: 0.58,
    reflectivity: 1.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.02,
    categoryFa: 'رفلکس و آینه‌ای',
    vltPercent: 38,
    solarControlScore: 'عالی',
    badgeFa: 'آینه‌ای ضدحرارت',
    gradientBg: 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 40%, #64748b 80%, #334155 100%)',
    description: 'پوشش رفلکس متالایز با بازتاب شدید آینه‌ای در روز؛ مانع دید از بیرون، دفع ۶۵٪ حرارت خورشید و ایجاد جلوه مدرن برج‌ها',
  },
  frosted: {
    id: 'frosted',
    nameFa: 'ساتینا مات پرایوسی (سندبلاست مخملی)',
    nameEn: 'Frosted Satin Privacy (Sandblasted)',
    color: '#f1f5f9',
    transmission: 0.62,
    opacity: 0.88,
    roughness: 0.62,
    ior: 1.48,
    metalness: 0.0,
    reflectivity: 0.22,
    clearcoat: 0.05,
    clearcoatRoughness: 0.6,
    categoryFa: 'مات و حریم خصوصی',
    vltPercent: 62,
    solarControlScore: 'خیلی خوب',
    badgeFa: 'حریم خصوصی کامل',
    gradientBg: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 50%, #cbd5e1 100%)',
    description: 'سطح مات مخملی اسیدشور (Satin)؛ نور طبیعی را عبور می‌دهد اما مانع دید مستقیم و حفظ ۱۰۰٪ حریم خصوصی بالکن می‌شود',
  },
  smoked: {
    id: 'smoked',
    nameFa: 'دودی اروپایی زغالی (Smoked Graphite)',
    nameEn: 'Smoked European Graphite',
    color: '#2d3339',
    transmission: 0.60,
    opacity: 0.46,
    roughness: 0.04,
    ior: 1.54,
    metalness: 0.06,
    reflectivity: 0.92,
    clearcoat: 1.0,
    clearcoatRoughness: 0.035,
    categoryFa: 'رنگی و متالیک',
    vltPercent: 60,
    solarControlScore: 'عالی',
    badgeFa: 'کنترل تابش خورشید',
    gradientBg: 'linear-gradient(135deg, #475569 0%, #334155 50%, #1e293b 100%)',
    description: 'تم خاکستری دودی شیک اروپایی با فیلتر ملایم آفتاب تند، حذف انعکاس‌های مزاحم داخل خانه و ایجاد پرستیژ معماری',
  },
  green: {
    id: 'green',
    nameFa: 'سبز پیرکس رفلکس سولار',
    nameEn: 'Solar Reflective Emerald Green',
    color: '#1f4834',
    transmission: 0.72,
    opacity: 0.38,
    roughness: 0.035,
    ior: 1.56,
    metalness: 0.22,
    reflectivity: 0.95,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
    categoryFa: 'رفلکس و آینه‌ای',
    vltPercent: 72,
    solarControlScore: 'عالی',
    badgeFa: 'ضدUV و خنک‌کننده',
    gradientBg: 'linear-gradient(135deg, #10b981 0%, #047857 50%, #064e3b 100%)',
    description: 'کاهش محسوس بار برودتی ساختمان در تابستان با بازتاب سبز زمرّدی کلاسیک و ایجاد فضایی خنک در داخل بالکن',
  },
  blue_reflective: {
    id: 'blue_reflective',
    nameFa: 'آبی درباری رفلکس متالیک',
    nameEn: 'Royal Blue Reflective Metallic',
    color: '#1c3d5a',
    transmission: 0.52,
    opacity: 0.55,
    roughness: 0.025,
    ior: 1.60,
    metalness: 0.42,
    reflectivity: 0.98,
    clearcoat: 1.0,
    clearcoatRoughness: 0.025,
    categoryFa: 'رفلکس و آینه‌ای',
    vltPercent: 52,
    solarControlScore: 'عالی',
    badgeFa: 'آبی آسمانی متالیک',
    gradientBg: 'linear-gradient(135deg, #38bdf8 0%, #0369a1 50%, #1e3a8a 100%)',
    description: 'انعکاس رنگ آبی آسمان در روز با جلوه شیک متالیک برای بالکن‌های رو به باغ، دریا یا استخر ویلا',
  },
};

export const BALCONY_LAYOUTS: Record<BalconyLayout, {
  nameFa: string;
  nameEn: string;
  description: string;
  iconName: string;
}> = {
  straight: {
    nameFa: 'بالکن مستقیم (یک‌طرفه)',
    nameEn: 'Straight Balcony',
    description: 'طرح خطی ساده برای دهانه‌های مستقیم بدون زاویه',
    iconName: 'Minus',
  },
  l_shape: {
    nameFa: 'بالکن ال‌شکل نبش‌دار (مطابق فیلم)',
    nameEn: 'L-Shape Corner Balcony',
    description: 'دو ضلع متقاطع ۹۰ درجه با ستون نبش آلومینیومی و هدایت مستقل یا مشترک لنگه‌ها',
    iconName: 'CornerDownRight',
  },
  u_shape: {
    nameFa: 'بالکن یو‌شکل (سه‌طرفه)',
    nameEn: 'U-Shape 3-Sided Balcony',
    description: 'ضلع اصلی جلو به همراه دو بال کناری چپ و راست با بیشترین دید پانوراما',
    iconName: 'Maximize',
  },
};

export const SYSTEM_SPECS: Record<SystemType, {
  nameFa: string;
  nameEn: string;
  tagline: string;
  description: string;
  features: string[];
  basePricePerSqm: number;
  iconName: string;
}> = {
  sliding: {
    nameFa: 'سیستم ریلی (اسلایدینگ چندخطه)',
    nameEn: 'Multi-Track Sliding System',
    tagline: 'حرکت روان و موازی پنل‌ها روی ریل‌های چندردیفه اختصاصی',
    description: 'در این سیستم لنگه‌های شیشه روی ریل‌های موازی ۲ تا ۵ خطه به نرمی حرکت کرده و روی یکدیگر جمع می‌شوند. مناسب برای دهانه‌های عریض تجاری، استخر، رستوران و آلاچیق.',
    features: [
      'دارای ریل کف کم‌ارتفاع همسطح جهت سهولت در رفت‌وآمد',
      'غلتک‌های دوبل بلبرینگی با بلبرینگ ژاپنی ضدزنگ',
      'درزگیرهای آلومینیومی و مویی‌های پرتراکم آلمانی برای آب‌بندی',
      'تحمل وزن هر لنگه شیشه تا ۱۲۰ کیلوگرم'
    ],
    basePricePerSqm: 2850000,
    iconName: 'Sliders',
  },
  folding: {
    nameFa: 'سیستم تاشو بالکنی (شیشه بالکن جمع‌شو - CamBalkon)',
    nameEn: 'Folding Balcony Glazing',
    tagline: 'حرکت لنگه‌ها به گوشه و چرخش ۹۰ درجه به سمت دیوار (مطابق فیلم)',
    description: 'محبوب‌ترین سیستم شیشه بالکن؛ لنگه‌ها تک‌تک در امتداد ریل سر خورده، به گوشه هدایت می‌شوند و مانند صفحات کتاب ۹۰ درجه باز شده و کل فضای بالکن را آزاد می‌کنند.',
    features: [
      'بازشوی مرحله‌ای تک‌تک لنگه‌ها مطابق استاندارد سیستم‌های مدرن بالکنی',
      'امکان شستشوی هر دو طرف شیشه‌ها از داخل بالکن با حداکثر ایمنی',
      'قفل ایمنی دوطرفه سکوریت بالا و پایین',
      'قابلیت اتصال در نبش‌های ۹۰ درجه ال‌شکل و یو‌شکل بدون ستون مزاحم'
    ],
    basePricePerSqm: 3200000,
    iconName: 'BookOpen',
  },
  accordion: {
    nameFa: 'سیستم آکاردئونی (هماهنگ زیگزاگ)',
    nameEn: 'Concertina Accordion System',
    tagline: 'تا شدن جفتی لنگه‌ها با لولاهای استیل مقاوم',
    description: 'در این سیستم پنل‌ها با لولاهای مخفی یا روکار به یکدیگر متصل بوده و با یک حرکت ملایم به صورت زیگزاگ جمع می‌شوند. مناسب تقسیم فضا، سالن همایش، ویلا و پنت‌هاوس.',
    features: [
      'حرکت همزمان و پیوسته پنل‌ها با راهنمای ریل فوقانی تقویتی',
      'لولاهای تمام استیل ضدسرقت با قابلیت تنظیم زاویه',
      'قابلیت بازشوی دوطرفه (چپ و راست) برای دهانه‌های بزرگ',
      'امکان تعبیه لنگه درب بازشوی مستقل در انتهای سیستم'
    ],
    basePricePerSqm: 3600000,
    iconName: 'Maximize2',
  },
};

/**
 * Architectural Engineering Model for Variable Glass Balcony Panels
 * Tabriz Securit Standard (ISIRI 3772 & CamBalkon Engineering Guidelines)
 */
export interface PanelOption {
  count: number;
  panelWidthCm: number;
  isOptimal: boolean;
  status: 'optimal' | 'wide' | 'narrow';
  labelFa: string;
  descriptionFa: string;
  estimatedPanelWeightKg: number;
}

export interface PanelCalculationResult {
  widthCm: number;
  heightCm: number;
  recommendedCount: number;
  recommendedPanelWidthCm: number;
  options: PanelOption[];
}

/**
 * Calculates variable panel count options dynamically based on balcony width and height.
 * Optimal glass balcony panel width is between 55cm and 68cm (standard ~60cm).
 */
export function calculateDynamicPanels(
  widthCm: number,
  heightCm: number = 240,
  glassThicknessMm: 8 | 10 = 10
): PanelCalculationResult {
  const targetOptimalWidth = 60;
  const rawRecommended = Math.round(widthCm / targetOptimalWidth);
  const recommendedCount = Math.max(2, Math.min(14, rawRecommended));

  // Determine safe structural bounds for panel widths:
  // Min panel count: prevents individual panel from exceeding ~85 cm
  const minPanels = Math.max(2, Math.floor(widthCm / 85));
  // Max panel count: prevents individual panel from being narrower than ~42 cm
  const maxPanels = Math.max(minPanels + 1, Math.min(14, Math.ceil(widthCm / 42)));

  const options: PanelOption[] = [];
  for (let count = minPanels; count <= maxPanels; count++) {
    const panelWidthCm = Math.round(widthCm / count);
    const isOptimal = count === recommendedCount;

    // Weight calculation: 2.5 kg per m² per mm of glass thickness
    const areaM2 = (panelWidthCm / 100) * (heightCm / 100);
    const estimatedPanelWeightKg = Math.round(areaM2 * (glassThicknessMm * 2.5));

    let status: 'optimal' | 'wide' | 'narrow' = 'optimal';
    let labelFa = 'استاندارد کارخانه (بهینه)';
    let descriptionFa = 'تناسب ایده‌آل ابعاد و وزن؛ حداقل فشار روی بلبرینگ‌ها و حرکت روان';

    if (panelWidthCm > 72) {
      status = 'wide';
      labelFa = 'لنگه عریض و سنگین‌تر';
      descriptionFa = 'دید شیشه‌ای یکدست‌تر با لنگه کمتر؛ وزن بیشتر در هنگام جمع شدن';
    } else if (panelWidthCm < 52) {
      status = 'narrow';
      labelFa = 'لنگه باریک و سبک';
      descriptionFa = 'بازشوی بسیار سبک و روان؛ اشغال فضای کمتر در پارکینگ لنگه‌ها';
    } else if (isOptimal) {
      status = 'optimal';
      labelFa = 'پیشنهادی مهندسی تبریز سکوریت';
      descriptionFa = 'بهترین ابعاد برای سهولت در شستشو، حرکت نرم روی ریل و مقاومت در برابر باد';
    }

    options.push({
      count,
      panelWidthCm,
      isOptimal,
      status,
      labelFa,
      descriptionFa,
      estimatedPanelWeightKg,
    });
  }

  return {
    widthCm,
    heightCm,
    recommendedCount,
    recommendedPanelWidthCm: Math.round(widthCm / recommendedCount),
    options,
  };
}

/**
 * Calculates dynamic side wing panels for corner L and U shapes
 */
export function calculateDynamicSidePanels(sideWingWidthCm: number): {
  recommendedCount: number;
  options: number[];
} {
  const recommended = Math.max(2, Math.min(6, Math.round(sideWingWidthCm / 60)));
  const minPanels = Math.max(2, Math.floor(sideWingWidthCm / 80));
  const maxPanels = Math.max(minPanels + 1, Math.min(6, Math.ceil(sideWingWidthCm / 42)));
  const options: number[] = [];
  for (let c = minPanels; c <= maxPanels; c++) {
    options.push(c);
  }
  return {
    recommendedCount: recommended,
    options,
  };
}

