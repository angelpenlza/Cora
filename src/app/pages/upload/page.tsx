import { createClient } from "@/lib/supabase/server"
import UploadForm from "./upload"

/**
 * Upload page.
 *
 * - Server component that fetches the current Supabase user.
 * - Passes the user object down into the client-side `UploadForm`.
 * - Currently does not hard-redirect when unauthenticated; the form can
 *   choose how to behave when `user` is `null`.
 */
export default async function Upload() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="upload-container">
      <UploadForm user={user} />
    </div>
  )
}