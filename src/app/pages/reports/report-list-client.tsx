'use client';

import Link from 'next/link';
import VoteButtons from './vote-buttons';
import ReportFlagControls from './[reportId]/report-flag-controls';
import { useState } from 'react';

const Time = ({ dateCreated, location }: {
  dateCreated: string,
  location: string
}) => {
  const createdAt = new Date(dateCreated)
  const time = new Intl.DateTimeFormat('en-US', {
    timeStyle: 'short',
  }).format(createdAt)
  const date = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
  }).format(createdAt)
  return (
    <div className='time-date'>
      <div className='time'>&#9201; {time}</div>
      <div className='time'>&#128466; {date}</div>
      <div className='time'>&#8982; {location}</div>
    </div>
  )
}

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
  category_name: string | null;
};

type CategoryRow = {
  report_id: any;
  category: any;
}

type ExploreListClientProps = {
  reports: ReportRow[];
  commentCounts: Record<number, number>;
  images: Record<string, string>;
  category: CategoryRow[] | null;
};

export default function ExploreListClient({
  reports,
  commentCounts,
}: ExploreListClientProps) {
  const [show, setShow] = useState(false)
  const [filter, setFilter] = useState({
    supported: false,
    disputed: false,
    unconfirmed: false,
    safety: false,
    accessibility: false,
    environment: false,
  })

  const filteredReports = reports.filter(report => {
    const sup = report.status === 'Community-Supported' && filter.supported
    const dis = report.status === 'Disputed' && filter.disputed
    const uncon = report.status === 'Unconfirmed' && filter.unconfirmed

    const saf = report.category_name === 'Safety' && filter.safety
    const acc = report.category_name === 'Accessibility' && filter.accessibility
    const env = report.category_name === 'Environment' && filter.environment

    return dis || sup || uncon || saf || acc || env
  })

  const Filters = () => {
    const setFilters = (e: React.ChangeEvent<HTMLInputElement>) => {
      const key = e.target.value as keyof typeof filter
      setFilter((prev) => ({
        ...prev, 
        [key]: !prev[key]
      }))
    }
     
    return (
      <fieldset className={show ? 'filter-container' : 'hide-filter-container'}>
        <div className='filter-exit' onClick={() => setShow(false)}>X</div>
        <h3>Filters</h3>
        <div className='filter-group'>
          <h4>Timeline</h4>

        </div>
        <div className='filter-group'>
          <h4>Status</h4>
          <label className={ filter.supported ? 'option-container-selected' : 'option-container'}>
            <input 
              value='supported' 
              onChange={setFilters} 
              type='checkbox' 
              checked={filter.supported}
            />
            Supported
          </label>
          <label className={filter.disputed ? 'option-container-selected' : 'option-container'}>
            <input 
              value='disputed' 
              onChange={setFilters} 
              type='checkbox' 
              checked={filter.disputed}
            />
            Disputed
          </label>
          <label className={filter.unconfirmed ? 'option-container-selected' : 'option-container'}>
            <input 
              value='unconfirmed' 
              onChange={setFilters} 
              type='checkbox' 
              checked={filter.unconfirmed}
            />
            Unconfirmed
          </label>
        </div>
        <div className='filter-group'>
          <h4>Categories</h4>
          <label className={filter.accessibility ? 'option-container-selected' : 'option-container'}>
            <input 
              value='accessibility'
              onChange={setFilters}
              type='checkbox'
              checked={filter.accessibility}
            />
            Accessibility
          </label>
          <label className={filter.environment ? 'option-container-selected' : 'option-container'}>
            <input 
              value='environment'
              onChange={setFilters}
              type='checkbox'
              checked={filter.environment}
            />
            Environment
          </label>
          <label className={filter.safety ? 'option-container-selected' : 'option-container'}>
            <input 
              value='safety'
              onChange={setFilters}
              type='checkbox'
              checked={filter.safety}
            />
            Safety
          </label>
        </div>
      </fieldset>
    )
  }
  
  const Top = ({report}: {
    report: ReportRow
  }) => {
    return (
      <div className='report-card-header'>
        <div className='category-image-title'>
          <img
            src='/assets/user.png'
            alt='cat-img'
            width={20}
            height={20}
            className='cat-img'
          />
          <h3 className='report-category'>{report.category_name?.toUpperCase()}</h3>
        </div>
        <div className='space'></div>
        <span
          className={`${(report.status ?? 'Unconfirmed').toLowerCase()}`}
        >
          {(report.status ?? 'Unconfirmed') && 
          report.status === 'Community-Supported' ? 'SUPPORTED' : report.status?.toUpperCase()}
        </span>
      </div>
    )
  } 

  return (
    <div className='report-page'>
      <Filters />
      <div className="report-container">
        <h2 className='report-container-title'>Report Dashboard</h2>
        <div role='button' onClick={() => setShow(!show)} className='show-filter-button'>show filters</div>
        {(filteredReports.length <= 0 ? reports : filteredReports).map((report) => (
          <div  key={report.report_id} className='report'>
            <Link
              href={`/pages/reports/${report.report_id}`}
              className="report-card"
              prefetch={false}
            >
              <Top report={report} />
              <h2 className='report-title'>{report.report_title}</h2>
              <p className='report-desc'>{report.report_description}</p>
              <Time dateCreated={report.created_at} location='Anaheim'/>
            </Link>
            <div className='votes'>
              <VoteButtons
                reportId={report.report_id}
                initialUpvotes={report.upvotes ?? 0}
                initialDownvotes={report.downvotes ?? 0}
                initialUserVote={0}
                compact
              />
              <span className="report-comment-count" aria-label="Comment count">
                &#128172; &#32; &#8201; {commentCounts[report.report_id] ?? 0}
              </span>
              <div className='empty'></div>
              <ReportFlagControls reportId={report.report_id}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
