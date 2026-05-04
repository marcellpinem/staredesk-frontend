"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNavBar() {
  const pathname = usePathname();

  const links = [
    {
      href: "/analytics",
      label: "ANALYTICS",
      icon: "bx bxs-pie-chart-alt-2 text-3xl",
    },
    { href: "/dashboard", label: "HOME", icon: "bx bxs-home text-3xl" },
    { href: "/settings", label: "SETTINGS", icon: "bx bxs-cog text-3xl" },
  ];

  return (
    <nav className="md:hidden h-18.75 bg-white fixed bottom-0 left-0 w-full z-50 flex items-center border-t">
      {links.map(({ href, label, icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 h-full flex flex-col justify-center items-center gap-1 ${
              active ? "bg-black text-[#FDB833]" : "bg-white text-black"
            }`}
          >
            <i className={icon} />
            <p className={"text-xs font-bold"}>{label}</p>
          </Link>
        );
      })}
    </nav>
  );
}
