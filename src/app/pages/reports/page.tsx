import { createClient } from '@/lib/supabase/server';
import { getReportCommentCounts } from '@/app/components/report-actions';
import ExploreListClient from './report-list-client';
import { adminClient } from '@/lib/supabase/admin';
import { locationToGeoJSON } from '@/lib/mapLocation';
import { reverseGeocodeCity } from '@/lib/reverse-geocode';

export const dynamic = 'force-dynamic';

type GeoRow = { report_id: number; location: unknown | null };

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function fetchLocationsByReportId(
  reportIds: number[],
  sessionClient: Awaited<ReturnType<typeof createClient>>,
): Promise<Map<number, unknown | null>> {
  const map = new Map<number, unknown | null>();
  if (reportIds.length === 0) return map;
  const db = adminClient ?? sessionClient;

  for (const ids of chunk(reportIds, 100)) {
    const { data, error } = await db
      .from('reports')
      .select('report_id, location')
      .in('report_id', ids);
    if (error) continue;
    for (const row of (data ?? []) as GeoRow[]) {
      map.set(row.report_id, row.location ?? null);
    }
  }
  return map;
}

export default async function Explore() {
  const supabase = await createClient();
  const { data: reports } = await supabase
    .from('reports_with_meta_updated')
    .select('*')
    .order('report_id', { ascending: false });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  let phoneVerified = false;
  if (userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('phone_verified')
      .eq('id', userId)
      .maybeSingle();
    phoneVerified = profile?.phone_verified === true;
  }

  const reportIds = reports?.map((r) => r.report_id) ?? [];
  const commentCounts = reportIds.length
    ? await getReportCommentCounts(reportIds)
    : {};

  // Best-effort city labels from coordinates.
  const locationById = await fetchLocationsByReportId(reportIds, supabase);
  const cityById = new Map<number, string>();
  // Nominatim is rate-limited; keep this conservative.
  const MAX_GEOCODE = 30;
  for (const report of (reports ?? []).slice(0, MAX_GEOCODE) as any[]) {
    const loc = locationById.get(report.report_id);
    const geo = locationToGeoJSON(loc ?? null);
    const coords = geo?.coordinates;
    if (!coords) continue;
    const [lng, lat] = coords;
    const city = await reverseGeocodeCity(lat, lng);
    if (city) cityById.set(report.report_id, city);
  }

  const enrichedReports = (reports ?? []).map((r: any) => ({
    ...r,
    city: cityById.get(r.report_id) ?? null,
  }));

  return (
    <div className="explore-page explore-page--dashboard">
      {!reports?.length ? (
        <div className="report-dashboard-empty">No reports yet</div>
      ) : (
        <ExploreListClient
          reports={enrichedReports}
          commentCounts={commentCounts}
          user={user ?? null}
          phoneVerified={phoneVerified}
        />
      )}
    </div>
  );
}
