// 📁 app/super-admin/page.jsx (AuthStore 토큰 사용 버전)
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../store/authStore";

/**
 * SUPER_ADMIN 대시보드 (AuthStore 토큰 연동)
 */
export default function SuperAdminDashboard() {
  // 상태 관리
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCompanies: 0,
    totalLaborOffices: 0,
    totalWorkers: 0,
    activeUsers: 0,
    pendingActions: 0,
    systemHealth: "unknown",
    lastBackup: null,
  });

  const [trends, setTrends] = useState({
    usersGrowth: 0,
    companiesGrowth: 0,
    laborOfficesGrowth: 0,
    workersGrowth: 0,
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [systemAlerts, setSystemAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  // 🔧 AuthStore에서 user와 accessToken 가져오기
  const { user, accessToken, isAuthenticated } = useAuth();

  // 🔧 개선된 API 호출 함수 (AuthStore 토큰 사용)
  const callSuperAdminAPI = async (endpoint, options = {}) => {
    try {
      // 🔧 AuthStore에서 토큰 가져오기
      if (!accessToken) {
        throw new Error("No access token found in AuthStore");
      }

      console.log(`🚀 API Call: ${endpoint}`);
      console.log(`🔑 Token from AuthStore: ${accessToken.substring(0, 10)}...`);

      const response = await fetch(endpoint, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          ...options.headers,
        },
      });

      console.log(`📡 Response Status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`❌ API Error:`, errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ API Success:`, data);
      return data;
    } catch (error) {
      console.error(`❌ API Call Failed:`, error);
      throw error;
    }
  };

  // 🔄 대시보드 데이터 로드 (에러 처리 강화)
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔍 Loading dashboard data...");
      console.log("👤 Current user:", user);
      console.log("🔑 AccessToken exists:", !!accessToken);
      console.log("🔐 Is authenticated:", isAuthenticated);

      // 🔧 AuthStore 상태 확인
      if (!isAuthenticated || !accessToken) {
        throw new Error("Not authenticated or no access token available");
      }

      // 디버그 정보 수집
      const debugData = {
        user: user,
        hasToken: !!accessToken,
        isAuthenticated,
        timestamp: new Date().toISOString(),
      };
      setDebugInfo(debugData);

      const response = await callSuperAdminAPI("/api/super-admin/dashboard");

      if (response.success && response.data) {
        const {
          stats: statsData,
          trends: trendsData,
          recentActivities: activities,
          systemAlerts: alerts,
        } = response.data;

        setStats(statsData || stats);
        setTrends(trendsData || trends);
        setRecentActivities(activities || []);
        setSystemAlerts(alerts || []);
        setLastRefreshed(new Date().toISOString());

        console.log("✅ Dashboard data loaded successfully");
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("❌ Dashboard loading error:", error);
      setError(error.message);

      // API 실패 시 기본값 설정
      setStats({
        totalUsers: 0,
        totalCompanies: 0,
        totalLaborOffices: 0,
        totalWorkers: 0,
        activeUsers: 0,
        pendingActions: 0,
        systemHealth: "error",
        lastBackup: null,
      });
      setRecentActivities([]);
      setSystemAlerts([
        {
          id: 1,
          type: "error",
          title: "API 연결 오류",
          message: `대시보드 데이터를 불러올 수 없습니다: ${error.message}`,
          action: "다시 시도",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 🔄 새로고침 핸들러
  const handleRefresh = async () => {
    await loadDashboardData();
  };

  // 🕐 초기 로드 (AuthStore 토큰 기다리기)
  useEffect(() => {
    // 🔧 AuthStore 토큰이 준비될 때까지 기다린 후 로드
    if (isAuthenticated && accessToken) {
      const timer = setTimeout(() => {
        loadDashboardData();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      console.log("🔄 Waiting for AuthStore authentication...");
    }
  }, [isAuthenticated, accessToken]); // 🔧 의존성 배열 수정

  // 🎨 UI 컴포넌트들
  const StatCard = ({ title, value, icon, color = "blue", trend = null }) => (
    <div
      className="bg-white p-6 rounded-lg shadow-md border-l-4 hover:shadow-lg transition-shadow"
      style={{ borderLeftColor: color }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
          {trend !== null && (
            <div className="flex items-center mt-2">
              <span className="text-lg mr-1">{trend >= 0 ? "📈" : "📉"}</span>
              <p className={`text-sm ${trend >= 0 ? "text-green-600" : "text-red-600"}`}>
                {trend > 0 ? "+" : ""}
                {trend}%
              </p>
            </div>
          )}
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );

  const QuickActionCard = ({ title, description, href, icon, color = "blue" }) => (
    <Link href={href} className="block">
      <div
        className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border-l-4 transform hover:-translate-y-1"
        style={{ borderLeftColor: color }}
      >
        <div className="flex items-center">
          <div className="text-3xl mr-4">{icon}</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>
      </div>
    </Link>
  );

  const getHealthColor = (health) => {
    switch (health) {
      case "healthy":
        return "bg-green-100 text-green-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getHealthIcon = (health) => {
    switch (health) {
      case "healthy":
        return "✅";
      case "warning":
        return "⚠️";
      case "error":
        return "❌";
      default:
        return "❓";
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "success":
        return "text-green-600 bg-green-100";
      case "warning":
        return "text-yellow-600 bg-yellow-100";
      case "error":
        return "text-red-600 bg-red-100";
      default:
        return "text-blue-600 bg-blue-100";
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case "error":
        return "bg-red-50 border-red-200 text-red-800";
      default:
        return "bg-blue-50 border-blue-200 text-blue-800";
    }
  };

  // 🔄 인증 상태 확인 로딩
  if (!isAuthenticated || !accessToken) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
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
              <h3 className="text-yellow-800 font-semibold">인증 상태 확인 중</h3>
              <p className="text-yellow-600 text-sm mt-1">
                AuthStore 인증 상태를 확인하고 있습니다...
              </p>
              <div className="mt-2 text-xs text-yellow-600">
                <div>• 인증 상태: {isAuthenticated ? "✅" : "❌"}</div>
                <div>• 토큰 상태: {accessToken ? "✅" : "❌"}</div>
                <div>• 사용자 정보: {user ? "✅" : "❌"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 🔄 로딩 상태
  if (loading && !stats.totalUsers && !error) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">시스템 관리 대시보드</h1>
          <p className="text-gray-600 mt-2">4대보험 취득상실 통합 관리 시스템 전체 현황</p>
          {lastRefreshed && (
            <p className="text-xs text-gray-500 mt-1">
              마지막 업데이트: {new Date(lastRefreshed).toLocaleString("ko-KR")}
            </p>
          )}
          {error && <p className="text-xs text-red-500 mt-1">⚠️ API 오류: {error}</p>}
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center"
          >
            {loading ? (
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
                새로고침 중...
              </>
            ) : (
              <>🔄 새로고침</>
            )}
          </button>
        </div>
      </div>

      {/* 🆘 API 오류 알림 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="text-red-400 mr-3">
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
              <h3 className="text-red-800 font-semibold">대시보드 API 오류</h3>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              {debugInfo && (
                <details className="mt-2">
                  <summary className="text-red-600 text-xs cursor-pointer">디버그 정보</summary>
                  <pre className="text-red-600 text-xs mt-1 bg-red-100 p-2 rounded">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </details>
              )}
            </div>
            <button
              onClick={handleRefresh}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
            >
              다시 시도
            </button>
          </div>
        </div>
      )}

      {/* 시스템 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="전체 사용자"
          value={stats.totalUsers}
          icon="👥"
          color="#3B82F6"
          trend={trends.usersGrowth}
        />
        <StatCard
          title="등록된 회사"
          value={stats.totalCompanies}
          icon="🏢"
          color="#10B981"
          trend={trends.companiesGrowth}
        />
        <StatCard
          title="노무사 사무실"
          value={stats.totalLaborOffices}
          icon="🏛️"
          color="#8B5CF6"
          trend={trends.laborOfficesGrowth}
        />
        <StatCard
          title="관리 중인 근로자"
          value={stats.totalWorkers}
          icon="👷"
          color="#F59E0B"
          trend={trends.workersGrowth}
        />
      </div>

      {/* 시스템 상태 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">시스템 상태</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">시스템 상태</span>
              <span
                className={`px-3 py-1 ${getHealthColor(
                  stats.systemHealth
                )} rounded-full text-sm font-medium`}
              >
                {getHealthIcon(stats.systemHealth)}{" "}
                {stats.systemHealth === "healthy"
                  ? "정상"
                  : stats.systemHealth === "error"
                  ? "오류"
                  : "알 수 없음"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">활성 사용자</span>
              <span className="font-semibold text-gray-900">{stats.activeUsers}명 온라인</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">대기 중인 액션</span>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                {stats.pendingActions}개
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">마지막 백업</span>
              <span className="text-sm text-gray-500">
                {stats.lastBackup
                  ? new Date(stats.lastBackup).toLocaleString("ko-KR")
                  : "정보 없음"}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">시스템 알림</h2>
          <div className="space-y-3">
            {systemAlerts.length > 0 ? (
              systemAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-md border ${getAlertColor(alert.type)}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{alert.title}</h3>
                      <p className="text-sm mt-1">{alert.message}</p>
                    </div>
                    <button
                      onClick={alert.type === "error" ? handleRefresh : undefined}
                      className="text-sm underline hover:no-underline"
                    >
                      {alert.action}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>현재 시스템 알림이 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 빠른 액션 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">빠른 관리 액션</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <QuickActionCard
            title="사용자 관리"
            description="전체 사용자 계정 및 권한 관리"
            href="/super-admin/users"
            icon="👥"
            color="#3B82F6"
          />
          <QuickActionCard
            title="역할 & 권한"
            description="시스템 역할 및 권한 설정"
            href="/super-admin/roles"
            icon="🔐"
            color="#8B5CF6"
          />
          <QuickActionCard
            title="시스템 설정"
            description="전역 시스템 설정 및 구성"
            href="/super-admin/system"
            icon="⚙️"
            color="#10B981"
          />
          <QuickActionCard
            title="데이터베이스"
            description="데이터베이스 관리 및 최적화"
            href="/super-admin/database"
            icon="🗄️"
            color="#F59E0B"
          />
          <QuickActionCard
            title="로그 관리"
            description="시스템 로그 조회 및 분석"
            href="/super-admin/logs"
            icon="📋"
            color="#EF4444"
          />
          <QuickActionCard
            title="백업 & 복원"
            description="데이터 백업 및 복원 관리"
            href="/super-admin/backup"
            icon="💾"
            color="#6B7280"
          />
        </div>
      </div>

      {/* 최근 활동 */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">최근 시스템 활동</h2>
        </div>

        <div className="space-y-3">
          {recentActivities.length > 0 ? (
            recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center">
                  <div
                    className={`w-2 h-2 rounded-full mr-3 ${getSeverityColor(activity.severity)}`}
                  ></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500">
                      {activity.timestamp
                        ? new Date(activity.timestamp).toLocaleString("ko-KR")
                        : "시간 정보 없음"}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(
                    activity.severity
                  )}`}
                >
                  {activity.type}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>최근 활동이 없습니다.</p>
            </div>
          )}
        </div>

        {recentActivities.length > 0 && (
          <div className="mt-4 text-center">
            <Link
              href="/super-admin/logs"
              className="text-blue-600 hover:text-blue-500 text-sm font-medium"
            >
              전체 로그 보기 →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
