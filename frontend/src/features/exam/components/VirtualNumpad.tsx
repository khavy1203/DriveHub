import React from 'react';
import num1 from '../../../assets/image/keycaps/number1.png';
import num2 from '../../../assets/image/keycaps/number2.png';
import num3 from '../../../assets/image/keycaps/number3.png';
import num4 from '../../../assets/image/keycaps/number4.png';
import num5 from '../../../assets/image/keycaps/number5.png';
import num6 from '../../../assets/image/keycaps/number6.png';

interface VirtualNumpadProps {
  currentQuestion: number;
  selectedOptions: { [key: number]: number[] };
  toggleOption: (questionIndex: number, optionId: number) => void;
}

export const VirtualNumpad: React.FC<VirtualNumpadProps> = ({
  currentQuestion,
  selectedOptions,
  toggleOption,
}) => {
  const numpadConfig = [
    { value: 4, img: num4, disabled: false },
    { value: 5, img: num5, disabled: true },
    { value: 6, img: num6, disabled: true },
    { value: 1, img: num1, disabled: false },
    { value: 2, img: num2, disabled: false },
    { value: 3, img: num3, disabled: false },
  ];

  return (
    <div className="virtual-numpad">
      <div className="numpad-row">
        {numpadConfig.slice(0, 3).map((btn) => (
          <button
            key={btn.value}
            className={`numpad-btn ${selectedOptions[currentQuestion]?.includes(btn.value) ? 'active' : ''}`}
            onClick={() => !btn.disabled && toggleOption(currentQuestion, btn.value)}
            disabled={btn.disabled}
          >
            <img src={btn.img} alt={`Num ${btn.value}`} className="keycap-img" />
          </button>
        ))}
      </div>
      <div className="numpad-row">
        {numpadConfig.slice(3, 6).map((btn) => (
          <button
            key={btn.value}
            className={`numpad-btn ${selectedOptions[currentQuestion]?.includes(btn.value) ? 'active' : ''}`}
            onClick={() => !btn.disabled && toggleOption(currentQuestion, btn.value)}
            disabled={btn.disabled}
          >
            <img src={btn.img} alt={`Num ${btn.value}`} className="keycap-img" />
          </button>
        ))}
      </div>
    </div>
  );
};
