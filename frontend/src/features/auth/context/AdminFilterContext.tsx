import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../../../axios';
import { useAuth } from '../hooks/useAuth';

export type AdminOption = { id: number; username: string; email: string; active: number };

type AdminFilterContextValue = {
  selectedAdminId: number | null;
  setSelectedAdminId: (id: number | null) => void;
  adminList: AdminOption[];
  loadingAdmins: boolean;
};

const AdminFilterContext = createContext<AdminFilterContextValue>({
  selectedAdminId: null,
  setSelectedAdminId: () => {},
  adminList: [],
  loadingAdmins: false,
});

export const AdminFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { role } = useAuth();
  const [selectedAdminId, setSelectedAdminId] = useState<number | null>(null);
  const [adminList, setAdminList] = useState<AdminOption[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  useEffect(() => {
    if (role !== 'SupperAdmin') {
      setAdminList([]);
      setSelectedAdminId(null);
      return;
    }
    setLoadingAdmins(true);
    axios.get('/api/admins')
      .then(res => { if (res.data?.EC === 0) setAdminList(res.data.DT ?? []); })
      .catch(() => {})
      .finally(() => setLoadingAdmins(false));
  }, [role]);

  return (
    <AdminFilterContext.Provider value={{ selectedAdminId, setSelectedAdminId, adminList, loadingAdmins }}>
      {children}
    </AdminFilterContext.Provider>
  );
};

export const useAdminFilter = () => useContext(AdminFilterContext);
