// file: app/company/components/CompanySidebar.jsx
"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "../../store/authStore";

export default function CompanySidebar({ sidebarOpen, setSidebarOpen, currentPath }) {
  const { hasRole } = useAuth();

  // 네비게이션 메뉴 정의
  const navigation = [
    {
      name: "대시보드",
      href: "/company/dashboard",
      icon: "📊",
      current: currentPath === "/company/dashboard",
      description: "전체 현황 요약",
    },
    {
      name: "직원 관리",
      href: "/company/employees",
      icon: "👥",
      current: currentPath.startsWith("/company/employees"),
      description: "직원 정보 및 현황",
      submenu: [
        { name: "전체 직원", href: "/company/employees" },
        { name: "신규 등록", href: "/company/employees/add" },
        { name: "부서 관리", href: "/company/departments" },
      ],
    },
    {
      name: "근태 관리",
      href: "/company/attendance",
      icon: "⏰",
      current: currentPath.startsWith("/company/attendance"),
      description: "출퇴근 및 휴가 관리",
      submenu: [
        { name: "일일 근태", href: "/company/attendance/daily" },
        { name: "월별 근태", href: "/company/attendance/monthly" },
        { name: "휴가 관리", href: "/company/attendance/leave" },
        { name: "근태 입력", href: "/company/attendance/import" },
      ],
    },
    {
      name: "급여 관리",
      href: "/company/payroll",
      icon: "💰",
      current: currentPath.startsWith("/company/payroll"),
      description: "급여 계산 및 명세서",
      submenu: [
        { name: "급여 현황", href: "/company/payroll" },
        { name: "급여 명세서", href: "/company/payroll/payslips" },
        { name: "급여 설정", href: "/company/payroll-settings" },
      ],
      adminOnly: true, // COMPANY_ADMIN만 접근 가능
    },
    {
      name: "4대보험",
      href: "/company/insurance",
      icon: "🛡️",
      current: currentPath.startsWith("/company/insurance"),
      description: "보험 가입 현황",
      submenu: [
        { name: "가입 현황", href: "/company/insurance/status" },
        { name: "선택 가입", href: "/company/insurance/voluntary" },
      ],
    },
    {
      name: "계약서 관리",
      href: "/company/contracts",
      icon: "📄",
      current: currentPath.startsWith("/company/contracts"),
      description: "근로 계약서 관리",
      submenu: [
        { name: "계약서 목록", href: "/company/contracts" },
        { name: "계약서 생성", href: "/company/contracts/create" },
      ],
    },
  ];

  // 설정 메뉴
  const settingsNavigation = [
    {
      name: "회사 설정",
      href: "/company/settings",
      icon: "⚙️",
      current: currentPath.startsWith("/company/settings"),
      description: "회사 정보 및 설정",
      adminOnly: true,
    },
    {
      name: "사용자 관리",
      href: "/company/settings/users",
      icon: "👤",
      current: currentPath.startsWith("/company/settings/users"),
      description: "직원 계정 관리",
      adminOnly: true,
    },
    {
      name: "알림 설정",
      href: "/company/settings/notifications",
      icon: "🔔",
      current: currentPath.startsWith("/company/settings/notifications"),
      description: "알림 및 공지 설정",
    },
  ];

  // 권한 체크 함수
  const hasAccess = (item) => {
    if (item.adminOnly) {
      return hasRole("COMPANY_ADMIN") || hasRole("SUPER_ADMIN");
    }
    return true;
  };

  // 메뉴 아이템 렌더링
  const renderMenuItem = (item, isSubmenu = false) => {
    if (!hasAccess(item)) return null;

    return (
      <Link
        key={item.name}
        href={item.href}
        onClick={() => setSidebarOpen(false)} // 모바일에서 클릭 시 사이드바 닫기
        className={`
          group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
          ${isSubmenu ? "ml-6 pl-6" : ""}
          ${
            item.current
              ? "bg-blue-100 text-blue-700 border-r-2 border-blue-500"
              : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          }
        `}
      >
        <span className={`mr-3 text-lg ${isSubmenu ? "text-sm" : ""}`}>
          {isSubmenu ? "•" : item.icon}
        </span>
        <div className="flex-1">
          <div className="font-medium">{item.name}</div>
          {!isSubmenu && item.description && (
            <div className="text-xs text-gray-500 mt-1">{item.description}</div>
          )}
        </div>
        {item.submenu && !isSubmenu && (
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 5l7 7-7 7"
            ></path>
          </svg>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* 사이드바 */}
      <aside
        className={`
        fixed top-16 left-0 z-40 w-64 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out lg:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="h-full px-3 py-4 overflow-y-auto">
          {/* 메인 네비게이션 */}
          <div className="mb-8">
            <h2 className="mb-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              메인 메뉴
            </h2>
            <nav className="space-y-1">
              {navigation.map((item) => {
                if (!hasAccess(item)) return null;

                return (
                  <div key={item.name}>
                    {renderMenuItem(item)}
                    {/* 서브메뉴 렌더링 */}
                    {item.submenu && item.current && (
                      <div className="mt-1 space-y-1">
                        {item.submenu.map((subItem) =>
                          renderMenuItem(
                            {
                              ...subItem,
                              current: currentPath === subItem.href,
                            },
                            true
                          )
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* 설정 네비게이션 */}
          <div className="mb-8">
            <h2 className="mb-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              설정
            </h2>
            <nav className="space-y-1">
              {settingsNavigation.map((item) => renderMenuItem(item))}
            </nav>
          </div>

          {/* 빠른 액션 */}
          <div className="mb-8">
            <h2 className="mb-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              빠른 액션
            </h2>
            <div className="space-y-2">
              <button
                onClick={() => alert("직원 추가 (준비중)")}
                className="w-full flex items-center px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <span className="mr-2">➕</span>
                직원 추가
              </button>
              <button
                onClick={() => alert("급여 계산 (준비중)")}
                className="w-full flex items-center px-3 py-2 text-sm text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
                <span className="mr-2">💰</span>
                급여 계산
              </button>
              <button
                onClick={() => alert("보고서 생성 (준비중)")}
                className="w-full flex items-center px-3 py-2 text-sm text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <span className="mr-2">📊</span>
                보고서 생성
              </button>
            </div>
          </div>

          {/* 시스템 정보 */}
          <div className="pt-4 border-t border-gray-200">
            <div className="px-3 py-2">
              <div className="text-xs text-gray-500 mb-1">시스템 상태</div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-xs text-gray-600">정상 운영 중</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
