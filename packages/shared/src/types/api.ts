export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: PaginationMeta;
};

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export type JwtPayload = {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
  hospitalId?: string | null;
  departmentId?: string | null;
  jti?: string;
};
