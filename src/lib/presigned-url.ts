/**
 * Heuristic: detect AWS SigV4 / S3 presigned URLs.
 *
 * We use this to avoid storing or rendering expiring avatar URLs.
 */
export function isPresignedUrl(url: string): boolean {
  const t = (url ?? '').toString().trim();
  if (!t) return false;
  const lower = t.toLowerCase();
  return (
    lower.includes('x-amz-algorithm=') ||
    lower.includes('x-amz-signature=') ||
    lower.includes('x-amz-credential=') ||
    lower.includes('x-amz-date=') ||
    lower.includes('x-amz-expires=')
  );
}

export function buildPublicR2Url(publicBase: string | null | undefined, key: string | null | undefined): string | null {
  const base = (publicBase ?? '').toString().trim().replace(/\/$/, '');
  const k = (key ?? '').toString().trim().replace(/^\//, '');
  if (!base || !k) return null;
  return `${base}/${k}`;
}

