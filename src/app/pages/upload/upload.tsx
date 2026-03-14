'use client'

import { User } from "@supabase/supabase-js";
import { handleSubmit } from "@/app/components/imgupload";

export default function UploadForm({ user }: { user : User | null}) {
  return (
    <form onSubmit={handleSubmit}>
      <h1>Upload</h1>

      <label>Title</label>
      <input />

      <label>Category</label>
      <input />

      <label>Description</label>
      <input />

      <label htmlFor="user-image">Image</label>
      <input name="user-image" id="user-image" type="file" accept="image/png, image/jpeg"/>

      <button type="submit">upload</button>
    </form>
  )
}