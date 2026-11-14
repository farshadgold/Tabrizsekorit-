import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  Flame,
  Scissors,
  Wrench,
  ShieldCheck,
  Truck,
  Ruler,
  PlusCircle,
  RefreshCw,
  AlertCircle,
  Eye,
  Copy,
  Check,
  Sparkles,
  Factory,
  FastForward,
} from 'lucide-react';
import {
  ConfiguratorState,
  SYSTEM_SPECS,
  BALCONY_LAYOUTS,
  GLASS_TINTS,
  HARDWARE_COLORS,
} from '../types/configurator';
import {
  TrackedOrder,
  SEED_FACTORY_ORDERS,
  findOrderByTrackingCode,
  getUserRegisteredOrders,
  registerOrderFromCurrentState,
  updateSavedUserOrderProgress,
  OrderStageId,
  buildStagesForIndex,
} from '../utils/orderTracker';
import { calculateProjectCost } from '../utils/invoicePdfGenerator';
import { playMechanicalClick, playUiClick } from '../audio/soundEffects';

interface OrderTrackingTabProps {
  state: ConfiguratorState;
  onUpdateState: (patch: Partial<ConfiguratorState>) => void;
}

const STAGE_ICONS: Record<OrderStageId, React.ElementType> = {
  survey: Ruler,
  cutting: Scissors,
  tempering: Flame,
  hardware_prep: Wrench,
  qc_pack: ShieldCheck,
  delivery_install: Truck,
};

export const OrderTrackingTab: React.FC<OrderTrackingTabProps> = ({
  state,
  onUpdateState,
}) => {
  const [trackingInput, setTrackingInput] = useState<string>('TS-403-1024');
  const [activeOrder, setActiveOrder] = useState<TrackedOrder | null>(() =>
    findOrderByTrackingCode('TS-403-1024')
  );
  const [notFoundError, setNotFoundError] = useState<string>('');
  const [userOrders, setUserOrders] = useState<TrackedOrder[]>(() =>
    getUserRegisteredOrders()
  );

  // Live Auto-Sync state for manufacturing telemetry
  const [isLiveFeedActive, setIsLiveFeedActive] = useState<boolean>(true);
  const [liveTickCount, setLiveTickCount] = useState<number>(0);

  // Inline Quick Order Registration Form
  const [showRegisterForm, setShowRegisterForm] = useState<boolean>(false);
  const [newCustomerName, setNewCustomerName] = useState<string>('');
  const [newProjectTitle, setNewProjectTitle] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Live production line progress simulation when viewing an active order
  useEffect(() => {
    if (!isLiveFeedActive || !activeOrder) return;

    const timer = setInterval(() => {
      setLiveTickCount((c) => c + 1);
      setActiveOrder((prev) => {
        if (!prev) return null;
        if (prev.currentStageIndex >= 5 && prev.stageProgressPercent >= 100) {
          return prev;
        }
        let nextProg = prev.stageProgressPercent + 1;
        let nextStage = prev.currentStageIndex;
        if (nextProg > 100) {
          if (nextStage < 5) {
            nextStage += 1;
            nextProg = 10;
          } else {
            nextProg = 100;
          }
        }
        if (prev.isUserCreated) {
          updateSavedUserOrderProgress(prev.trackingCode, nextStage, nextProg);
        }
        return {
          ...prev,
          currentStageIndex: nextStage,
          stageProgressPercent: nextProg,
          lastUpdatedFa: 'بروزرسانی زنده خط تولید',
          stages: buildStagesForIndex(nextStage),
        };
      });
    }, 4500);

    return () => clearInterval(timer);
  }, [isLiveFeedActive, activeOrder?.trackingCode]);

  const handleSearchOrder = (codeToSearch?: string) => {
    const query = (codeToSearch ?? trackingInput).trim();
    if (!query) {
      setNotFoundError('لطفاً کد رهگیری سفارش خود را وارد نمایید.');
      setActiveOrder(null);
      return;
    }

    const found = findOrderByTrackingCode(query);
    if (found) {
      setActiveOrder(found);
      setTrackingInput(found.trackingCode);
      setNotFoundError('');
      playMechanicalClick(state.soundEnabled);
    } else {
      setActiveOrder(null);
      setNotFoundError(
        `سفارشی با کد رهگیری «${query}» یافت نشد. از صحت کد اطمینان حاصل کنید یا یکی از کدهای نمونه را انتخاب نمایید.`
      );
      playUiClick(state.soundEnabled);
    }
  };

  const handleRegisterCurrentConfig = (e: React.FormEvent) => {
    e.preventDefault();
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

    const created = registerOrderFromCurrentState(
      state,
      newCustomerName,
      newProjectTitle,
      calc.finalCost
    );
    setUserOrders(getUserRegisteredOrders());
    setActiveOrder(created);
    setTrackingInput(created.trackingCode);
    setNotFoundError('');
    setShowRegisterForm(false);
    setNewCustomerName('');
    setNewProjectTitle('');
    playMechanicalClick(state.soundEnabled);
  };

  const handleLoadOrderInto3D = (order: TrackedOrder) => {
    onUpdateState({
      systemType: order.config.systemType,
      balconyLayout: order.config.balconyLayout,
      widthCm: order.config.widthCm,
      heightCm: order.config.heightCm,
      panelCount: order.config.panelCount,
      sideWingPanels: order.config.sideWingPanels,
      sideWingWidthCm: order.config.sideWingWidthCm,
      glassTint: order.config.glassTint,
      glassThickness: order.config.glassThickness,
      hardwareColor: order.config.hardwareColor,
    });
    playMechanicalClick(state.soundEnabled);
  };

  const handleAdvanceStageDemo = () => {
    if (!activeOrder) return;
    const nextStage = Math.min(5, activeOrder.currentStageIndex + 1);
    const nextProg = nextStage === 5 ? 100 : 35;

    if (activeOrder.isUserCreated) {
      const updated = updateSavedUserOrderProgress(
        activeOrder.trackingCode,
        nextStage,
        nextProg
      );
      if (updated) {
        setActiveOrder(updated);
        setUserOrders(getUserRegisteredOrders());
      }
    } else {
      setActiveOrder({
        ...activeOrder,
        currentStageIndex: nextStage,
        stageProgressPercent: nextProg,
        lastUpdatedFa: 'بروزرسانی لحظه‌ای',
        stages: buildStagesForIndex(nextStage),
      });
    }
    playMechanicalClick(state.soundEnabled);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    playUiClick(state.soundEnabled);
  };

  const overallPercent = activeOrder
    ? Math.min(
        100,
        Math.round(
          ((activeOrder.currentStageIndex + activeOrder.stageProgressPercent / 100) / 6) *
            100
        )
      )
    : 0;

  return (
    <div className="space-y-4">
      {/* 1. Top Search & Quick Register Bar */}
      <div className="bg-neutral-950/75 border border-neutral-800 rounded-2xl p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <Factory className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-bold text-neutral-100">
              سامانه پیگیری زنده وضعیت ساخت و کوره سکوریت:
            </span>
          </div>

          <button
            onClick={() => {
              setShowRegisterForm(!showRegisterForm);
              playUiClick(state.soundEnabled);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/50 text-amber-300 text-[11px] font-bold cursor-pointer transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>ثبت سفارش طراحی فعلی و دریافت کد رهگیری</span>
          </button>
        </div>

        {/* Inline Registration Drawer */}
        {showRegisterForm && (
          <form
            onSubmit={handleRegisterCurrentConfig}
            className="mb-3 p-3 rounded-xl bg-neutral-900 border border-amber-500/40 space-y-2.5"
          >
            <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                ثبت فوری سفارش برای پیکربندی فعلی ({SYSTEM_SPECS[state.systemType].nameFa} •{' '}
                {state.widthCm}×{state.heightCm}cm • {state.panelCount} پنل):
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                placeholder="نام کارفرما / مشتری (اختیاری)"
                className="bg-neutral-950 border border-neutral-800 focus:border-amber-400 rounded-lg px-2.5 py-1.5 text-xs text-neutral-100 outline-none"
              />
              <input
                type="text"
                value={newProjectTitle}
                onChange={(e) => setNewProjectTitle(e.target.value)}
                placeholder="عنوان پروژه (مثلاً: بالکن طبقه ۴)"
                className="bg-neutral-950 border border-neutral-800 focus:border-amber-400 rounded-lg px-2.5 py-1.5 text-xs text-neutral-100 outline-none"
              />
              <div className="flex items-center gap-1.5">
                <button
                  type="submit"
                  className="flex-1 py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs cursor-pointer transition-colors"
                >
                  تایید و صدور کد رهگیری
                </button>
                <button
                  type="button"
                  onClick={() => setShowRegisterForm(false)}
                  className="py-1.5 px-2.5 rounded-lg bg-neutral-800 text-neutral-300 text-xs cursor-pointer hover:bg-neutral-700"
                >
                  لغو
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tracking Code Input Form */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-500 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              dir="ltr"
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearchOrder();
              }}
              placeholder="کد رهگیری سفارش را وارد کنید (مثلاً: TS-403-1024)"
              className="w-full bg-neutral-900 border border-neutral-700/80 focus:border-sky-400 rounded-xl pr-10 pl-3 py-2 text-xs font-mono font-bold text-neutral-100 placeholder:text-neutral-500 placeholder:font-sans text-right outline-none transition-colors"
            />
          </div>

          <button
            onClick={() => handleSearchOrder()}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-neutral-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-md shadow-sky-500/20"
          >
            <Search className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>استعلام وضعیت زنده</span>
          </button>
        </div>

        {/* Sample & User-Registered Quick Pills */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-[11px]">
          <span className="text-neutral-400">کدهای فعال کارخانه:</span>
          {SEED_FACTORY_ORDERS.map((order) => (
            <button
              key={order.trackingCode}
              onClick={() => handleSearchOrder(order.trackingCode)}
              className={`px-2 py-0.5 rounded-lg border font-mono text-[10px] cursor-pointer transition-all ${
                activeOrder?.trackingCode === order.trackingCode
                  ? 'bg-sky-500/20 border-sky-400 text-sky-300 font-bold'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
              }`}
            >
              {order.trackingCode}
            </button>
          ))}

          {userOrders.length > 0 && (
            <>
              <span className="text-neutral-600 mx-1">|</span>
              <span className="text-amber-400 font-medium">سفارش‌های ثبت‌شده شما:</span>
              {userOrders.slice(0, 4).map((order) => (
                <button
                  key={order.trackingCode}
                  onClick={() => handleSearchOrder(order.trackingCode)}
                  className={`px-2 py-0.5 rounded-lg border font-mono text-[10px] cursor-pointer transition-all ${
                    activeOrder?.trackingCode === order.trackingCode
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                      : 'bg-neutral-900 border-amber-500/30 text-amber-300/80 hover:border-amber-400'
                  }`}
                >
                  {order.trackingCode}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Error Message when code not found */}
      {notFoundError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 flex items-center gap-2 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{notFoundError}</span>
        </div>
      )}

      {/* 2. Active Order Live Manufacturing Timeline */}
      {activeOrder && (
        <div className="bg-neutral-950/80 border border-neutral-800 rounded-2xl p-4 space-y-4">
          {/* Order Summary Header */}
          <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-neutral-800">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black text-white">{activeOrder.projectTitle}</span>
                <button
                  onClick={() => handleCopyCode(activeOrder.trackingCode)}
                  className="text-[10px] font-mono bg-sky-500/15 border border-sky-400/40 text-sky-300 px-2 py-0.5 rounded-md flex items-center gap-1 cursor-pointer hover:bg-sky-500/25"
                  title="کپی کد رهگیری"
                >
                  <span>{activeOrder.trackingCode}</span>
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
                <span className="text-[10px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                  پیشرفت کل: {overallPercent}٪
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-[11px] text-neutral-400 mt-1.5">
                <span>
                  کارفرما: <strong className="text-neutral-200">{activeOrder.customerName}</strong>
                </span>
                <span>•</span>
                <span>
                  تاریخ ثبت: <strong className="text-neutral-200">{activeOrder.createdAtFa}</strong>
                </span>
                <span>•</span>
                <span>
                  تحویل تخمینی:{' '}
                  <strong className="text-amber-300">{activeOrder.estimatedDeliveryFa}</strong>
                </span>
              </div>
            </div>

            {/* Live Actions */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setIsLiveFeedActive(!isLiveFeedActive)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold cursor-pointer transition-colors ${
                  isLiveFeedActive
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-neutral-900 border-neutral-700 text-neutral-400'
                }`}
                title="همگام‌سازی زنده وضعیت خط تولید"
              >
                <RefreshCw
                  className={`w-3 h-3 ${isLiveFeedActive ? 'animate-spin text-emerald-400' : ''}`}
                  style={{ animationDuration: '4s' }}
                />
                <span>{isLiveFeedActive ? 'رهگیری زنده فعال' : 'رهگیری متوقف'}</span>
              </button>

              <button
                onClick={() => handleLoadOrderInto3D(activeOrder)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/50 text-amber-300 text-[11px] font-bold cursor-pointer transition-colors"
                title="بارگذاری ابعاد و متریال این سفارش در صحنه سه‌بعدی"
              >
                <Eye className="w-3 h-3" />
                <span>مشاهده مدل در ۳D</span>
              </button>

              <button
                onClick={handleAdvanceStageDemo}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 text-[11px] cursor-pointer transition-colors"
                title="شبیه‌سازی انتقال به مرحله بعدی ساخت در خط تولید"
              >
                <FastForward className="w-3 h-3 text-sky-400" />
                <span>مرحله بعد (شبیه‌ساز)</span>
              </button>
            </div>
          </div>

          {/* Overall Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="text-neutral-300 font-semibold">
                مرحله جاری:{' '}
                <strong className="text-sky-300">
                  {activeOrder.stages[activeOrder.currentStageIndex]?.titleFa}
                </strong>
              </span>
              <span className="font-mono text-neutral-400">
                بروزرسانی: {activeOrder.lastUpdatedFa} ({liveTickCount > 0 ? `پالس #${liveTickCount}` : 'آنلاین'})
              </span>
            </div>
            <div className="w-full h-2.5 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
              <div
                style={{ width: `${overallPercent}%` }}
                className="h-full bg-gradient-to-r from-sky-500 via-emerald-400 to-amber-400 transition-all duration-500"
              />
            </div>
          </div>

          {/* 6-Stage Glass Manufacturing Pipeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {activeOrder.stages.map((stage, idx) => {
              const Icon = STAGE_ICONS[stage.id];
              const isCompleted = stage.status === 'completed';
              const isActive = stage.status === 'in_progress';

              return (
                <div
                  key={stage.id}
                  className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                    isActive
                      ? 'bg-sky-500/10 border-sky-400/80 shadow-md ring-1 ring-sky-400/30'
                      : isCompleted
                      ? 'bg-emerald-500/5 border-emerald-500/30'
                      : 'bg-neutral-900/50 border-neutral-800/80 opacity-65'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            isActive
                              ? 'bg-sky-500 text-neutral-950'
                              : isCompleted
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : 'bg-neutral-800 text-neutral-500'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-[10px] font-mono text-neutral-400">
                            مرحله {idx + 1} از ۶
                          </div>
                          <div
                            className={`text-xs font-bold leading-tight ${
                              isActive
                                ? 'text-sky-300'
                                : isCompleted
                                ? 'text-emerald-300'
                                : 'text-neutral-300'
                            }`}
                          >
                            {stage.titleFa}
                          </div>
                        </div>
                      </div>

                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : isActive ? (
                        <span className="text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded border border-sky-400/40">
                          {activeOrder.stageProgressPercent}%
                        </span>
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                      )}
                    </div>

                    <div className="text-[10px] text-amber-300/90 font-medium mb-1">
                      {stage.stationFa}
                    </div>
                    <p className="text-[10px] text-neutral-400 leading-relaxed line-clamp-2">
                      {stage.descriptionFa}
                    </p>
                  </div>

                  {/* Stage Telemetry & Sub-progress */}
                  <div className="mt-2.5 pt-2 border-t border-neutral-800/80 space-y-1.5">
                    {isActive && (
                      <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${activeOrder.stageProgressPercent}%` }}
                          className="h-full bg-sky-400 transition-all duration-500"
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-neutral-400 font-mono">{stage.telemetryTagFa}</span>
                      <span
                        className={`font-bold ${
                          isActive
                            ? 'text-sky-300'
                            : isCompleted
                            ? 'text-emerald-400'
                            : 'text-neutral-500'
                        }`}
                      >
                        {stage.timestampFa}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tracked Order Technical Specifications Strip */}
          <div className="bg-neutral-900/70 border border-neutral-800 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <div className="flex flex-wrap items-center gap-3 text-neutral-300">
              <span>
                سیستم: <strong className="text-amber-300">{SYSTEM_SPECS[activeOrder.config.systemType].nameFa}</strong>
              </span>
              <span className="text-neutral-600">|</span>
              <span>
                ابعاد:{' '}
                <strong className="font-mono text-white">
                  {activeOrder.config.widthCm}×{activeOrder.config.heightCm} cm
                </strong>{' '}
                ({activeOrder.config.panelCount} پنل)
              </span>
              <span className="text-neutral-600">|</span>
              <span>
                شیشه:{' '}
                <strong className="text-sky-300">
                  {activeOrder.config.glassThickness}mm {GLASS_TINTS[activeOrder.config.glassTint].nameFa}
                </strong>
              </span>
              <span className="text-neutral-600">|</span>
              <span>
                پروفیل:{' '}
                <strong className="text-neutral-100">
                  {HARDWARE_COLORS[activeOrder.config.hardwareColor].nameFa}
                </strong>
              </span>
              <span className="text-neutral-600">|</span>
              <span>
                فرم:{' '}
                <strong className="text-neutral-200">
                  {BALCONY_LAYOUTS[activeOrder.config.balconyLayout].nameFa}
                </strong>
              </span>
            </div>

            <div className="font-mono font-bold text-emerald-400">
              ارزش قرارداد: {activeOrder.totalPriceToman.toLocaleString('fa-IR')} تومان
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
