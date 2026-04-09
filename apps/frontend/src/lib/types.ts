export type ApiErrorPayload = {
  status: number;
  message: string;
  path?: string;
  timestamp?: string;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
};

export type ApiEnvelope<T> =
  | { success: true; data: T; meta?: PaginationMeta }
  | { success: false; error: ApiErrorPayload };

export type Paginated<T> = {
  data: T[];
  meta: PaginationMeta;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  status: "ACTIVE" | "DISABLED";
  roles: string[];
  permissions: string[];
};

export type LoginResult = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type PatientRegistrationResult = {
  message: string;
  user: {
    id: string;
    email: string;
    name: string;
    status: "ACTIVE" | "DISABLED";
  };
  patient: {
    id: string;
    mrn: string;
    name: string;
    phone?: string | null;
    address?: string | null;
    birthDate?: string | null;
    createdAt: string;
  };
};

export type Patient = {
  id: string;
  mrn: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  birthDate?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Doctor = {
  id: string;
  code: string;
  name: string;
  specialty?: string | null;
  phone?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AppointmentStatus = "SCHEDULED" | "CHECKED_IN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export type Appointment = {
  id: string;
  scheduledAt: string;
  status: AppointmentStatus;
  notes?: string | null;
  patientId: string;
  doctorId: string;
  patient?: Pick<Patient, "id" | "mrn" | "name">;
  doctor?: Pick<Doctor, "id" | "code" | "name" | "specialty">;
  visit?: { id: string } | null;
  createdAt: string;
  updatedAt: string;
};

export type QueueStatus = "WAITING" | "CALLED" | "IN_SERVICE" | "DONE" | "CANCELLED";

export type QueueEntry = {
  id: string;
  number: number;
  date: string;
  status: QueueStatus;
  patientId: string;
  doctorId?: string | null;
  patient?: Pick<Patient, "id" | "mrn" | "name">;
  doctor?: Pick<Doctor, "id" | "code" | "name" | "specialty"> | null;
  createdAt: string;
  updatedAt: string;
};

export type Medicine = {
  id: string;
  sku: string;
  name: string;
  unit: string;
  stock: number;
  price: number;
  createdAt: string;
  updatedAt: string;
};

export type Visit = {
  id: string;
  startedAt: string;
  endedAt?: string | null;
  complaint?: string | null;
  diagnosis?: string | null;
  patientId: string;
  doctorId: string;
  appointmentId?: string | null;
  patient?: Pick<Patient, "id" | "mrn" | "name">;
  doctor?: Pick<Doctor, "id" | "code" | "name">;
  appointment?: { id: string; status?: AppointmentStatus; scheduledAt?: string } | null;
  invoice?: { id: string; number?: string; status?: "UNPAID" | "PAID"; total?: number } | null;
  createdAt: string;
  updatedAt: string;
};

export type DailyOrderSummary = {
  date: string;
  counts: {
    menunggu: number;
    proses: number;
    selesai: number;
    total: number;
  };
};

export type LaboratoryResult = {
  id: string;
  orderId: string;
  parameter: string;
  value: string;
  unit?: string | null;
  normalRange?: string | null;
  notes?: string | null;
  resultedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type LaboratoryOrder = {
  id: string;
  visitId: string;
  doctorId: string;
  testType: string;
  notes?: string | null;
  status: "MENUNGGU" | "PROSES" | "SELESAI" | "BATAL";
  orderedAt: string;
  createdAt: string;
  updatedAt: string;
  visit?: {
    id: string;
    startedAt: string;
    patient?: Pick<Patient, "id" | "mrn" | "name">;
    doctor?: Pick<Doctor, "id" | "code" | "name">;
  };
  doctor?: Pick<Doctor, "id" | "code" | "name" | "specialty">;
  results?: LaboratoryResult[];
};

export type RadiologyResult = {
  id: string;
  orderId: string;
  description: string;
  impression?: string | null;
  filePath?: string | null;
  resultedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type RadiologyOrder = {
  id: string;
  visitId: string;
  doctorId: string;
  examType: string;
  notes?: string | null;
  status: "MENUNGGU" | "PROSES" | "SELESAI" | "BATAL";
  orderedAt: string;
  createdAt: string;
  updatedAt: string;
  visit?: {
    id: string;
    startedAt: string;
    patient?: Pick<Patient, "id" | "mrn" | "name">;
    doctor?: Pick<Doctor, "id" | "code" | "name">;
  };
  doctor?: Pick<Doctor, "id" | "code" | "name" | "specialty">;
  results?: RadiologyResult[];
};

export type BillingItem = {
  id: string;
  name: string;
  qty: number;
  price: number;
  subtotal: number;
};

export type BillingInvoice = {
  id: string;
  number: string;
  status: "UNPAID" | "PAID";
  total: number;
  visitId: string;
  items: BillingItem[];
  visit?: {
    id: string;
    startedAt: string;
    patient?: Pick<Patient, "id" | "mrn" | "name">;
    doctor?: Pick<Doctor, "id" | "code" | "name">;
  };
  createdAt: string;
  updatedAt: string;
};

export type Permission = {
  id: string;
  key: string;
  name: string;
  description?: string | null;
};

export type Role = {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  permissions?: Array<{
    permissionId: string;
    permission: Permission;
  }>;
  createdAt: string;
  updatedAt: string;
};

export type UserRoleRef = {
  id: string;
  key: string;
  name: string;
};

export type User = {
  id: string;
  email: string;
  name: string;
  status: "ACTIVE" | "DISABLED";
  roles: UserRoleRef[];
  createdAt: string;
  updatedAt: string;
};

export type FileObject = {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  bucket: string;
  objectKey: string;
  createdAt: string;
};

