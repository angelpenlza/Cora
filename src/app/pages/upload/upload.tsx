import { User } from "@supabase/supabase-js";

export default function UploadForm({ user }: { user : User | null}) {
  return (
    <form>
      <h1>Upload</h1>

      <label>Title</label>
      <input />

      <label>Category</label>
      <input />

      <label>Description</label>
      <input />

      <label>Image</label>
      <input type="file" accept="image/png, image/jpeg"/>

    </form>
  )
}