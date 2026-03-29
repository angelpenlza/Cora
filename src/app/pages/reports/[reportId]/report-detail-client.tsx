'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PhoneVerificationModal from '@/app/components/phone-verification-modal';
import {
  createReportComment,
  type ReportCommentRow,
} from '@/app/components/report-actions';
import { formatDistanceToNow } from 'date-fns';
import VoteButtons from '../vote-buttons';

type ReportDetailClientProps = {
  reportId: number;
  initialUpvotes: number;
  initialDownvotes: number;
  initialUserVote: number;
  initialComments: ReportCommentRow[];
};

export default function ReportDetailClient({
  reportId,
  initialUpvotes,
  initialDownvotes,
  initialUserVote,
  initialComments,
}: ReportDetailClientProps) {
  const router = useRouter();
  const [comments, setComments] = useState(initialComments);
  const [commentBody, setCommentBody] = useState('');
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentBody.trim()) return;
    setSubmittingComment(true);
    const result = await createReportComment(reportId, commentBody.trim());
    setSubmittingComment(false);
    if (result.error === 'VERIFICATION_REQUIRED') {
      setShowVerificationModal(true);
      return;
    }
    if (result.error) return;
    setCommentBody('');
    router.refresh();
  };

  return (
    <>
      <PhoneVerificationModal
        open={showVerificationModal}
        onVerifyLater={() => setShowVerificationModal(false)}
        onVerifyNow={() => router.push('/pages/verify-phone')}
      />

      <VoteButtons
        reportId={reportId}
        initialUpvotes={initialUpvotes}
        initialDownvotes={initialDownvotes}
        initialUserVote={initialUserVote}
      />

      <section className="report-comments" aria-label={`Comments (${comments.length})`}>
        <h3>Comments ({comments.length})</h3>
        <ul className="comment-list">
          {comments.map((c) => (
            <li key={c.id} className="comment-item">
              <span className="comment-author">{c.username}</span>
              <span className="comment-time">
                {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
              </span>
              <p className="comment-body">{c.body}</p>
            </li>
          ))}
        </ul>
        <form onSubmit={handleSubmitComment} className="comment-form">
          <label htmlFor="comment-body">Add a comment</label>
          <textarea
            id="comment-body"
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            placeholder="Write a comment..."
            rows={3}
            disabled={submittingComment}
          />
          <button type="submit" disabled={submittingComment || !commentBody.trim()}>
            {submittingComment ? 'Posting...' : 'Post comment'}
          </button>
        </form>
      </section>
    </>
  );
}
