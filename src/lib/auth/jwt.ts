export function isJwtExpired(token: string, leewaySeconds = 30): boolean {
  try {
    const segment = token.split('.')[1];
    if (!segment) return true;

    const payload = JSON.parse(
      Buffer.from(segment.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
    ) as { exp?: number };

    if (!payload.exp) return true;

    return payload.exp * 1000 <= Date.now() + leewaySeconds * 1000;
  } catch {
    return true;
  }
}

export function isJwtUsable(token: string | undefined): token is string {
  return Boolean(token && !isJwtExpired(token));
}
