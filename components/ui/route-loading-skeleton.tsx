import { PageLoadingBar } from "@/components/ui/page-loading-bar";

type RouteLoadingSkeletonProps = {
  message: string;
};

export function RouteLoadingSkeleton({ message }: RouteLoadingSkeletonProps) {
  return (
    <div className="space-y-6">
      <PageLoadingBar />
      <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-gray-700">{message}</p>
        <div className="mt-6 space-y-3">
          <div className="h-4 w-1/3 animate-pulse rounded bg-gray-100" />
          <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-gray-100" />
        </div>
      </div>
    </div>
  );
}