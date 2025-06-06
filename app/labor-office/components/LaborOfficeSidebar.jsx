// file: app/labor-office/components/LaborOfficeSidebar.jsx
"use client";

import React from "react";
import Link from "next/link";
import { useAuth, useEntityStatus } from "../../store/authStore";

export default function LaborOfficeSidebar({ sidebarOpen, setSidebarOpen, currentPath }) {
  const { hasRole } = useAuth();
  const { isActive, isInactive, isTerminated, getStatusMessage } = useEntityStatus();

  // 🆕 엔터티 상태 확인
  const isEntityActive = isActive();
  const isEntityInactive = isInactive();
  const isEntityTerminated = isTerminated();
  const isSuperAdmin = hasRole("SUPER_ADMIN");

  // 메인 네비게이션 메뉴 정의
  const navigation = [
    {
      name: "대시보드",
      href: "/labor-office/dashboard",
      icon: "📊",
      current: currentPath === "/labor-office/dashboard",
      description: "전체 업무 현황",
    },
    {
      name: "고객사 관리",
      href: "/labor-office/clients",
      icon: "🏢",
      current: currentPath?.startsWith("/labor-office/clients"),
      description: "클라이언트 회사 관리",
      submenu: [
        { name: "전체 고객사", href: "/labor-office/clients" },
        { name: "신규 고객사", href: "/labor-office/clients/add" },
        { name: "고객사 현황", href: "/labor-office/clients/status" },
      ],
    },
    {
      name: "4대보험 신고",
      href: "/labor-office/insurance",
      icon: "📋",
      current: currentPath?.startsWith("/labor-office/insurance"),
      description: "4대보험 업무 처리",
      priority: true,
      submenu: [
        { name: "신고 현황", href: "/labor-office/insurance/overview" },
        { name: "취득상실", href: "/labor-office/insurance/acquisition-loss" },
        { name: "자격 판정", href: "/labor-office/insurance/eligibility" },
        { name: "신고서 생성", href: "/labor-office/insurance/generate" },
        { name: "일괄 처리", href: "/labor-office/insurance/batch-generate" },
        { name: "신고 제출", href: "/labor-office/insurance/submit" },
        { name: "대기 액션", href: "/labor-office/insurance/pending-actions" },
        { name: "선택 가입", href: "/labor-office/insurance/voluntary" },
        { name: "요율 관리", href: "/labor-office/insurance/rates" },
      ],
    },
    {
      name: "급여 처리",
      href: "/labor-office/payroll",
      icon: "💰",
      current: currentPath?.startsWith("/labor-office/payroll"),
      description: "급여 계산 및 관리",
      submenu: [
        { name: "급여 현황", href: "/labor-office/payroll" },
        { name: "급여 계산", href: "/labor-office/payroll/calculate" },
        { name: "일괄 계산", href: "/labor-office/payroll/batch-calculate" },
        { name: "급여명세서", href: "/labor-office/payroll/payslips" },
        { name: "동적 입력", href: "/labor-office/payroll/dynamic-input" },
        { name: "급여 생성", href: "/labor-office/payroll/generate" },
        { name: "급여 설정", href: "/labor-office/payroll/settings" },
        { name: "급여 요약", href: "/labor-office/payroll/summary" },
      ],
    },
    {
      name: "근태 관리",
      href: "/labor-office/attendance",
      icon: "⏰",
      current: currentPath?.startsWith("/labor-office/attendance"),
      description: "출퇴근 및 근무시간",
      submenu: [
        { name: "근태 현황", href: "/labor-office/attendance" },
        { name: "일일 근태", href: "/labor-office/attendance/daily" },
        { name: "월별 근태", href: "/labor-office/attendance/monthly" },
        { name: "회사별 현황", href: "/labor-office/attendance/companies" },
        { name: "근태 입력", href: "/labor-office/attendance/import" },
        { name: "근태 보고서", href: "/labor-office/attendance/reports" },
      ],
    },
    {
      name: "일용직 관리",
      href: "/labor-office/daily-workers",
      icon: "👷",
      current: currentPath?.startsWith("/labor-office/daily-workers"),
      description: "일용직 특별 관리",
      submenu: [
        { name: "일용직 현황", href: "/labor-office/daily-workers" },
        { name: "연속 근무", href: "/labor-office/daily-workers/continuous-periods" },
        { name: "롤링 판정", href: "/labor-office/daily-workers/rolling-judgment" },
        { name: "근태 추적", href: "/labor-office/daily-workers/attendance-tracking" },
      ],
    },
    {
      name: "배치 처리",
      href: "/labor-office/batch-processing",
      icon: "⚡",
      current: currentPath?.startsWith("/labor-office/batch-processing"),
      description: "자동화 처리 관리",
      submenu: [
        { name: "배치 현황", href: "/labor-office/batch-processing" },
        { name: "실행 모니터링", href: "/labor-office/batch-processing/monitoring" },
        { name: "처리 로그", href: "/labor-office/batch-processing/logs" },
        { name: "스케줄 관리", href: "/labor-office/batch-processing/schedule" },
      ],
    },
    {
      name: "계약서 관리",
      href: "/labor-office/contracts",
      icon: "📄",
      current: currentPath?.startsWith("/labor-office/contracts"),
      description: "근로계약서 생성",
      submenu: [
        { name: "계약서 목록", href: "/labor-office/contracts" },
        { name: "계약서 생성", href: "/labor-office/contracts/create" },
        { name: "템플릿 관리", href: "/labor-office/contracts/templates" },
        { name: "일괄 생성", href: "/labor-office/contracts/generate" },
      ],
    },
    {
      name: "보고서",
      href: "/labor-office/reports",
      icon: "📊",
      current: currentPath?.startsWith("/labor-office/reports"),
      description: "각종 보고서 생성",
      submenu: [
        { name: "보고서 현황", href: "/labor-office/reports" },
        { name: "신고 일정", href: "/labor-office/reports/schedule" },
        { name: "제출 현황", href: "/labor-office/reports/submissions" },
        { name: "보고서 이력", href: "/labor-office/reports/history" },
      ],
    },
    {
      name: "분석 대시보드",
      href: "/labor-office/analytics",
      icon: "📈",
      current: currentPath?.startsWith("/labor-office/analytics"),
      description: "통계 및 분석",
      submenu: [
        { name: "종합 분석", href: "/labor-office/analytics" },
        { name: "고객 분석", href: "/labor-office/analytics/clients" },
        { name: "매출 분석", href: "/labor-office/analytics/revenue" },
        { name: "성과 분석", href: "/labor-office/analytics/performance" },
      ],
    },
  ];

  // 관리 메뉴 (관리자만)
  const managementNavigation = [
    {
      name: "사무실 관리",
      href: "/labor-office/settings/office",
      icon: "🏛️",
      current: currentPath?.startsWith("/labor-office/settings/office"),
      description: "사무실 정보 관리",
      adminOnly: true,
    },
    {
      name: "직원 관리",
      href: "/labor-office/staff",
      icon: "👥",
      current: currentPath?.startsWith("/labor-office/staff"),
      description: "사무실 직원 관리",
      adminOnly: true,
      submenu: [
        { name: "직원 목록", href: "/labor-office/staff" },
        { name: "직원 추가", href: "/labor-office/staff/add" },
      ],
    },
    {
      name: "권한 관리",
      href: "/labor-office/settings/permissions",
      icon: "🔐",
      current: currentPath?.startsWith("/labor-office/settings/permissions"),
      description: "직원 권한 설정",
      adminOnly: true,
    },
    {
      name: "급여 항목",
      href: "/labor-office/payroll-items",
      icon: "💼",
      current: currentPath?.startsWith("/labor-office/payroll-items"),
      description: "급여 항목 관리",
      submenu: [
        { name: "급여 항목", href: "/labor-office/payroll-items" },
        { name: "마스터 관리", href: "/labor-office/payroll-items/master" },
        { name: "카테고리", href: "/labor-office/payroll-items/categories" },
      ],
    },
    {
      name: "비과세 한도",
      href: "/labor-office/nontax-limits",
      icon: "🏷️",
      current: currentPath?.startsWith("/labor-office/nontax-limits"),
      description: "비과세 한도 관리",
      submenu: [
        { name: "한도 현황", href: "/labor-office/nontax-limits" },
        { name: "법정 한도", href: "/labor-office/nontax-limits/legal-limits" },
        { name: "회사별 한도", href: "/labor-office/nontax-limits/company-limits" },
      ],
    },
  ];

  // 🆕 제한된 설정 메뉴 (비활성화 상태에서 허용)
  const allowedSettingsNavigation = [
    {
      name: "개인 설정",
      href: "/labor-office/settings",
      icon: "⚙️",
      current: currentPath === "/labor-office/settings",
      description: "개인 계정 설정",
    },
  ];

  // 설정 메뉴 (전체)
  const settingsNavigation = [
    {
      name: "개인 설정",
      href: "/labor-office/settings",
      icon: "⚙️",
      current: currentPath === "/labor-office/settings",
      description: "개인 계정 설정",
    },
    {
      name: "구독 관리",
      href: "/labor-office/settings/subscription",
      icon: "💳",
      current: currentPath?.startsWith("/labor-office/settings/subscription"),
      description: "서비스 구독 관리",
      adminOnly: true,
    },
  ];

  // 권한 체크 함수
  const hasAccess = (item) => {
    if (item.adminOnly) {
      return hasRole("LABOR_ADMIN") || hasRole("SUPER_ADMIN");
    }
    return true;
  };

  // 🆕 비활성화된 메뉴 아이템 렌더링
  const renderDisabledMenuItem = (item, isSubmenu = false) => {
    return (
      <div
        key={item.name}
        className={`
          group flex items-center px-3 py-2 text-sm font-medium rounded-lg opacity-50 cursor-not-allowed
          ${isSubmenu ? "ml-6 pl-6" : ""}
          text-gray-400
        `}
        title="현재 상태에서는 접근할 수 없습니다"
      >
        <span className={`mr-3 text-lg ${isSubmenu ? "text-sm" : ""}`}>
          {isSubmenu ? "•" : item.icon}
        </span>
        <div className="flex-1">
          <div className="font-medium flex items-center">
            {item.name}
            <span className="ml-2 px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
              제한
            </span>
          </div>
          {!isSubmenu && item.description && (
            <div className="text-xs text-gray-400 mt-1">{item.description}</div>
          )}
        </div>
        <svg
          className="w-4 h-4 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          ></path>
        </svg>
      </div>
    );
  };

  // 메뉴 아이템 렌더링
  const renderMenuItem = (item, isSubmenu = false) => {
    if (!hasAccess(item)) return null;

    // 🆕 비활성화 상태에서는 제한된 메뉴만 표시
    if (!isEntityActive && !isSuperAdmin) {
      return renderDisabledMenuItem(item, isSubmenu);
    }

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
              ? "bg-indigo-100 text-indigo-700 border-r-2 border-indigo-500"
              : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          }
          ${item.priority && !isSubmenu ? "ring-1 ring-indigo-200" : ""}
        `}
      >
        <span className={`mr-3 text-lg ${isSubmenu ? "text-sm" : ""}`}>
          {isSubmenu ? "•" : item.icon}
        </span>
        <div className="flex-1">
          <div className="font-medium flex items-center">
            {item.name}
            {item.priority && !isSubmenu && (
              <span className="ml-2 px-1.5 py-0.5 bg-orange-100 text-orange-800 text-xs rounded-full">
                핵심
              </span>
            )}
          </div>
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

  // 🆕 제한된 상태 안내 메시지 렌더링
  const renderStatusMessage = () => {
    if (isSuperAdmin) return null;

    if (isEntityInactive) {
      return (
        <div className="px-3 py-4 mb-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center text-sm text-yellow-800">
            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <div className="font-medium">계정 비활성화</div>
              <div className="text-xs mt-1">업무 메뉴 접근이 제한됩니다</div>
            </div>
          </div>
        </div>
      );
    }

    if (isEntityTerminated) {
      return (
        <div className="px-3 py-4 mb-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center text-sm text-red-800">
            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <div className="font-medium">계정 종료</div>
              <div className="text-xs mt-1">관리자에게 문의하세요</div>
            </div>
          </div>
        </div>
      );
    }

    return null;
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
          {/* 🆕 상태 안내 메시지 */}
          {renderStatusMessage()}

          {/* 🆕 조건부 메뉴 렌더링 */}
          {isEntityActive || isSuperAdmin ? (
            <>
              {/* 메인 네비게이션 */}
              <div className="mb-8">
                <h2 className="mb-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  업무 메뉴
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

              {/* 관리 네비게이션 (관리자만) */}
              {(hasRole("LABOR_ADMIN") || hasRole("SUPER_ADMIN")) && (
                <div className="mb-8">
                  <h2 className="mb-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    사무실 관리
                  </h2>
                  <nav className="space-y-1">
                    {managementNavigation.map((item) => {
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
              )}

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
                    onClick={() => alert("4대보험 신고서 생성 (준비중)")}
                    className="w-full flex items-center px-3 py-2 text-sm text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    <span className="mr-2">📋</span>
                    신고서 생성
                  </button>
                  <button
                    onClick={() => alert("급여 계산 (준비중)")}
                    className="w-full flex items-center px-3 py-2 text-sm text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <span className="mr-2">💰</span>
                    급여 계산
                  </button>
                  <button
                    onClick={() => alert("고객사 추가 (준비중)")}
                    className="w-full flex items-center px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <span className="mr-2">🏢</span>
                    고객사 추가
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
                  <div className="text-xs text-gray-500 mb-2">업무 현황</div>
                  <div className="space-y-1">
                    <div className="flex items-center text-xs">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-gray-600">시스템 정상</span>
                    </div>
                    <div className="flex items-center text-xs">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                      <span className="text-gray-600">대기 신고: 5건</span>
                    </div>
                    <div className="flex items-center text-xs">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      <span className="text-gray-600">배치 실행 중</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* 🆕 제한된 메뉴 (비활성화/종료 상태) */}
              <div className="mb-8">
                <h2 className="mb-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  사용 가능 메뉴
                </h2>
                <nav className="space-y-1">
                  {allowedSettingsNavigation.map((item) => renderMenuItem(item))}
                </nav>
              </div>

              {/* 🆕 제한된 메뉴 안내 */}
              <div className="mb-8">
                <h2 className="mb-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  제한된 메뉴
                </h2>
                <div className="px-3 py-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-sm text-gray-600 mb-2">
                    {isEntityInactive
                      ? "계정 비활성화로 인해 업무 메뉴에 접근할 수 없습니다."
                      : "계정 종료로 인해 대부분의 메뉴에 접근할 수 없습니다."}
                  </div>
                  <Link
                    href="/labor-office/entity-status"
                    className="text-sm text-indigo-600 hover:text-indigo-800 underline"
                  >
                    상태 자세히 보기 →
                  </Link>
                </div>
              </div>

              {/* 🆕 도움말 메뉴 */}
              <div className="mb-8">
                <h2 className="mb-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  지원
                </h2>
                <nav className="space-y-1">
                  <button
                    onClick={() => alert("도움말 페이지 (준비중)")}
                    className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-left"
                  >
                    <span className="mr-3">❓</span>
                    <div className="flex-1">
                      <div className="font-medium">도움말</div>
                      <div className="text-xs text-gray-500 mt-1">시스템 사용 안내</div>
                    </div>
                  </button>
                  <button
                    onClick={() => alert("고객지원 (준비중)")}
                    className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-left"
                  >
                    <span className="mr-3">📞</span>
                    <div className="flex-1">
                      <div className="font-medium">고객지원</div>
                      <div className="text-xs text-gray-500 mt-1">관리자 문의</div>
                    </div>
                  </button>
                </nav>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
