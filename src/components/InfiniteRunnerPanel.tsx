import React, { useState, useEffect, useRef } from 'react';
import { GamePanelFrame } from './GamePanelFrame';
import { Zap, Heart, ArrowLeft, ArrowRight } from 'lucide-react';

interface InfiniteRunnerProps {
  onClose: () => void;
  onUpdateCoins: (amount: number) => void;
  onShowToast: (message: string, type: 'success' | 'info' | 'error') => void;
  onAddLog: (message: string) => void;
  id?: string;
}

const QUESTIONS = [
  { q: "¿Cuál es el valor de 'x' en 3x = 15?", options: ["3", "5", "12"], correct: 1 },
  { q: "Traduce: 'Manzana'", options: ["Apple", "Orange", "Grape"], correct: 0 },
  { q: "¿Qué etiqueta HTML crea un enlace?", options: ["<link>", "<a>", "<href>"], correct: 1 },
];

type Obstacle = { id: number; lane: number; text: string; isCorrect: boolean; y: number };

export const InfiniteRunnerPanel: React.FC<InfiniteRunnerProps> = ({
  onClose, onUpdateCoins, onShowToast, onAddLog, id,
}) => {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [hp, setHp] = useState(3);
  const [score, setScore] = useState(0);
  const [playerLane, setPlayerLane] = useState(1);
  const [currentQ, setCurrentQ] = useState(QUESTIONS[0]);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const nextObsId = useRef(0);
  const speed = 2.5;

  const spawnNewQuestion = () => {
    const q = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
    setCurrentQ(q);
    const shuffledLanes = [0, 1, 2].sort(() => Math.random() - 0.5);
    const newObs: Obstacle[] = q.options.map((opt, idx) => ({
      id: nextObsId.current++,
      lane: shuffledLanes[idx],
      text: opt,
      isCorrect: idx === q.correct,
      y: -20,
    }));
    setObstacles(newObs);
  };

  useEffect(() => {
    if (gameState !== 'playing') return;
    const engine = setInterval(() => {
      setObstacles(prev => {
        let hitResult: 'correct' | 'wrong' | null = null;
        const newObs = prev
          .map(obs => ({ ...obs, y: obs.y + speed }))
          .filter(obs => {
            if (obs.y > 80 && obs.y < 92 && obs.lane === playerLane) {
              hitResult = obs.isCorrect ? 'correct' : 'wrong';
              return false;
            }
            return obs.y <= 105;
          });

        if (hitResult === 'correct') {
          setScore(s => s + 50);
          onShowToast('+50 Puntos', 'success');
          setTimeout(spawnNewQuestion, 200);
        } else if (hitResult === 'wrong') {
          setHp(h => {
            const next = h - 1;
            if (next <= 0) setGameState('gameover');
            return next;
          });
          onShowToast('¡Impacto incorrecto! -1 Vida', 'error');
          setTimeout(spawnNewQuestion, 200);
        }
        return newObs;
      });
    }, 50);
    return () => clearInterval(engine);
  }, [gameState, playerLane]);

  const startGame = () => {
    setHp(3);
    setScore(0);
    setPlayerLane(1);
    setObstacles([]);
    setGameState('playing');
    setTimeout(spawnNewQuestion, 100);
    onAddLog('ARCADE: Carrera Infinita iniciada.');
  };

  const movePlayer = (dir: 'left' | 'right') => {
    if (dir === 'left') setPlayerLane(p => Math.max(0, p - 1));
    else setPlayerLane(p => Math.min(2, p + 1));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') movePlayer('left');
      if (e.key === 'ArrowRight') movePlayer('right');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <GamePanelFrame title="CARRERA INFINITA" titleType="blue" onClose={onClose} widthClass="w-[450px]" heightClass="min-h-[600px]" id={id}>
      <div className="flex-1 flex flex-col bg-slate-950 rounded-xl overflow-hidden relative border-2 border-slate-800">

        {/* START SCREEN */}
        {gameState === 'start' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-slate-900/90">
            <Zap size={64} className="text-yellow-400 mb-4 animate-pulse" />
            <h2 className="text-xl font-black text-white uppercase tracking-widest">Atrapa-Meteoros</h2>
            <p className="text-xs text-slate-400 mt-2 mb-8">
              Usa las flechas (o botones) para moverte al carril con la respuesta correcta a la pregunta en pantalla.
            </p>
            <button onClick={startGame} className="px-8 py-3 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-black rounded-xl w-full transition-colors">
              EMPEZAR CARRERA
            </button>
          </div>
        )}

        {/* PLAYING */}
        {gameState === 'playing' && (
          <div className="flex-1 flex flex-col relative bg-slate-950">
            {/* HUD */}
            <div className="absolute top-0 w-full p-4 flex justify-between z-10 bg-gradient-to-b from-slate-950 to-transparent">
              <div className="flex gap-1 text-red-500">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Heart key={i} size={18} className={i < hp ? 'fill-red-500 text-red-500' : 'text-slate-700'} />
                ))}
              </div>
              <div className="text-yellow-400 font-black font-mono bg-black/50 px-3 py-1 rounded">
                SCORE: {score}
              </div>
            </div>

            {/* Pregunta activa */}
            <div className="absolute top-14 w-full text-center z-10 px-4">
              <div className="bg-blue-900/80 border border-blue-500 text-white font-bold p-3 rounded-xl shadow-lg backdrop-blur-sm text-sm">
                {currentQ.q}
              </div>
            </div>

            {/* Carriles */}
            <div className="flex-1 flex w-full border-x-4 border-slate-800 divide-x-2 divide-slate-800/50 mt-28">
              <div className="flex-1" /><div className="flex-1" /><div className="flex-1" />
            </div>

            {/* Obstáculos */}
            {obstacles.map(obs => (
              <div
                key={obs.id}
                className="absolute w-1/3 flex justify-center"
                style={{ left: `${obs.lane * 33.33}%`, top: `${obs.y}%` }}
              >
                <div className="bg-slate-800 border-2 border-slate-600 p-2 rounded-lg text-center w-4/5 shadow-xl">
                  <span className="text-[10px] font-black text-white block">{obs.text}</span>
                </div>
              </div>
            ))}

            {/* Jugador */}
            <div
              className="absolute w-1/3 bottom-[12%] flex justify-center transition-all duration-150"
              style={{ left: `${playerLane * 33.33}%` }}
            >
              <div className="text-5xl filter drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]">🚀</div>
            </div>

            {/* Controles táctiles */}
            <div className="absolute bottom-4 w-full flex justify-between px-6">
              <button onClick={() => movePlayer('left')} className="w-16 h-16 bg-white/10 hover:bg-white/20 backdrop-blur border border-white/30 rounded-full flex items-center justify-center text-white active:scale-90 transition-all">
                <ArrowLeft size={32} />
              </button>
              <button onClick={() => movePlayer('right')} className="w-16 h-16 bg-white/10 hover:bg-white/20 backdrop-blur border border-white/30 rounded-full flex items-center justify-center text-white active:scale-90 transition-all">
                <ArrowRight size={32} />
              </button>
            </div>
          </div>
        )}

        {/* GAME OVER */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-red-950/95">
            <h2 className="text-3xl font-black text-white mb-2">NAVE DESTRUIDA</h2>
            <p className="text-yellow-400 font-bold mb-8">Puntuación Final: {score}</p>
            <div className="flex gap-3 w-full">
              <button onClick={startGame} className="flex-1 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors">
                REINTENTAR
              </button>
              <button onClick={() => {
                const earned = Math.floor(score / 2);
                onUpdateCoins(earned);
                onShowToast(`Reclamaste ${earned} monedas`, 'success');
                onClose();
              }} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-500 transition-colors">
                COBRAR Y SALIR
              </button>
            </div>
          </div>
        )}
      </div>
    </GamePanelFrame>
  );
};
