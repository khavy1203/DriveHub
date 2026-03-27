import React, { useEffect, useState } from 'react';
import { reviewApi, RankItem, ReviewSetItem } from '../../../review/services/reviewApi';
import './ReviewSetManager.scss';

const ReviewSetManager: React.FC = () => {
  const [ranks, setRanks] = useState<RankItem[]>([]);
  const [selectedRankId, setSelectedRankId] = useState<number | null>(null);
  const [sets, setSets] = useState<ReviewSetItem[]>([]);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    reviewApi.getRanks().then((res) => {
      if (res.EC === 0 && res.DT) setRanks(res.DT);
    });
  }, []);

  useEffect(() => {
    if (!selectedRankId) return;
    setSets([]);
    reviewApi.getReviewSetsByRank(selectedRankId).then((res) => {
      if (res.EC === 0 && res.DT) setSets(res.DT);
    });
  }, [selectedRankId]);

  const handleGenerate = async () => {
    if (!selectedRankId) return;
    setGenerating(true);
    setMessage(null);
    try {
      const res = await reviewApi.generateReviewSets(selectedRankId);
      if (res.EC === 0) {
        setMessage({ text: res.EM ?? 'Tạo xong!', ok: true });
        // Reload sets
        const setsRes = await reviewApi.getReviewSetsByRank(selectedRankId);
        if (setsRes.EC === 0 && setsRes.DT) setSets(setsRes.DT);
      } else {
        setMessage({ text: res.EM ?? 'Lỗi', ok: false });
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="rsm">
      <div className="rsm__header">
        <h2 className="rsm__title">Quản lý bộ đề ôn tập</h2>
        <p className="rsm__subtitle">
          Tạo bộ đề ôn tập riêng (độc lập với bộ đề thi) theo từng hạng bằng lái.
        </p>
      </div>

      <div className="rsm__controls">
        <select
          className="rsm__select"
          value={selectedRankId ?? ''}
          onChange={(e) => setSelectedRankId(Number(e.target.value) || null)}
        >
          <option value="">-- Chọn hạng --</option>
          {ranks.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>

        <button
          className="rsm__btn rsm__btn--generate"
          onClick={handleGenerate}
          disabled={!selectedRankId || generating}
        >
          {generating ? (
            <>
              <span className="material-icons rsm__spin">sync</span>
              Đang tạo...
            </>
          ) : (
            <>
              <span className="material-icons">auto_fix_high</span>
              Tạo / Cập nhật bộ đề
            </>
          )}
        </button>
      </div>

      {message && (
        <div className={`rsm__message rsm__message--${message.ok ? 'ok' : 'err'}`}>
          <span className="material-icons">{message.ok ? 'check_circle' : 'error'}</span>
          {message.text}
        </div>
      )}

      {sets.length > 0 && (
        <div className="rsm__sets">
          <p className="rsm__sets-count">{sets.length} bộ đề ôn tập</p>
          <div className="rsm__sets-grid">
            {sets.map((s) => (
              <div key={s.id} className="rsm__set-card">
                <span className="rsm__set-index">Bộ {String(s.setIndex).padStart(2, '0')}</span>
                <span className="rsm__set-count">{s.totalQuestions} câu</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rsm__info">
        <span className="material-icons">info</span>
        <p>
          Mỗi lần nhấn <strong>Tạo / Cập nhật</strong>, hệ thống sẽ lấy toàn bộ câu hỏi của hạng
          đó từ ngân hàng đề thi, chia thành các bộ 20 câu (theo thứ tự số câu).
          Dữ liệu cũ sẽ bị xóa và tạo lại.
        </p>
      </div>
    </div>
  );
};

export default ReviewSetManager;
