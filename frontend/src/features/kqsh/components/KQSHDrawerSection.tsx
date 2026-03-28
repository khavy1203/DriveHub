import React from 'react';
import { useKQSHByStudent } from '../hooks/useKQSHByStudent';
import KQSHCardList from './KQSHCardList';

type Props = { hocVienId: number };

const KQSHDrawerSection: React.FC<Props> = ({ hocVienId }) => {
  const { data, loading, error } = useKQSHByStudent(hocVienId, 'admin');

  return (
    <KQSHCardList
      records={data?.records ?? []}
      loading={loading}
      error={error}
      emptyMessage="Chưa có dữ liệu sát hạch cho học viên này."
      defaultAllCollapsed
    />
  );
};

export default KQSHDrawerSection;
