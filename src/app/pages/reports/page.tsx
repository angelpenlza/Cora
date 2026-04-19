import { createClient } from '@/lib/supabase/server';
import { getReportCommentCounts } from '@/app/components/report-actions';
import ExploreListClient from './report-list-client';
import { getImages } from '@/app/components/cfhelpers';
import Filters from './filter';

export const dynamic = 'force-dynamic';

export default async function Explore() {
  const supabase = await createClient();
  const { data: reports } = await supabase
    .from('reports_with_meta')
    .select('*')
    .order('report_id', { ascending: false });

  let { data: category } = await supabase
    .from('reports')
    .select('report_id, category')
    .order('report_id', { ascending: false })

  console.log(category)

  const reportIds = reports?.map((r) => r.report_id) ?? [];
  const commentCounts = reportIds.length
    ? await getReportCommentCounts(reportIds)
    : {};

  const images = await getImages();

  return (
    <div className="explore-page">
      {!reports?.length ? (
        <div>No reports yet</div>
      ) : (
        <ExploreListClient
          reports={reports}
          commentCounts={commentCounts}
          images={images}
          category={category}
        />
      )}
    </div>
  );
}
