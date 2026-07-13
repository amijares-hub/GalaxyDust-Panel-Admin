import React from 'react';
import { X } from 'lucide-react';

type TitleType = 'blue' | 'green' | 'red' | 'yellow';

interface GamePanelFrameProps {
  title: string;
  titleType?: TitleType;
  onClose: () => void;
  widthClass?: string;
  heightClass?: string;
  children: React.ReactNode;
  id?: string;
}

const titleColors: Record<TitleType, string> = {
  blue:   'text-blue-400 border-blue-500/30',
  green:  'text-emerald-400 border-emerald-500/30',
  red:    'text-red-400 border-red-500/30',
  yellow: 'text-yellow-400 border-yellow-500/30',
};

export const GamePanelFrame: React.FC<GamePanelFrameProps> = ({
  title,
  titleType = 'blue',
  onClose,
  widthClass = 'w-[420px]',
  heightClass = 'min-h-[500px]',
  children,
  id,
}) => {
  const colorCls = titleColors[titleType];

  return (
    <div
      id={id}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <div
        className={`relative flex flex-col ${widthClass} ${heightClass} max-h-[90vh] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-3 border-b ${colorCls} shrink-0`}>
          <span className={`text-[11px] font-black tracking-widest uppercase font-mono ${colorCls.split(' ')[0]}`}>
            {title}
          </span>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
            aria-label="Cerrar panel"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden p-4">
          {children}
        </div>
      </div>
    </div>
  );
};
