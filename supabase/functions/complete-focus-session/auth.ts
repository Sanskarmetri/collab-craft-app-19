export function getBearerToken(authHeader: string | null): string | null {
  const match = authHeader?.match(/^Bearer\s+([^\s]+)$/i);
  return match?.[1] ?? null;
}