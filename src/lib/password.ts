import { isValidEmail } from "./sanitize";

export function passwordIssues(password: string): string[] {
  const issues: string[] = [];
  if (password.length < 10) issues.push("Use at least 10 characters.");
  if (password.length > 128) issues.push("Use at most 128 characters.");
  if (!/[a-z]/.test(password)) issues.push("Include a lowercase letter.");
  if (!/[A-Z]/.test(password)) issues.push("Include an uppercase letter.");
  if (!/[0-9]/.test(password)) issues.push("Include a number.");
  if (!/[^A-Za-z0-9]/.test(password)) issues.push("Include a symbol.");
  return issues;
}

export function signupIssues(input: { email: string; password: string; confirm: string }): string[] {
  const issues: string[] = [];
  if (!isValidEmail(input.email)) issues.push("Use a valid email address.");
  issues.push(...passwordIssues(input.password));
  if (!input.confirm) issues.push("Enter the password again.");
  else if (input.password !== input.confirm) issues.push("Passwords do not match.");
  return issues;
}
