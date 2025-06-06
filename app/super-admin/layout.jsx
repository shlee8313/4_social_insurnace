// File: app/super-admin/layout.jsx (수정된 버전 - AuthStore 사용)
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SuperAdminGuard } from "../components/auth/AuthGuard";
import { useAuth } from "../store/authStore";

/**
 * SUPER_ADMIN 전용 레이아웃 (AuthStore 통합 버전)
 */
export default function SuperAdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAuthenticated, accessToken } = useAuth(); // 🔧 AuthStore에서 토큰 가져오기
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // 🔧 토큰 만료 감지 (AuthStore 상태 사용)
  useEffect(() => {
    const checkTokenExpiry = () => {
      // 🔧 수정: AuthStore에서 토큰 상태 확인
      if (!isAuthenticated || !accessToken) {
        console.log("🔒 Not authenticated or no token found, redirecting to login");
        router.push("/login?message=로그인이 필요합니다");
        return;
      }

      try {
        // JWT 토큰 디코딩 (AuthStore에서 가져온 토큰 사용)
        const base64Url = accessToken.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );
        const decoded = JSON.parse(jsonPayload);

        // 토큰 만료 검사
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          console.log("🕐 Token expired in SuperAdmin layout");
          handleLogout();
        }
      } catch (error) {
        console.error("❌ Token parsing error in SuperAdmin layout:", error);
        handleLogout();
      }
    };

    // 🔧 인증 상태가 있을 때만 토큰 만료 검사
    if (isAuthenticated && accessToken) {
      // 초기 검사
      checkTokenExpiry();

      // 1분마다 토큰 만료 검사
      const interval = setInterval(checkTokenExpiry, 60000);
      return () => clearInterval(interval);
    }
  }, [router, isAuthenticated, accessToken]); // 🔧 의존성 배열 수정

  const handleLogout = async () => {
    if (isLoggingOut) return; // 중복 실행 방지

    setIsLoggingOut(true);
    try {
      console.log("🚪 Logging out Super Admin user");

      // 🔧 AuthStore logout 사용 (localStorage 정리 포함)
      if (logout) {
        await logout();
      }

      console.log("✅ Super Admin logout successful");

      // 로그아웃 성공 시 로그인 페이지로 리다이렉트
      router.push("/login?message=로그아웃되었습니다");
    } catch (error) {
      console.error("❌ Super Admin logout error:", error);
      // 로그아웃 실패 시에도 강제로 로그인 페이지로 이동
      router.push("/login?message=세션이 만료되었습니다");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navigation = [
    {
      name: "대시보드",
      href: "/super-admin",
      icon: "🏠",
      current: pathname === "/super-admin",
      description: "시스템 전체 현황",
    },
    {
      name: "사용자 관리",
      href: "/super-admin/users",
      icon: "👥",
      current: pathname.startsWith("/super-admin/users"),
      description: "모든 사용자 계정 관리",
    },
    {
      name: "역할 & 권한",
      href: "/super-admin/roles",
      icon: "🔐",
      current: pathname.startsWith("/super-admin/roles"),
      description: "시스템 역할 및 권한",
    },
    {
      name: "시스템 설정",
      href: "/super-admin/system",
      icon: "⚙️",
      current: pathname.startsWith("/super-admin/system"),
      description: "전역 시스템 구성",
    },
    {
      name: "데이터베이스",
      href: "/super-admin/database",
      icon: "🗄️",
      current: pathname.startsWith("/super-admin/database"),
      description: "DB 관리 및 최적화",
    },
    {
      name: "로그 관리",
      href: "/super-admin/logs",
      icon: "📋",
      current: pathname.startsWith("/super-admin/logs"),
      description: "시스템 로그 분석",
    },
    {
      name: "백업 & 복원",
      href: "/super-admin/backup",
      icon: "💾",
      current: pathname.startsWith("/super-admin/backup"),
      description: "데이터 백업 관리",
    },
  ];

  const accountNavigation = [
    {
      name: "계정 설정",
      href: "/super-admin/profile",
      icon: "👤",
      current: pathname.startsWith("/super-admin/profile"),
      description: "관리자 프로필",
    },
  ];

  const quickAccess = [
    {
      name: "노무사 관리",
      href: "/labor-office",
      icon: "🏢",
      description: "노무사 사무실 관리",
      external: true,
    },
    {
      name: "회사 관리",
      href: "/company",
      icon: "🏭",
      description: "클라이언트 회사 관리",
      external: true,
    },
  ];

  // 🔧 현재 시간 표시
  const getCurrentTime = () => {
    return new Date().toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const [currentTime, setCurrentTime] = useState(getCurrentTime());

  // 🕐 시간 업데이트
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getCurrentTime());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <SuperAdminGuard>
      <div className="min-h-screen bg-gray-50">
        {/* 🚨 상단 경고 배너 */}
        <div className="bg-red-600 text-white px-4 py-2 text-center text-sm font-medium">
          ⚠️ 시스템 최고 관리자 모드 - 모든 작업이 로그에 기록됩니다 | 현재 시간: {currentTime}
        </div>

        {/* 상단 헤더 */}
        <header className="bg-orange-600 shadow-lg">
          <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <Link
                  href="/super-admin"
                  className="flex items-center hover:opacity-80 transition-opacity"
                >
                  <h1 className="text-2xl font-bold text-white">🛡️ SUPER ADMIN</h1>
                </Link>
                <div className="ml-4 px-3 py-1 bg-red-700 text-white text-xs rounded-full">
                  시스템 최고 관리자
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* 🔔 알림 아이콘 (추후 구현) */}
                <button className="text-white hover:text-red-200 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    ></path>
                  </svg>
                </button>

                {/* 사용자 정보 */}
                <Link
                  href="/super-admin/profile"
                  className="flex items-center text-white text-sm hover:text-red-200 transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 bg-red-700 rounded-full flex items-center justify-center mr-2">
                    <span className="text-xs font-bold">👤</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{user?.name || "Super Admin"}</div>
                    <div className="text-xs opacity-75">{user?.email || "admin@system.local"}</div>
                  </div>
                </Link>

                {/* 로그아웃 버튼 */}
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="bg-red-700 hover:bg-red-800 disabled:bg-red-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                >
                  {isLoggingOut ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                    <>🚪 로그아웃</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-8">
            {/* 🎛️ 사이드바 */}
            <aside className="w-80 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-md p-6">
                {/* 시스템 관리 메뉴 */}
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">🔧</span>
                    시스템 관리
                  </h2>
                  <nav className="space-y-2">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`
                          group flex items-start px-3 py-3 rounded-md text-sm font-medium transition-all duration-200
                          ${
                            item.current
                              ? "bg-red-100 text-red-700 border-l-4 border-red-500 shadow-sm"
                              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm"
                          }
                        `}
                      >
                        <span className="mr-3 text-lg flex-shrink-0">{item.icon}</span>
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-xs opacity-75">{item.description}</div>
                        </div>
                      </Link>
                    ))}
                  </nav>
                </div>

                {/* 빠른 접근 */}
                <div className="mb-8">
                  <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="mr-2">⚡</span>
                    빠른 접근
                  </h3>
                  <div className="space-y-2">
                    {quickAccess.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="block p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors group"
                      >
                        <div className="flex items-center">
                          <span className="mr-3 text-lg group-hover:scale-110 transition-transform">
                            {item.icon}
                          </span>
                          <div>
                            <div className="text-sm font-medium text-gray-900 flex items-center">
                              {item.name}
                              {item.external && (
                                <svg
                                  className="w-3 h-3 ml-1 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                  ></path>
                                </svg>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">{item.description}</div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* 계정 관리 */}
                <div className="mb-8">
                  <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="mr-2">👤</span>
                    계정 관리
                  </h3>
                  <nav className="space-y-2">
                    {accountNavigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`
                          group flex items-start px-3 py-3 rounded-md text-sm font-medium transition-all duration-200
                          ${
                            item.current
                              ? "bg-blue-100 text-blue-700 border-l-4 border-blue-500 shadow-sm"
                              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm"
                          }
                        `}
                      >
                        <span className="mr-3 text-lg flex-shrink-0">{item.icon}</span>
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-xs opacity-75">{item.description}</div>
                        </div>
                      </Link>
                    ))}
                  </nav>
                </div>

                {/* ⚠️ 경고 알림 */}
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex">
                    <span className="text-yellow-400 mr-2 text-lg">⚠️</span>
                    <div>
                      <h3 className="text-sm font-medium text-yellow-800">주의사항</h3>
                      <div className="mt-1 text-xs text-yellow-700 space-y-1">
                        <p>• SUPER_ADMIN 권한으로 접근 중</p>
                        <p>• 모든 시스템 데이터 접근 가능</p>
                        <p>• 작업 내용이 전부 기록됨</p>
                        {/* 🔧 디버깅 정보 추가 */}
                        <p>• 인증 상태: {isAuthenticated ? "✅" : "❌"}</p>
                        <p>• 토큰 존재: {accessToken ? "✅" : "❌"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* 📄 메인 콘텐츠 */}
            <main className="flex-1">
              <div className="bg-white rounded-lg shadow-md min-h-[600px]">{children}</div>
            </main>
          </div>
        </div>
      </div>
    </SuperAdminGuard>
  );
}
