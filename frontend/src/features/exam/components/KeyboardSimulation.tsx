import React, { useCallback } from 'react';

interface KeyboardSimulationProps {
  onNavigateUp: () => void;
  onNavigateDown: () => void;
  onSelectOption: (optionNumber: number) => void;
  selectedOptions: number[];
  currentQuestion: number;
  totalQuestions: number;
  disabled?: boolean;
  layout?: 'horizontal' | 'vertical';
}

/**
 * KeyboardSimulation Component
 * Simulates physical keyboard for exam navigation and answer selection
 * - Left side: Navigation keys (Up/Down arrows)
 * - Right side: Answer keys (1, 2, 3, 4)
 */
const KeyboardSimulation: React.FC<KeyboardSimulationProps> = ({
  onNavigateUp,
  onNavigateDown,
  onSelectOption,
  selectedOptions,
  currentQuestion,
  totalQuestions,
  disabled = false,
  layout = 'horizontal',
}) => {
  const handleOptionClick = useCallback((option: number) => {
    if (!disabled) {
      onSelectOption(option);
    }
  }, [disabled, onSelectOption]);

  const handleNavigateUp = useCallback(() => {
    if (!disabled) {
      onNavigateUp();
    }
  }, [disabled, onNavigateUp]);

  const handleNavigateDown = useCallback(() => {
    if (!disabled) {
      onNavigateDown();
    }
  }, [disabled, onNavigateDown]);

  // Base button styles for key-like appearance
  const baseKeyClass = `
    flex items-center justify-center
    font-bold text-lg
    rounded-lg
    border-b-4 border-r-2
    transition-all duration-100
    select-none
    active:translate-y-1 active:border-b-2
    focus:outline-none focus:ring-2 focus:ring-blue-400
    disabled:opacity-50 disabled:cursor-not-allowed
    touch-manipulation
  `;

  // Navigation key specific styles
  const navKeyClass = `
    ${baseKeyClass}
    bg-gradient-to-b from-gray-200 to-gray-300
    border-gray-400
    text-gray-700
    hover:from-gray-300 hover:to-gray-400
    active:from-gray-400 active:to-gray-300
    min-w-[60px] min-h-[60px]
    sm:min-w-[70px] sm:min-h-[70px]
    md:min-w-[80px] md:min-h-[80px]
  `;

  // Answer key specific styles - larger for easy tapping
  const answerKeyClass = (option: number) => {
    const isSelected = selectedOptions.includes(option);
    return `
      ${baseKeyClass}
      min-w-[60px] min-h-[60px]
      sm:min-w-[70px] sm:min-h-[70px]
      md:min-w-[80px] md:min-h-[80px]
      ${isSelected 
        ? 'bg-gradient-to-b from-green-400 to-green-500 border-green-600 text-white shadow-lg scale-105' 
        : 'bg-gradient-to-b from-blue-100 to-blue-200 border-blue-400 text-blue-800 hover:from-blue-200 hover:to-blue-300'
      }
    `;
  };

  const isHorizontal = layout === 'horizontal';

  return (
    <div 
      className={`
        w-full h-full
        flex ${isHorizontal ? 'flex-row' : 'flex-col'}
        items-center justify-center
        gap-4 sm:gap-6 md:gap-8
        p-4 sm:p-6 md:p-8
        bg-gradient-to-br from-slate-800 to-slate-900
        rounded-xl
        shadow-inner
      `}
      role="group"
      aria-label="Bàn phím điều khiển"
    >
      {/* Navigation Keys - Left Side */}
      <div 
        className={`
          flex ${isHorizontal ? 'flex-col' : 'flex-row'}
          items-center justify-center
          gap-3 sm:gap-4
        `}
        role="group"
        aria-label="Điều hướng câu hỏi"
      >
        {/* Question indicator */}
        <div className="text-white text-sm sm:text-base font-semibold mb-2 text-center">
          Câu {currentQuestion + 1}/{totalQuestions}
        </div>
        
        {/* Up Arrow */}
        <button
          type="button"
          onClick={handleNavigateUp}
          disabled={disabled}
          className={navKeyClass}
          aria-label="Câu trước"
          title="Câu trước (↑)"
        >
          <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
          </svg>
        </button>

        {/* Down Arrow */}
        <button
          type="button"
          onClick={handleNavigateDown}
          disabled={disabled}
          className={navKeyClass}
          aria-label="Câu sau"
          title="Câu sau (↓)"
        >
          <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Divider */}
      <div className={`
        ${isHorizontal ? 'w-px h-32' : 'h-px w-32'}
        bg-gradient-to-b from-transparent via-slate-600 to-transparent
      `} />

      {/* Answer Keys - Right Side */}
      <div 
        className={`
          grid ${isHorizontal ? 'grid-cols-2 grid-rows-2' : 'grid-cols-4 grid-rows-1'}
          gap-3 sm:gap-4
        `}
        role="group"
        aria-label="Chọn đáp án"
      >
        {[1, 2, 3, 4].map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => handleOptionClick(option)}
            disabled={disabled}
            className={answerKeyClass(option)}
            aria-label={`Đáp án ${option}`}
            aria-pressed={selectedOptions.includes(option)}
            title={`Đáp án ${option}`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};

export default KeyboardSimulation;
