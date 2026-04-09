import { createClient } from "@/lib/supabase/server";
import UserReport from "./user-report";

export default async function ExpandedReport({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const reports = (await searchParams).report;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('report_id', reports)
    .maybeSingle()

  if(error) {
    console.log('error: ', error.message)
  } else {
    console.log('success: ', data)
  }
  return (
    <UserReport reports={data} />
  )
}