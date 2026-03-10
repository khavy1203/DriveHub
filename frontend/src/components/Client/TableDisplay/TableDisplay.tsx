import React, { useState } from 'react';
import './TableDisplay.css';

interface TableDisplayProps {
  arrQuestion: {
    number: number;
    image: string; // URL của hình ảnh
    answer: string;
  }[];
  selectedOptions: number[][];
}

const TableDisplay: React.FC<TableDisplayProps> = ({ arrQuestion, selectedOptions }) => {

  console.log('check { arrQuestion, selectedOptions }', { arrQuestion, selectedOptions })
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);

  const isAnswerCorrect = (selected: number[], correct: string): boolean => {
    const correctAnswers = correct?.toString()?.split(',')?.map(Number);
    return (
      selected?.length === correctAnswers?.length &&
      selected?.every((answer) => correctAnswers?.includes(answer))
    );
  };

  return (
    <div className="table-container">
      <table className="table-result">
        <thead>
          <tr>
            <th>STT</th>
            <th>Câu hỏi</th>
            <th>Đáp án<br />đúng</th>
            <th>Đáp án<br />của bạn</th>
          </tr>
        </thead>
        <tbody>
          {arrQuestion.map((question, index) => {
            const userAnswer = selectedOptions[index];
            const correctAnswer = question.answer;
            const isCorrect = isAnswerCorrect(userAnswer, correctAnswer);

            return (
              <tr
                key={index}
                onMouseEnter={() =>
                  setHoveredImage(
                    require(`../../../assets/600question_2025/${question.number}.jpg`)
                  )
                }
                onMouseLeave={() => setHoveredImage(null)}
              >
                <td>{index + 1}</td> {/* Hiển thị số thứ tự */}
                <td className="image-column">
                  <img
                    src={require(`../../../assets/600question_2025/${question.number}.jpg`)}
                    alt={`Câu ${question.number}`}
                  />
                </td>
                <td className="correct-answer">{correctAnswer}</td>
                <td className={`user-answer ${isCorrect ? 'correct' : 'incorrect'}`}>
                  {userAnswer?.join(', ')}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {hoveredImage && (
        <div className="enlarged-image">
          <img src={hoveredImage} alt="Phóng to hình ảnh" />
        </div>
      )}
    </div>
  );
};

export default TableDisplay;
