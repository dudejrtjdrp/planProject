import { PageLoadingBar } from "@/components/ui/page-loading-bar";

export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
      <PageLoadingBar />
      <div className="rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-sm">
        <p className="text-sm font-medium text-gray-700">페이지를 불러오는 중...</p>
      </div>
    </div>
  );
}
