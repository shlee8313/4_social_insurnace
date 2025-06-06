// File: app/worker/components/WorkerSidebar.jsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, User, CreditCard, Clock, Shield, FileText, Settings, LogOut } from "lucide-react";
import { useAuth } from "../../store/authStore";

const navigation = [
  {
    name: "대시보드",
    href: "/worker/dashboard",
    icon: Home,
  },
  {
    name: "개인정보",
    href: "/worker/profile",
    icon: User,
  },
  {
    name: "급여명세서",
    href: "/worker/payroll",
    icon: CreditCard,
  },
  {
    name: "근태현황",
    href: "/worker/attendance",
    icon: Clock,
  },
  {
    name: "4대보험",
    href: "/worker/insurance",
    icon: Shield,
  },
  {
    name: "증명서",
    href: "/worker/documents",
    icon: FileText,
  },
];

export function WorkerSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("로그아웃 오류:", error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 로고 및 사용자 정보 */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">근로자</p>
          </div>
        </div>
      </div>

      {/* 네비게이션 메뉴 */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-100 text-blue-900"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <item.icon
                className={`mr-3 h-5 w-5 ${
                  isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
                }`}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* 하단 메뉴 */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <Link
          href="/worker/settings"
          className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <Settings className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-600" />
          설정
        </Link>
        <button
          onClick={handleLogout}
          className="w-full group flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-red-500" />
          로그아웃
        </button>
      </div>
    </div>
  );
}
