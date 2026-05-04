"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearAuth } from "@/lib/api";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    { href: "/dashboard", label: "HOME", icon: "bx bxs-home text-2xl" },
    {
      href: "/analytics",
      label: "ANALYTICS",
      icon: "bx bxs-pie-chart-alt-2 text-2xl",
    },
    { href: "/settings", label: "SETTINGS", icon: "bx bxs-cog text-2xl" },
  ];

  function handleLogout() {
    clearAuth();
    router.push("/login");
  }

  return (
    <aside className="w-50 hidden md:flex flex-col fixed top-18 bottom-0 left-0 border-r bg-white">
      <div className="flex flex-col w-full h-full justify-between">
        <div className="border-b">
          {links.map(({ href, label, icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 w-full px-5 py-4 ${
                  active ? "bg-[#4d4949] text-[#FDB833]" : "bg-white text-black"
                }`}
              >
                <i className={icon} />
                <span className="font-bold text-sm">{label}</span>
              </Link>
            );
          })}
        </div>

        <button
          onClick={handleLogout}
          className="bg-black text-[#FDB833] flex items-center pl-7 gap-3 h-14 w-full hover:bg-zinc-800 transition-colors"
        >
          <LogOut />
          <p className="font-bold">Log Out</p>
        </button>
      </div>
    </aside>
  );
}
