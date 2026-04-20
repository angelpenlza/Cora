'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import PhoneVerificationModal from '@/app/components/phone-verification-modal';
import {
  createReportComment,
  type ReportCommentRow,
} from '@/app/components/report-actions';
import {
  SIGN_IN_REQUIRED,
  VERIFICATION_REQUIRED,
} from '@/lib/report-auth-errors';
import { formatDistanceToNow } from 'date-fns';

type AuthGate = 'none' | 'signIn' | 'phone';

type ReportDetailClientProps = {
  reportId: number;
  initialComments: ReportCommentRow[];
  user: User | null;
  phoneVerified: boolean;
};

export default function ReportDetailClient({
  reportId,
  initialComments,
  user,
  phoneVerified,
}: ReportDetailClientProps) {
  const router = useRouter();
  const [comments, setComments] = useState(initialComments);
  const [commentBody, setCommentBody] = useState('');
  const [authGate, setAuthGate] = useState<AuthGate>('none');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  const loginHref = `/pages/login?next=${encodeURIComponent(`/pages/reports/${reportId}`)}`;

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentBody.trim()) return;
    setSubmittingComment(true);
    const result = await createReportComment(reportId, commentBody.trim());
    setSubmittingComment(false);
    if (result.error === SIGN_IN_REQUIRED) {
      setAuthGate('signIn');
      return;
    }
    if (result.error === VERIFICATION_REQUIRED) {
      setAuthGate('phone');
      return;
    }
    if (result.error) return;
    setCommentBody('');
    router.refresh();
  };

  const commentsSection = (
    <section className="report-comments" aria-label={`Comments (${comments.length})`}>
      <h3>Comments</h3>
      {user && phoneVerified ? (
        <form onSubmit={handleSubmitComment} className="comment-form">
          <textarea
            className='comment-box'
            id="comment-body"
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            placeholder="leave a comment"
            rows={1}
            disabled={submittingComment}
          />
          <button
            type="submit"
            disabled={submittingComment || !commentBody.trim()}
            className='comment-button'
          >
            &#8593;
          </button>
        </form>
      ) : user && !phoneVerified ? (
        <div className="report-comments-gate" role="note">
          <p className="report-comments-gate__text">
            You must authorize your account (verify your phone) before you can post comments.
          </p>
          <button
            type="button"
            className="report-comments-gate__btn"
            onClick={() => setAuthGate('phone')}
          >
            Authorize now
          </button>
        </div>
      ) : (
        <div className="report-comments-gate" role="note">
          <p className="report-comments-gate__text">Sign in to post comments on this report.</p>
          <button
            type="button"
            className="report-comments-gate__btn"
            onClick={() => setAuthGate('signIn')}
          >
            Sign in
          </button>
        </div>
      )}
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
    </section>
  );

  return (
    <>
      <PhoneVerificationModal
        open={authGate === 'signIn'}
        variant="signIn"
        onVerifyLater={() => setAuthGate('none')}
        onVerifyNow={() => router.push(loginHref)}
      />
      <PhoneVerificationModal
        open={authGate === 'phone'}
        onVerifyLater={() => setAuthGate('none')}
        onVerifyNow={() => router.push('/pages/verify-phone')}
      />

      {commentsSection}
    </>
  );
}
