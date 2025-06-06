// File: app/worker/components/WorkerHeader.jsx
"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, Search, Menu, User, Settings, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "../../store/authStore";

// 페이지별 제목 매핑
const PAGE_TITLES = {
  "/worker/dashboard": "대시보드",
  "/worker/profile": "개인정보",
  "/worker/payroll": "급여명세서",
  "/worker/attendance": "근태현황",
  "/worker/insurance": "4대보험 현황",
  "/worker/documents": "증명서 발급",
  "/worker/settings": "설정",
};

export function WorkerHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const currentTitle = PAGE_TITLES[pathname] || "근로자 시스템";

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("로그아웃 오류:", error);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        {/* 좌측: 페이지 제목 */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-semibold text-gray-900">{currentTitle}</h1>
          </div>
        </div>

        {/* 우측: 알림, 검색, 사용자 메뉴 */}
        <div className="flex items-center space-x-4">
          {/* 검색 (추후 구현) */}
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <Search className="h-5 w-5" />
          </button>

          {/* 알림 */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors relative"
            >
              <Bell className="h-5 w-5" />
              {/* 알림 배지 */}
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </button>

            {/* 알림 드롭다운 */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">알림</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {/* 알림 목록 */}
                  <div className="p-4 hover:bg-gray-50 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">급여명세서 발급</p>
                    <p className="text-xs text-gray-600 mt-1">
                      2024년 5월 급여명세서가 발급되었습니다.
                    </p>
                    <p className="text-xs text-gray-400 mt-2">2시간 전</p>
                  </div>
                  <div className="p-4 hover:bg-gray-50 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">근태 확인 요청</p>
                    <p className="text-xs text-gray-600 mt-1">5월 근태 내역을 확인해주세요.</p>
                    <p className="text-xs text-gray-400 mt-2">1일 전</p>
                  </div>
                  <div className="p-4 hover:bg-gray-50">
                    <p className="text-sm font-medium text-gray-900">보험료 안내</p>
                    <p className="text-xs text-gray-600 mt-1">5월 4대보험료가 조정되었습니다.</p>
                    <p className="text-xs text-gray-400 mt-2">3일 전</p>
                  </div>
                </div>
                <div className="p-4 border-t border-gray-200">
                  <button className="w-full text-center text-sm text-blue-600 hover:text-blue-800">
                    모든 알림 보기
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 사용자 메뉴 */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-2 text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium hidden md:block">{user?.name}</span>
              <ChevronDown className="h-4 w-4" />
            </button>

            {/* 사용자 드롭다운 메뉴 */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-3 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-600">{user?.email || "이메일 없음"}</p>
                </div>
                <div className="py-1">
                  <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <User className="mr-3 h-4 w-4" />내 정보
                  </button>
                  <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <Settings className="mr-3 h-4 w-4" />
                    설정
                  </button>
                </div>
                <div className="py-1 border-t border-gray-200">
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    로그아웃
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 클릭 외부 영역 처리 */}
      {(showUserMenu || showNotifications) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowUserMenu(false);
            setShowNotifications(false);
          }}
        />
      )}
    </header>
  );
}
