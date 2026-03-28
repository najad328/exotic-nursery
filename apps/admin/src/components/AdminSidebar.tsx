"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: "📊" },
  { label: "Plants", href: "/plants", icon: "🌿" },
  { label: "Orders", href: "/orders", icon: "📦" },
  { label: "Analytics", href: "/analytics", icon: "📈" },
  { label: "Pincodes", href: "/pincodes", icon: "📍" },
  { label: "WhatsApp", href: "/whatsapp", icon: "💬" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-green-900 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-green-800">
        <h1 className="text-xl font-bold">🌿 Exotic Nursery</h1>
        <p className="text-green-300 text-xs mt-1">Admin Dashboard</p>
      </div>

      <nav className="flex-1 py-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                isActive
                  ? "bg-green-800 text-white font-semibold border-r-4 border-green-400"
                  : "text-green-200 hover:bg-green-800/50 hover:text-white"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-green-800">
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="w-full text-left text-green-300 hover:text-white text-sm px-2 py-2 rounded hover:bg-green-800/50 transition-colors"
          >
            ← Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}
