// File: components/layout/HomeNavigation.jsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "../ui/Button";
import { useAuth } from "../../store/authStore";

/**
 * 홈페이지 네비게이션 컴포넌트
 * 인증 상태에 따라 동적으로 버튼을 변경
 */
export default function HomeNavigation() {
  const router = useRouter();
  const { isAuthenticated, isInitialized, user, logout, getDefaultDashboard } = useAuth();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      // router.push("/login?message=logout_success");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleGoToDashboard = () => {
    const dashboard = getDefaultDashboard();
    router.push(dashboard);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 로고 */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <span className="ml-3 text-xl font-bold text-gray-900">4대보험 통합관리</span>
            </Link>
          </div>

          {/* 데스크톱 네비게이션 링크 */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <a
                href="#features"
                className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                기능소개
              </a>
              <a
                href="#benefits"
                className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                장점
              </a>
              <a
                href="#pricing"
                className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                요금안내
              </a>
              <a
                href="#contact"
                className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                문의하기
              </a>
            </div>
          </div>

          {/* 인증 버튼들 */}
          <div className="flex items-center space-x-4">
            {!isInitialized ? (
              // 초기화 중일 때 로딩 표시
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                <span className="text-sm text-gray-500">로딩중...</span>
              </div>
            ) : isAuthenticated && user ? (
              // 로그인된 상태
              <div className="flex items-center space-x-4">
                {/* 사용자 정보 */}
                <div className="hidden sm:flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {user.name?.charAt(0) || user.username?.charAt(0) || "U"}
                    </span>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">{user.name || user.username}</p>
                    <p
                      className={
                        user.entityStatus?.effectiveStatus === "active"
                          ? "text-gray-500"
                          : "text-red-500"
                      }
                    >
                      {user.entityStatus?.effectiveStatus === "active"
                        ? user.roles?.length > 0
                          ? user.roles[0].name
                          : "사용자"
                        : "사용제한중"}
                    </p>
                  </div>
                </div>

                {/* 대시보드 버튼 */}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleGoToDashboard}
                  className="hidden sm:inline-flex"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                  </svg>
                  대시보드
                </Button>

                {/* 로그아웃 버튼 */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  loading={isLoggingOut}
                  disabled={isLoggingOut}
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
                </Button>

                {/* 모바일 메뉴 버튼 */}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="md:hidden p-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                    />
                  </svg>
                </button>
              </div>
            ) : (
              // 로그인되지 않은 상태
              <>
                <Link href="/login">
                  <Button variant="secondary" size="sm">
                    로그인
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm">
                    회원가입
                  </Button>
                </Link>

                {/* 모바일 메뉴 버튼 */}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="md:hidden p-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                    />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

        {/* 모바일 메뉴 */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 animate-slide-down">
            <div className="flex flex-col space-y-3">
              {/* 네비게이션 링크들 */}
              <a
                href="#features"
                className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                기능소개
              </a>
              <a
                href="#benefits"
                className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                장점
              </a>
              <a
                href="#pricing"
                className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                요금안내
              </a>
              <a
                href="#contact"
                className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                문의하기
              </a>

              {/* 로그인된 경우 모바일용 추가 옵션 */}
              {isAuthenticated && user && (
                <>
                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <div className="flex items-center space-x-3 px-3 py-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {user.name?.charAt(0) || user.username?.charAt(0) || "U"}
                        </span>
                      </div>
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">{user.name || user.username}</p>
                        <p className="text-gray-500">
                          {user.roles?.length > 0 ? user.roles[0].name : "사용자"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      handleGoToDashboard();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
                  >
                    대시보드
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
