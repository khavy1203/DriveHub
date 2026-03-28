import React from 'react';
import { useKQSHSync } from '../../../features/kqsh';
import './KQSHSyncPanel.scss';

const KQSHSyncPanel: React.FC = () => {
  const { syncing, result, error, triggerSync } = useKQSHSync();

  return (
    <div className="kqsp__panel">
      <div className="kqsp__icon-wrap">
        <i className="material-icons">sync</i>
      </div>

      <div className="kqsp__content">
        <h3 className="kqsp__title">Đồng bộ dữ liệu sát hạch</h3>
        <p className="kqsp__desc">
          Kéo dữ liệu từ hệ thống GPLX về server theo CCCD của học viên trong hệ thống.
        </p>

        <button
          type="button"
          className="kqsp__btn"
          onClick={triggerSync}
          disabled={syncing}
        >
          {syncing ? (
            <>
              <span className="kqsp__spinner" />
              Đang đồng bộ…
            </>
          ) : (
            <>
              <i className="material-icons">sync</i>
              Đồng bộ ngay
            </>
          )}
        </button>

        {result && (
          <div className="kqsp__result kqsp__result--success">
            <i className="material-icons">check_circle</i>
            <span>
              Đã sync <strong>{result.synced}</strong> bản ghi
              {result.skipped > 0 && <>, bỏ qua <strong>{result.skipped}</strong></>}
            </span>
          </div>
        )}

        {error && (
          <div className="kqsp__result kqsp__result--error">
            <i className="material-icons">error_outline</i>
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default KQSHSyncPanel;
