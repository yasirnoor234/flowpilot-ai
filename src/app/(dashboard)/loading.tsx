import { LoadingState } from '@/components/ui/loading-state';

export default function DashboardLoading() {
  return (
    <div className="py-16">
      <LoadingState message="Loading workspace data..." />
    </div>
  );
}
