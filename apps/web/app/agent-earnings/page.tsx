import type { Metadata } from 'next';
import { AgentEarningsScreen } from '@/components/agent-earnings/AgentEarningsScreen';

export const metadata: Metadata = {
  title: 'Agent Earnings | Popo Live',
  description:
    'Agent Earnings frontend preview showing sample points totals, monthly/pending summaries, host activity earnings, and commission history.',
};

export default function AgentEarningsPage() {
  return <AgentEarningsScreen />;
}
