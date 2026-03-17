import { PageLoadingBar } from "@/components/ui/page-loading-bar";

export default function DashboardLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl p-8">
      <PageLoadingBar />
      <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-gray-700">데이터를 최신 상태로 불러오는 중...</p>
      </div>
    </div>
  );
}
