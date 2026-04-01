import React, { lazy, Suspense, useEffect, useState } from 'react';
import type {
  TrainingFullDisplay,
  TrainingSessionRow,
  TrainingTheoryRow,
  ThieuDu,
  GiayToItem,
} from '../lib/parseTrainingDisplay';
import './TrainingFullStudentView.scss';

const SessionRouteModal = lazy(() => import('./SessionRouteModal'));

type Props = {
  display: TrainingFullDisplay;
  showBreadcrumbs?: boolean;
};

const Icon: React.FC<{ name: string; className?: string }> = ({ name, className }) => (
  <span className={`material-icons tfs__icon ${className ?? ''}`.trim()} aria-hidden>
    {name}
  </span>
);

const ProfileFact: React.FC<{ icon: string; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => (
  <div className="tfs__fact">
    <Icon name={icon} className="tfs__fact-icon" />
    <div>
      <p className="tfs__fact-label">{label}</p>
      <p className="tfs__fact-value">{value}</p>
    </div>
  </div>
);

const SessionTable: React.FC<{
  title: string;
  sessions: TrainingSessionRow[];
  onRowClick?: (row: TrainingSessionRow) => void;
}> = ({ title, sessions, onRowClick }) => (
  <section className="tfs__history">
    <div className="tfs__history-head">
      <div className="tfs__history-title-row">
        <div className="tfs__history-accent" aria-hidden />
        <h2 className="tfs__history-title">{title}</h2>
      </div>
      {onRowClick && sessions.length > 0 && (
        <p className="tfs__table-hint">
          <span className="material-icons" style={{ fontSize: 14 }}>touch_app</span>
          Nhấn vào phiên để xem lộ trình
        </p>
      )}
    </div>
    <div className="tfs__table-wrap">
      <table className="tfs__table">
        <thead>
          <tr>
            <th>#</th>
            <th>Ngày tập</th>
            <th>Khung giờ</th>
            <th className="tfs__th-center">Thời lượng</th>
            <th className="tfs__th-right">Quãng đường</th>
            <th>Biển số xe</th>
            <th>Hạng xe</th>
            <th className="tfs__th-center">GPS</th>
            <th className="tfs__th-center">Lộ trình</th>
          </tr>
        </thead>
        <tbody>
          {sessions.length === 0 ? (
            <tr>
              <td colSpan={9} className="tfs__table-empty">
                Chưa có phiên tập nào hoặc dữ liệu chưa đồng bộ.
              </td>
            </tr>
          ) : (
            sessions.map((row, idx) => {
              const hasRoute = Boolean(row.thoiDiemVao);
              return (
                <tr
                  key={row.key}
                  className={hasRoute && onRowClick ? 'tfs__tr--clickable' : ''}
                  onClick={hasRoute && onRowClick ? () => onRowClick(row) : undefined}
                  title={hasRoute && onRowClick ? 'Xem lộ trình phiên này' : undefined}
                >
                  <td className="tfs__td-muted">{idx + 1}</td>
                  <td className="tfs__td-strong">{row.date}</td>
                  <td>
                    <span className="tfs__pill-data">{row.timeRange}</span>
                  </td>
                  <td className="tfs__td-center tfs__td-mono">{row.durationLabel}</td>
                  <td className="tfs__td-right tfs__td-mono tfs__td-strong">{row.distanceLabel}</td>
                  <td>
                    <div className="tfs__plate-cell">
                      <span className="tfs__plate-dot" aria-hidden />
                      <span className="tfs__td-strong">{row.plate}</span>
                    </div>
                  </td>
                  <td>
                    <span className="tfs__chip tfs__chip--primary tfs__chip--sm">{row.rank}</span>
                  </td>
                  <td className="tfs__td-center">
                    {row.gpsCount > 0 ? (
                      <Icon name="location_on" className="tfs__state-ok" />
                    ) : (
                      <Icon name="location_off" className="tfs__state-wait" />
                    )}
                  </td>
                  <td className="tfs__td-center">
                    {hasRoute ? (
                      <button
                        className="tfs__route-btn"
                        onClick={(e) => { e.stopPropagation(); onRowClick?.(row); }}
                        aria-label="Xem lộ trình"
                        title="Xem lộ trình"
                      >
                        <span className="material-icons">map</span>
                      </button>
                    ) : (
                      <span className="tfs__td-muted">—</span>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  </section>
);

const TheoryTable: React.FC<{ rows: TrainingTheoryRow[] }> = ({ rows }) => (
  <section className="tfs__history">
    <div className="tfs__history-head">
      <div className="tfs__history-title-row">
        <div className="tfs__history-accent tfs__history-accent--secondary" aria-hidden />
        <h2 className="tfs__history-title">Chi tiết lý thuyết</h2>
      </div>
    </div>
    <div className="tfs__table-wrap">
      <table className="tfs__table">
        <thead>
          <tr>
            <th>#</th>
            <th>Môn học</th>
            <th className="tfs__th-center">Tiến độ</th>
            <th className="tfs__th-center">Trạng thái</th>
            <th>Ghi chú</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={r.key}>
              <td className="tfs__td-muted">{idx + 1}</td>
              <td className="tfs__td-strong">{r.mon}</td>
              <td className="tfs__td-center tfs__td-mono">{r.tienDo}</td>
              <td className="tfs__td-center">
                <span className={r.hoanThanh ? 'tfs__pill tfs__pill--done' : 'tfs__pill tfs__pill--active'}>
                  {r.hoanThanh ? 'Hoàn thành' : 'Chưa xong'}
                </span>
              </td>
              <td className="tfs__td-muted">{r.ghiChu || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

const ThieuDuPanel: React.FC<{ data: ThieuDu }> = ({ data }) => (
  <section className="tfs__thieudo">
    <div className="tfs__thieudo-head">
      <div className="tfs__history-title-row">
        <div className="tfs__history-accent tfs__history-accent--warn" aria-hidden />
        <h2 className="tfs__history-title">Tình trạng thiếu đủ — Hạng {data.hang}</h2>
      </div>
      <span className={`tfs__verdict ${data.isEligible ? 'tfs__verdict--ok' : 'tfs__verdict--fail'}`}>
        <Icon name={data.isEligible ? 'verified' : 'warning'} />
        {data.tongKet}
      </span>
    </div>

    <div className="tfs__thieudo-grid">
      {data.criteria.map((c) => (
        <div key={c.key} className={`tfs__td-card tfs__td-card--${c.status}`}>
          <div className="tfs__td-card-top">
            <span className="tfs__td-card-label">{c.label}</span>
            <span className={`tfs__pill tfs__pill--${c.status === 'du' ? 'done' : c.status === 'na' ? 'na' : 'warn'}`}>
              {c.status === 'du' ? 'Đủ' : c.status === 'na' ? 'Không áp dụng' : 'Thiếu'}
            </span>
          </div>
          <div className="tfs__td-card-numbers">
            <span className="tfs__td-card-actual">{c.thucTeLabel}</span>
            <span className="tfs__td-card-sep">/</span>
            <span className="tfs__td-card-threshold">{c.nguongLabel}</span>
          </div>
          <div className="tfs__td-progress-track">
            <div
              className={`tfs__td-progress-fill tfs__td-progress-fill--${c.status}`}
              style={{ width: `${c.pct}%` }}
            />
          </div>
          {c.status === 'thieu' ? (
            <p className="tfs__td-card-note">{c.danhGia}</p>
          ) : null}
        </div>
      ))}
    </div>
    {data.conThieu && (data.conThieu.gio > 0 || data.conThieu.km > 0 || data.conThieu.gioBanDem > 0) ? (
      <div className="tfs__conthieu">
        <Icon name="info" className="tfs__conthieu-icon" />
        <span className="tfs__conthieu-label">Còn thiếu:</span>
        {data.conThieu.gio > 0 ? <span className="tfs__conthieu-item">{Math.round(data.conThieu.gio * 100) / 100}h giờ học</span> : null}
        {data.conThieu.km > 0 ? <span className="tfs__conthieu-item">{Math.round(data.conThieu.km * 100) / 100} km</span> : null}
        {data.conThieu.gioBanDem > 0 ? <span className="tfs__conthieu-item">{Math.round(data.conThieu.gioBanDem * 100) / 100}h ban đêm</span> : null}
        {data.conThieu.gioTuDong > 0 ? <span className="tfs__conthieu-item">{Math.round(data.conThieu.gioTuDong * 100) / 100}h tự động</span> : null}
      </div>
    ) : null}
  </section>
);

const GiayToTable: React.FC<{ rows: GiayToItem[] }> = ({ rows }) => (
  <section className="tfs__history">
    <div className="tfs__history-head">
      <div className="tfs__history-title-row">
        <div className="tfs__history-accent tfs__history-accent--secondary" aria-hidden />
        <h2 className="tfs__history-title">Giấy tờ</h2>
      </div>
    </div>
    <div className="tfs__table-wrap">
      <table className="tfs__table">
        <thead>
          <tr>
            <th>#</th>
            <th>Tên giấy tờ</th>
            <th className="tfs__th-center">Trạng thái</th>
            <th>Ghi chú</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={r.key}>
              <td className="tfs__td-muted">{idx + 1}</td>
              <td className="tfs__td-strong">{r.tenGiayTo}</td>
              <td className="tfs__td-center">
                <span className={r.trangThai ? 'tfs__pill tfs__pill--done' : 'tfs__pill tfs__pill--active'}>
                  {r.trangThai || 'Chưa có'}
                </span>
              </td>
              <td className="tfs__td-muted">{r.ghiChu || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

const TrainingFullStudentView: React.FC<Props> = ({ display, showBreadcrumbs = true }) => {
  const {
    hoTen,
    maSo,
    rankLabel,
    ngaySinh,
    cccd,
    diaChi,
    khoaHoc,
    ketQuaDiemDanh,
    dat,
    cabin,
    caoToc,
    lyThuyet,
    giayTo,
    courseProgressPct,
    thieuDu,
    instructor,
    plate,
    moduleHistories,
  } = display;

  const [activeSession, setActiveSession] = useState<TrainingSessionRow | null>(null);

  // Prefetch map chunk so it's ready when user clicks a session row
  useEffect(() => {
    import('./SessionRouteMap');
  }, []);

  const rankChip = rankLabel !== '—'
    ? (/^hạng/i.test(rankLabel) ? rankLabel : `Hạng ${rankLabel}`)
    : null;

  const progressWidth = Math.min(100, Math.max(0, courseProgressPct));

  return (
    <div className="tfs">
      {showBreadcrumbs ? (
        <nav className="tfs__crumbs" aria-label="Breadcrumb">
          <span>Học viên</span>
          <Icon name="chevron_right" className="tfs__crumbs-sep" />
          <span className="tfs__crumbs-current">Tiến độ đào tạo</span>
        </nav>
      ) : null}

      {/* Bento: Profile + Summary */}
      <div className="tfs__bento">
        {/* Profile card — no avatar per product decision */}
        <div className="tfs__profile-card">
          <div className="tfs__chips">
            {rankChip ? <span className="tfs__chip tfs__chip--primary">{rankChip}</span> : null}
          </div>
          <h1 className="tfs__name">{hoTen}</h1>
          <p className="tfs__ms">MS: {maSo}</p>
          <div className="tfs__facts">
            <ProfileFact icon="calendar_today" label="Ngày sinh" value={ngaySinh} />
            <ProfileFact icon="badge" label="CCCD" value={cccd} />
            <ProfileFact icon="location_on" label="Địa chỉ" value={diaChi} />
            <ProfileFact icon="school" label="Khóa học" value={khoaHoc} />
            {ketQuaDiemDanh ? (
              <ProfileFact icon="fact_check" label="Điểm danh" value={ketQuaDiemDanh} />
            ) : null}
          </div>
        </div>

        {/* Summary cards */}
        <div className="tfs__summary">
          <div className="tfs__course-progress" aria-label="Tiến độ hoàn thành khóa học">
            <div className="tfs__course-progress-head">
              <span className="tfs__course-progress-label">Hoàn thành khóa học</span>
              <span className="tfs__course-progress-pct">{courseProgressPct}%</span>
            </div>
            <div className="tfs__course-progress-track" role="progressbar" aria-valuenow={courseProgressPct} aria-valuemin={0} aria-valuemax={100}>
              <div className="tfs__course-progress-fill" style={{ width: `${progressWidth}%` }} />
            </div>
          </div>
          <div className="tfs__summary-grid">
            {/* DAT / Đường trường */}
            {dat ? (
              <div className="tfs__card tfs__card--dat">
                <div className="tfs__card-dat-top">
                  <div className="tfs__card-icon-wrap tfs__card-icon-wrap--primary">
                    <Icon name="directions_car" />
                  </div>
                  <span className="tfs__card-watermark">DAT</span>
                </div>
                <h3 className="tfs__card-title">Đường trường</h3>
                <div className="tfs__card-dat-metrics">
                  <span className="tfs__card-dat-num">{dat.tongKm}</span>
                </div>
                <div className="tfs__card-dat-sub">
                  <span>{dat.soPhienHoc} phiên</span>
                  <span className="tfs__card-dat-sep">·</span>
                  <span>{dat.tongGio}</span>
                </div>
              </div>
            ) : null}

            {/* Lý thuyết */}
            {lyThuyet.length > 0 ? (
              <div className="tfs__card tfs__card--theory">
                <div className="tfs__card-theory-head">
                  <div className="tfs__card-icon-wrap tfs__card-icon-wrap--secondary">
                    <Icon name="menu_book" />
                  </div>
                  <div className="tfs__card-theory-score">
                    <p className="tfs__card-theory-score-label">Kết quả</p>
                    <p className="tfs__card-theory-score-val">
                      {lyThuyet.filter((x) => x.hoanThanh).length}/{lyThuyet.length}
                    </p>
                  </div>
                </div>
                <h3 className="tfs__card-title">Lý thuyết</h3>
                <div className="tfs__theory-grid">
                  {lyThuyet.map((it) => (
                    <div key={it.key} className="tfs__theory-item">
                      <Icon
                        name={it.hoanThanh ? 'check_circle' : 'radio_button_unchecked'}
                        className={it.hoanThanh ? 'tfs__theory-check tfs__theory-check--on' : 'tfs__theory-check'}
                      />
                      <span>{it.mon}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Cabin */}
            {cabin ? (
              <div className="tfs__card tfs__card--accent tfs__card--cabin">
                <div className="tfs__card-accent-icon">
                  <Icon name="psychology" />
                </div>
                <div className="tfs__card-accent-body">
                  <p className="tfs__card-accent-label">Mô phỏng cabin</p>
                  <p className="tfs__card-accent-value">{cabin.tongGio}</p>
                  {cabin.baiHoanThanh ? (
                    <p className="tfs__card-accent-sub">Bài: {cabin.baiHoanThanh}</p>
                  ) : null}
                  <span className={cabin.hoanThanh ? 'tfs__badge-solid' : 'tfs__badge-outline'}>
                    {cabin.hoanThanh ? 'Đã đạt' : 'Chưa đạt'}
                  </span>
                </div>
              </div>
            ) : null}

            {/* Cao tốc */}
            {caoToc ? (
              <div className="tfs__card tfs__card--accent tfs__card--caotoc">
                <div className="tfs__card-accent-icon tfs__card-accent-icon--tertiary">
                  <Icon name="speed" />
                </div>
                <div className="tfs__card-accent-body">
                  <p className="tfs__card-accent-label">Cao tốc</p>
                  <p className="tfs__card-accent-value">{caoToc.tongGio !== '0' ? caoToc.tongGio : '—'}</p>
                  {caoToc.tongKm !== '0' ? (
                    <p className="tfs__card-accent-sub">{caoToc.tongKm} km · TB {caoToc.vanTocTB} km/h</p>
                  ) : null}
                  <span className={caoToc.hoanThanh ? 'tfs__badge-solid' : 'tfs__badge-outline'}>
                    {caoToc.hoanThanh ? 'Đã đạt' : 'Chưa đạt'}
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Instructor & Vehicle */}
      {instructor !== null || plate !== null ? (
        <div className="tfs__meta-row">
          {instructor !== null ? (
            <div className="tfs__meta-card tfs__meta-card--instructor">
              <div className="tfs__meta-inner">
                <Icon name="supervisor_account" className="tfs__meta-icon" />
                <div>
                  <p className="tfs__meta-label">Giáo viên hướng dẫn</p>
                  <p className="tfs__meta-value">GV. {instructor.toUpperCase()}</p>
                </div>
              </div>
            </div>
          ) : null}
          {plate !== null ? (
            <div className="tfs__meta-card tfs__meta-card--vehicle">
              <div className="tfs__meta-inner">
                <Icon name="minor_crash" className="tfs__meta-icon" />
                <div>
                  <p className="tfs__meta-label">Phương tiện tập lái</p>
                  <p className="tfs__meta-value">{plate}</p>
                </div>
              </div>
              {rankChip ? (
                <span className="tfs__vehicle-class">{rankChip}</span>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Thiếu đủ panel */}
      {thieuDu !== null ? <ThieuDuPanel data={thieuDu} /> : null}

      {/* Theory detail table */}
      {lyThuyet.length > 0 ? <TheoryTable rows={lyThuyet} /> : null}

      {/* Giấy tờ table */}
      {giayTo.length > 0 ? <GiayToTable rows={giayTo} /> : null}

      {/* Session history tables */}
      <div className="tfs__history-stack">
        {moduleHistories.length === 0 ? (
          <SessionTable title="Lộ trình thực hành" sessions={[]} onRowClick={setActiveSession} />
        ) : (
          moduleHistories.map((mod) => (
            <SessionTable
              key={mod.key}
              title={mod.title}
              sessions={mod.sessions}
              onRowClick={setActiveSession}
            />
          ))
        )}
      </div>

      {/* Route detail modal */}
      {activeSession !== null && (
        <Suspense fallback={null}>
          <SessionRouteModal
            session={activeSession}
            maDK={maSo !== '—' ? maSo : null}
            studentName={hoTen}
            onClose={() => setActiveSession(null)}
          />
        </Suspense>
      )}
    </div>
  );
};

export default TrainingFullStudentView;
