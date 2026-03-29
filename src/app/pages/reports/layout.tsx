import { ExploreVoteProviderWrapper } from './report-vote-provider-wrapper';

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ExploreVoteProviderWrapper>
      {children}
    </ExploreVoteProviderWrapper>
  );
}
