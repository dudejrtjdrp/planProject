export function PageLoadingBar() {
  return (
    <div className="fixed inset-x-0 top-0 z-[60] h-1 overflow-hidden bg-transparent">
      <div className="h-full w-1/3 animate-[page-loading_1.1s_ease-in-out_infinite] rounded-r-full bg-[#3182F6]" />
    </div>
  );
}
