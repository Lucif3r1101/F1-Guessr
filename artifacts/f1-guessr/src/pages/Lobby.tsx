import { motion } from 'framer-motion';
import { Trophy, Zap, Eye, Film } from 'lucide-react';
import { LEVEL_CONFIGS } from '@/lib/gameEngine';
import { cn } from '@/lib/utils';

interface LobbyProps {
  onStartGame: (level: number) => void;
  totalScore: number;
}

export function Lobby({ onStartGame, totalScore }: LobbyProps) {
  return (
    <div className="min-h-screen bg-black text-white overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-red-600/20 border border-red-600/40 text-red-400 text-xs px-4 py-1.5 rounded-full mb-4 uppercase tracking-widest">
            <Zap className="w-3 h-3" />
            Live from Reddit · Real F1 Content
          </div>
          <h1 className="text-6xl font-black mb-3 leading-none">
            <span className="text-red-600">F1</span> GUESSR
          </h1>
          <p className="text-gray-400 text-lg max-w-md mx-auto">
            Can you identify F1 moments from pixelated images, zoomed clips, and Reddit posts? Race through 10 levels of increasing difficulty.
          </p>
        </motion.div>

        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { icon: Eye, label: 'Pixelated', desc: 'Identify blurred images' },
            { icon: Zap, label: 'Zoomed In', desc: 'Guess from close-up shots' },
            { icon: Film, label: 'Clips', desc: 'Watch short Reddit videos' },
          ].map(({ icon: Icon, label, desc }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center"
            >
              <Icon className="w-6 h-6 text-red-500 mx-auto mb-2" />
              <div className="font-bold text-sm">{label}</div>
              <div className="text-xs text-gray-500 mt-1">{desc}</div>
            </motion.div>
          ))}
        </div>

        {totalScore > 0 && (
          <div className="text-center mb-6 bg-gray-900 border border-gray-800 rounded-xl p-4">
            <Trophy className="w-5 h-5 text-yellow-400 inline mr-2" />
            <span className="text-gray-300">Session Score: </span>
            <span className="text-yellow-400 font-bold text-lg">{totalScore.toLocaleString()}</span>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-300 mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" />
            Choose Your Starting Level
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {LEVEL_CONFIGS.map((config, i) => (
              <motion.button
                key={config.level}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => onStartGame(config.level)}
                data-testid={`button-start-level-${config.level}`}
                className={cn(
                  'group relative p-3 rounded-xl border-2 text-left transition-all duration-200',
                  'hover:scale-[1.03] active:scale-[0.97]',
                  config.level <= 3
                    ? 'border-emerald-700/50 bg-emerald-950/30 hover:border-emerald-500'
                    : config.level <= 6
                    ? 'border-orange-700/50 bg-orange-950/20 hover:border-orange-500'
                    : 'border-red-700/50 bg-red-950/20 hover:border-red-500',
                )}
              >
                <div className={cn(
                  'text-2xl font-black mb-1',
                  config.level <= 3 ? 'text-emerald-400' : config.level <= 6 ? 'text-orange-400' : 'text-red-400',
                )}>
                  {config.level}
                </div>
                <div className="text-xs font-bold text-white">{config.name}</div>
                <div className="text-xs text-gray-500 mt-1 leading-tight">{config.timePerQuestion}s · {config.lives} ❤️</div>
              </motion.button>
            ))}
          </div>
        </div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={() => onStartGame(1)}
          data-testid="button-start-from-beginning"
          className="w-full py-4 rounded-2xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black text-xl transition-colors"
        >
          START FROM ROOKIE →
        </motion.button>

        <p className="text-center text-xs text-gray-600 mt-4">
          Content sourced live from r/formula1 · No data stored · Refreshes every session
        </p>
      </div>
    </div>
  );
}
