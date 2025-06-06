// file: app/labor-office/components/LaborOfficeHeader.jsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, useEntityStatus } from "../../store/authStore";

export default function LaborOfficeHeader({ sidebarOpen, setSidebarOpen }) {
  const router = useRouter();
  const { user, logout, hasRole } = useAuth();
  const { isActive, isInactive, isTerminated, getStatusMessage } = useEntityStatus();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // 🆕 엔터티 상태 확인
  const isEntityActive = isActive();
  const isEntityInactive = isInactive();
  const isEntityTerminated = isTerminated();
  const isSuperAdmin = hasRole("SUPER_ADMIN");

  // 로그아웃 처리
  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      console.log("🚪 Labor office user logging out");

      if (logout) {
        await logout();
      }

      console.log("✅ Labor office logout successful");
      router.push("/login?message=로그아웃되었습니다");
    } catch (error) {
      console.error("❌ Labor office logout error:", error);
      router.push("/login?message=세션이 만료되었습니다");
    } finally {
      setIsLoggingOut(false);
    }
  };

  // 사용자 정보에서 노무사 사무실명과 역할 추출
  const getLaborOfficeInfo = () => {
    if (user?.roles && user.roles.length > 0) {
      const laborRole = user.roles.find(
        (role) => role.code === "LABOR_ADMIN" || role.code === "LABOR_STAFF"
      );
      return {
        officeName: laborRole?.scope?.laborOfficeName || "노무사 사무실",
        roleName: laborRole?.name || "노무사",
        isAdmin: laborRole?.code === "LABOR_ADMIN",
      };
    }
    return { officeName: "노무사 사무실", roleName: "노무사", isAdmin: false };
  };

  const { officeName, roleName, isAdmin } = getLaborOfficeInfo();

  // 🆕 메뉴 접근 권한 확인 함수
  const canAccessMenu = (menuType) => {
    // SUPER_ADMIN은 모든 메뉴 접근 가능
    if (isSuperAdmin) return true;

    // 허용되는 메뉴들 (비활성화 상태에서도 접근 가능)
    const allowedMenus = ["profile", "help", "logout"];

    if (allowedMenus.includes(menuType)) {
      return true;
    }

    // 나머지 메뉴는 활성 상태에서만 접근 가능
    return isEntityActive;
  };

  // 🆕 상태별 메시지 생성
  const getStatusBannerMessage = () => {
    if (isSuperAdmin) return null;

    if (isEntityInactive) {
      return "계정이 비활성화되어 프로필 이외의 메뉴에 접근 제한이 됩니다.";
    }

    if (isEntityTerminated) {
      return "계정이 종료되어 대부분의 기능에 접근할 수 없습니다. 관리자에게 문의하세요.";
    }

    return null;
  };

  const statusMessage = getStatusBannerMessage();

  return (
    <>
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

              {/* 로고 및 사무실명 */}
              <Link href="/labor-office/dashboard" className="flex items-center ml-4 lg:ml-0">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white font-bold text-sm">🏛️</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">{officeName}</h1>
                    <p className="text-xs text-gray-500">노무법인 관리 시스템</p>
                  </div>
                </div>
              </Link>
            </div>

            {/* 중앙: 빠른 검색 (활성 상태에서만) */}
            {canAccessMenu("search") && (
              <div className="hidden md:flex flex-1 max-w-md mx-8">
                <div className="relative w-full">
                  <input
                    type="text"
                    placeholder="고객사 또는 근로자 검색..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-4 w-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      ></path>
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* 우측: 알림 + 빠른 액션 + 사용자 메뉴 */}
            <div className="flex items-center space-x-4">
              {/* 알림 아이콘 (활성 상태에서만) */}
              {canAccessMenu("notifications") && (
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
              )}

              {/* 빠른 액션 버튼 (활성 상태에서만) */}
              {canAccessMenu("quick_actions") && (
                <div className="hidden md:flex items-center space-x-2">
                  <button
                    onClick={() => alert("4대보험 신고 (준비중)")}
                    className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-md text-sm font-medium hover:bg-indigo-200 transition-colors"
                  >
                    📋 신고
                  </button>
                  <button
                    onClick={() => alert("급여 계산 (준비중)")}
                    className="px-3 py-1.5 bg-green-100 text-green-700 rounded-md text-sm font-medium hover:bg-green-200 transition-colors"
                  >
                    💰 급여
                  </button>
                </div>
              )}

              {/* 사용자 메뉴 */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {/* 아바타 */}
                  <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {user?.name?.charAt(0) || "U"}
                    </span>
                  </div>

                  {/* 사용자 정보 */}
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium text-gray-900">
                      {user?.name || "사용자"}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center">
                      {isAdmin && <span className="text-orange-600 mr-1">👑</span>}
                      {roleName}
                      {/* 🆕 상태 표시 */}
                      {!isEntityActive && !isSuperAdmin && (
                        <span className="ml-1 px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                          {isEntityInactive ? "비활성" : "제한"}
                        </span>
                      )}
                    </div>
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
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    {/* 사용자 정보 헤더 */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                      <div className="text-sm text-gray-500">{user?.email}</div>
                      <div className="text-xs text-gray-400 mt-1 flex items-center">
                        {isAdmin && <span className="text-orange-600 mr-1">👑</span>}
                        {roleName} • {officeName}
                        {/* 🆕 상태 표시 */}
                        {!isEntityActive && !isSuperAdmin && (
                          <span className="ml-1 px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                            {isEntityInactive ? "비활성" : "제한"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 메뉴 항목들 */}
                    <Link
                      href="/labor-office/settings/profile"
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

                    {/* 🆕 조건부 메뉴 항목들 */}
                    {canAccessMenu("office_settings") ? (
                      <Link
                        href="/labor-office/settings/office"
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
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h2M7 7h3a2 2 0 012 2v3a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2z"
                            ></path>
                          </svg>
                          사무실 관리
                        </div>
                      </Link>
                    ) : (
                      <div className="px-4 py-2 text-sm text-gray-400 cursor-not-allowed">
                        <div className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-3 opacity-50"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h2M7 7h3a2 2 0 012 2v3a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2z"
                            ></path>
                          </svg>
                          사무실 관리 <span className="text-xs">(접근 제한)</span>
                        </div>
                      </div>
                    )}

                    {canAccessMenu("analytics") ? (
                      <Link
                        href="/labor-office/analytics"
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
                              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            ></path>
                          </svg>
                          통계 분석
                        </div>
                      </Link>
                    ) : (
                      <div className="px-4 py-2 text-sm text-gray-400 cursor-not-allowed">
                        <div className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-3 opacity-50"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            ></path>
                          </svg>
                          통계 분석 <span className="text-xs">(접근 제한)</span>
                        </div>
                      </div>
                    )}

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

        {/* 🆕 상태 안내 배너 */}
        {statusMessage && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-yellow-600 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm text-yellow-800 font-medium">{statusMessage}</span>
              </div>
              <Link
                href="/labor-office/entity-status"
                className="text-sm text-yellow-700 hover:text-yellow-900 underline"
              >
                자세히 보기
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 🆕 모바일 메뉴 배경 오버레이 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </>
  );
}
