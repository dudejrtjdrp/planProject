import { RouteLoadingSkeleton } from "@/components/ui/route-loading-skeleton";

export default function RootLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl p-8">
      <RouteLoadingSkeleton message="페이지를 불러오는 중..." />
    </div>
  );
}
