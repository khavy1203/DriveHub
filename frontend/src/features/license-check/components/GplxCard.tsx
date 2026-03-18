import React from 'react';
import { GplxCardProps } from '../types';

const GplxCard: React.FC<GplxCardProps> = ({ record, index }) => {
  const live = record.liveInfo;
  const isValid = record.verificationResult?.toLowerCase().includes('hợp lệ');

  return (
    <div className="gplx-card">
      <div className="gplx-card-header">
        <div className="gplx-card-title">
          <i className="material-icons">credit_card</i>
          <span>Bằng lái #{index + 1}</span>
        </div>
        <span className={`gplx-badge ${isValid ? 'valid' : 'invalid'}`}>
          <i className="material-icons">{isValid ? 'check_circle' : 'cancel'}</i>
          {record.verificationResult || 'Không xác định'}
        </span>
      </div>

      <div className="gplx-card-body">
        <div className="gplx-grid">
          <div className="gplx-row"><span className="gplx-label">Họ và tên</span><span className="gplx-value">{live?.fullName || record.fullName || '—'}</span></div>
          <div className="gplx-row"><span className="gplx-label">Số GPLX</span><span className="gplx-value gplx-highlight">{live?.licenseNumber || record.licenseNumber || '—'}</span></div>
          <div className="gplx-row"><span className="gplx-label">Hạng</span><span className="gplx-value">{live?.licenseClass || record.licenseClass || '—'}</span></div>
          <div className="gplx-row"><span className="gplx-label">Ngày sinh</span><span className="gplx-value">{live?.dateOfBirth || record.dateOfBirth || '—'}</span></div>
          {live && (
            <>
              <div className="gplx-row"><span className="gplx-label">Nơi cấp</span><span className="gplx-value">{live.issuedBy || '—'}</span></div>
              <div className="gplx-row"><span className="gplx-label">Ngày cấp</span><span className="gplx-value">{live.issueDate || '—'}</span></div>
              <div className="gplx-row"><span className="gplx-label">Ngày hết hạn</span><span className="gplx-value">{live.expiryDate || '—'}</span></div>
              <div className="gplx-row"><span className="gplx-label">Ngày trúng tuyển</span><span className="gplx-value">{live.passingDate || '—'}</span></div>
            </>
          )}
          {record.rejectionReason && (
            <div className="gplx-row gplx-row-full"><span className="gplx-label">Lý do từ chối</span><span className="gplx-value gplx-error">{record.rejectionReason}</span></div>
          )}
        </div>

        {record.liveError && (
          <div className="gplx-live-error">
            <i className="material-icons">warning_amber</i> {record.liveError}
          </div>
        )}
      </div>
    </div>
  );
};

export default GplxCard;