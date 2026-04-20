import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getReportComments } from '@/app/components/report-actions';
import ReportDetailClient from './report-detail-client';
import { getImages } from '@/app/components/cfhelpers';
import { Avatar } from '@/app/components/client-components';
import VoteButtons from '../vote-buttons';
import ReportFlagControls from './report-flag-controls';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ reportId: string }> };

export default async function ReportDetailPage({ params }: PageProps) {
  const { reportId: reportIdParam } = await params;
  const reportId = parseInt(reportIdParam, 10);
  if (Number.isNaN(reportId)) notFound();

  const images = await getImages();

  const supabase = await createClient();
  const { data: report, error: reportError } = await supabase
    .from('reports_with_meta')
    .select('*')
    .eq('report_id', reportId)
    .maybeSingle();

  if (reportError || !report) notFound();

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

  let userVote = 0;
  if (userId) {
    const { data: voteRow } = await supabase
      .from('votes')
      .select('vote')
      .eq('report_id', reportId)
      .eq('user_id', userId)
      .maybeSingle();
    userVote = voteRow?.vote ?? 0;
  }

  const comments = await getReportComments(reportId);

  const upvotes = report.upvotes ?? 0;
  const downvotes = report.downvotes ?? 0;

  let hideReportFlag = false;
  if (userId) {
    const { data: authorRow } = await supabase
      .from('reports')
      .select('created_by')
      .eq('report_id', reportId)
      .maybeSingle();
    hideReportFlag = authorRow?.created_by === userId;
  }


  const { data: profile } =  await supabase
    .from('profiles')
    .select('*')
    .eq('id', report.created_by)
    .maybeSingle()

  const Header = ({ title, username, avatar }: {
    title: string | null,
    username: string | null,
    avatar: string | null,
  }) => {
    return (
      <div className='report-page-header-container'>
        <div className='header-title'>
          <img
            src='/assets/user.png'
            alt='category-image'
            height={20}
            width={20}
            className='header-category-image'
          />
          <h2>{title}</h2>
        </div>
        <div className='header-profile'>
          <Avatar 
            avatar_url={avatar}
            className='report-page-avatar'
          />
          <h3 className='report-page-username'>{username}</h3>
        </div>
      </div>
    )
  }

  const Image = () => {
    return (
      <div className='report-page-image-container'>
        <h4>Image:</h4>
        {
          report.report_image ? 
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
    const createdAt = new Date(report.created_at)
    const date = new Intl.DateTimeFormat('en-US', {
      dateStyle: 'short',      
    }).format(createdAt)
    const time = new Intl.DateTimeFormat('en-US', {
      timeStyle: 'short',
    }).format(createdAt)
    return (
      <div className='info-container'>
        <section className='info'>
          <h5 className='info-label'>Category: {report.category_name}</h5>
        </section>
        <section className='info'>
          <h5 className='info-label'>Status: {report.status}</h5>
        </section>
        <section className='info-location'>
          <h5 className='info-label'>Location</h5>
          <p className='info-data'>123 N example location, with city, CA 88888</p>
        </section>
        <section className='info'>
          <h5 className='info-label'>Date</h5>
          <p className='info-data'>{date}</p>
        </section>
        {/* <section className='info-space'></section> */}

        <section className='info'>
          <h5 className='info-label'>Time</h5>
          <p className='info-data'>{time}</p>
        </section>
        <section className='info-description'>
          <h5 className='info-label'>Description</h5>
          <p className='info-data-description'>{report.report_description}</p>
        </section>
        <div className='info-user-actions'>
          <VoteButtons
            reportId={reportId}
            initialUpvotes={upvotes}
            initialDownvotes={downvotes}
            initialUserVote={userVote}
            compact
          />
          <div className='empty'></div>
          <ReportFlagControls
            reportId={report.report_id}
            user={user ?? null}
            phoneVerified={phoneVerified}
          />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className='report-page-container'>
        <Header
          title={report.report_title}
          username={profile?.username}
          avatar={profile?.avatar_url}
        />
        <div className='report-page-body-container'> 
          <Image />
          <Info />
        </div>
      </div>
      <ReportDetailClient
        reportId={reportId}
        initialUpvotes={upvotes}
        initialDownvotes={downvotes}
        initialUserVote={userVote}
        initialComments={comments}
        hideReportFlag={hideReportFlag}
        user={user ?? null}
        phoneVerified={phoneVerified}
      />
    </>
  );
}
