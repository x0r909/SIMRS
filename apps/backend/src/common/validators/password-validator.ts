/**
 * Password Validator Service
 * Validates password complexity requirements
 */

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  strength: 'weak' | 'fair' | 'good' | 'strong';
}

export class PasswordValidator {
  /**
   * Validate password against requirements
   * - Min 8 characters
   * - 1 uppercase letter
   * - 1 lowercase letter
   * - 1 number
   * - 1 special character
   */
  static validate(password: string): PasswordValidationResult {
    const errors: string[] = [];
    let strength = 'weak';

    // Check length
    if (!password || password.length < 8) {
      errors.push('Password harus minimal 8 karakter');
    } else if (password.length >= 8 && password.length < 12) {
      strength = 'fair';
    } else if (password.length >= 12 && password.length < 16) {
      strength = 'good';
    } else if (password.length >= 16) {
      strength = 'strong';
    }

    // Check uppercase
    if (!/[A-Z]/.test(password)) {
      errors.push('Password harus mengandung minimal 1 huruf besar (A-Z)');
    }

    // Check lowercase
    if (!/[a-z]/.test(password)) {
      errors.push('Password harus mengandung minimal 1 huruf kecil (a-z)');
    }

    // Check number
    if (!/[0-9]/.test(password)) {
      errors.push('Password harus mengandung minimal 1 angka (0-9)');
    }

    // Check special character
    if (!/[!@#$%^&*()_\-+=\[\]{};:'",.<>?/\\|`~]/.test(password)) {
      errors.push('Password harus mengandung minimal 1 karakter spesial (!@#$%^&*)');
    }

    // Reset strength if there are errors
    if (errors.length > 0) {
      strength = 'weak';
    }

    return {
      valid: errors.length === 0,
      errors,
      strength: strength as 'weak' | 'fair' | 'good' | 'strong'
    };
  }

  /**
   * Generate password suggestion
   */
  static generateStrongPassword(length: number = 12): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*';

    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    const allChars = uppercase + lowercase + numbers + special;
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    return password
      .split('')
      .sort(() => 0.5 - Math.random())
      .join('');
  }

  /**
   * Check if password is commonly used
   */
  static isCommonPassword(password: string): boolean {
    const commonPasswords = [
      'password', 'password123', '123456', '12345678',
      'qwerty', 'abc123', 'admin', 'letmein',
      'welcome', 'monkey', 'dragon', 'master'
    ];

    return commonPasswords.includes(password.toLowerCase());
  }
}
