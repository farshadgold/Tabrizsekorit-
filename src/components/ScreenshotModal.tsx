import React from 'react';
import { Download, X, Check, Image as ImageIcon } from 'lucide-react';
import { ConfiguratorState, SYSTEM_SPECS, HARDWARE_COLORS, GLASS_TINTS, LIGHTING_CONDITIONS } from '../types/configurator';

interface ScreenshotModalProps {
  imageUrl: string;
  state: ConfiguratorState;
  onClose: () => void;
}

export const ScreenshotModal: React.FC<ScreenshotModalProps> = ({
  imageUrl,
  state,
  onClose,
}) => {
  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `Tabriz-Securit-${state.systemType}-${state.panelCount}panels.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm text-neutral-100">
              تصویر سه‌بعدی شبیه‌سازی تبریز سکوریت
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Preview */}
        <div className="p-4 bg-neutral-950 flex flex-col items-center justify-center">
          <div className="relative rounded-xl overflow-hidden border border-neutral-800 max-h-[50vh]">
            <img
              src={imageUrl}
              alt="Tabriz Securit 3D Configurator Render"
              className="w-full h-auto object-contain"
            />
            <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-[10px] text-amber-300 font-mono">
              {SYSTEM_SPECS[state.systemType].nameFa} | {state.panelCount} پنل | {HARDWARE_COLORS[state.hardwareColor].nameFa} | {LIGHTING_CONDITIONS[state.lightingCondition].nameFa.split(' ')[0]}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-900 flex items-center justify-between">
          <div className="text-xs text-neutral-400">
            رزولوشن کیفیت اصلی بدون افت کیفیت (PNG)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-colors cursor-pointer"
            >
              انصراف
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl shadow-lg shadow-amber-500/20 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>دانلود فایل تصویر</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
