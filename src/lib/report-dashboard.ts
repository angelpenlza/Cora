/**
 * Report dashboard (explore) helpers: category icons, status badges, timeline.
 */

export type DashboardTimeline = 'all' | 'today' | 'week' | 'month';

export const DASHBOARD_TIMELINE_OPTIONS: {
  id: Exclude<DashboardTimeline, 'all'>;
  label: string;
  iconSrc: string;
}[] = [
  { id: 'today', label: 'Today', iconSrc: '/assets/report-time-filter-icon.png' },
  { id: 'week', label: 'Past Week', iconSrc: '/assets/report-time-filter-icon.png' },
  { id: 'month', label: 'Past Month', iconSrc: '/assets/report-time-filter-icon.png' },
];

export type ReportStatus =
  | 'Unconfirmed'
  | 'Community-Supported'
  | 'Disputed'
  | null
  | undefined;

export const DASHBOARD_STATUS_FILTERS = [
  {
    key: 'supported' as const,
    label: 'Supported',
    iconSrc: '/assets/report-community-supported-icon.png',
    match: (s: ReportStatus) => s === 'Community-Supported',
  },
  {
    key: 'unconfirmed' as const,
    label: 'Unconfirmed',
    iconSrc: '/assets/report-unconfirmed-icon.png',
    match: (s: ReportStatus) => s === 'Unconfirmed' || s == null,
  },
  {
    key: 'disputed' as const,
    label: 'Disputed',
    iconSrc: '/assets/report-disputed-icon.png',
    match: (s: ReportStatus) => s === 'Disputed',
  },
];

/** Category keys match `reports.category` / `reports_with_meta.category_name` values. */
export const DASHBOARD_CATEGORY_FILTERS = [
  { key: 'Assault', label: 'Assault', iconSrc: '/assets/report-assault-icon.png' },
  { key: 'Robbery', label: 'Robbery', iconSrc: '/assets/report-robbery-icon.png' },
  { key: 'Vandalism', label: 'Vandalism', iconSrc: '/assets/report-vandalism-icon.png' },
  { key: 'Suspicious', label: 'Suspicious', iconSrc: '/assets/report-suspicious-icon.png' },
  { key: 'Traffic', label: 'Traffic & Roads', iconSrc: '/assets/report-traffic-icon.png' },
  { key: 'Hazard', label: 'Hazard', iconSrc: '/assets/report-hazard-icon.png' },
  { key: 'Other', label: 'Other', iconSrc: '/assets/report-other-icon.png' },
] as const;

export type DashboardStatusKey = (typeof DASHBOARD_STATUS_FILTERS)[number]['key'];
export type DashboardCategoryKey = (typeof DASHBOARD_CATEGORY_FILTERS)[number]['key'];

export function normalizeCategoryKey(name: string | null | undefined): string {
  return (name ?? '').trim().toLowerCase();
}

export function categoryIconPath(categoryName: string | null | undefined): string {
  const key = normalizeCategoryKey(categoryName);
  const row = DASHBOARD_CATEGORY_FILTERS.find(
    (c) => c.key.toLowerCase() === key,
  );
  if (row) return row.iconSrc;
  // Legacy categories that may still exist in data but shouldn't appear as filters.
  if (key === 'safety' || key === 'environment') return '/assets/report-hazard-icon.png';
  if (key === 'accessibility') return '/assets/report-other-icon.png';
  return '/assets/report-other-icon.png';
}

/** Single-line category label for card header (uppercase in UI). */
export function categoryHeadline(categoryName: string | null | undefined): string {
  if (!categoryName?.trim()) return 'REPORT';
  const key = normalizeCategoryKey(categoryName);
  if (key === 'traffic') return 'TRAFFIC & ROADS';
  return categoryName.trim().toUpperCase();
}

export function matchTimeline(
  createdAt: string,
  timeline: DashboardTimeline,
): boolean {
  if (timeline === 'all') return true;
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (timeline === 'today') {
    return d >= startOfToday;
  }
  const ms = d.getTime();
  const nowMs = now.getTime();
  if (timeline === 'week') {
    return nowMs - ms <= 7 * 24 * 60 * 60 * 1000;
  }
  /* month */
  return nowMs - ms <= 30 * 24 * 60 * 60 * 1000;
}

export function shortLocationFromAddress(address: string | null | undefined): string {
  if (!address?.trim()) return '—';
  const parts = address.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) return parts[1];
  return parts[0] ?? '—';
}

export function statusBadgeMeta(status: ReportStatus): {
  label: string;
  iconSrc: string;
  modifier: 'supported' | 'disputed' | 'unverified';
} {
  if (status === 'Community-Supported') {
    return {
      label: 'SUPPORTED',
      iconSrc: '/assets/report-community-supported-icon.png',
      modifier: 'supported',
    };
  }
  if (status === 'Disputed') {
    return {
      label: 'DISPUTED',
      iconSrc: '/assets/report-disputed-icon.png',
      modifier: 'disputed',
    };
  }
  return {
    label: 'UNVERIFIED',
    iconSrc: '/assets/report-unconfirmed-icon.png',
    modifier: 'unverified',
  };
}
