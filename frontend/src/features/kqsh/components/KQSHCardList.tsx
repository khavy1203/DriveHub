import React from 'react';
import type { KQSHRecord, KQSHSubject } from '../types';
import './kqsh.scss';

const LOAI_LABEL: Record<string, string> = {
  L: 'Lý thuyết',
  H: 'Sa hình',
  D: 'Lái đường',
  M: 'Mô phỏng',
};

const KQ_LABEL: Record<string, string> = {
  DA: 'Đạt',
  KDA: 'Không đạt',
  VA: 'Vắng',
};

type KetQuaBadgeProps = { kq: string };

export const KetQuaBadge: React.FC<KetQuaBadgeProps> = ({ kq }) => (
  <span className={`kq__badge kq__badge--${(kq || 'unknown').toLowerCase()}`}>
    {KQ_LABEL[kq] ?? kq}
  </span>
);

type SubjectRowProps = { subject: KQSHSubject };

const SubjectRow: React.FC<SubjectRowProps> = ({ subject }) => {
  const isVang = subject.VangSH === 1;
  const diem = subject.DiemSH ?? 0;
  const toiDa = subject.DiemToiDa ?? 100;
  const toiThieu = subject.DiemToiThieu ?? 0;
  const pct = toiDa > 0 ? Math.min((diem / toiDa) * 100, 100) : 0;
  const passed = diem >= toiThieu;

  return (
    <tr>
      <td className="kq__subject-name">{LOAI_LABEL[subject.LoaiSH] ?? subject.LoaiSH}</td>
      <td>
        {isVang ? (
          <span className="kq__vang-tag">— Vắng</span>
        ) : (
          <div className="kq__score-cell">
            <span className="kq__score-val">{diem}</span>
            <div className="kq__progress-bar">
              <div
                className={`kq__progress-fill ${passed ? 'kq__progress-fill--pass' : 'kq__progress-fill--fail'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
      </td>
      <td>{isVang ? '—' : toiDa}</td>
      <td>{isVang ? '—' : toiThieu}</td>
      <td><KetQuaBadge kq={subject.KetQuaSH} /></td>
    </tr>
  );
};

type KQSHCardProps = { record: KQSHRecord; index: number; defaultOpen?: boolean };

export const KQSHCard: React.FC<KQSHCardProps> = ({ record, index, defaultOpen = false }) => {
  const [open, setOpen] = React.useState(defaultOpen);
  const ngay = record.NgaySH ? new Date(record.NgaySH).toLocaleDateString('vi-VN') : '—';

  return (
    <div className="kq__card">
      <button
        type="button"
        className={`kq__card-header kq__card-header--${(record.KetQuaSH || 'unknown').toLowerCase()}`}
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <div className="kq__card-header-left">
          <span className="kq__ky-label">Kỳ {index + 1}</span>
          {record.HangGPLX && <span className="kq__hang">Hạng {record.HangGPLX}</span>}
          <span className="kq__ngay">{ngay}</span>
        </div>
        <div className="kq__card-header-right">
          <KetQuaBadge kq={record.KetQuaSH} />
          <i className="material-icons kq__chevron">{open ? 'expand_less' : 'expand_more'}</i>
        </div>
      </button>

      {open && (
        <div className="kq__card-body">
          <div className="kq__meta">
            <span><strong>SBD:</strong> {record.SoBaoDanh}</span>
            <span><strong>Mã kỳ:</strong> {record.MaKySH}</span>
            {record.SoQDSH && <span><strong>QĐ:</strong> {record.SoQDSH}</span>}
          </div>

          {record.subjects.length > 0 ? (
            <div className="kq__table-wrap">
              <table className="kq__table">
                <thead>
                  <tr>
                    <th>Môn</th>
                    <th>Điểm</th>
                    <th>Tối đa</th>
                    <th>Tối thiểu</th>
                    <th>Kết quả</th>
                  </tr>
                </thead>
                <tbody>
                  {record.subjects.map(sub => (
                    <SubjectRow key={sub.LoaiSH} subject={sub} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="kq__no-subjects">Chưa có chi tiết điểm từng môn.</p>
          )}
        </div>
      )}
    </div>
  );
};

export type KQSHCardListProps = {
  records: KQSHRecord[];
  hoTen?: string | null;
  loading: boolean;
  error: string | null;
  emptyMessage?: string;
  defaultAllCollapsed?: boolean;
};

const KQSHCardList: React.FC<KQSHCardListProps> = ({
  records,
  loading,
  error,
  emptyMessage = 'Chưa có kết quả sát hạch.',
  defaultAllCollapsed = false,
}) => {
  if (loading) {
    return (
      <div className="kq__loading">
        <div className="kq__spinner" />
        <span>Đang tải kết quả sát hạch…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="kq__error">
        <i className="material-icons">error_outline</i>
        <span>{error}</span>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="kq__empty">
        <i className="material-icons">info_outline</i>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="kq__list">
      {records.map((rec, idx) => (
        <KQSHCard
          key={rec.id}
          record={rec}
          index={idx}
          defaultOpen={!defaultAllCollapsed && idx === 0}
        />
      ))}
    </div>
  );
};

export default KQSHCardList;
