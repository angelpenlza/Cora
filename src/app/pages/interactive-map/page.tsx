import { createClient } from "@/lib/supabase/server";
import ReportsMap from "../../components/ReportsMap";

export default async function Home() {
  const supabase = await createClient();

  const { data: reports, error } = await supabase
    .from("reports_map")
    .select(`
      report_id,
      created_at,
      report_title,
      report_description,
      report_image,
      category_id,
      upvotes,
      downvotes,
      score,
      location_geojson
    `)


  if (error) {
    console.error("Supabase error:", error.message);
  }

  const formattedReports = (reports ?? []).map((report) => (
    <div key={report.report_id} className="report">
      <h3>{report.report_title}</h3>
      <p>{report.report_description}</p>
      {report.report_image ? (
        <img src={report.report_image} alt="" />
      ) : (
        <div className="no-image">Empty</div>
      )}
    </div>
  ));

  return (
    <div className="">
      <ReportsMap reports={reports ?? []} />

    </div>
  );
}