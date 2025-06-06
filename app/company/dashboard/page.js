// file: app/company/dashboard/page.js (레이아웃 적용 버전)
"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../store/authStore";

export default function CompanyDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    pendingLeaves: 0,
    monthlyPayroll: 0,
  });

  // 더미 데이터 로드
  useEffect(() => {
    // 실제로는 API에서 가져올 데이터
    setTimeout(() => {
      setStats({
        totalEmployees: 45,
        presentToday: 38,
        pendingLeaves: 3,
        monthlyPayroll: 85000000,
      });
    }, 1000);
  }, []);

  const quickActions = [
    { title: "직원 관리", desc: "직원 정보 및 현황", link: "/company/employees", icon: "👥" },
    { title: "급여 관리", desc: "급여 명세서 확인", link: "/company/payroll", icon: "💰" },
    { title: "근태 관리", desc: "출퇴근 및 휴가 관리", link: "/company/attendance", icon: "⏰" },
    { title: "4대보험", desc: "보험 가입 현황", link: "/company/insurance", icon: "🛡️" },
  ];

  const todayAttendance = [
    { name: "김철수", department: "개발팀", status: "출근", time: "09:00" },
    { name: "이영희", department: "디자인팀", status: "출근", time: "09:15" },
    { name: "박민수", department: "영업팀", status: "휴가", time: "-" },
    { name: "정수진", department: "인사팀", status: "출근", time: "08:45" },
    { name: "최준호", department: "개발팀", status: "지각", time: "10:30" },
  ];

  const announcements = [
    { title: "월말 회식 안내", date: "2025-01-30", urgent: false },
    { title: "연말정산 서류 제출", date: "2025-01-31", urgent: true },
    { title: "보안교육 참석 필수", date: "2025-02-01", urgent: false },
  ];

  return (
    <div className="px-6">
      {/* 페이지 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
        <p className="text-gray-600 mt-2">
          안녕하세요, <span className="font-semibold">{user?.name}</span>님! 오늘 하루도 즐거운 업무
          되세요.
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
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">전체 직원</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalEmployees}</p>
              <p className="text-sm text-green-600">+3 이번 달</p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">오늘 출근</p>
              <p className="text-3xl font-bold text-gray-900">{stats.presentToday}</p>
              <p className="text-sm text-blue-600">
                출근율{" "}
                {stats.totalEmployees > 0
                  ? Math.round((stats.presentToday / stats.totalEmployees) * 100)
                  : 0}
                %
              </p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">휴가 신청</p>
              <p className="text-3xl font-bold text-gray-900">{stats.pendingLeaves}</p>
              <p className="text-sm text-red-600">승인 대기</p>
            </div>
            <div className="text-4xl">📝</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">월 급여 총액</p>
              <p className="text-2xl font-bold text-gray-900">
                {(stats.monthlyPayroll / 10000).toLocaleString()}만원
              </p>
              <p className="text-sm text-gray-500">+4% 전월 대비</p>
            </div>
            <div className="text-4xl">💰</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 빠른 액션 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">빠른 메뉴</h2>
          <div className="space-y-3">
            {quickActions.map((action, index) => (
              <div
                key={index}
                className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                onClick={() => alert(`${action.title} 페이지로 이동 (준비중)`)}
              >
                <div className="text-xl mr-3">{action.icon}</div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900">{action.title}</h3>
                  <p className="text-xs text-gray-500">{action.desc}</p>
                </div>
                <div className="text-gray-400">→</div>
              </div>
            ))}
          </div>
        </div>

        {/* 오늘 출근 현황 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">오늘 출근 현황</h2>
          <div className="space-y-3">
            {todayAttendance.map((employee, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b border-gray-100"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{employee.name}</p>
                  <p className="text-xs text-gray-500">{employee.department}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      employee.status === "출근"
                        ? "bg-green-100 text-green-800"
                        : employee.status === "휴가"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {employee.status}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">{employee.time}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 text-blue-600 hover:text-blue-500 text-sm font-medium">
            전체 출근 현황 보기 →
          </button>
        </div>

        {/* 공지사항 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">공지사항</h2>
          <div className="space-y-3">
            {announcements.map((notice, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between">
                  <h3 className="text-sm font-medium text-gray-900 flex items-center">
                    {notice.urgent && (
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs mr-2">
                        긴급
                      </span>
                    )}
                    {notice.title}
                  </h3>
                </div>
                <p className="text-xs text-gray-500 mt-1">{notice.date}</p>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 text-blue-600 hover:text-blue-500 text-sm font-medium">
            전체 공지사항 보기 →
          </button>
        </div>
      </div>

      {/* 중요 알림 */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="text-yellow-400 mr-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              ></path>
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-yellow-800 font-semibold">중요 알림</h3>
            <p className="text-yellow-600 text-sm mt-1">
              • 연말정산 서류 제출 마감: 1월 31일
              <br />• 4대보험 요율 변경 안내가 있습니다 (노무사 확인 필요)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
