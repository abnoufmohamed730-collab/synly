export function isPasswordPolicyValid(password: string): boolean {
  return password.length >= 8 && password.length <= 128 && [/[A-Z]/.test(password), /[a-z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length >= 3;
}
