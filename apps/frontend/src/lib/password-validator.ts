/**
 * @file password-validator.ts
 * @path apps/frontend/src/lib/password-validator.ts
 * @description Validasi kekuatan password di form frontend.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

/**
 * Password strength validator
 * Requirements: minimum 12 characters, uppercase, lowercase, number, and symbol
 */

export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 12) {
    errors.push("Password minimal 12 karakter");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Harus mengandung huruf besar (A-Z)");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Harus mengandung huruf kecil (a-z)");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Harus mengandung angka (0-9)");
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Harus mengandung simbol (!@#$%^&* dll)");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function getPasswordStrengthPercentage(password: string): number {
  let strength = 0;

  if (password.length >= 12) strength += 20;
  if (password.length >= 16) strength += 10;
  if (password.length >= 20) strength += 10;

  if (/[A-Z]/.test(password)) strength += 15;
  if (/[a-z]/.test(password)) strength += 15;
  if (/[0-9]/.test(password)) strength += 15;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength += 15;

  return Math.min(strength, 100);
}

export function getPasswordStrengthColor(strength: number): string {
  if (strength < 30) return "#ef4444"; // red
  if (strength < 60) return "#f97316"; // orange
  if (strength < 85) return "#eab308"; // yellow
  return "#22c55e"; // green
}

export function getPasswordStrengthLabel(strength: number): string {
  if (strength < 30) return "Sangat Lemah";
  if (strength < 60) return "Lemah";
  if (strength < 85) return "Sedang";
  return "Kuat";
}
