import Link from "next/link";
import { navigationItems } from "@/lib/config/navigation";

export function SidebarNav() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white px-5 py-6 lg:block">
      <div className="px-2 pb-8">
        <p className="text-lg font-semibold tracking-tight text-gray-900">PlanProject</p>
        <p className="mt-1 text-sm text-gray-400">Strategy Workspace</p>
      </div>
      <nav className="space-y-1">
        {navigationItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-xl border border-transparent px-3 py-2 text-sm font-medium text-gray-700 transition-all duration-200 hover:border-gray-200 hover:bg-gray-50"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
