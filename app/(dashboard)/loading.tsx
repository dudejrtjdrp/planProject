import { RouteLoadingSkeleton } from "@/components/ui/route-loading-skeleton";

export default function DashboardLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl p-8">
      <RouteLoadingSkeleton message="데이터를 최신 상태로 불러오는 중..." />
    </div>
  );
}
