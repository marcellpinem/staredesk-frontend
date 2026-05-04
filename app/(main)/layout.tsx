"use client";

import BottomNavBar from "@/components/layout/BottomNavBar";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { DeviceProvider } from "@/context/DeviceContext";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DeviceProvider>
      <div className="h-screen flex flex-col overflow-hidden pt-18">
        <Navbar />
        <div className="flex-1 flex flex-row overflow-hidden">
          <Sidebar />
          <div className="flex-1 overflow-y-auto pb-18.75 md:pb-0 md:pl-50">
            {children}
          </div>
        </div>
        <BottomNavBar />
      </div>
    </DeviceProvider>
  );
}
