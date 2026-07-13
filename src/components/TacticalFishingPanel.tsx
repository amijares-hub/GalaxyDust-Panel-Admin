import React, { useState, useEffect } from 'react';
import { GamePanelFrame } from './GamePanelFrame';
import { Fish, Waves, CheckCircle2, XCircle } from 'lucide-react';

interface TacticalFishingProps {
  onClose: () => void;
  onUpdateCoins: (amount: number) => void;
  onShowToast: (message: string, type: 'success' | 'info' | 'error') => void;
  id?: string;
}

const FLASHCARD = {
  front: '¿Qué significan las siglas API?',
  back: 'Application Programming Interface',
};

export const TacticalFishingPanel: React.FC<TacticalFishingProps> = ({
  onClose, onUpdateCoins, onShowToast, id,
}) => {
  const [phase, setPhase] = useState<'flashcard' | 'fishing' | 'result'>('flashcard');
  const [isFlipped, setIsFlipped] = useState(false);
  const [catchBarSize, setCatchBarSize] = useState(20);

  const [fishPos, setFishPos] = useState(50);
  const [barPos, setBarPos] = useState(50);
  const [captureProgress, setCaptureProgress] = useState(30);

  const handleFlashcardAnswer = (knewIt: boolean) => {
    if (knewIt) {
      setCatchBarSize(45);
      onShowToast('¡Excelente memoria! Tu barra de captura ha aumentado de tamaño.', 'success');
    } else {
      setCatchBarSize(15);
      onShowToast('Debes repasar más. La barra de captura será pequeña.', 'info');
    }
    setTimeout(() => setPhase('fishing'), 1500);
  };

  // Motor de física estilo Stardew
  useEffect(() => {
    if (phase !== 'fishing') return;

    const fishMovement = setInterval(() => {
      setFishPos(prev => {
        const move = (Math.random() - 0.5) * 20;
        return Math.min(90, Math.max(10, prev + move));
      });
    }, 600);

    const gameLoop = setInterval(() => {
      setFishPos(currentFish => {
        setCaptureProgress(prev => {
          const isInside = Math.abs(currentFish - barPos) <= catchBarSize / 2;
          const next = isInside ? prev + 2 : prev - 1.5;
          if (next >= 100) {
            setPhase('result');
            onUpdateCoins(200);
            onShowToast('¡Pez legendario capturado! +200 Monedas', 'success');
            return 100;
          } else if (next <= 0) {
            setPhase('result');
            onShowToast('El pez escapó con tu cebo...', 'error');
            return 0;
          }
          return Math.max(0, Math.min(100, next));
        });
        return currentFish;
      });
    }, 100);

    return () => { clearInterval(fishMovement); clearInterval(gameLoop); };
  }, [phase, barPos, catchBarSize]);

  const handleMoveBar = (dir: 'up' | 'down') => {
    setBarPos(prev => {
      if (dir === 'up') return Math.max(10, prev - 15);
      return Math.min(90, prev + 15);
    });
  };

  return (
    <GamePanelFrame title="PESCA TÁCTICA" titleType="blue" onClose={onClose} widthClass="w-[450px]" heightClass="min-h-[500px]" id={id}>
      <div className="flex-1 flex flex-col bg-slate-900 rounded-xl overflow-hidden border border-blue-800 p-4">

        {/* FLASHCARD PHASE */}
        {phase === 'flashcard' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <h3 className="text-xs font-black text-blue-400 tracking-widest uppercase">Preparando el Cebo (Flashcard)</h3>

            {/* Tarjeta 3D con CSS puro */}
            <div
              className="w-full max-w-[300px] h-[200px] cursor-pointer"
              style={{ perspective: '1000px' }}
              onClick={() => !isFlipped && setIsFlipped(true)}
            >
              <div
                className="relative w-full h-full transition-all duration-500"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
              >
                {/* Frente */}
                <div
                  className="absolute inset-0 bg-slate-800 border-2 border-slate-600 rounded-xl flex flex-col items-center justify-center p-6 text-center shadow-lg"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <p className="text-white font-bold text-sm">{FLASHCARD.front}</p>
                  {!isFlipped && (
                    <span className="absolute bottom-4 text-[9px] text-slate-500 font-bold uppercase animate-pulse">
                      Toca para revelar
                    </span>
                  )}
                </div>
                {/* Reverso */}
                <div
                  className="absolute inset-0 bg-blue-900 border-2 border-blue-500 rounded-xl flex flex-col items-center justify-center p-6 text-center shadow-lg"
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  <span className="text-[9px] text-blue-300 uppercase tracking-widest mb-2 font-black">Respuesta:</span>
                  <p className="text-white font-bold text-lg">{FLASHCARD.back}</p>
                </div>
              </div>
            </div>

            {isFlipped && (
              <div className="flex gap-4 w-full max-w-[300px]">
                <button
                  onClick={() => handleFlashcardAnswer(false)}
                  className="flex-1 py-3 bg-red-900/50 border border-red-500 text-red-100 rounded-lg text-xs font-bold flex flex-col items-center gap-1 hover:bg-red-900/70 transition-colors"
                >
                  <XCircle size={18} /> No lo recordaba
                </button>
                <button
                  onClick={() => handleFlashcardAnswer(true)}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex flex-col items-center gap-1 transition-colors"
                >
                  <CheckCircle2 size={18} /> Lo sabía perfecto
                </button>
              </div>
            )}
          </div>
        )}

        {/* FISHING PHASE */}
        {phase === 'fishing' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <div className="text-center">
              <span className="text-[10px] font-black text-blue-400 tracking-widest uppercase">
                Mantén al pez en el área verde
              </span>
            </div>

            <div className="flex gap-6 h-[300px] items-end justify-center w-full">
              {/* Barra de progreso de captura */}
              <div className="w-6 h-full bg-slate-950 rounded-full border border-slate-700 flex flex-col justify-end p-1">
                <div
                  className="w-full bg-gradient-to-t from-emerald-500 to-teal-400 rounded-full transition-all duration-150"
                  style={{ height: `${captureProgress}%` }}
                />
              </div>

              {/* Canal de pesca */}
              <div className="w-16 h-full bg-blue-950/40 border-2 border-blue-900 rounded-xl relative overflow-hidden">
                {/* Zona del jugador */}
                <div
                  className="absolute w-full bg-emerald-500/40 border-y-2 border-emerald-400 transition-all duration-150"
                  style={{ top: `${barPos - catchBarSize / 2}%`, height: `${catchBarSize}%` }}
                />
                {/* El Pez */}
                <div
                  className="absolute w-full flex justify-center transition-all duration-300"
                  style={{ top: `${fishPos}%`, transform: 'translateY(-50%)' }}
                >
                  <Fish size={24} className="text-blue-200" />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => handleMoveBar('up')}   className="px-8 py-3 bg-blue-800 hover:bg-blue-700 text-white rounded-xl font-black text-xs active:scale-95 transition-all shadow-lg">▲ SUBIR CEBO</button>
              <button onClick={() => handleMoveBar('down')} className="px-8 py-3 bg-blue-800 hover:bg-blue-700 text-white rounded-xl font-black text-xs active:scale-95 transition-all shadow-lg">▼ BAJAR CEBO</button>
            </div>
          </div>
        )}

        {/* RESULT PHASE */}
        {phase === 'result' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
            {captureProgress >= 100 ? (
              <>
                <div className="w-24 h-24 bg-blue-900 border-4 border-blue-400 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                  <Fish size={48} className="text-blue-100 animate-bounce" />
                </div>
                <h2 className="text-xl font-black text-blue-400 uppercase tracking-widest">¡Captura Perfecta!</h2>
                <p className="text-sm text-slate-300 font-bold">La teoría aplicada te dio la victoria física.</p>
              </>
            ) : (
              <>
                <Waves size={64} className="text-slate-600" />
                <h2 className="text-xl font-black text-red-500 uppercase tracking-widest">Se escapó...</h2>
                <p className="text-sm text-slate-400 font-bold mt-1">
                  Intenta mejorar tu memoria en las Flashcards para tener barras más grandes.
                </p>
              </>
            )}
            <button onClick={onClose} className="mt-4 px-8 py-3 bg-slate-800 text-white font-black text-xs rounded-xl uppercase tracking-widest hover:bg-slate-700 transition-colors">
              Continuar Aventura
            </button>
          </div>
        )}
      </div>
    </GamePanelFrame>
  );
};
