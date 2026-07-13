import React, { useState, useEffect } from 'react';
import { GamePanelFrame } from './GamePanelFrame';
import { MapPin, Compass, Sparkles, Navigation } from 'lucide-react';

interface GpsTreasureProps {
  onClose: () => void;
  onUpdateCoins: (amount: number) => void;
  onShowToast: (message: string, type: 'success' | 'info' | 'error') => void;
  onAddLog: (message: string) => void;
  id?: string;
}

export const GpsTreasurePanel: React.FC<GpsTreasureProps> = ({
  onClose, onUpdateCoins, onShowToast, onAddLog, id,
}) => {
  const [distance, setDistance] = useState(150);
  const [phase, setPhase] = useState<'radar' | 'arrived' | 'quiz' | 'reward'>('radar');
  const [isWalking, setIsWalking] = useState(false);
  const [radarAngle, setRadarAngle] = useState(0);

  // Radar sweep animation
  useEffect(() => {
    const anim = setInterval(() => setRadarAngle(a => (a + 3) % 360), 30);
    return () => clearInterval(anim);
  }, []);

  // Simula la caminata si se mantiene presionado el botón
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isWalking && distance > 0 && phase === 'radar') {
      interval = setInterval(() => {
        setDistance(d => {
          if (d <= 5) {
            setPhase('arrived');
            onShowToast('¡Has llegado a la Fisura de Conocimiento!', 'success');
            return 0;
          }
          return d - 5;
        });
      }, 300);
    }
    return () => clearInterval(interval);
  }, [isWalking, distance, phase]);

  const handleAnswer = (correct: boolean) => {
    if (correct) {
      setPhase('reward');
      onUpdateCoins(300);
      onShowToast('¡Fisura Sellada! Botín asegurado.', 'success');
      onAddLog('REAL WORLD: El jugador selló una fisura en el mapa obteniendo 300 monedas.');
    } else {
      onShowToast('La fisura se desestabilizó. Intenta con otra más tarde.', 'error');
      onAddLog('REAL WORLD: Falla en sellar la fisura.');
      onClose();
    }
  };

  return (
    <GamePanelFrame title="CACERÍA GPS" titleType="green" onClose={onClose} widthClass="w-[400px]" heightClass="min-h-[500px]" id={id}>
      <div className="flex-1 flex flex-col bg-slate-900 rounded-xl overflow-hidden border border-emerald-800/50 p-4 gap-4">

        {/* Encabezado GPS */}
        <div className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800">
          <div className="flex items-center gap-2 text-emerald-500">
            <Navigation size={18} className="animate-pulse" />
            <span className="text-[10px] font-black tracking-widest uppercase">Sincronización de Satélite</span>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400">LAT 34.05 / LON -118.24</span>
        </div>

        {/* RADAR PHASE */}
        {phase === 'radar' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            {/* Radar SVG */}
            <div className="relative w-48 h-48 rounded-full border-2 border-emerald-900/50 bg-emerald-950/20 flex items-center justify-center overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.15)]">
              <div className="absolute inset-0 rounded-full border border-emerald-500/20" />
              <div className="absolute w-2/3 h-2/3 rounded-full border border-emerald-500/10" />
              <div className="absolute w-1/3 h-1/3 rounded-full border border-emerald-500/10" />
              {/* Sweep */}
              <div
                className="absolute w-[50%] h-[2px] bg-gradient-to-r from-emerald-500/60 to-transparent origin-left top-1/2"
                style={{ transform: `rotate(${radarAngle}deg)`, transformOrigin: 'left center', left: '50%' }}
              />
              <MapPin size={20} className="text-emerald-400 z-10" />
              {/* Blip de destino */}
              <div
                className="absolute w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.9)] z-10 transition-all duration-300"
                style={{
                  bottom: `${48 + (distance / 150) * 38}%`,
                  right:  `${48 + (distance / 150) * 28}%`,
                }}
              />
            </div>

            <div className="text-center">
              <h3 className="text-3xl font-black text-white font-mono">{distance}m</h3>
              <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold mt-1">Fisura Detectada</p>
            </div>

            <button
              onMouseDown={() => setIsWalking(true)}
              onMouseUp={() => setIsWalking(false)}
              onMouseLeave={() => setIsWalking(false)}
              onTouchStart={() => setIsWalking(true)}
              onTouchEnd={() => setIsWalking(false)}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black rounded-xl shadow-lg uppercase tracking-widest text-xs transition-colors select-none"
            >
              {isWalking ? '📡 Caminando...' : 'Mantén presionado para caminar'}
            </button>
          </div>
        )}

        {/* ARRIVED PHASE */}
        {phase === 'arrived' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
            <Compass size={64} className="text-emerald-400 animate-bounce" />
            <h2 className="text-xl font-black text-white uppercase tracking-widest">Destino Alcanzado</h2>
            <p className="text-xs text-slate-400 max-w-[250px]">
              Has encontrado la grieta en el mapa. Resuelve el acertijo guardián para cerrarla y obtener el botín.
            </p>
            <button onClick={() => setPhase('quiz')} className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-black rounded-xl transition-all hover:opacity-90">
              EXAMINAR FISURA
            </button>
          </div>
        )}

        {/* QUIZ PHASE */}
        {phase === 'quiz' && (
          <div className="flex-1 flex flex-col justify-center">
            <div className="bg-slate-950 p-5 rounded-2xl border border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-2 block">Acertijo del Guardián Geográfico</span>
              <p className="text-sm font-bold text-white mb-6">
                "¿Cuál es el término botánico para las plantas que viven y florecen durante múltiples años?"
              </p>
              <div className="space-y-3">
                <button onClick={() => handleAnswer(false)} className="w-full p-3 bg-slate-800 hover:bg-slate-700 text-left rounded-lg text-xs font-bold text-slate-200 transition-colors">A) Anuales</button>
                <button onClick={() => handleAnswer(true)}  className="w-full p-3 bg-slate-800 hover:bg-emerald-600 text-left rounded-lg text-xs font-bold text-slate-200 transition-colors">B) Perennes</button>
                <button onClick={() => handleAnswer(false)} className="w-full p-3 bg-slate-800 hover:bg-slate-700 text-left rounded-lg text-xs font-bold text-slate-200 transition-colors">C) Bianuales</button>
              </div>
            </div>
          </div>
        )}

        {/* REWARD PHASE */}
        {phase === 'reward' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
            <Sparkles size={64} className="text-yellow-400 animate-pulse" />
            <h2 className="text-xl font-black text-yellow-500 uppercase tracking-widest">¡Misión de Campo Completada!</h2>
            <p className="text-sm text-slate-300 font-bold">Obtuviste 300 Monedas Reales.</p>
            <button onClick={onClose} className="w-full py-3 bg-slate-800 text-white font-black rounded-xl hover:bg-slate-700 transition-colors">
              VOLVER AL MAPA GLOBAL
            </button>
          </div>
        )}
      </div>
    </GamePanelFrame>
  );
};
