export type JwtPayload = {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
  hospitalId?: string | null;
  departmentId?: string | null;
  jti?: string;
};
