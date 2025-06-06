// file: app/labor-office/dashboard/page.js (레이아웃 적용 버전)
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../../store/authStore";

export default function LaborOfficeDashboard() {
  const { user, hasRole } = useAuth();
  const [stats, setStats] = useState({
    totalClients: 0,
    totalWorkers: 0,
    pendingReports: 0,
    monthlyRevenue: 0,
    insuranceActions: 0,
    payrollProcessed: 0,
  });

  const [loading, setLoading] = useState(true);

  // 더미 데이터 로드
  useEffect(() => {
    // 실제로는 API에서 가져올 데이터
    setTimeout(() => {
      setStats({
        totalClients: 18,
        totalWorkers: 540,
        pendingReports: 12,
        monthlyRevenue: 4200000,
        insuranceActions: 8,
        payrollProcessed: 156,
      });
      setLoading(false);
    }, 1000);
  }, []);

  const quickActions = [
    {
      title: "4대보험 신고",
      desc: "취득상실 신고 처리",
      link: "/labor-office/insurance",
      icon: "📋",
      urgent: 8,
    },
    {
      title: "급여 계산",
      desc: "월급여 일괄 계산",
      link: "/labor-office/payroll/calculate",
      icon: "💰",
      urgent: 3,
    },
    {
      title: "고객사 관리",
      desc: "신규 고객사 등록",
      link: "/labor-office/clients",
      icon: "🏢",
      urgent: 0,
    },
    {
      title: "보고서 생성",
      desc: "각종 신고서 작성",
      link: "/labor-office/reports",
      icon: "📊",
      urgent: 2,
    },
    {
      title: "배치 처리",
      desc: "자동화 처리 관리",
      link: "/labor-office/batch-processing",
      icon: "⚡",
      urgent: 0,
    },
    {
      title: "일용직 관리",
      desc: "롤링 월별 판정",
      link: "/labor-office/daily-workers",
      icon: "👷",
      urgent: 5,
    },
  ];

  const recentActivities = [
    {
      type: "4대보험",
      company: "ABC 건설",
      worker: "김철수",
      action: "취득신고",
      time: "30분 전",
      status: "완료",
      priority: "normal",
    },
    {
      type: "급여처리",
      company: "XYZ 제조",
      worker: "전체직원",
      action: "월급여 계산",
      time: "1시간 전",
      status: "처리중",
      priority: "high",
    },
    {
      type: "4대보험",
      company: "DEF 유통",
      worker: "이영희",
      action: "상실신고",
      time: "2시간 전",
      status: "대기",
      priority: "urgent",
    },
    {
      type: "계약서",
      company: "GHI 서비스",
      worker: "박민수",
      action: "근로계약서",
      time: "3시간 전",
      status: "완료",
      priority: "normal",
    },
    {
      type: "근태",
      company: "JKL 엔터",
      worker: "전체직원",
      action: "월근태 처리",
      time: "4시간 전",
      status: "완료",
      priority: "normal",
    },
  ];

  const urgentTasks = [
    { title: "ABC 건설 - 신규 직원 4대보험 취득신고", deadline: "오늘", type: "insurance" },
    { title: "XYZ 제조 - 2월 급여 계산 및 명세서 발급", deadline: "내일", type: "payroll" },
    { title: "DEF 유통 - 퇴사자 상실신고 처리", deadline: "오늘", type: "insurance" },
  ];

  const clientStats = [
    { company: "ABC 건설", workers: 45, pending: 3, lastUpdate: "2시간 전" },
    { company: "XYZ 제조", workers: 78, pending: 1, lastUpdate: "1일 전" },
    { company: "DEF 유통", workers: 32, pending: 0, lastUpdate: "3시간 전" },
    { company: "GHI 서비스", workers: 29, pending: 2, lastUpdate: "5시간 전" },
  ];

  // 관리자 여부 확인
  const isAdmin = hasRole("LABOR_ADMIN") || hasRole("SUPER_ADMIN");

  if (loading) {
    return (
      <div className="px-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6">
      {/* 페이지 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">노무사 대시보드</h1>
        <p className="text-gray-600 mt-2">
          안녕하세요, <span className="font-semibold">{user?.name}</span>님!
          {isAdmin && <span className="text-orange-600 ml-1">👑</span>}
          오늘도 고객사 관리를 위해 힘내세요.
        </p>
        <p className="text-sm text-gray-500 mt-1">
          오늘 날짜:{" "}
          {new Date().toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "long",
            day: "numeric",
            weekday: "long",
          })}
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">관리 고객사</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalClients}</p>
              <p className="text-sm text-green-600">+2 이번 달</p>
            </div>
            <div className="text-4xl">🏢</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">관리 근로자</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalWorkers}</p>
              <p className="text-sm text-green-600">+25 이번 달</p>
            </div>
            <div className="text-4xl">👷</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">긴급 처리</p>
              <p className="text-3xl font-bold text-gray-900">{stats.pendingReports}</p>
              <p className="text-sm text-red-600">처리 필요</p>
            </div>
            <div className="text-4xl">⚠️</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">월 매출</p>
              <p className="text-2xl font-bold text-gray-900">
                {(stats.monthlyRevenue / 10000).toLocaleString()}만원
              </p>
              <p className="text-sm text-green-600">+12% 전월 대비</p>
            </div>
            <div className="text-4xl">💰</div>
          </div>
        </div>
      </div>

      {/* 추가 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 이번 달 업무 현황</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">4대보험 신고 처리</span>
              <div className="flex items-center">
                <span className="font-bold text-indigo-600">{stats.insuranceActions}건</span>
                <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                  대기중
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">급여 처리 완료</span>
              <span className="font-bold text-green-600">{stats.payrollProcessed}건</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">근로계약서 생성</span>
              <span className="font-bold text-blue-600">23건</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">근태 처리</span>
              <span className="font-bold text-purple-600">18건</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">⚠️ 긴급 처리 업무</h3>
          <div className="space-y-3">
            {urgentTasks.map((task, index) => (
              <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-red-900">{task.title}</h4>
                    <p className="text-xs text-red-600 mt-1">마감: {task.deadline}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      task.type === "insurance"
                        ? "bg-indigo-100 text-indigo-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {task.type === "insurance" ? "4대보험" : "급여"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 빠른 액션 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">⚡ 빠른 액션</h2>
          <div className="space-y-3">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                href={action.link}
                className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <div className="text-xl mr-3">{action.icon}</div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900 group-hover:text-indigo-600">
                    {action.title}
                  </h3>
                  <p className="text-xs text-gray-500">{action.desc}</p>
                </div>
                <div className="flex items-center">
                  {action.urgent > 0 && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full mr-2">
                      {action.urgent}
                    </span>
                  )}
                  <div className="text-gray-400">→</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 최근 활동 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">📋 최근 활동</h2>
          <div className="space-y-3">
            {recentActivities.map((activity, index) => (
              <div key={index} className="py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium mr-2 ${
                          activity.type === "4대보험"
                            ? "bg-indigo-100 text-indigo-800"
                            : activity.type === "급여처리"
                            ? "bg-green-100 text-green-800"
                            : activity.type === "계약서"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {activity.type}
                      </span>
                      {activity.priority === "urgent" && (
                        <span className="text-red-500 text-xs">🚨</span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {activity.company} - {activity.worker}
                    </p>
                    <p className="text-xs text-gray-500">
                      {activity.action} • {activity.time}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      activity.status === "완료"
                        ? "bg-green-100 text-green-800"
                        : activity.status === "처리중"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {activity.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/labor-office/reports/history"
            className="block w-full mt-4 text-indigo-600 hover:text-indigo-500 text-sm font-medium text-center"
          >
            전체 활동 보기 →
          </Link>
        </div>

        {/* 고객사 현황 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">🏢 고객사 현황</h2>
          <div className="space-y-3">
            {clientStats.map((client, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-900">{client.company}</h3>
                  {client.pending > 0 && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                      {client.pending}건 대기
                    </span>
                  )}
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>근로자: {client.workers}명</span>
                  <span>업데이트: {client.lastUpdate}</span>
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/labor-office/clients"
            className="block w-full mt-4 text-indigo-600 hover:text-indigo-500 text-sm font-medium text-center"
          >
            전체 고객사 보기 →
          </Link>
        </div>
      </div>

      {/* 시스템 알림 */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="text-blue-400 mr-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-blue-800 font-semibold">시스템 알림</h3>
            <p className="text-blue-600 text-sm mt-1">
              • 이번 주 금요일까지 월말 정산 처리 완료 필요
              <br />
              • 새로운 4대보험 요율이 다음 달부터 적용됩니다
              <br />• 배치 처리가 매일 새벽 2시에 자동 실행됩니다
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
