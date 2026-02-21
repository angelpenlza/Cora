import { NextRequest } from 'next/server';
import { appendFileSync } from 'fs';
import { join } from 'path';

export async function GET(request: NextRequest) {
  const width = request.nextUrl.searchParams.get('width');
  const height = request.nextUrl.searchParams.get('height');
  const dpr = request.nextUrl.searchParams.get('dpr');
  const splashMedia = request.nextUrl.searchParams.get('splashMedia');
  const has440 = request.nextUrl.searchParams.get('has440');
  const splashHrefs = request.nextUrl.searchParams.get('splashHrefs');
  const first440Href = request.nextUrl.searchParams.get('first440Href');
  const standalone = request.nextUrl.searchParams.get('standalone');
  const metaCapable = request.nextUrl.searchParams.get('metaCapable');
  const splashDebug = request.nextUrl.searchParams.get('splashDebug');
  const imageStatus = request.nextUrl.searchParams.get('imageStatus');
  const imageLen = request.nextUrl.searchParams.get('imageLen');

  const data: Record<string, unknown> = { width, height, dpr, splashMedia, has440, userAgent: request.headers.get('user-agent')?.slice(0, 80) };
  if (splashHrefs != null) data.splashHrefs = splashHrefs;
  if (first440Href != null) data.first440Href = first440Href;
  if (standalone != null) data.standalone = standalone;
  if (metaCapable != null) data.metaCapable = metaCapable;
  if (splashDebug != null) data.splashDebug = splashDebug;
  if (imageStatus != null) data.imageStatus = imageStatus;
  if (imageLen != null) data.imageLen = imageLen;

  const logEntry = JSON.stringify({
    sessionId: '0d1220',
    runId: 'viewport-report',
    hypothesisId: 'H1-H5',
    location: 'api/debug-viewport/route.ts',
    message: 'Viewport and splash link report from device',
    data,
    timestamp: Date.now(),
  }) + '\n';
  const logPath = join(process.cwd(), 'debug-0d1220.log');
  const cursorLogPath = join(process.cwd(), '.cursor', 'debug-0d1220.log');
  try {
    appendFileSync(logPath, logEntry);
  } catch (_) {}
  try {
    appendFileSync(cursorLogPath, logEntry);
  } catch (_) {}

  // #region agent log
  fetch('http://127.0.0.1:7619/ingest/b840f1ee-ac9c-402c-a851-53805b34e6d1', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '0d1220' },
    body: JSON.stringify({
      sessionId: '0d1220',
      runId: 'viewport-report',
      hypothesisId: 'H1-H5',
      location: 'api/debug-viewport/route.ts',
      message: 'Viewport and splash link report from device',
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  return new Response(null, { status: 204 });
}
