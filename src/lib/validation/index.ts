/** Validation helpers. Messages say what went wrong and how to fix it. Nothing is silently clamped. */
export const MAX_REASONABLE = 1e7;

export class ValidationError extends Error {
  issues: string[];
  constructor(issues: string[]) {
    super(issues.join(' '));
    this.issues = issues;
  }
}

export class Checker {
  issues: string[] = [];
  positive(v: number | null | undefined, label: string): v is number {
    if (v === null || v === undefined || Number.isNaN(v)) {
      this.issues.push(`Enter a number for ${label}.`);
      return false;
    }
    if (!Number.isFinite(v)) {
      this.issues.push(`${label} must be a finite number.`);
      return false;
    }
    if (v <= 0) {
      this.issues.push(`${label} must be greater than 0. Enter a positive value.`);
      return false;
    }
    if (v > MAX_REASONABLE) {
      this.issues.push(`${label} is unrealistically large. Check the value and unit.`);
      return false;
    }
    return true;
  }
  nonNegative(v: number | null | undefined, label: string): v is number {
    if (v === null || v === undefined || Number.isNaN(v)) {
      this.issues.push(`Enter a number for ${label}, or 0.`);
      return false;
    }
    if (v < 0) {
      this.issues.push(`${label} cannot be negative. Enter 0 or a positive value.`);
      return false;
    }
    if (v > MAX_REASONABLE) {
      this.issues.push(`${label} is unrealistically large. Check the value and unit.`);
      return false;
    }
    return true;
  }
  integerPositive(v: number | null | undefined, label: string): v is number {
    if (!this.positive(v, label)) return false;
    if (!Number.isInteger(v)) {
      this.issues.push(`${label} must be a whole number. Enter a whole number such as 10.`);
      return false;
    }
    return true;
  }
  fail(message: string) {
    this.issues.push(message);
  }
  get ok() {
    return this.issues.length === 0;
  }
}

/** Float tolerance for comparing computed quantities (not for classification thresholds). */
export const EPS = 1e-9;
export const approxEqual = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) <= eps * Math.max(1, Math.abs(a), Math.abs(b));
