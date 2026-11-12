import type { Metadata } from 'next';
import { AgencyManagementScreen } from '@/components/agency-management/AgencyManagementScreen';

export const metadata: Metadata = {
  title: 'Agency | Popo Live',
  description:
    'Agency Management frontend preview showing agency summary, profile information editing, host management, activity performance, and support.',
};

export default function AgencyManagementPage() {
  return <AgencyManagementScreen />;
}
