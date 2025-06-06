// file: app/company/components/CompanyHeader.jsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../store/authStore";

export default function CompanyHeader({ sidebarOpen, setSidebarOpen }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // 로그아웃 처리
  const handleLogout = async () => {
    if (isLoggingOut) return;

    // const confirmLogout = confirm("정말 로그아웃하시겠습니까?");
    // if (!confirmLogout) return;

    setIsLoggingOut(true);
    try {
      console.log("🚪 Company user logging out");

      if (logout) {
        await logout();
      }

      console.log("✅ Company logout successful");
      router.push("/login?message=로그아웃되었습니다");
    } catch (error) {
      console.error("❌ Company logout error:", error);
      router.push("/login?message=세션이 만료되었습니다");
    } finally {
      setIsLoggingOut(false);
    }
  };

  // 사용자 정보에서 회사명 추출 (roles에서)
  const getCompanyInfo = () => {
    if (user?.roles && user.roles.length > 0) {
      const companyRole = user.roles.find(
        (role) => role.code === "COMPANY_ADMIN" || role.code === "COMPANY_HR"
      );
      return {
        companyName: companyRole?.scope?.companyName || "우리 회사",
        roleName: companyRole?.name || "직원",
      };
    }
    return { companyName: "우리 회사", roleName: "직원" };
  };

  const { companyName, roleName } = getCompanyInfo();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 좌측: 햄버거 메뉴 + 로고 */}
          <div className="flex items-center">
            {/* 모바일 햄버거 메뉴 */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                ></path>
              </svg>
            </button>

            {/* 로고 및 회사명 */}
            <Link href="/company/dashboard" className="flex items-center ml-4 lg:ml-0">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">🏢</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{companyName}</h1>
                  <p className="text-xs text-gray-500">인사관리 시스템</p>
                </div>
              </div>
            </Link>
          </div>

          {/* 우측: 알림 + 사용자 메뉴 */}
          <div className="flex items-center space-x-4">
            {/* 알림 아이콘 */}
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors relative">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                ></path>
              </svg>
              {/* 알림 배지 */}
              <span className="absolute top-1 right-1 block h-2 w-2 bg-red-500 rounded-full"></span>
            </button>

            {/* 사용자 메뉴 */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {/* 아바타 */}
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {user?.name?.charAt(0) || "U"}
                  </span>
                </div>

                {/* 사용자 정보 */}
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium text-gray-900">{user?.name || "사용자"}</div>
                  <div className="text-xs text-gray-500">{roleName}</div>
                </div>

                {/* 드롭다운 화살표 */}
                <svg
                  className="w-4 h-4 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </button>

              {/* 드롭다운 메뉴 */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  {/* 사용자 정보 헤더 */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                    <div className="text-sm text-gray-500">{user?.email}</div>
                    <div className="text-xs text-gray-400 mt-1">{roleName}</div>
                  </div>

                  {/* 메뉴 항목들 */}
                  <Link
                    href="/company/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        ></path>
                      </svg>
                      내 프로필
                    </div>
                  </Link>

                  <Link
                    href="/company/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        ></path>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        ></path>
                      </svg>
                      회사 설정
                    </div>
                  </Link>

                  <button
                    onClick={() => alert("도움말 페이지 (준비중)")}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        ></path>
                      </svg>
                      도움말
                    </div>
                  </button>

                  <div className="border-t border-gray-100 mt-1">
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center">
                        {isLoggingOut ? (
                          <>
                            <svg
                              className="animate-spin w-4 h-4 mr-3"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            로그아웃 중...
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-4 h-4 mr-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                              ></path>
                            </svg>
                            로그아웃
                          </>
                        )}
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 모바일 메뉴 배경 오버레이 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </header>
  );
}
