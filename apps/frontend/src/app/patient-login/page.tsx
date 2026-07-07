/**
 * @file page.tsx
 * @path apps/frontend/src/app/patient-login/page.tsx
 * @description Halaman login khusus akun pasien.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { PatientLoginForm } from "@/components/patient-login-form";

export default function PatientLoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-start bg-muted px-6 py-8 md:justify-center md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <PatientLoginForm />
      </div>
    </div>
  );
}
