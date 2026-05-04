"use client";

// frontend/components/layout/Navbar.tsx

import { useDevice } from "@/context/DeviceContext";
import { clearAuth } from "@/lib/api";
import { LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { ws } = useDevice();
  const isOnline = ws.device?.is_online ?? false;

  const router = useRouter();

  function handleLogout() {
    clearAuth();
    router.push("/login");
  }

  return (
    <nav className="bg-black h-18 flex items-center justify-between pl-3 pr-7 md:pl-3 md:pr-7 fixed top-0 left-0 right-0 z-50">
      <Link
        href="/dashboard"
        className="flex items-center gap-0 md:gap-2 select-none"
      >
        <Image
          src="/staredesk-logo-dua.png"
          alt="StareDesk"
          height={45}
          width={45}
          className="object-contain"
        />
        <h1 className="text-white font-bold text-2xl">StareDesk</h1>
      </Link>

      <LogOut
        onClick={handleLogout}
        className="flex md:hidden h-5 w-5 text-[#FDB833] cursor-pointer"
        size={16}
        strokeWidth={3}
      />

      <div className="scale-80 bg-white hidden md:flex items-center gap-3 py-2 px-5 lg:px-3 rounded-md border-3 border-[#3A3A3A] select-none">
        <div
          className={`h-5 w-5 rounded-full border ${
            isOnline ? "bg-[#FDB833]" : "bg-black"
          }`}
        />
        <h1 className="font-bold text-md md:text-md tracking-widest">
          {isOnline ? "ONLINE" : "OFFLINE"}
        </h1>
      </div>
    </nav>
  );
}
