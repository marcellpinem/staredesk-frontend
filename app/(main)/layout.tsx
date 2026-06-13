"use client";

import BottomNavBar from "@/components/layout/BottomNavBar";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { DeviceProvider } from "@/context/DeviceContext";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <DeviceProvider>
      <div className="relative h-dvh overflow-hidden bg-[url('/bg-mobile-main.svg')] bg-cover bg-center bg-no-repeat lg:bg-[url('/bg-desktop-main.svg')]">
        <Navbar />

        <Sidebar />

        <main className="h-full overflow-y-auto pt-18 pb-18.75 md:pb-0 md:pl-50">
          {children}
        </main>

        <BottomNavBar />
      </div>
    </DeviceProvider>
  );
}
