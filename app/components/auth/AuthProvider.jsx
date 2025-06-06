// File: components/auth/AuthProvider.jsx
"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { LoadingSpinner } from "../ui/LoadingSpinner";

/**
 * 앱 전체의 인증 상태를 관리하는 Provider 컴포넌트
 * 모든 페이지에서 인증 상태가 초기화될 때까지 로딩 화면 표시
 */
export default function AuthProvider({ children }) {
  // useAuthStore에서 isInitialized, isLoading, initialize 함수를 가져옵니다.
  const { isInitialized, isLoading: authStoreLoading, initialize } = useAuthStore();
  const [isClient, setIsClient] = useState(false);

  // 클라이언트 사이드 렌더링 확인 (Next.js CSR/SSR 분리 필수)
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 앱 시작시 인증 상태 초기화
  // isInitialized가 false이고, 현재 초기화 중이 아니라면 initialize 호출
  // isClient가 true일 때만 실행되어 서버에서는 실행되지 않도록 함
  useEffect(() => {
    // 💡 디버깅: AuthProvider useEffect가 언제 실행되는지 확인
    console.log("🚀 AuthProvider useEffect Triggered:", {
      isClient,
      isInitialized,
      authStoreLoading,
    });

    if (isClient && !isInitialized && !authStoreLoading) {
      console.log("🚀 AuthProvider: Initializing auth state...");
      initialize();
    }
  }, [isClient, isInitialized, authStoreLoading, initialize]); // initialize는 useCallback 등으로 안정화되어야 합니다.

  // 초기화가 완료되지 않았거나, 서버 사이드 렌더링 중일 때 로딩 표시
  // isInitialized가 false일 때만 로딩 스피너를 보여주는 것이 핵심
  if (!isInitialized) {
    // isClient는 더 이상 직접적인 렌더링 조건에 사용하지 않아도 됩니다.
    // Next.js의 "use client" 컴포넌트는 클라이언트에서 Hydration 되기 전까지
    // 이 초기 로딩 상태를 보여주게 됩니다.
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
        <div className="text-center">
          {/* 로고 */}
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-6">
            <svg
              className="h-8 w-8 text-white animate-pulse"
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

          {/* 제목 */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">4대보험 통합 관리 시스템</h1>

          {/* 로딩 메시지 */}
          <p className="text-gray-600 mb-6">시스템을 초기화하고 있습니다...</p>

          {/* 로딩 스피너 */}
          <LoadingSpinner size="lg" />

          {/* 프로그레스 바 (시각적 효과용) */}
          <div className="mt-8 w-64 bg-gray-200 rounded-full h-2 mx-auto">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-1000 animate-pulse"
              style={{ width: "60%" }}
            />
          </div>

          {/* 힌트 메시지 */}
          <p className="text-xs text-gray-500 mt-4">
            잠시만 기다려주세요. 인증 상태를 확인 중입니다.
          </p>
        </div>

        {/* 버전 정보 */}
        <div className="absolute bottom-4 text-center text-xs text-gray-400">
          <p>4대보험 취득상실 통합 관리 시스템 v1.0</p>
          <p className="mt-1">© 2025 Insurance Management System</p>
        </div>
      </div>
    );
  }

  // 초기화 완료 후 자식 컴포넌트 렌더링
  return <>{children}</>;
}

/**
 * 에러 바운더리와 함께 사용할 수 있는 AuthProvider (선택사항)
 */
export function AuthProviderWithErrorBoundary({ children }) {
  return (
    <AuthErrorBoundary>
      <AuthProvider>{children}</AuthProvider>
    </AuthErrorBoundary>
  );
}

/**
 * 인증 관련 에러를 처리하는 에러 바운더리
 */
class AuthErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("🔐 Auth Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
          <div className="text-center max-w-md mx-auto p-6">
            {/* 에러 아이콘 */}
            <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">시스템 오류</h1>
            <p className="text-gray-600 mb-6">
              인증 시스템에 문제가 발생했습니다. 페이지를 새로고침하거나 관리자에게 문의해주세요.
            </p>

            {/* 액션 버튼들 */}
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                페이지 새로고침
              </button>

              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = "/login";
                }}
                className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                로그인 페이지로 이동
              </button>
            </div>

            {/* 에러 상세 정보 (개발 환경에서만) */}
            {process.env.NODE_ENV === "development" && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 mb-2">
                  에러 상세 정보 (개발용)
                </summary>
                <pre className="text-xs bg-gray-100 p-3 rounded text-red-600 overflow-auto">
                  {this.state.error?.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
