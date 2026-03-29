export type Role = {
  id: number;
  url: string;
  description: string;
  groups?: GroupSummary[];
};

export type Group = {
  id: number;
  name: string;
  description: string;
  userCount: number;
  roles: Role[];
};

export type GroupSummary = Pick<Group, 'id' | 'name'>;

export type PermissionUser = {
  id: number;
  email: string;
  username: string;
  phone?: string;
  active: number;
  groupId: number;
  group: GroupSummary;
};

export type PermissionUsersResponse = {
  total: number;
  page: number;
  limit: number;
  users: PermissionUser[];
};

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'ALL';

export type ApiEndpoint = {
  id: number;
  method: ApiMethod;
  path: string;
  pattern: string;
  featureGroup: string;
  description: string;
  isPublic: boolean;
  isActive: boolean;
  sortOrder: number;
  groupIds?: number[];
};

export type PermissionMatrixGroup = {
  id: number;
  name: string;
  description?: string;
};

export type GroupApiMatrix = {
  groups: PermissionMatrixGroup[];
  endpoints: ApiEndpoint[];
  matrix: Record<number, number[]>;
};
