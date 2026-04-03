import { motion } from 'framer-motion';
import { Trophy, Zap, Eye, Film, Lock, Gauge, CalendarDays } from 'lucide-react';
import { useMemo, useState } from 'react';
import { getLevelConfig } from '@/lib/gameEngine';
import type { ChallengeMode } from '@/lib/types';

interface LobbyProps {
  onStartGame: (modes: ChallengeMode[]) => void;
  totalScore: number;
  dailyBestScore: number;
  highestUnlockedLevel: number;
}

const featureCards = [
  { icon: Eye, label: 'Pixel Rush', desc: 'Blurred race moments and trackside clues', modes: ['pixelated'] as ChallengeMode[] },
  { icon: Zap, label: 'Zoom Break', desc: 'Micro details from helmets, cars, and garages', modes: ['zoomed'] as ChallengeMode[] },
  { icon: Film, label: 'Clip Hunt', desc: 'Short live Reddit videos that refresh often', modes: ['video', 'clip'] as ChallengeMode[] },
];

const ALL_MODES: ChallengeMode[] = ['pixelated', 'zoomed', 'video', 'clip'];

export function Lobby({ onStartGame, totalScore, dailyBestScore, highestUnlockedLevel }: LobbyProps) {
  const unlockedConfig = getLevelConfig(highestUnlockedLevel);
  const hasProgress = highestUnlockedLevel > 1 || dailyBestScore > 0;
  const [selectedModes, setSelectedModes] = useState<ChallengeMode[]>(ALL_MODES);
  const allModesSelected = selectedModes.length === ALL_MODES.length;

  const selectionLabel = useMemo(() => {
    if (allModesSelected) return 'All Modes';
    return featureCards
      .filter((card) => card.modes.every((mode) => selectedModes.includes(mode)))
      .map((card) => card.label)
      .join(' · ');
  }, [allModesSelected, selectedModes]);

  const toggleModeGroup = (modes: ChallengeMode[]) => {
    setSelectedModes((current) => {
      const groupSelected = modes.every((mode) => current.includes(mode));
      if (groupSelected) {
        const next = current.filter((mode) => !modes.includes(mode));
        return next.length > 0 ? next : current;
      }

      return Array.from(new Set([...current, ...modes]));
    });
  };

  return (
    <div className="min-h-screen overflow-y-auto bg-black text-white">
      <div className="relative isolate">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_top,rgba(255,72,0,0.26),transparent_52%)]" />
        <div className="pointer-events-none absolute left-1/2 top-24 h-80 w-80 -translate-x-1/2 rounded-full bg-red-600/10 blur-3xl" />

        <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-8 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="race-panel race-grid relative overflow-hidden rounded-[2rem] border border-white/10 p-6 sm:p-8 lg:p-10"
          >
            <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 bg-[linear-gradient(135deg,transparent,rgba(255,255,255,0.05),transparent)] lg:block" />

            <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.35em] text-red-300">
                  <Zap className="h-3.5 w-3.5" />
                  Live Grid Locked
                </div>

                <motion.h1
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 }}
                  className="race-title mt-6 max-w-3xl text-5xl font-black leading-none sm:text-6xl lg:text-7xl"
                >
                  <span className="block text-white">F1</span>
                  <span className="block bg-gradient-to-r from-red-500 via-orange-400 to-yellow-300 bg-clip-text text-transparent">
                    GUESSR
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.14 }}
                  className="mt-5 max-w-2xl text-base leading-7 text-gray-300 sm:text-lg"
                >
                  Chase fresh Formula 1 moments pulled from live Reddit feeds. Pick your challenge mix, lock into a run,
                  and work your way up the grid one earned level at a time.
                </motion.p>

                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  {featureCards.map(({ icon: Icon, label, desc, modes }, index) => {
                    const active = modes.every((mode) => selectedModes.includes(mode));

                    return (
                      <motion.button
                        key={label}
                        type="button"
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.18 + index * 0.08 }}
                        onClick={() => toggleModeGroup(modes)}
                        className={`rounded-2xl border p-4 text-left backdrop-blur-sm transition-all duration-200 ${
                          active
                            ? 'border-red-400/60 bg-red-500/12 shadow-[0_12px_32px_rgba(225,6,0,0.16)]'
                            : 'border-white/8 bg-white/[0.03] hover:border-white/20'
                        }`}
                      >
                        <div className="mb-3 inline-flex rounded-xl border border-red-500/20 bg-red-500/10 p-2 text-red-300">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="text-sm font-bold text-white">{label}</div>
                        <div className="mt-1 text-sm text-gray-400">{desc}</div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.16 }}
                className="race-glow rounded-[1.75rem] border border-white/10 bg-[#0d0d0d]/95 p-5 sm:p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.32em] text-red-400">Driver Briefing</div>
                    <div className="mt-2 text-2xl font-black text-white">
                      {hasProgress ? `Resume from Level ${highestUnlockedLevel}` : 'Start your first stint'}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-right">
                    <div className="text-[10px] uppercase tracking-[0.28em] text-gray-500">Tier</div>
                    <div className="mt-1 text-sm font-bold text-yellow-300">{unlockedConfig.name}</div>
                  </div>
                </div>

                <div className="mt-6 grid gap-3">
                  <StatRow icon={CalendarDays} label="Daily Best" value={dailyBestScore.toLocaleString()} accent="text-yellow-300" />
                  <StatRow icon={Gauge} label="Unlocked Level" value={`Level ${highestUnlockedLevel}`} accent="text-white" />
                  <StatRow icon={Lock} label="Challenge Mix" value={selectionLabel} accent="text-red-300" />
                </div>

                {totalScore > 0 && (
                  <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                      <Trophy className="h-4 w-4 text-yellow-300" />
                      Last Session Score
                    </div>
                    <div className="mt-2 text-3xl font-black text-white">{totalScore.toLocaleString()}</div>
                  </div>
                )}

                <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                  <div className="text-xs uppercase tracking-[0.28em] text-red-300">Mode Select</div>
                  <p className="mt-2 text-sm leading-6 text-gray-300">
                    Choose one mode, two modes, or all of them before you start. The browser still remembers today&apos;s unlocked level, and the next one only opens after clearing the score gate.
                  </p>
                  {!allModesSelected && (
                    <button
                      type="button"
                      onClick={() => setSelectedModes(ALL_MODES)}
                      className="mt-3 rounded-xl border border-white/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.22em] text-gray-300 transition-colors hover:border-white/25 hover:text-white"
                    >
                      Choose All
                    </button>
                  )}
                </div>

                <motion.button
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.28 }}
                  onClick={() => onStartGame(selectedModes)}
                  data-testid="button-start-from-beginning"
                  className="mt-6 w-full rounded-2xl bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400 px-6 py-4 text-lg font-black tracking-[0.16em] text-black transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99]"
                >
                  {hasProgress ? `CONTINUE LEVEL ${highestUnlockedLevel}` : 'START FROM ROOKIE'}
                </motion.button>

                <div className="mt-4 text-center text-xs leading-5 text-gray-500">
                  Tomorrow this browser resets back to Level 1 and clears the daily best, so each day starts as a fresh run.
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

interface StatRowProps {
  icon: typeof Trophy;
  label: string;
  value: string;
  accent: string;
}

function StatRow({ icon: Icon, label, value, accent }: StatRowProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="rounded-xl border border-white/10 bg-black/30 p-2 text-red-300">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.24em] text-gray-500">{label}</div>
          <div className={`mt-1 text-sm font-bold ${accent}`}>{value}</div>
        </div>
      </div>
    </div>
  );
}
