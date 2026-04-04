import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import ReportsMap from '@/app/components/ReportsMap';
import type { Report } from '@/app/components/mapTypes';
import { locationToGeoJSON } from '@/lib/mapLocation';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 1000;
const GEO_IN_CHUNK = 300;

/** Default map center (Orange County area) — used for placeholder / missing geometry. */
const PLACEHOLDER: [number, number] = [-117.8311, 33.7175];

type MetaRow = {
  report_id: number;
  report_title: string | null;
  report_description: string | null;
  report_image: string | null;
  status: string | null;
  score: number | null;
  upvotes: number | null;
  downvotes: number | null;
};

type GeoRow = {
  report_id: number;
  category_id: number | null;
  created_at: string | null;
  location: unknown;
};

function chunkIds(ids: number[], size: number): number[][] {
  const out: number[][] = [];
  for (let i = 0; i < ids.length; i += size) {
    out.push(ids.slice(i, i + size));
  }
  return out;
}

/**
 * Load every row from `reports_with_meta` (Supabase caps at 1000 per request without pagination).
 */
async function fetchAllMeta(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<MetaRow[]> {
  const all: MetaRow[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from('reports_with_meta')
      .select(
        'report_id, report_title, report_description, report_image, status, score, upvotes, downvotes'
      )
      .order('report_id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error('interactive-map: reports_with_meta', error.message, error.code);
      break;
    }
    const batch = (data ?? []) as MetaRow[];
    all.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return all;
}

/**
 * Merge geometry from `reports` using service role when available (RLS often hides `location`).
 */
async function fetchGeoByReportId(
  reportIds: number[],
  sessionClient: Awaited<ReturnType<typeof createClient>>
): Promise<Map<number, GeoRow>> {
  const map = new Map<number, GeoRow>();
  if (reportIds.length === 0) return map;

  const db = adminClient ?? sessionClient;

  for (const ids of chunkIds(reportIds, GEO_IN_CHUNK)) {
    const { data, error } = await db
      .from('reports')
      .select('report_id, category_id, created_at, location')
      .in('report_id', ids);

    if (error) {
      console.error('interactive-map: reports geometry', error.message, error.code);
      continue;
    }
    for (const row of (data ?? []) as GeoRow[]) {
      map.set(row.report_id, row);
    }
  }
  return map;
}

function normalizeToReport(m: MetaRow, g: GeoRow | undefined): Report {
  let location_geojson = locationToGeoJSON(g?.location ?? null);

  if (
    location_geojson &&
    location_geojson.coordinates[0] === 0 &&
    location_geojson.coordinates[1] === 0
  ) {
    location_geojson = { type: 'Point', coordinates: [...PLACEHOLDER] };
  }

  if (!location_geojson) {
    const j = (m.report_id % 24) * 0.004;
    const k = ((m.report_id * 7) % 19) * 0.004;
    location_geojson = {
      type: 'Point',
      coordinates: [PLACEHOLDER[0] + j, PLACEHOLDER[1] + k],
    };
  }

  return {
    report_id: m.report_id,
    created_at: g?.created_at ?? null,
    report_title: m.report_title,
    report_description: m.report_description,
    report_image: m.report_image,
    category_id: g?.category_id ?? null,
    upvotes: m.upvotes,
    downvotes: m.downvotes,
    score: m.score,
    status: m.status ?? null,
    location_geojson,
  };
}

export default async function InteractiveMapPage() {
  const supabase = await createClient();
  const meta = await fetchAllMeta(supabase);
  const reportIds = meta.map((r) => r.report_id);
  const geoById = await fetchGeoByReportId(reportIds, supabase);
  const reports: Report[] = meta.map((m) =>
    normalizeToReport(m, geoById.get(m.report_id))
  );

  return (
    <div className="interactive-map-page">
      <h1 className="sr-only">Interactive map</h1>
      <ReportsMap reports={reports} fillViewport />
    </div>
  );
}
