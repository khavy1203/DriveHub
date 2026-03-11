import React, { useState } from 'react';
import './TrafficCheck.css';
import type { ViolationRecord } from '../types';
import instance from '../../../axios';

const VEHICLE_TYPES = [
  { value: '1', label: 'Xe ô tô', icon: 'airport_shuttle' },
  { value: '2', label: 'Xe máy', icon: 'two_wheeler' },
  { value: '3', label: 'Xe đạp điện', icon: 'electric_bike' },
];

const TrafficCheck: React.FC = () => {
  const [loaiXe, setLoaiXe] = useState('1');
  const [bienSo, setBienSo] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ViolationRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bienSo.trim()) {
      setError('Vui lòng nhập biển số xe.');
      return;
    }
    setLoading(true);
    setError(null);
    setResults(null);
    setSearched(true);

    try {
      const response = await instance.post('/api/traffic-check/lookup', {
        BienKiemSoat: bienSo.trim(),
        LoaiXe: loaiXe,
      });
      const data = response.data;
      if (data.success && Array.isArray(data.data)) {
        setResults(data.data);
      } else if (!data.success) {
        setError(data.message || 'Hệ thống đang bận. Vui lòng thử lại.');
      }
    } catch {
      setError('Lỗi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  const selectedVehicle = VEHICLE_TYPES.find((v) => v.value === loaiXe);

  return (
    <div className="tc-wrapper">
      {/* Banner */}
      <div className="tc-banner">
        <div className="tc-banner-content">
          <img src="https://anh.csgt.vn/logo-csgt.png" alt="Logo" className="tc-banner-logo" />
          <div className="tc-banner-text">
            <span className="tc-banner-line1">BỘ CÔNG AN</span>
            <span className="tc-banner-line2">CỤC CẢNH SÁT GIAO THÔNG</span>
          </div>
        </div>
      </div>

      {/* Navbar */}
      <div className="tc-navbar">
        <div className="tc-navbar-content">
          <a href="/"><i className="material-icons">home</i></a>
          <div className="tc-navbar-spacer"></div>
          <i className="material-icons">search</i>
        </div>
      </div>

      <div className="tc-container">
        {/* Form Card */}
        <div className="tc-form-card">
          <div className="tc-title">Tra cứu phạt nguội</div>
          <div className="tc-form-body">
            <form onSubmit={handleSearch}>
              <div className="tc-field-group">
                <label>Loại phương tiện</label>
                <div className="tc-input-wrapper">
                  <div className="tc-input-prefix">
                    <i className="material-icons">{selectedVehicle?.icon}</i>
                  </div>
                  <select 
                    className="tc-select-field"
                    value={loaiXe}
                    onChange={(e) => setLoaiXe(e.target.value)}
                  >
                    {VEHICLE_TYPES.map(v => (
                      <option key={v.value} value={v.value}>{v.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="tc-field-group">
                <label>Biển số xe</label>
                <div className="tc-input-wrapper">
                  <div className="tc-input-prefix">123</div>
                  <input 
                    type="text"
                    className="tc-input-field"
                    placeholder="Nhập biển số xe ví dụ 89a22222"
                    value={bienSo}
                    onChange={(e) => setBienSo(e.target.value)}
                  />
                </div>
              </div>

              {error && <div style={{ color: '#dc2626', marginBottom: '16px', fontSize: '14px', textAlign: 'center' }}>{error}</div>}

              <button type="submit" className="tc-submit-btn" disabled={loading}>
                {loading ? 'Đang kiểm tra...' : 'Tra cứu'}
              </button>
            </form>
          </div>
        </div>

        {/* Results */}
        {searched && !loading && (
          <div className="tc-results">
            {results && results.length > 0 ? (
              <div className="tc-results-list">
                {results.map((item, idx) => (
                  <div key={idx} className="tc-violation-card">
                    <div className="tc-v-header">
                      <span className="tc-v-plate">Biển số: {bienSo.toUpperCase()}</span>
                      <span className={`tc-v-status ${item.trang_thai?.toLowerCase().includes('chưa') ? 'pending' : 'done'}`}>
                        {item.trang_thai || 'Chưa xử phạt'}
                      </span>
                    </div>
                    <div className="tc-v-body">
                      <div className="tc-v-section">
                        <h3>Thông tin phương tiện</h3>
                        <p><strong>Loại xe:</strong> {VEHICLE_TYPES.find(v => v.value === loaiXe)?.label}</p>
                        <p><strong>Màu biển:</strong> {item.mau_bien || 'Nền màu trắng, chữ và số màu đen'}</p>
                      </div>
                      <div className="tc-v-section">
                        <h3>Chi tiết vi phạm</h3>
                        <p><strong>Thời gian:</strong> {item.ngay_vi_pham}</p>
                        <p><strong>Địa điểm:</strong> {item.dia_diem}</p>
                        <p><strong>Lỗi vi phạm:</strong> {item.hanh_vi}</p>
                      </div>
                      <div className="tc-v-section">
                        <h3>Thông tin xử lý</h3>
                        <p><strong>Đơn vị phát hiện:</strong> {item.don_vi_phat_hien}</p>
                        <p><strong>Đơn vị giải quyết:</strong> {item.don_vi_giai_quyet}</p>
                        {item.diachi_diem_giaiquyet && <p><strong>Địa chỉ:</strong> {item.diachi_diem_giaiquyet}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              !error && (
                <p style={{ textAlign: 'center', color: '#666' }}>Không tìm thấy dữ liệu vi phạm.</p>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrafficCheck;
