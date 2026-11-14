import { ConfiguratorState, BALCONY_LAYOUTS, LIGHTING_CONDITIONS } from '../types/configurator';

interface DimensionsOverlayProps {
  state: ConfiguratorState;
}

export const DimensionsOverlay: React.FC<DimensionsOverlayProps> = ({ state }) => {
  if (!state.showDimensions) return null;

  const widthM = (state.widthCm / 100).toFixed(2);
  const sideWidthM = (state.sideWingWidthCm / 100).toFixed(2);
  const heightM = (state.heightCm / 100).toFixed(2);

  const mainAreaSqm = (state.widthCm * state.heightCm) / 10000;
  const sideMultiplier = state.balconyLayout === 'l_shape' ? 1 : state.balconyLayout === 'u_shape' ? 2 : 0;
  const sideAreaSqm = sideMultiplier * ((state.sideWingWidthCm * state.heightCm) / 10000);
  const totalAreaSqm = (mainAreaSqm + sideAreaSqm).toFixed(2);

  const panelWidthCm = Math.round(state.widthCm / state.panelCount);
  const sidePanelWidthCm = Math.round(state.sideWingWidthCm / state.sideWingPanels);

  return (
    <div className="absolute top-20 right-4 sm:right-6 pointer-events-none select-none z-10 flex flex-col gap-2">
      <div className="bg-neutral-900/90 border border-neutral-700/70 rounded-xl p-3 shadow-2xl backdrop-blur-none text-xs text-neutral-200 min-w-[220px]">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800">
          <span className="font-bold text-amber-400">مشخصات فنی و ابعاد</span>
          <span className="text-[10px] bg-sky-500/15 text-sky-300 border border-sky-500/30 px-1.5 py-0.5 rounded font-mono">
            {BALCONY_LAYOUTS[state.balconyLayout].nameFa}
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-neutral-400">عرض ضلع جلو (Main):</span>
            <span className="font-mono font-semibold text-neutral-100">{state.widthCm} cm ({widthM} m)</span>
          </div>

          {sideMultiplier > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">عرض ضلع کناری (Side):</span>
              <span className="font-mono font-semibold text-sky-300">{state.sideWingWidthCm} cm ({sideWidthM} m)</span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-neutral-400">ارتفاع بازشو (Height):</span>
            <span className="font-mono font-semibold text-neutral-100">{state.heightCm} cm ({heightM} m)</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-neutral-400">تعداد کل لنگه‌ها:</span>
            <span className="font-semibold text-neutral-100">
              {state.panelCount + state.sideWingPanels * sideMultiplier} پنل
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-neutral-400">عرض هر لنگه جلو:</span>
            <span className="font-mono text-amber-300 font-semibold">{panelWidthCm} cm</span>
          </div>

          {sideMultiplier > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">عرض هر لنگه بغل:</span>
              <span className="font-mono text-sky-300 font-semibold">{sidePanelWidthCm} cm</span>
            </div>
          )}

          <div className="flex justify-between items-center pt-1.5 border-t border-neutral-800/80">
            <span className="text-neutral-400">مساحت کل پروژه:</span>
            <span className="font-mono font-bold text-emerald-400">{totalAreaSqm} m²</span>
          </div>

          <div className="flex justify-between items-center pt-1 border-t border-neutral-800/60 text-[11px]">
            <span className="text-neutral-400">شرایط نوری:</span>
            <span className="font-semibold text-amber-300">
              {LIGHTING_CONDITIONS[state.lightingCondition].nameFa.split(' ')[0]} ({LIGHTING_CONDITIONS[state.lightingCondition].sunElevation})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
