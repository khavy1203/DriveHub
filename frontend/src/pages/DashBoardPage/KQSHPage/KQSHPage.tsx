import React from 'react';
import { useKQSH } from '../../../features/kqsh';
import KQSHCardList from '../../../features/kqsh/components/KQSHCardList';

const KQSHPage: React.FC = () => {
  const { data, loading, error } = useKQSH();

  return (
    <div className="kq__page">
      <div className="kq__page-header">
        <h2 className="kq__title">Kết quả sát hạch</h2>
        {data?.hoTen && <p className="kq__hoten">Họ tên: <strong>{data.hoTen}</strong></p>}
      </div>
      <KQSHCardList
        records={data?.records ?? []}
        loading={loading}
        error={error}
        emptyMessage="Chưa có kết quả. Dữ liệu được đồng bộ từ hệ thống sát hạch. Vui lòng liên hệ trung tâm nếu bạn đã thi nhưng chưa thấy kết quả."
      />
    </div>
  );
};

export default KQSHPage;
