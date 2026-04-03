import { useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface AnswerOptionsProps {
  options: string[];
  correctAnswer: string;
  onAnswer: (answer: string) => void;
  revealed?: boolean;
  disabled?: boolean;
}

export function AnswerOptions({ options, correctAnswer, onAnswer, revealed = false, disabled = false }: AnswerOptionsProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (option: string) => {
    if (disabled || selected || revealed) return;
    setSelected(option);
    onAnswer(option);
  };

  const getButtonStyle = (option: string) => {
    if (!selected && !revealed) return 'option-default';
    if (option === correctAnswer) return 'option-correct';
    if (option === selected && option !== correctAnswer) return 'option-wrong';
    return 'option-neutral';
  };

  return (
    <div className="grid grid-cols-2 gap-3" data-testid="container-answer-options">
      <AnimatePresence>
        {options.map((option, i) => {
          const style = getButtonStyle(option);
          return (
            <motion.button
              key={option}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              onClick={() => handleSelect(option)}
              disabled={disabled || !!selected || revealed}
              data-testid={`button-answer-option-${i}`}
              className={cn(
                'relative px-4 py-3 rounded-xl text-left font-medium text-sm transition-all duration-200',
                'border-2 focus:outline-none focus:ring-2 focus:ring-offset-2',
                style === 'option-default' && !disabled && 'border-gray-600 bg-gray-800/80 text-white hover:border-red-500 hover:bg-gray-700 hover:scale-[1.02] active:scale-[0.98] cursor-pointer',
                style === 'option-default' && disabled && 'border-gray-700 bg-gray-900/60 text-gray-500 cursor-not-allowed',
                style === 'option-correct' && 'border-emerald-500 bg-emerald-900/60 text-emerald-300',
                style === 'option-wrong' && 'border-red-500 bg-red-900/60 text-red-300',
                style === 'option-neutral' && 'border-gray-700 bg-gray-900/40 text-gray-500',
              )}
            >
              <span className="absolute top-2 left-2 text-xs text-gray-500 font-mono">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="ml-4">{option}</span>
              {style === 'option-correct' && (
                <span className="absolute top-2 right-2 text-emerald-400 text-xs">✓</span>
              )}
              {style === 'option-wrong' && (
                <span className="absolute top-2 right-2 text-red-400 text-xs">✗</span>
              )}
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

interface FillInTheBlankProps {
  answer: string;
  hint: string;
  onAnswer: (answer: string) => void;
  revealed?: boolean;
  disabled?: boolean;
}

export function FillInTheBlank({ answer, hint, onAnswer, revealed = false, disabled = false }: FillInTheBlankProps) {
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitted || revealed || disabled || !input.trim()) return;
    const correct = input.trim().toLowerCase() === answer.toLowerCase();
    setIsCorrect(correct);
    setSubmitted(true);
    onAnswer(input.trim());
  };

  const blankedAnswer = answer
    .split('')
    .map((char, i) => {
      if (char === ' ') return ' ';
      if (i === 0) return char;
      if (i === answer.length - 1) return char;
      return '_';
    })
    .join('');

  return (
    <div className="space-y-3">
      <div className="text-center text-gray-400 text-sm">
        Hint: <span className="text-gray-300 font-mono tracking-widest">{blankedAnswer}</span>
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={submitted || revealed || disabled}
          placeholder="Type your answer..."
          className={cn(
            'flex-1 px-4 py-3 rounded-xl border-2 bg-gray-800 text-white placeholder-gray-500',
            'focus:outline-none focus:ring-2 focus:ring-red-500',
            !submitted && !revealed ? 'border-gray-600' : isCorrect ? 'border-emerald-500 bg-emerald-900/20' : 'border-red-500 bg-red-900/20',
          )}
          data-testid="input-fill-blank"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={submitted || revealed || disabled || !input.trim()}
          className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          data-testid="button-submit-answer"
        >
          Submit
        </button>
      </form>
      {submitted && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'text-center py-2 rounded-lg text-sm font-medium',
            isCorrect ? 'text-emerald-400 bg-emerald-900/30' : 'text-red-400 bg-red-900/30',
          )}
        >
          {isCorrect ? `Correct! +points` : `Wrong! The answer was: ${answer}`}
        </motion.div>
      )}
    </div>
  );
}
