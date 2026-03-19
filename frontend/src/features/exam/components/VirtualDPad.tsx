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
  disableHorizontal?: boolean;
}

export const VirtualDPad: React.FC<VirtualDPadProps> = ({
  currentQuestion,
  itemsPerColumn,
  totalQuestions,
  onQuestionChange,
  disableHorizontal = false,
}) => {
  const dpadConfig = [
    { id: 'up', img: topImg, action: Math.max(0, currentQuestion - 1), disabled: currentQuestion === 0, className: 'dpad-btn up' },
    {
      id: 'left',
      img: leftImg,
      action: Math.max(0, currentQuestion - itemsPerColumn),
      disabled: disableHorizontal || currentQuestion < itemsPerColumn,
      className: 'dpad-btn left'
    },
    { id: 'down', img: botImg, action: Math.min(totalQuestions - 1, currentQuestion + 1), disabled: currentQuestion === totalQuestions - 1, className: 'dpad-btn down' },
    {
      id: 'right',
      img: rightImg,
      action: Math.min(totalQuestions - 1, currentQuestion + itemsPerColumn),
      disabled: disableHorizontal || currentQuestion + itemsPerColumn >= totalQuestions,
      className: 'dpad-btn right'
    },
  ];

  return (
    <div className="virtual-dpad">
      <div className="dpad-row dpad-top">
        <button 
          className={dpadConfig[0].className} 
          onClick={() => onQuestionChange(dpadConfig[0].action)} 
          disabled={dpadConfig[0].disabled}
        >
          <img src={dpadConfig[0].img} alt="Up" className="keycap-img" />
        </button>
      </div>
      <div className="dpad-row dpad-bottom">
        {dpadConfig.slice(1).map((btn) => (
          <button 
            key={btn.id} 
            className={btn.className} 
            onClick={() => onQuestionChange(btn.action)} 
            disabled={btn.disabled}
          >
            <img src={btn.img} alt={btn.id} className="keycap-img" />
          </button>
        ))}
      </div>
    </div>
  );
};
