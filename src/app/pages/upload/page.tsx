import { createClient } from "@/lib/supabase/server"
import UploadForm from "./upload"

export default async function Upload() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="upload-container">
      <UploadForm user={user} />
    </div>
  )
}