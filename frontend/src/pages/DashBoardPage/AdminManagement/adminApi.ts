import axios from '../../../axios';

type ApiRes<T> = { EC: number; EM: string; DT: T };

export type AdminRecord = {
  id: number;
  email: string;
  username: string;
  phone: string | null;
  address: string | null;
  active: number;
  featuredOnHomepage: boolean;
  supperTeacherCount: number;
  serverConfig: {
    apiBaseUrl: string | null;
    lastTestStatus: 'success' | 'error' | 'untested';
    lastTestedAt: string | null;
  } | null;
};

export type AdminDetail = AdminRecord & {
  managedSupperTeachers: { id: number; username: string; email: string; phone: string | null; active: number }[];
};

export type AdminFormData = {
  username: string;
  email: string;
  password: string;
  phone: string;
  address: string;
};

export const fetchAdmins = () =>
  axios.get<ApiRes<AdminRecord[]>>('/api/admins').then(r => r.data);

export const fetchAdminDetail = (adminId: number) =>
  axios.get<ApiRes<AdminDetail>>(`/api/admins/${adminId}`).then(r => r.data);

export const createAdminApi = (data: AdminFormData) =>
  axios.post<ApiRes<{ id: number }>>('/api/admins', data).then(r => r.data);

export const updateAdminApi = (adminId: number, data: Partial<AdminFormData>) =>
  axios.put<ApiRes<null>>(`/api/admins/${adminId}`, data).then(r => r.data);

export const toggleAdminActiveApi = (adminId: number) =>
  axios.patch<ApiRes<{ active: number }>>(`/api/admins/${adminId}/toggle-active`).then(r => r.data);

export const deleteAdminApi = (adminId: number) =>
  axios.delete<ApiRes<null>>(`/api/admins/${adminId}`).then(r => r.data);

export const assignSupperTeacherApi = (adminId: number, supperTeacherId: number) =>
  axios.post<ApiRes<null>>(`/api/admins/${adminId}/supper-teachers`, { supperTeacherId }).then(r => r.data);

export const detachSupperTeacherApi = (supperTeacherId: number) =>
  axios.delete<ApiRes<null>>(`/api/admins/supper-teachers/${supperTeacherId}`).then(r => r.data);

export const toggleFeaturedApi = (adminId: number) =>
  axios.patch<ApiRes<{ id: number; featuredOnHomepage: boolean }>>(`/api/admins/${adminId}/toggle-featured`).then(r => r.data);
