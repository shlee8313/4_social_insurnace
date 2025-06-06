// File: app/access-restricted/page.jsx - 무한 리다이렉트 해결 버전
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/store/authStore";
import { Card } from "@/app/components/ui/Card";
import { Button } from "@/app/components/ui/Button";
import { LoadingSpinner } from "@/app/components/ui/LoadingSpinner";

export default function AccessRestrictedPage() {
  const router = useRouter();
  const { user, logout, isAuthenticated, isInitialized } = useAuth();

  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [statusInfo, setStatusInfo] = useState(null);

  useEffect(() => {
    console.log("🔍 AccessRestricted: Starting status check", {
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
    if (!isInitialized) {
      console.log("⏳ AccessRestricted: Waiting for initialization");
      return;
    }

    // 2. 비인증 사용자 → 로그인 페이지
    if (!isAuthenticated || !user) {
      console.log("🔐 AccessRestricted: Not authenticated, redirecting to login");
      router.replace("/login");
      return;
    }

    // 🚨 3. 핵심: 동일한 로직으로 접근 제한 체크 (dashboard와 동일)
    const shouldBeRestricted =
      user.requiresAccessRestricted === true ||
      user.entityStatus?.entityStatus === "inactive" ||
      user.entityStatus?.entityStatus === "terminated" ||
      !user.roles ||
      user.roles.length === 0;

    console.log("🔍 AccessRestricted: Should be restricted?", {
      shouldBeRestricted,
      requiresAccessRestricted: user.requiresAccessRestricted,
      entityStatusValue: user.entityStatus?.entityStatus,
      rolesCount: user.roles?.length || 0,
    });

    // 4. 접근 제한이 필요하지 않은 사용자 → 절대 리다이렉트하지 않음
    if (!shouldBeRestricted) {
      console.log("✅ AccessRestricted: User should NOT be restricted, but staying here anyway");
      // 🚨 중요: 리다이렉트하지 않고 메시지만 표시
      setStatusInfo({
        type: "error",
        title: "잘못된 접근",
        message: "정상 계정으로 이 페이지에 접근할 필요가 없습니다.",
        canGoToDashboard: true,
      });
      setIsCheckingStatus(false);
      return;
    }

    // 5. 접근 제한 사용자 → 상태 정보 설정
    console.log("🚫 AccessRestricted: User access is restricted, showing restricted page");

    let statusType = "inactive";
    let title = "계정 접근이 제한되었습니다";
    let message = "현재 계정 상태로 인해 시스템 접근이 제한되었습니다.";

    if (user.entityStatus?.entityStatus === "terminated") {
      statusType = "terminated";
      title = "계정이 종료되었습니다";
      message = "계정이 완전히 종료되어 더 이상 서비스를 이용할 수 없습니다.";
    } else if (user.entityStatus?.entityStatus === "inactive") {
      statusType = "inactive";
      title = "계정이 일시 중지되었습니다";
      message = "계정이 일시적으로 비활성화되었습니다. 관리자에게 문의하세요.";
    } else if (!user.roles || user.roles.length === 0) {
      statusType = "no_roles";
      title = "역할이 부여되지 않았습니다";
      message = "계정에 적절한 역할이 부여되지 않았습니다. 관리자에게 역할 부여를 요청하세요.";
    }

    setStatusInfo({
      type: statusType,
      title: title,
      message: message,
      canGoToDashboard: false,
    });

    setIsCheckingStatus(false);
  }, [isInitialized, isAuthenticated, user, router]);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleGoToDashboard = () => {
    console.log("🔄 AccessRestricted: Manual navigation to dashboard");
    router.push("/dashboard");
  };

  const handleContactAdmin = () => {
    const subject = encodeURIComponent("계정 상태 문의");
    const body = encodeURIComponent(
      `안녕하세요.\n\n계정 상태에 대해 문의드립니다.\n\n` +
        `사용자명: ${user?.username}\n` +
        `이메일: ${user?.email}\n` +
        `현재 상태: ${user?.entityStatus?.entityStatus || "알 수 없음"}\n\n` +
        `문의 내용: `
    );
    window.open(`mailto:admin@example.com?subject=${subject}&body=${body}`);
  };

  // 로딩 상태
  if (!isInitialized || isCheckingStatus || !statusInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">상태를 확인하는 중...</p>
        </div>
      </div>
    );
  }

  // 잘못된 접근인 경우
  if (statusInfo.type === "error") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Card className="text-center p-8">
            <div className="text-6xl mb-4">🤔</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{statusInfo.title}</h1>
            <p className="text-gray-600 mb-6">{statusInfo.message}</p>

            <div className="space-y-3">
              <Button onClick={handleGoToDashboard} className="w-full">
                대시보드로 이동
              </Button>
              <Button onClick={handleLogout} variant="outline" className="w-full">
                로그아웃
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // 상태별 아이콘과 색상
  const getStatusDisplay = () => {
    switch (statusInfo.type) {
      case "terminated":
        return {
          icon: "🚫",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          badgeColor: "bg-red-100 text-red-800",
        };
      case "inactive":
        return {
          icon: "⏸️",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          badgeColor: "bg-yellow-100 text-yellow-800",
        };
      case "no_roles":
        return {
          icon: "👤",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          badgeColor: "bg-blue-100 text-blue-800",
        };
      default:
        return {
          icon: "❓",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          badgeColor: "bg-gray-100 text-gray-800",
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">접근 제한</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">{user?.name || user?.username}</span>
              <Button onClick={handleLogout} variant="outline" size="sm">
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* 상태 아이콘 */}
          <div className="text-6xl mb-6">{statusDisplay.icon}</div>

          {/* 메인 메시지 */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{statusInfo.title}</h1>

          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">{statusInfo.message}</p>

          {/* 상태 정보 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* 계정 상태 정보 */}
            <Card className={`p-6 ${statusDisplay.bgColor} ${statusDisplay.borderColor}`}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 계정 상태 정보</h3>
              <div className="space-y-3 text-left">
                <div className="flex justify-between">
                  <span className="text-gray-600">사용자명:</span>
                  <span className="font-medium">{user?.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">이메일:</span>
                  <span className="font-medium">{user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">계정 상태:</span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${statusDisplay.badgeColor}`}
                  >
                    {user?.entityStatus?.entityStatus || "알 수 없음"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">부여된 역할:</span>
                  <span className="text-xs">
                    {user?.roles?.length > 0 ? `${user.roles.length}개` : "없음"}
                  </span>
                </div>
              </div>
            </Card>

            {/* 연락처 정보 */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📞 문의 정보</h3>
              <div className="space-y-3 text-left">
                <p className="text-sm text-gray-600">
                  계정 상태에 대한 문의사항이 있으시면 아래 연락처로 문의해주세요.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">이메일:</span>
                    <span className="text-sm text-blue-600">admin@example.com</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">전화:</span>
                    <span className="text-sm">1588-0000</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">운영시간:</span>
                    <span className="text-sm">평일 09:00-18:00</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* 액션 버튼들 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={handleContactAdmin} className="flex items-center space-x-2">
              <span>📧</span>
              <span>관리자에게 문의</span>
            </Button>

            {statusInfo.canGoToDashboard && (
              <Button
                onClick={handleGoToDashboard}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <span>🏠</span>
                <span>대시보드로 이동</span>
              </Button>
            )}
          </div>

          {/* 디버그 정보 (개발 환경에서만) */}
          {process.env.NODE_ENV === "development" && (
            <Card className="mt-8 p-4 bg-gray-100">
              <details>
                <summary className="cursor-pointer text-sm font-medium mb-2">
                  🔧 디버그 정보 (개발용)
                </summary>
                <pre className="text-xs text-left bg-white p-3 rounded border overflow-auto">
                  {JSON.stringify(
                    {
                      statusInfo,
                      user: {
                        id: user?.id,
                        username: user?.username,
                        requiresAccessRestricted: user?.requiresAccessRestricted,
                        entityStatus: user?.entityStatus,
                        roles: user?.roles,
                      },
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
