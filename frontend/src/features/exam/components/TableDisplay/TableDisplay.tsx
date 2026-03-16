import React, { useState } from 'react';
import './TableDisplay.scss';

interface TableDisplayProps {
  arrQuestion: {
    number: number;
    image: string; // URL của hình ảnh
    answer: string;
  }[];
  selectedOptions: number[][];
}

const TableDisplay: React.FC<TableDisplayProps> = ({ arrQuestion, selectedOptions }) => {
  const getQuestionImage = (number: number) => {
    try {
      return require(`../../../../assets/600question_2025/${number}.jpg`);
    } catch (error) {
      return null;
    }
  };

  const isAnswerCorrect = (selected: number[], correct: string): boolean => {
    const correctAnswers = correct?.toString()?.split(',')?.map(Number);
    if (!selected) return false;
    return (
      selected.length === correctAnswers.length &&
      selected.every((val) => correctAnswers.includes(val))
    );
  };

  return (
    <div className="table-container">
      <table className="table-result">
        <thead>
          <tr>
            <th>STT</th>
            <th>Câu hỏi</th>
            <th>Đáp án đúng</th>
            <th>Đáp án của bạn</th>
          </tr>
        </thead>
        <tbody>
          {arrQuestion.map((question, index) => {
            const selected = selectedOptions[index];
            const isCorrect = isAnswerCorrect(selected, question.answer);
            const correctAnswer = question.answer;
            const userAnswer = selected && selected.length > 0 ? selected.sort((a, b) => a - b).join(', ') : '';

            return (
              <tr key={index}>
                <td className="stt-cell">{index + 1}</td>
                <td className="question-content-cell">
                  {getQuestionImage(question.number) ? (
                    <img
                      src={getQuestionImage(question.number)}
                      alt={`Câu ${question.number}`}
                    />
                  ) : (
                    <div className="no-image-text">Không tìm thấy hình ảnh</div>
                  )}
                </td>
                <td className="correct-answer-cell">{correctAnswer}</td>
                <td className={`user-answer-cell ${isCorrect ? 'correct' : 'incorrect'}`}>
                  {userAnswer || '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TableDisplay;