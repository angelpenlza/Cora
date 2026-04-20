'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import PhoneVerificationModal from '@/app/components/phone-verification-modal';
import { useVotes } from './vote-context';
import {
  SIGN_IN_REQUIRED,
  VERIFICATION_REQUIRED,
} from '@/lib/report-auth-errors';

type AuthGate = 'none' | 'signIn' | 'phone';

type VoteButtonsProps = {
  reportId: number;
  initialUpvotes: number;
  initialDownvotes: number;
  initialUserVote: number;
  compact?: boolean;
  /** Use PNG arrows and compact counts for the report dashboard card footer. */
  dashboardIcons?: boolean;
};

/**
 * Universal vote buttons component. Reads from and writes to VoteContext
 * so vote state is shared across explore list and detail pages.
 *
 * Pass compact={true} for the explore list (arrow-only buttons).
 * Pass compact={false} for the detail page (labeled buttons).
 */
export default function VoteButtons({
  reportId,
  initialUpvotes,
  initialDownvotes,
  initialUserVote,
  compact = false,
  dashboardIcons = false,
}: VoteButtonsProps) {
  const router = useRouter();
  const pathname = usePathname() || '/pages/reports';
  const { getVoteEntry, castVote, registerReport } = useVotes();
  const [authGate, setAuthGate] = useState<AuthGate>('none');

  useEffect(() => {
    registerReport(reportId, initialUpvotes, initialDownvotes);
  }, [reportId, initialUpvotes, initialDownvotes, registerReport]);

  const entry = getVoteEntry(reportId);
  const userVote = entry?.userVote ?? initialUserVote;
  const upvotes = entry?.upvotes ?? initialUpvotes;
  const downvotes = entry?.downvotes ?? initialDownvotes;

  const handleVote = async (e: React.MouseEvent, value: 1 | -1) => {
    if (compact) {
      e.preventDefault();
      e.stopPropagation();
    }
    const result = await castVote(reportId, value, upvotes, downvotes);
    if (result.error === SIGN_IN_REQUIRED) {
      setAuthGate('signIn');
    } else if (result.error === VERIFICATION_REQUIRED) {
      setAuthGate('phone');
    }
  };

  const loginHref = `/pages/login?next=${encodeURIComponent(pathname)}`;

  const upIcon =
    userVote === 1
      ? '/assets/report-active-upvote.png'
      : '/assets/report-inactive-upvote.png';
  const downIcon =
    userVote === -1
      ? '/assets/report-active-downvote.png'
      : '/assets/report-inactive-downvote.png';

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
      {/* <div
        className={compact ? 'explore-vote-block' : 'report-vote-block'}
        onClick={compact ? (e) => e.stopPropagation() : undefined}
      > */}
        <div
          className={
            dashboardIcons && compact
              ? 'vote-block vote-block--dashboard'
              : 'vote-block'
          }
        >
          <button
            type="button"
            onClick={(e) => handleVote(e, 1)}
            aria-pressed={userVote === 1}
            className={`upvote-button ${userVote === 1 ? 'vote-button--active' : ''} ${dashboardIcons && compact ? 'vote-button--dashboard' : ''}`}
          >
            {compact ? (
              dashboardIcons ? (
                <img
                  className="vote-dashboard-icon vote-dashboard-icon--up"
                  src={upIcon}
                  alt=""
                  width={16}
                  height={16}
                />
              ) : (
                <>&#10145;</>
              )
            ) : (
              '↑ Upvote'
            )}
          </button>
          {upvotes}
        </div>

        {compact ? (
          <></>
        ) : (
          <>
            <button
              type="button"
              onClick={(e) => handleVote(e, -1)}
              aria-pressed={userVote === -1}
              className={`upvote-button ${userVote === -1 ? 'vote-button--active' : ''}`}
            >
              ↓ Downvote
            </button>
            <span className="vote-counts">
              ({upvotes} up / {downvotes} down)
            </span>
          </>
        )}
        {compact && (
          <div
            className={
              dashboardIcons
                ? 'vote-block vote-block--dashboard'
                : 'vote-block'
            }
          >
            <button
              type="button"
              onClick={(e) => handleVote(e, -1)}
              aria-pressed={userVote === -1}
              className={`downvote-button ${userVote === -1 ? 'vote-button--active' : ''} ${dashboardIcons ? 'vote-button--dashboard' : ''}`}
            >
              {dashboardIcons ? (
                <img
                  className="vote-dashboard-icon vote-dashboard-icon--down"
                  src={downIcon}
                  alt=""
                  width={16}
                  height={16}
                />
              ) : (
                <>&#10145;</>
              )}
            </button>
            <div>{downvotes}</div>
          </div>

        )}
      {/* </div> */}
    </>
  );
}
