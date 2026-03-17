import { PageLoadingBar } from "@/components/ui/page-loading-bar";

export default function ProjectRouteLoading() {
  return (
    <div className="space-y-6">
      <PageLoadingBar />
      <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-gray-700">프로젝트를 불러오는 중...</p>
      </div>
    </div>
  );
}
