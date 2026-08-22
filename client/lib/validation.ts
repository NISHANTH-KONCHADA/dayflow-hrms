const PASSWORD_MIN_LENGTH = 8;

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

export function validatePassword(password: string): ValidationResult {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.` };
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return { valid: false, message: "Password must include at least one letter and one number." };
  }
  return { valid: true };
}
