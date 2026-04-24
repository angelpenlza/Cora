'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { setReportVote, getMyVotes } from '@/app/components/report-actions';

type VoteEntry = {
  userVote: number;
  upvotes: number;
  downvotes: number;
};

type VoteContextValue = {
  getVoteEntry: (reportId: number) => VoteEntry | undefined;
  castVote: (
    reportId: number,
    value: 1 | -1,
    currentUpvotes: number,
    currentDownvotes: number,
  ) => Promise<{ error?: string }>;
  registerReport: (reportId: number, upvotes: number, downvotes: number) => void;
};

const VoteContext = createContext<VoteContextValue | null>(null);

export function useVotes() {
  const ctx = useContext(VoteContext);
  if (!ctx) throw new Error('useVotes must be used inside VoteProvider');
  return ctx;
}

type VoteProviderProps = {
  children: ReactNode;
};

export function VoteProvider({ children }: VoteProviderProps) {
  const [entries, setEntries] = useState<Record<number, VoteEntry>>({});
  // Always-current mirror of entries used in castVote so it doesn't need entries as a dep.
  const entriesRef = useRef<Record<number, VoteEntry>>({});
  entriesRef.current = entries;

  const pendingIds = useRef<Set<number>>(new Set());
  const hydratedIds = useRef<Set<number>>(new Set());
  const hydrationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localVoteIds = useRef<Set<number>>(new Set());

  const hydrateVotes = useCallback(() => {
    const idsToFetch = Array.from(pendingIds.current).filter((id) => !hydratedIds.current.has(id));
    if (idsToFetch.length === 0) return;

    idsToFetch.forEach((id) => hydratedIds.current.add(id));

    getMyVotes(idsToFetch).then((freshVotes) => {
      setEntries((prev) => {
        const next = { ...prev };
        for (const id of idsToFetch) {
          if (localVoteIds.current.has(id)) continue;
          const vote = freshVotes[id] ?? 0;
          if (next[id]) {
            next[id] = { ...next[id], userVote: vote };
          } else {
            next[id] = { userVote: vote, upvotes: 0, downvotes: 0 };
          }
        }
        return next;
      });
    });
  }, []);

  const registerReport = useCallback((reportId: number, upvotes: number, downvotes: number) => {
    setEntries((prev) => {
      if (prev[reportId]) {
        if (prev[reportId].upvotes === 0 && prev[reportId].downvotes === 0 && (upvotes > 0 || downvotes > 0)) {
          return { ...prev, [reportId]: { ...prev[reportId], upvotes, downvotes } };
        }
        return prev;
      }
      return { ...prev, [reportId]: { userVote: 0, upvotes, downvotes } };
    });

    if (!hydratedIds.current.has(reportId)) {
      pendingIds.current.add(reportId);
      if (hydrationTimer.current) clearTimeout(hydrationTimer.current);
      hydrationTimer.current = setTimeout(hydrateVotes, 50);
    }
  }, [hydrateVotes]);

  const getVoteEntry = useCallback(
    (reportId: number): VoteEntry | undefined => entries[reportId],
    [entries],
  );

  const castVote = useCallback(
    async (
      reportId: number,
      value: 1 | -1,
      currentUpvotes: number,
      currentDownvotes: number,
    ): Promise<{ error?: string }> => {
      // Read current vote from the ref so this callback stays stable (no entries dep).
      const prevVote = entriesRef.current[reportId]?.userVote ?? 0;
      const nextValue = value === prevVote ? 0 : value;

      const result = await setReportVote(reportId, nextValue);
      if (result.error) return result;

      localVoteIds.current.add(reportId);

      setEntries((old) => {
        const entry = old[reportId] ?? { userVote: 0, upvotes: currentUpvotes, downvotes: currentDownvotes };
        let up = entry.upvotes;
        let down = entry.downvotes;
        if (entry.userVote === 1) up--;
        if (entry.userVote === -1) down--;
        if (nextValue === 1) up++;
        if (nextValue === -1) down++;
        return { ...old, [reportId]: { userVote: nextValue, upvotes: up, downvotes: down } };
      });

      return {};
    },
    // entriesRef is a stable ref — no need to list entries as a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <VoteContext.Provider value={{ getVoteEntry, castVote, registerReport }}>
      {children}
    </VoteContext.Provider>
  );
}
