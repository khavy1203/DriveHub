import React from 'react';
import topImg from '../../../assets/image/keycaps/top.png';
import botImg from '../../../assets/image/keycaps/bot.png';
import leftImg from '../../../assets/image/keycaps/left.png';
import rightImg from '../../../assets/image/keycaps/right.png';

interface VirtualDPadProps {
  currentQuestion: number;
  itemsPerColumn: number;
  totalQuestions: number;
  onQuestionChange: (newQuestion: number) => void;
}

export const VirtualDPad: React.FC<VirtualDPadProps> = ({
  currentQuestion,
  totalQuestions,
  onQuestionChange,
}) => {
  const upDisabled = currentQuestion === 0;
  const downDisabled = currentQuestion === totalQuestions - 1;

  return (
    <div className="virtual-dpad">
      <div className="dpad-row dpad-top">
        <button
          className={`dpad-btn up${upDisabled ? ' dpad-nav-disabled' : ''}`}
          onClick={() => !upDisabled && onQuestionChange(Math.max(0, currentQuestion - 1))}
          disabled={upDisabled}
        >
          <img src={topImg} alt="Up" className="keycap-img" />
        </button>
      </div>
      <div className="dpad-row dpad-bottom">
        {/* Left - decorative only */}
        <button className="dpad-btn left dpad-decorative" disabled tabIndex={-1}>
          <img src={leftImg} alt="Left" className="keycap-img" />
        </button>
        {/* Down - functional */}
        <button
          className={`dpad-btn down${downDisabled ? ' dpad-nav-disabled' : ''}`}
          onClick={() => !downDisabled && onQuestionChange(Math.min(totalQuestions - 1, currentQuestion + 1))}
          disabled={downDisabled}
        >
          <img src={botImg} alt="Down" className="keycap-img" />
        </button>
        {/* Right - decorative only */}
        <button className="dpad-btn right dpad-decorative" disabled tabIndex={-1}>
          <img src={rightImg} alt="Right" className="keycap-img" />
        </button>
      </div>
    </div>
  );
};
