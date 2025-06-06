// File: app/dashboard/page.jsx - 통일된 상태 체크 로직
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/store/authStore";

import { Card } from "@/app/components/ui/Card";
import { Button } from "@/app/components/ui/Button";
import { LoadingSpinner } from "@/app/components/ui/LoadingSpinner";

export default function DefaultDashboard() {
  const router = useRouter();
  const {
    user,
    logout,
    isAuthenticated,
    isInitialized,
    permissions,
    getDefaultDashboard,
    isLoading: authLoading,
  } = useAuth();

  const [localIsLoading, setLocalIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    console.log("🔍 Dashboard: Starting status check", {
      isInitialized,
      isAuthenticated,
      user: user
        ? {
            id: user.id,
            username: user.username,
            requiresAccessRestricted: user.requiresAccessRestricted,
            entityStatus: user.entityStatus?.entityStatus,
            roles: user.roles,
          }
        : null,
    });

    // 1. 초기화 대기
    if (!isInitialized || authLoading) {
      console.log("⏳ Dashboard: Waiting for initialization");
      return;
    }

    // 2. 비인증 사용자 처리
    if (!isAuthenticated || !user) {
      console.log("🔐 Dashboard: Not authenticated, redirecting to login");
      if (!hasRedirected) {
        setHasRedirected(true);
        router.replace("/login");
      }
      return;
    }

    // 🚨 3. 핵심: 동일한 로직으로 접근 제한 체크 (access-restricted와 동일)
    const shouldBeRestricted =
      user.requiresAccessRestricted === true ||
      user.entityStatus?.entityStatus === "inactive" ||
      user.entityStatus?.entityStatus === "terminated" ||
      !user.roles ||
      user.roles.length === 0;

    console.log("🔍 Dashboard: Should be restricted?", {
      shouldBeRestricted,
      requiresAccessRestricted: user.requiresAccessRestricted,
      entityStatusValue: user.entityStatus?.entityStatus,
      rolesCount: user.roles?.length || 0,
    });

    // 4. 접근 제한 사용자 → access-restricted로 리다이렉트
    if (shouldBeRestricted) {
      console.log("🚫 Dashboard: Access restricted user, redirecting to access-restricted");

      if (!hasRedirected) {
        setHasRedirected(true);

        // 즉시 리다이렉트 (여러 방법 동시 시도)
        router.replace("/access-restricted");

        // 백업 리다이렉트 (200ms 후)
        setTimeout(() => {
          if (window.location.pathname === "/dashboard") {
            console.log("🔄 Dashboard: Backup redirect using window.location");
            window.location.href = "/access-restricted";
          }
        }, 200);
      }
      return;
    }

    // 5. 정상 사용자: 더 구체적인 대시보드 체크
    const roles = permissions?.roles || [];
    const userRoles = user?.roles || [];

    console.log("✅ Dashboard: Normal user, checking for specific dashboard", {
      permissionRoles: roles,
      userRoles: userRoles,
    });

    if (roles.length > 0 || userRoles.length > 0) {
      const specificDashboard = getDefaultDashboard();
      if (specificDashboard && specificDashboard !== "/dashboard") {
        console.log("🔄 Dashboard: Redirecting to specific dashboard:", specificDashboard);
        if (!hasRedirected) {
          setHasRedirected(true);
          router.replace(specificDashboard);
        }
        return;
      }
    }

    // 6. 일반 대시보드에 머무르기
    console.log("📋 Dashboard: Staying on general dashboard");
    setUserInfo({
      name: user?.name || user?.username || "사용자",
      email: user?.email || "",
      roles: [...new Set([...roles, ...userRoles])],
      hasSpecificRole: roles.length > 0 || userRoles.length > 0,
    });

    setLocalIsLoading(false);
  }, [
    isInitialized,
    isAuthenticated,
    authLoading,
    user,
    permissions,
    getDefaultDashboard,
    router,
    hasRedirected,
  ]);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleRoleRequest = () => {
    alert("역할 부여 요청이 관리자에게 전송되었습니다.\n영업일 기준 1-2일 내에 처리됩니다.");
  };

  // 🚨 리다이렉트 중이거나 로딩 중인 경우
  if (hasRedirected || localIsLoading || authLoading || !isInitialized || !userInfo) {
    const loadingMessage = hasRedirected
      ? "페이지를 이동하는 중..."
      : !isInitialized
      ? "시스템 초기화 중..."
      : authLoading
      ? "인증 정보 확인 중..."
      : "대시보드 정보를 불러오는 중...";

    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">{loadingMessage}</p>

          {/* 디버깅 정보 */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-4 text-xs text-gray-500 max-w-md">
              <details>
                <summary className="cursor-pointer">디버그 정보</summary>
                <pre className="mt-2 text-left bg-gray-100 p-2 rounded text-xs overflow-auto max-h-32">
                  {JSON.stringify(
                    {
                      hasRedirected,
                      localIsLoading,
                      authLoading,
                      isInitialized,
                      isAuthenticated,
                      userExists: !!user,
                      userInfo,
                      userStatus: user?.entityStatus?.entityStatus,
                      requiresRestricted: user?.requiresAccessRestricted,
                      shouldBeRestricted:
                        user?.requiresAccessRestricted === true ||
                        user?.entityStatus?.entityStatus === "inactive" ||
                        user?.entityStatus?.entityStatus === "terminated" ||
                        !user?.roles ||
                        user?.roles?.length === 0,
                    },
                    null,
                    2
                  )}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 정상 대시보드 렌더링
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">대시보드</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">안녕하세요, {userInfo?.name}님</span>
              <Button onClick={handleLogout} variant="outline" size="sm">
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* 환영 메시지 */}
          <Card className="p-6">
            <div className="text-center">
              <div className="text-4xl mb-4">👋</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                4대보험 통합 관리 시스템에 오신 것을 환영합니다!
              </h2>
              <p className="text-gray-600">
                계정이 성공적으로 생성되었습니다. 서비스 이용을 위해 관리자의 역할 부여를 기다리고
                있습니다.
              </p>
            </div>
          </Card>

          {/* 사용자 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 계정 정보</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">이름:</span>
                  <span className="font-medium">{userInfo?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">이메일:</span>
                  <span className="font-medium">{userInfo?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">계정 상태:</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                    정상 (역할 대기 중)
                  </span>
                </div>
                {userInfo?.roles && userInfo.roles.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">부여된 역할:</span>
                    <div className="flex flex-wrap gap-1">
                      {userInfo.roles.map((role, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                        >
                          {role.code || role.role_code || role}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 다음 단계</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">역할 요청</p>
                    <p className="text-sm text-gray-600">
                      관리자에게 적절한 역할 부여를 요청하세요.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-gray-300 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-gray-500">승인 대기</p>
                    <p className="text-sm text-gray-400">
                      관리자의 승인을 기다립니다. (1-2 영업일)
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-gray-300 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-gray-500">서비스 이용</p>
                    <p className="text-sm text-gray-400">
                      역할 부여 후 모든 기능을 이용할 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* 액션 버튼들 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🚀 빠른 액션</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button
                onClick={handleRoleRequest}
                variant="primary"
                className="h-16 flex flex-col items-center justify-center"
              >
                <span className="text-lg mb-1">📝</span>
                역할 부여 요청
              </Button>

              <Button
                onClick={() => window.open("mailto:support@example.com")}
                variant="outline"
                className="h-16 flex flex-col items-center justify-center"
              >
                <span className="text-lg mb-1">📞</span>
                고객지원 문의
              </Button>

              <Button
                onClick={() => router.push("/profile")}
                variant="outline"
                className="h-16 flex flex-col items-center justify-center"
              >
                <span className="text-lg mb-1">👤</span>
                프로필 관리
              </Button>
            </div>
          </Card>

          {/* 도움말 */}
          <Card className="p-6 bg-blue-50 border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">💡 도움말</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p>
                • <strong>역할 종류:</strong> 노무사 사무실, 회사 관리자, 근로자, 시스템 관리자
              </p>
              <p>
                • <strong>문의 시간:</strong> 평일 09:00-18:00
              </p>
              <p>
                • <strong>연락처:</strong> 1588-0000 또는 support@example.com
              </p>
            </div>
          </Card>

          {/* 디버그 정보 (개발 환경에서만) */}
          {process.env.NODE_ENV === "development" && (
            <Card className="p-4 bg-gray-100">
              <details>
                <summary className="cursor-pointer text-sm font-medium mb-2">
                  🔧 디버그 정보 (개발용)
                </summary>
                <pre className="text-xs text-left bg-white p-3 rounded border overflow-auto">
                  {JSON.stringify(
                    {
                      user: {
                        id: user?.id,
                        username: user?.username,
                        requiresAccessRestricted: user?.requiresAccessRestricted,
                        entityStatus: user?.entityStatus,
                        roles: user?.roles,
                      },
                      userInfo,
                      shouldBeRestricted:
                        user?.requiresAccessRestricted === true ||
                        user?.entityStatus?.entityStatus === "inactive" ||
                        user?.entityStatus?.entityStatus === "terminated" ||
                        !user?.roles ||
                        user?.roles?.length === 0,
                    },
                    null,
                    2
                  )}
                </pre>
              </details>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
