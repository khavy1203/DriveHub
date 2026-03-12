/**
 * API related types
 * @module core/types/api
 */

export interface ApiResponse<T = unknown> {
  EC: number;
  EM: string;
  DT: T;
}

export interface ApiResponseLogin {
  EC: number;
  EM: string;
  DT: {
    access_token: string;
    groupWithRoles: GroupWithRoles;
    email: string;
    username: string;
    avatarUrl?: string | null;
  };
}

export interface GroupWithRoles {
  id: number;
  name: string | null;
  description: string | null;
  roles: string[] | null;
}

export interface ApiEndpoints {
  [key: string]: {
    [method: string]: {
      [action: string]: string;
    };
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
