import '@/app/styles/report-page.css';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getReportComments } from '@/app/components/report-actions';
import ReportDetailClient from './report-detail-client';
import { getImages } from '@/app/components/cfhelpers';
import { Avatar } from '@/app/components/client-components';
import VoteButtons from '../vote-buttons';
import ReportFlagControls from './report-flag-controls';
import Link from 'next/link';
import Image from 'next/image';
import { categoryIconPath, categoryHeadline } from '@/lib/report-dashboard';
import LocalDateTime from './local-datetime';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ reportId: string }> };

export default async function ReportDetailPage({ params }: PageProps) {
  const { reportId: reportIdParam } = await params;
  const reportId = parseInt(reportIdParam, 10);
  if (Number.isNaN(reportId)) notFound();

  const supabase = await createClient();

  // Round 1: fire all independent queries simultaneously.
  const [
    images,
    { data: report, error: reportError },
    { data: { user } },
    comments,
  ] = await Promise.all([
    getImages(),
    supabase.from('reports_with_meta_updated').select('*').eq('report_id', reportId).maybeSingle(),
    supabase.auth.getUser(),
    getReportComments(reportId),
  ]);

  if (reportError || !report) notFound();

  const userId = user?.id ?? null;

  // Round 2: queries that depend on round-1 results.
  const [phoneVerifiedResult, voteResult, { data: profile }] = await Promise.all([
    userId
      ? supabase.from('profiles').select('phone_verified').eq('id', userId).maybeSingle()
      : Promise.resolve({ data: null }),
    userId
      ? supabase.from('votes').select('vote').eq('report_id', reportId).eq('user_id', userId).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from('profiles').select('*').eq('id', report.created_by).maybeSingle(),
  ]);

  const phoneVerified = phoneVerifiedResult.data?.phone_verified === true;
  const userVote = voteResult.data?.vote ?? 0;
  const commentCount = comments?.length ?? 0;

  const upvotes = report.upvotes ?? 0;
  const downvotes = report.downvotes ?? 0;

  // Always show the "Report" control in the footer (even to the author),
  // since the modal flow already guards auth + phone verification.
  const hideReportFlag = false;

  const Header = ({ title, username, avatar }: {
    title: string | null,
    username: string | null,
    avatar: string | null,
  }) => {
    const iconSrc = categoryIconPath(report.category);
    return (
      <div className='report-page-header-container'>
        <div className='header-title'>
          <span className='header-category-image'>
            <Image src={iconSrc} alt="" width={20} height={20} />
          </span>
          <h2 className='report-page-title'>{title}</h2>
        </div>
        <div className='header-profile'>
          <Avatar
            avatar_url={avatar}
            className='report-page-avatar'
          />
          <div className='report-page-author-line'>
            <span className='report-page-author-label'>Author:</span>{' '}
            <span className='report-page-username'>{username ?? 'Unknown'}</span>
          </div>
        </div>
      </div>
    )
  }

  const ReportImage = () => {
    return (
      <div className='report-page-image-container'>
        <h4 className='report-detail-section-title'>Images:</h4>
        {
          report.report_image ? 
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={images[report.report_id + '-' +  report.report_image]} 
            alt="report-image" 
            className="report-image" 
            width={100}
          /> : <div className="no-image">No image</div>
        }
      </div>
    )
  }

  const Info = () => {
    return (
      <div className='info-container'>
        <section className='info info--inline info--category'>
          <span className='info-label'>Category:</span>{' '}
          <span className='info-data'>{categoryHeadline(report.category)}</span>
        </section>
        <section className='info info--inline info--status'>
          <span className='info-label'>Status:</span>{' '}
          <span className='info-data'>{report.status ?? 'Unconfirmed'}</span>
        </section>
        <section className='info info--inline info-location'>
          <span className='info-label'>Location:</span>{' '}
          <span className='info-data'>{report.address ?? '—'}</span>
        </section>
        <section className='info info--inline info--date'>
          <span className='info-label'>Date:</span>{' '}
          <span className='info-data'>
            <LocalDateTime value={report.created_at} kind="date" />
          </span>
        </section>
        <section className='info info--inline info--time'>
          <span className='info-label'>Time:</span>{' '}
          <span className='info-data'>
            <LocalDateTime value={report.created_at} kind="time" />
          </span>
        </section>
        <section className='info-description'>
          <h3 className='info-description-title'>Description</h3>
          <p className='info-data-description'>{report.report_description}</p>
        </section>
      </div>
    )
  }

  return (
    <>
      <div className="report-detail-topbar">
        <Link href="/pages/reports" className="report-detail-back">
          ← Go back
        </Link>
      </div>
      <div className='report-page-container'>
        <Header
          title={report.report_title}
          username={profile?.username}
          avatar={profile?.avatar_url}
        />
        <div className='report-page-body-container'>
          <ReportImage />
          <div className='report-page-body-divider' aria-hidden="true" />
          <Info />
        </div>
        <div className="report-detail-footer">
          <div className="report-detail-footer-inner">
            <div className="report-detail-footer-actions">
              <VoteButtons
                reportId={reportId}
                initialUpvotes={upvotes}
                initialDownvotes={downvotes}
                initialUserVote={userVote}
                compact
                detailIcons
              />
              <span className="report-detail-comment-count" aria-label={`${commentCount} comments`}>
                <Image src="/assets/report-details-comment-icon.png" alt="" width={18} height={18} />
                {commentCount}
              </span>
            </div>
            {!hideReportFlag && (
              <div className="report-detail-footer-flag">
                <ReportFlagControls
                  reportId={report.report_id}
                  user={user ?? null}
                  phoneVerified={phoneVerified}
                  flagIconSrc="/assets/report-details-flag-icon.png"
                  buttonClassName="report-detail-flag-btn"
                  label="Report"
                  labelClassName="report-detail-flag-label"
                />
              </div>
            )}
          </div>
        </div>
      </div>
      <ReportDetailClient
        reportId={reportId}
        initialComments={comments}
        user={user ?? null}
        phoneVerified={phoneVerified}
      />
    </>
  );
}
