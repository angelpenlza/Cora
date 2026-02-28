import { createClient } from "@/lib/supabase/server"

/**
 * Home page: list of existing reports/complaints.
 *
 * Data:
 * - Fetches all rows from the `reports` table using the Supabase server client.
 *
 * Rendering:
 * - Simple list of report title + description.
 * - Placeholder element rendered when an image is not yet available.
 */
export default async function Home() {
  const supabase = await createClient();
  const { data: reports } = await supabase.from('reports').select();

  const formattedReports = reports?.map((report) => {
    return (
      <div key={report.report_id} className="report">
        <h3>{report.report_title}</h3>
        <p>{report.report_description}</p>
        { report.report_image ? <img /> : <div className="no-image">Empty</div>}
      </div>
    )
  })

  return (
    <div className="home-container">
      <h1>Reports and complaints</h1>
      { formattedReports?.length == 0 ? <div>no reports yet</div> : formattedReports }
    </div>
  )
}