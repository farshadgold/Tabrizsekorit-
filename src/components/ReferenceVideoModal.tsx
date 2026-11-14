import React from 'react';
import { X, Play, Film, Sparkles, CheckCircle2 } from 'lucide-react';

interface ReferenceVideoModalProps {
  onClose: () => void;
}

export const ReferenceVideoModal: React.FC<ReferenceVideoModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-xs sm:text-sm text-neutral-100">
              ویدیوی مرجع شبیه‌سازی سیستم شیشه بالکن (CamBalkon-3D)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player */}
        <div className="p-4 bg-neutral-950 flex flex-col items-center justify-center">
          <div className="relative w-full rounded-xl overflow-hidden border border-neutral-800 bg-black flex items-center justify-center max-h-[58vh]">
            <video
              src="/assets/aistudio/CamBalkon-3D_0ec9e7b1.mp4"
              controls
              autoPlay
              loop
              playsInline
              className="max-h-[55vh] w-auto object-contain mx-auto"
            />
          </div>
          <div className="mt-3 text-xs text-neutral-300 w-full space-y-1.5">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ویژگی‌های پیاده‌سازی شده در کانفیگوراتور بر اساس این ویدیو:</span>
            </div>
            <ul className="text-[11px] text-neutral-400 space-y-1 list-disc list-inside pr-1">
              <li>طرح دوضلعی نبش‌دار L شکل با اتصال ستون ۹۰ درجه گوشه</li>
              <li>حرکت مرحله‌ای (Staged) لغزش پنل‌ها و چرخش ۹۰ درجه روی دیوار</li>
              <li>خطوط محور و آکس مهندسی دقیق کف شبیه‌ساز</li>
              <li>رنگ فیروزه‌ای کریستال اختصاصی شیشه‌ها با انعکاس نور واقعی</li>
              <li>امکان بازشوی دوطرفه از وسط (Split Opening) یا جمع‌شدن به کناره‌ها</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-neutral-800 bg-neutral-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl transition-colors cursor-pointer"
          >
            بستن و بازگشت به شبیه‌ساز سه‌بعدی
          </button>
        </div>
      </div>
    </div>
  );
};
