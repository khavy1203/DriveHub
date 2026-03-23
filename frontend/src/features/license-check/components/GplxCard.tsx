import React from 'react';
import { GplxCardProps } from '../types';

const isNoExpiry = (date?: string) => !date || date.includes('9999');

const GplxCard: React.FC<GplxCardProps> = ({ record, index }) => {
  const isValid = record.verificationResult?.toLowerCase().includes('hợp lệ');
  const live = record.liveInfo;
  const isLiveSuccess = live?.status === 'SUCCESS';
  const vehicleLabel = record.loaiXe === 'oto' ? 'Ô tô' : 'Xe máy';
  const vehicleIcon  = record.loaiXe === 'oto' ? 'directions_car' : 'two_wheeler';

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
          <div className="gplx-row"><span className="gplx-label">Họ và tên</span><span className="gplx-value">{record.fullName || '—'}</span></div>
          <div className="gplx-row"><span className="gplx-label">Ngày sinh</span><span className="gplx-value">{record.dateOfBirth || '—'}</span></div>
          {record.rejectionReason && (
            <div className="gplx-row gplx-row-full"><span className="gplx-label">Lý do từ chối</span><span className="gplx-value gplx-error">{record.rejectionReason}</span></div>
          )}
        </div>

        {live !== undefined && (
          <div className="gplx-live-wrapper">
            <div className="gplx-live-title">
              <i className="material-icons">cloud_sync</i>
              Tra cứu thực tế từ CSGT
              <span className="gplx-live-vehicle-badge">
                <i className="material-icons">{vehicleIcon}</i>
                {vehicleLabel}
              </span>
              <span className={`gplx-live-status ${isLiveSuccess ? 'ok' : 'fail'}`}>
                <i className="material-icons">{isLiveSuccess ? 'check_circle' : 'cancel'}</i>
                {isLiveSuccess ? 'Hợp lệ' : 'Không tìm thấy'}
              </span>
            </div>

            {isLiveSuccess && live && (
              <div className="gplx-live-rows gplx-live-rows--single">
                {live.licenseNumber && <div className="gplx-row"><span className="gplx-label">Số GPLX</span><span className="gplx-value gplx-highlight">{live.licenseNumber}</span></div>}
                {live.foilNumber    && <div className="gplx-row"><span className="gplx-label">Số phôi bằng</span><span className="gplx-value gplx-highlight">{live.foilNumber}</span></div>}
                {live.licenseClass  && <div className="gplx-row"><span className="gplx-label">Hạng</span><span className="gplx-value">{live.licenseClass}</span></div>}
                {live.issuedBy      && <div className="gplx-row"><span className="gplx-label">Nơi cấp</span><span className="gplx-value">{live.issuedBy}</span></div>}
                {live.issueDate     && <div className="gplx-row"><span className="gplx-label">Ngày cấp</span><span className="gplx-value">{live.issueDate}</span></div>}
                <div className="gplx-row">
                  <span className="gplx-label">Ngày hết hạn</span>
                  <span className={`gplx-value ${isNoExpiry(live.expiryDate) ? 'gplx-no-expiry' : ''}`}>
                    {isNoExpiry(live.expiryDate) ? 'Không thời hạn' : live.expiryDate || '—'}
                  </span>
                </div>
                {live.passingDate   && <div className="gplx-row"><span className="gplx-label">Ngày trúng tuyển</span><span className="gplx-value">{live.passingDate}</span></div>}
              </div>
            )}

            {!isLiveSuccess && (
              <p className="gplx-live-empty">Không tìm thấy dữ liệu trên hệ thống CSGT</p>
            )}
          </div>
        )}

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
