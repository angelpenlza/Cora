'use client';

import Link from 'next/link';
import Image from 'next/image';
import { memo, useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import VoteButtons from './vote-buttons';
import ReportFlagControls from './[reportId]/report-flag-controls';
import {
  categoryHeadline,
  categoryIconPath,
  DASHBOARD_CATEGORY_FILTERS,
  DASHBOARD_STATUS_FILTERS,
  DASHBOARD_TIMELINE_OPTIONS,
  matchTimeline,
  shortLocationFromAddress,
  statusBadgeMeta,
  type DashboardCategoryKey,
  type DashboardStatusKey,
  type DashboardTimeline,
} from '@/lib/report-dashboard';

type ReportRow = {
  report_id: number;
  report_title: string | null;
  report_description: string | null;
  report_image: string | null;
  status: 'Unconfirmed' | 'Community-Supported' | 'Disputed' | null;
  score: number | null;
  upvotes: number | null;
  downvotes: number | null;
  created_at: string;
  category: string | null;
  address?: string | null;
  city?: string | null;
};

/** All categories on = show every report (until user narrows the selection). */
function defaultCategoryFiltersAllOn(): Record<DashboardCategoryKey, boolean> {
  return Object.fromEntries(
    DASHBOARD_CATEGORY_FILTERS.map((c) => [c.key, true]),
  ) as Record<DashboardCategoryKey, boolean>;
}

function defaultStatusFiltersAllOn(): Record<DashboardStatusKey, boolean> {
  return Object.fromEntries(
    DASHBOARD_STATUS_FILTERS.map((s) => [s.key, true]),
  ) as Record<DashboardStatusKey, boolean>;
}

function isStatusFilteringActive(
  statusFilters: Record<DashboardStatusKey, boolean>,
): boolean {
  const anyOn = DASHBOARD_STATUS_FILTERS.some((f) => statusFilters[f.key]);
  const allOn = DASHBOARD_STATUS_FILTERS.every((f) => statusFilters[f.key]);
  return anyOn && !allOn;
}

function isCategoryFilteringActive(
  categoryFilters: Record<DashboardCategoryKey, boolean>,
): boolean {
  const anyOn = DASHBOARD_CATEGORY_FILTERS.some((f) => categoryFilters[f.key]);
  const allOn = DASHBOARD_CATEGORY_FILTERS.every((f) => categoryFilters[f.key]);
  return anyOn && !allOn;
}

type ExploreListClientProps = {
  reports: ReportRow[];
  commentCounts: Record<number, number>;
  user: User | null;
  phoneVerified: boolean;
};

type ReportCardProps = {
  report: ReportRow;
  commentCount: number;
  user: User | null;
  phoneVerified: boolean;
};

function CardMeta({
  dateCreated,
  location,
}: {
  dateCreated: string;
  location: string;
}) {
  const createdAt = new Date(dateCreated);
  const time = new Intl.DateTimeFormat('en-US', {
    timeStyle: 'short',
  }).format(createdAt);
  const date = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
  }).format(createdAt);

  return (
    <div className="report-dashboard-card__meta">
      <span className="report-dashboard-card__meta-item">
        <Image src="/assets/report-date-icon.png" alt="" width={14} height={14} />
        {date}
      </span>
      <span className="report-dashboard-card__meta-item">
        <Image src="/assets/report-time-icon.png" alt="" width={14} height={14} />
        {time}
      </span>
      <span className="report-dashboard-card__meta-item">
        <Image src="/assets/report-location-icon.png" alt="" width={14} height={14} />
        {location}
      </span>
    </div>
  );
}

const ReportCard = memo(function ReportCard({
  report,
  commentCount,
  user,
  phoneVerified,
}: ReportCardProps) {
  const badge = statusBadgeMeta(report.status);
  const catIcon = categoryIconPath(report.category);
  const loc =
    report.city?.trim() ||
    shortLocationFromAddress(report.address ?? null);

  return (
    <article className="report-dashboard-card">
      <Link
        href={`/pages/reports/${report.report_id}`}
        className="report-dashboard-card__body"
        prefetch={false}
      >
        <div className="report-dashboard-card__head">
          <div className="report-dashboard-card__category">
            <span className="report-dashboard-card__category-icon-wrap">
              <Image
                src={catIcon}
                alt=""
                width={16}
                height={16}
                className="report-dashboard-card__category-icon"
              />
            </span>
            <span className="report-dashboard-card__category-text">
              {categoryHeadline(report.category)}
            </span>
          </div>
          <span
            className={`report-dashboard-card__badge report-dashboard-card__badge--${badge.modifier}`}
          >
            <Image src={badge.iconSrc} alt="" width={13} height={13} />
            {badge.label}
          </span>
        </div>
        <div className="report-dashboard-card__text">
          <h2 className="report-dashboard-card__title">
            {report.report_title ?? 'Untitled'}
          </h2>
          <p className="report-dashboard-card__desc">
            {report.report_description ?? ''}
          </p>
        </div>
        <CardMeta dateCreated={report.created_at} location={loc} />
      </Link>
      <div className="report-dashboard-card__footer">
        <div className="report-dashboard-card__footer-actions">
          <VoteButtons
            reportId={report.report_id}
            initialUpvotes={report.upvotes ?? 0}
            initialDownvotes={report.downvotes ?? 0}
            initialUserVote={0}
            compact
            dashboardIcons
          />
          <span
            className="report-dashboard-card__comment-count"
            aria-label={`${commentCount} comments`}
          >
            <Image
              src="/assets/report-comment-icon.png"
              alt=""
              width={16}
              height={16}
            />
            {commentCount}
          </span>
        </div>
        <div className="report-dashboard-card__footer-flag">
          <ReportFlagControls
            reportId={report.report_id}
            user={user}
            phoneVerified={phoneVerified}
            flagIconSrc="/assets/report-flag-icon.png"
            buttonClassName="report-dashboard-card__flag-btn"
            label="Report"
            labelClassName="report-dashboard-card__flag-label"
          />
        </div>
      </div>
    </article>
  );
});

export default function ExploreListClient({
  reports,
  commentCounts,
  user,
  phoneVerified,
}: ExploreListClientProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [timeline, setTimeline] = useState<DashboardTimeline>('all');
  const [statusFilters, setStatusFilters] = useState(defaultStatusFiltersAllOn);
  const [categoryFilters, setCategoryFilters] = useState(defaultCategoryFiltersAllOn);

  useEffect(() => {
    if (!filtersOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFiltersOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [filtersOpen]);

  const filteredReports = useMemo(() => {
    const statusActive = isStatusFilteringActive(statusFilters);
    const categoryActive = isCategoryFilteringActive(categoryFilters);

    return reports.filter((report) => {
      if (!matchTimeline(report.created_at, timeline)) return false;

      if (statusActive) {
        const ok = DASHBOARD_STATUS_FILTERS.some(
          (f) => statusFilters[f.key] && f.match(report.status),
        );
        if (!ok) return false;
      }

      if (categoryActive) {
        const name = (report.category ?? '').trim();
        const ok = DASHBOARD_CATEGORY_FILTERS.some(
          (f) =>
            categoryFilters[f.key] && f.key.toLowerCase() === name.toLowerCase(),
        );
        if (!ok) return false;
      }

      return true;
    });
  }, [reports, timeline, statusFilters, categoryFilters]);

  const toggleTimeline = (id: Exclude<DashboardTimeline, 'all'>) => {
    setTimeline((t) => (t === id ? 'all' : id));
  };

  const toggleStatus = (key: DashboardStatusKey) => {
    setStatusFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleCategory = (key: DashboardCategoryKey) => {
    setCategoryFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const closeFilters = () => setFiltersOpen(false);

  const filterSidebar = (
    <aside
      className="report-dashboard__sidebar"
      aria-label="Report filters"
    >
      <div className="report-dashboard__sidebar-header">
        <h2 className="report-dashboard__sidebar-title">Filters</h2>
        <button
          type="button"
          className="report-dashboard__sidebar-close"
          onClick={closeFilters}
          aria-label="Close filters"
        >
          ×
        </button>
      </div>

      <section className="report-dashboard__filter-section">
        <h3 className="report-dashboard__filter-heading">Report Timeline</h3>
        <div className="report-dashboard__filter-list">
          {DASHBOARD_TIMELINE_OPTIONS.map((opt) => {
            const active = timeline === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                className={
                  active
                    ? 'report-dashboard__pill report-dashboard__pill--active'
                    : 'report-dashboard__pill'
                }
                aria-pressed={active}
                onClick={() => toggleTimeline(opt.id)}
              >
                <Image src={opt.iconSrc} alt="" width={18} height={18} />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="report-dashboard__filter-section">
        <h3 className="report-dashboard__filter-heading">Report Status</h3>
        <div className="report-dashboard__filter-list">
          {DASHBOARD_STATUS_FILTERS.map((opt) => {
            const active = statusFilters[opt.key];
            return (
              <button
                key={opt.key}
                type="button"
                className={
                  active
                    ? 'report-dashboard__pill report-dashboard__pill--active'
                    : 'report-dashboard__pill'
                }
                aria-pressed={active}
                onClick={() => toggleStatus(opt.key)}
              >
                <Image src={opt.iconSrc} alt="" width={18} height={18} />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="report-dashboard__filter-section">
        <h3 className="report-dashboard__filter-heading">Report Category</h3>
        <div className="report-dashboard__filter-list report-dashboard__filter-list--categories">
          {DASHBOARD_CATEGORY_FILTERS.map((opt) => {
            const active = categoryFilters[opt.key];
            return (
              <button
                key={opt.key}
                type="button"
                className={
                  active
                    ? 'report-dashboard__pill report-dashboard__pill--active'
                    : 'report-dashboard__pill'
                }
                aria-pressed={active}
                onClick={() => toggleCategory(opt.key)}
              >
                <Image src={opt.iconSrc} alt="" width={18} height={18} />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </section>
    </aside>
  );

  return (
    <div
      className={
        filtersOpen
          ? 'report-dashboard report-dashboard--filters-open'
          : 'report-dashboard'
      }
    >
      <button
        type="button"
        className="report-dashboard__backdrop"
        aria-label="Close filters"
        onClick={closeFilters}
      />

      {filterSidebar}

      <div className="report-dashboard__main">
        <header className="report-dashboard__main-header">
          <h1 className="report-dashboard__title">Report Dashboard</h1>
          <button
            type="button"
            className="report-dashboard__filters-trigger"
            onClick={() => setFiltersOpen(true)}
            aria-expanded={filtersOpen}
          >
            <span className="report-dashboard__filters-trigger-icon" aria-hidden>
              <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect y="0.5" width="20" height="2" rx="1" fill="currentColor" />
                <rect y="6" width="14" height="2" rx="1" fill="currentColor" />
                <rect y="11.5" width="18" height="2" rx="1" fill="currentColor" />
              </svg>
            </span>
            FILTERS
          </button>
        </header>

        <div className="report-dashboard__grid">
          {filteredReports.map((report) => (
            <ReportCard
              key={report.report_id}
              report={report}
              commentCount={commentCounts[report.report_id] ?? 0}
              user={user}
              phoneVerified={phoneVerified}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
