import { User } from '@supabase/supabase-js';
import { createReport } from '@/app/components/report-actions';

/**
 * Upload form for creating a new report.
 *
 * Props:
 * - `user`: Supabase user or `null` (passed from the server page). At the
 *   moment this component does not render differently based on auth state,
 *   but the server action enforces authentication before inserting a report.
 *
 * Form:
 * - Posts to the `createReport` server action.
 * - Captures title, category, description, and an optional image file
 *   (image handling can be wired up later).
 */
export default function UploadForm({ user }: { user: User | null }) {
  return (
    <form action={createReport} className="upload-form">
      <h1>Upload</h1>

      <label htmlFor="title">Title</label>
      <input id="title" name="title" type="text" required />

      <label htmlFor="category">Category</label>
      <input id="category" name="category" type="text" />

      <label htmlFor="description">Description</label>
      <textarea id="description" name="description" rows={3} required />

      <label htmlFor="image">Image</label>
      <input id="image" name="image" type="file" accept="image/png, image/jpeg" />

      <button type="submit">Submit report</button>
    </form>
  );
}