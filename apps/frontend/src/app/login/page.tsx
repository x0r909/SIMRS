/**
 * @file page.tsx
 * @path apps/frontend/src/app/login/page.tsx
 * @description Halaman login staff (admin, dokter, perawat, dll.).
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-start bg-muted px-6 py-8 md:justify-center md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <LoginForm />
      </div>
    </div>
  );
}
