import type { ReactNode } from "react";
import { TopHeader } from "./top-header";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <TopHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 p-8">{children}</main>
    </div>
  );
}
