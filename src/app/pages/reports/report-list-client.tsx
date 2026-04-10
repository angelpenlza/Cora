'use client';

import Link from 'next/link';
import VoteButtons from './vote-buttons';
import { getImages } from '@/app/components/cfhelpers';
import { useEffect, useState } from 'react';
import { getImgProps } from 'next/dist/shared/lib/get-img-props';

type ReportRow = {
  report_id: number;
  report_title: string | null;
  report_description: string | null;
  report_image: string | null;
  status: 'Unconfirmed' | 'Community-Supported' | 'Disputed' | null;
  score: number | null;
  upvotes: number | null;
  downvotes: number | null;
};

type ExploreListClientProps = {
  reports: ReportRow[];
  commentCounts: Record<number, number>;
  images: Record<string, string>;
};

export default function ExploreListClient({
  reports,
  commentCounts,
  images,
}: ExploreListClientProps) {
  console.log('images: ', images)
  return (
    <ul className="report-list">
      {reports.map((report) => (
        <li key={report.report_id} className="report report-card">
          <Link
            href={`/pages/reports/${report.report_id}`}
            className="report-card-link"
            prefetch={false}
          >
            <div className="report-card-header">
              <h3>{report.report_title}</h3>
              <span
                className={`report-status-badge report-status-badge--${(report.status ?? 'Unconfirmed').toLowerCase()}`}
              >
                {report.status ?? 'Unconfirmed'}
              </span>
            </div>
            <p>{report.report_description ?? ''}</p>
            {report.report_image ? (
              <img 
                src={images[`${report.report_id}-${report.report_image}`]} 
                alt="" className="report-image" 
                width={100}
                height={100}
              />
            ) : (
              <div className="no-image">No image</div>
            )}
          </Link>
          <VoteButtons
            reportId={report.report_id}
            initialUpvotes={report.upvotes ?? 0}
            initialDownvotes={report.downvotes ?? 0}
            initialUserVote={0}
            compact
          />
          <span className="report-comment-count" aria-label="Comment count">
            {commentCounts[report.report_id] ?? 0} comment{(commentCounts[report.report_id] ?? 0) !== 1 ? 's' : ''}
          </span>
        </li>
      ))}
    </ul>
  );
}
