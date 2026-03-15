import { createClient } from '@/lib/supabase/server';
import { getReportCommentCounts } from '@/app/components/report-actions';
import ExploreListClient from './report-list-client';

export const dynamic = 'force-dynamic';

export default async function Explore() {
  const supabase = await createClient();
  const { data: reports } = await supabase
    .from('reports_with_meta')
    .select('report_id, report_title, report_description, report_image, score, upvotes, downvotes')
    .order('report_id', { ascending: false });

  const reportIds = reports?.map((r) => r.report_id) ?? [];
  const commentCounts = reportIds.length
    ? await getReportCommentCounts(reportIds)
    : {};

  return (
    <div className="explore-page">
      <h1>Reports and complaints</h1>
      {!reports?.length ? (
        <div>No reports yet</div>
      ) : (
        <ExploreListClient
          reports={reports}
          commentCounts={commentCounts}
        />
      )}
    </div>
  );
}
