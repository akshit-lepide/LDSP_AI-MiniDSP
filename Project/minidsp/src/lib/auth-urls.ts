export function getRecoveryCallbackUrl(origin: string): string {
  const callback = new URL("/auth/callback", origin);
  callback.searchParams.set("next", "/reset-password");
  return callback.toString();
}