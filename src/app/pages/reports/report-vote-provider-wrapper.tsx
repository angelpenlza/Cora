'use client';

import { type ReactNode } from 'react';
import { VoteProvider } from './vote-context';

export function ExploreVoteProviderWrapper({
  children,
}: {
  children: ReactNode;
}) {
  return <VoteProvider>{children}</VoteProvider>;
}
