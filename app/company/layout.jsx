// file: app/company/layout.jsx
"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { CompanyGuard } from "../components/auth/AuthGuard";
import CompanyHeader from "./components/CompanyHeader";
import CompanySidebar from "./components/CompanySidebar";

export default function CompanyLayout({ children }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <CompanyGuard>
      <div className="min-h-screen bg-gray-50">
        {/* 헤더 */}
        <CompanyHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <div className="flex">
          {/* 사이드바 */}
          <CompanySidebar
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
    </CompanyGuard>
  );
}
