import { AuditAction, AuditStatus } from '@prisma/client';

export const getActionLabel = (action: AuditAction): string => {
  const labels: Record<AuditAction, string> = {
    [AuditAction.LOGIN]: 'Login',
    [AuditAction.LOGOUT]: 'Logout',
    [AuditAction.LOGIN_FAILED]: 'Login Gagal',
    [AuditAction.RESET_PASSWORD]: 'Reset Password',
    [AuditAction.CHANGE_PASSWORD]: 'Ganti Password',
    [AuditAction.USER_CREATE]: 'Buat User',
    [AuditAction.USER_UPDATE]: 'Edit User',
    [AuditAction.USER_DELETE]: 'Hapus User',
    [AuditAction.ROLE_CHANGE]: 'Ubah Role',
    [AuditAction.PATIENT_REGISTER]: 'Registrasi Pasien',
    [AuditAction.PATIENT_CREATE]: 'Buat Pasien',
    [AuditAction.PATIENT_UPDATE]: 'Edit Pasien',
    [AuditAction.PATIENT_DELETE]: 'Hapus Pasien',
    [AuditAction.DIAGNOSIS_ADD]: 'Tambah Diagnosa',
    [AuditAction.MEDICAL_RECORD_UPDATE]: 'Update Rekam Medis',
    [AuditAction.PRESCRIPTION_ADD]: 'Tambah Resep',
    [AuditAction.LAB_RESULT_UPLOAD]: 'Upload Hasil Lab',
    [AuditAction.APPOINTMENT_BOOK]: 'Booking Jadwal',
    [AuditAction.APPOINTMENT_RESCHEDULE]: 'Ubah Jadwal',
    [AuditAction.APPOINTMENT_CANCEL]: 'Batal Jadwal',
    [AuditAction.MEDICINE_STOCK_ADD]: 'Tambah Stok Obat',
    [AuditAction.MEDICINE_STOCK_UPDATE]: 'Update Stok Obat',
    [AuditAction.MEDICINE_OUT]: 'Obat Keluar',
    [AuditAction.DATABASE_BACKUP]: 'Backup Database',
    [AuditAction.DATABASE_RESTORE]: 'Restore Database',
    [AuditAction.SYSTEM_ERROR]: 'Error Sistem',
    [AuditAction.SETTING_UPDATE]: 'Update Setting',
    [AuditAction.OTHER]: 'Lainnya',
  };
  return labels[action] || action;
};

export const getStatusLabel = (status: AuditStatus): string => {
  const labels: Record<AuditStatus, string> = {
    [AuditStatus.SUCCESS]: 'Berhasil',
    [AuditStatus.FAILED]: 'Gagal',
    [AuditStatus.ERROR]: 'Error',
    [AuditStatus.WARNING]: 'Peringatan',
  };
  return labels[status] || status;
};

export const getStatusColor = (status: AuditStatus): string => {
  const colors: Record<AuditStatus, string> = {
    [AuditStatus.SUCCESS]: 'bg-green-100 text-green-800',
    [AuditStatus.FAILED]: 'bg-red-100 text-red-800',
    [AuditStatus.ERROR]: 'bg-red-100 text-red-800',
    [AuditStatus.WARNING]: 'bg-yellow-100 text-yellow-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getActionColor = (action: AuditAction): string => {
  // Success actions - green
  const successActions = [
    AuditAction.LOGIN,
    AuditAction.USER_CREATE,
    AuditAction.PATIENT_CREATE,
    AuditAction.PATIENT_REGISTER,
    AuditAction.APPOINTMENT_BOOK,
    AuditAction.DATABASE_BACKUP,
    AuditAction.PRESCRIPTION_ADD,
    AuditAction.LAB_RESULT_UPLOAD,
  ];

  // Delete actions - red
  const deleteActions = [
    AuditAction.USER_DELETE,
    AuditAction.PATIENT_DELETE,
    AuditAction.APPOINTMENT_CANCEL,
  ];

  // Update actions - blue
  const updateActions = [
    AuditAction.USER_UPDATE,
    AuditAction.PATIENT_UPDATE,
    AuditAction.MEDICAL_RECORD_UPDATE,
    AuditAction.MEDICINE_STOCK_UPDATE,
    AuditAction.APPOINTMENT_RESCHEDULE,
    AuditAction.SETTING_UPDATE,
  ];

  // Warning/error actions - yellow/red
  const warningActions = [
    AuditAction.LOGIN_FAILED,
    AuditAction.SYSTEM_ERROR,
  ];

  if (successActions.includes(action)) {
    return 'bg-green-100 text-green-800';
  }
  if (deleteActions.includes(action)) {
    return 'bg-red-100 text-red-800';
  }
  if (updateActions.includes(action)) {
    return 'bg-blue-100 text-blue-800';
  }
  if (warningActions.includes(action)) {
    return 'bg-yellow-100 text-yellow-800';
  }

  return 'bg-gray-100 text-gray-800';
};

export const getModuleLabel = (module: string): string => {
  const labels: Record<string, string> = {
    AUTH: 'Autentikasi',
    USER_MANAGEMENT: 'Manajemen User',
    PATIENT: 'Pasien',
    APPOINTMENT: 'Jadwal',
    MEDICAL_RECORD: 'Rekam Medis',
    PHARMACY: 'Apotek',
    BILLING: 'Tagihan',
    RADIOLOGY: 'Radiologi',
    LABORATORY: 'Laboratorium',
    QUEUE: 'Antrian',
    SYSTEM: 'Sistem',
    OTHER: 'Lainnya',
  };
  return labels[module] || module;
};
