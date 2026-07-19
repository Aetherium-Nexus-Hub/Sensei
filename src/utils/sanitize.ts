/**
 * Utility for basic input sanitization to safeguard against XSS or script injections
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
}
