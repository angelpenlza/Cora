import { createClient } from "@/lib/supabase/server"
import UploadForm from "./upload"

/**
 * Upload page.
 *
 * - Server component that fetches the current Supabase user and phone_verified.
 * - Passes user and phoneVerified into UploadForm so the verification modal
 *   can show as soon as the user lands here (if not verified), before they fill the form.
 */
export default async function Upload() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let phoneVerified = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('phone_verified')
      .eq('id', user.id)
      .maybeSingle()
    phoneVerified = profile?.phone_verified === true
  }

  return (
    <div className="upload-page">
      <UploadForm user={user} phoneVerified={phoneVerified} />
    </div>
  )
}