import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getReportComments } from '@/app/components/report-actions';
import ReportDetailClient from './report-detail-client';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ reportId: string }> };

export default async function ReportDetailPage({ params }: PageProps) {
  const { reportId: reportIdParam } = await params;
  const reportId = parseInt(reportIdParam, 10);
  if (Number.isNaN(reportId)) notFound();

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

  return (
    <div className="report-detail">
      <article>
        <h1>{report.report_title ?? 'Untitled'}</h1>
        {report.author_username && (
          <p className="report-author">by {report.author_username}</p>
        )}
        {report.report_description && (
          <p className="report-description">{report.report_description}</p>
        )}
        {report.report_image ? (
          <img src={report.report_image} alt="" className="report-image" />
        ) : (
          <div className="no-image">No image</div>
        )}
      </article>

      <ReportDetailClient
        reportId={reportId}
        initialUpvotes={upvotes}
        initialDownvotes={downvotes}
        initialUserVote={userVote}
        initialComments={comments}
      />
    </div>
  );
}
