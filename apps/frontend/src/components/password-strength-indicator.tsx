"use client";


/**
 * @file password-strength-indicator.tsx
 * @path apps/frontend/src/components/password-strength-indicator.tsx
 * @description Indikator visual kekuatan password.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { useEffect, useState } from "react";
import { useWatch } from "react-hook-form";
import {
  validatePasswordStrength,
  getPasswordStrengthPercentage,
  getPasswordStrengthColor,
  getPasswordStrengthLabel
} from "@/lib/password-validator";

interface PasswordStrengthIndicatorProps {
  control: any;
  passwordFieldName?: string;
}

export function PasswordStrengthIndicator({
  control,
  passwordFieldName = "password"
}: PasswordStrengthIndicatorProps) {
  const password = useWatch({ control, name: passwordFieldName }) || "";
  const [strength, setStrength] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!password) {
      setStrength(0);
      setErrors([]);
      return;
    }

    const { isValid, errors: validationErrors } = validatePasswordStrength(password);
    const strengthPercentage = getPasswordStrengthPercentage(password);

    setStrength(strengthPercentage);
    setErrors(validationErrors);
  }, [password]);

  if (!password) return null;

  const strengthColor = getPasswordStrengthColor(strength);
  const strengthLabel = getPasswordStrengthLabel(strength);

  return (
    <div className="mt-3 space-y-2 rounded-lg bg-muted p-3">
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium">Kekuatan Password:</span>
          <span style={{ color: strengthColor }} className="font-semibold">
            {strengthLabel}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted-foreground/20">
          <div
            className="h-full transition-all"
            style={{
              width: `${strength}%`,
              backgroundColor: strengthColor
            }}
          />
        </div>
      </div>

      {errors.length > 0 && (
        <ul className="space-y-1 text-xs text-muted-foreground">
          {errors.map((error, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="mt-1 inline-block h-1 w-1 rounded-full bg-destructive" />
              <span>{error}</span>
            </li>
          ))}
        </ul>
      )}

      {errors.length === 0 && (
        <p className="flex items-start gap-2 text-xs text-green-600">
          <span className="mt-1 inline-block h-1 w-1 rounded-full bg-green-600" />
          Password memenuhi semua persyaratan keamanan
        </p>
      )}
    </div>
  );
}
