// file: app/labor-office/layout.jsx
"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { LaborOfficeGuard } from "../components/auth/AuthGuard";
import LaborOfficeHeader from "./components/LaborOfficeHeader";
import LaborOfficeSidebar from "./components/LaborOfficeSidebar";

export default function LaborOfficeLayout({ children }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <LaborOfficeGuard>
      <div className="min-h-screen bg-gray-50">
        {/* 헤더 */}
        <LaborOfficeHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <div className="flex">
          {/* 사이드바 */}
          <LaborOfficeSidebar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            currentPath={pathname}
          />

          {/* 메인 콘텐츠 */}
          <main className="flex-1 lg:ml-64">
            <div className="py-6">{children}</div>
          </main>
        </div>
      </div>
    </LaborOfficeGuard>
  );
}
