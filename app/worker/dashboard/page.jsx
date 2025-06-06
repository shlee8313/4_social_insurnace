// File: app/worker/dashboard/page.jsx
"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../store/authStore";
import { Card } from "../../components/ui/Card";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import {
  User,
  CreditCard,
  Clock,
  Shield,
  Calendar,
  TrendingUp,
  FileText,
  AlertCircle,
} from "lucide-react";

export default function WorkerDashboard() {
  const { user } = useAuth();
  const [workerData, setWorkerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWorkerDashboardData();
  }, []);

  const fetchWorkerDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/worker/dashboard", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("대시보드 데이터를 불러올 수 없습니다");
      }

      const data = await response.json();
      setWorkerData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">대시보드를 로딩하고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchWorkerDashboardData}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">안녕하세요, {user?.name}님! 👋</h1>
            <p className="text-gray-600 mt-1">오늘도 좋은 하루 되세요!</p>
          </div>
        </div>
      </div>

      {/* 요약 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 이번 달 급여 */}
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <CreditCard className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">이번 달 급여</p>
              <p className="text-2xl font-semibold text-gray-900">
                {workerData?.currentPayroll?.netPay
                  ? `${workerData.currentPayroll.netPay.toLocaleString()}원`
                  : "미정"}
              </p>
            </div>
          </div>
        </Card>

        {/* 이번 달 근무일수 */}
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">이번 달 근무</p>
              <p className="text-2xl font-semibold text-gray-900">
                {workerData?.currentAttendance?.workDays || 0}일
              </p>
            </div>
          </div>
        </Card>

        {/* 연차 잔여일수 */}
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">연차 잔여</p>
              <p className="text-2xl font-semibold text-gray-900">
                {workerData?.annualLeave?.remaining || 0}일
              </p>
            </div>
          </div>
        </Card>

        {/* 4대보험 가입현황 */}
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">보험 가입</p>
              <p className="text-2xl font-semibold text-gray-900">
                {workerData?.insurance?.activeCount || 0}/4
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* 메인 콘텐츠 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 최근 급여 내역 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">최근 급여 내역</h3>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {workerData?.recentPayrolls?.length > 0 ? (
              workerData.recentPayrolls.map((payroll, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {payroll.year}년 {payroll.month}월
                    </p>
                    <p className="text-sm text-gray-600">{payroll.workDays}일 근무</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {payroll.netPay?.toLocaleString()}원
                    </p>
                    <p className="text-sm text-gray-600">실수령액</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">급여 내역이 없습니다</p>
            )}
          </div>
          <div className="mt-4">
            <button className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
              급여명세서 전체보기
            </button>
          </div>
        </Card>

        {/* 4대보험 가입 현황 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">4대보험 가입현황</h3>
            <Shield className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {[
              { name: "국민연금", code: "NP", subscribed: workerData?.insurance?.np },
              { name: "건강보험", code: "HI", subscribed: workerData?.insurance?.hi },
              { name: "고용보험", code: "EI", subscribed: workerData?.insurance?.ei },
              { name: "산재보험", code: "WC", subscribed: workerData?.insurance?.wc },
            ].map((insurance) => (
              <div
                key={insurance.code}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
              >
                <span className="font-medium text-gray-900">{insurance.name}</span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    insurance.subscribed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {insurance.subscribed ? "가입" : "미가입"}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <button className="w-full py-2 px-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
              보험 상세정보 보기
            </button>
          </div>
        </Card>
      </div>

      {/* 빠른 액션 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">빠른 기능</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <FileText className="h-8 w-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-blue-900">급여명세서</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
            <Clock className="h-8 w-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-green-900">근태현황</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
            <Shield className="h-8 w-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-purple-900">보험현황</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
            <User className="h-8 w-8 text-orange-600 mb-2" />
            <span className="text-sm font-medium text-orange-900">개인정보</span>
          </button>
        </div>
      </Card>
    </div>
  );
}
