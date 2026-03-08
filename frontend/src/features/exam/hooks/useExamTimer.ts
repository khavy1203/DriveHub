/**
 * Exam timer hook
 * @module features/exam/hooks/useExamTimer
 */

import { useState, useEffect, useCallback } from 'react';

interface UseExamTimerReturn {
  timeRemaining: number;
  isTimeOut: boolean;
  formatTime: (seconds: number) => string;
  resetTimer: (seconds: number) => void;
}

export const useExamTimer = (initialSeconds: number): UseExamTimerReturn => {
  const [timeRemaining, setTimeRemaining] = useState(initialSeconds);
  const [isTimeOut, setIsTimeOut] = useState(false);

  useEffect(() => {
    if (timeRemaining <= 0) {
      setIsTimeOut(true);
      return;
    }

    const intervalId = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId);
          setIsTimeOut(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timeRemaining]);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, []);

  const resetTimer = useCallback((seconds: number) => {
    setTimeRemaining(seconds);
    setIsTimeOut(false);
  }, []);

  return { timeRemaining, isTimeOut, formatTime, resetTimer };
};

export default useExamTimer;
