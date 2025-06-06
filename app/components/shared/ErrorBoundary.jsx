// File: components/shared/ErrorBoundary.jsx
"use client";

import React from "react";
import { Button } from "../ui/Button";

/**
 * 에러 바운더리 컴포넌트
 * Hydration 에러 및 기타 에러 처리
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // 다음 렌더링에서 폴백 UI가 보이도록 상태를 업데이트
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // 에러 로깅
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    this.setState({
      error: error,
      errorInfo: errorInfo,
    });

    // 에러 리포팅 서비스로 전송 (예: Sentry)
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "exception", {
        description: error.toString(),
        fatal: false,
      });
    }
  }

  handleReload = () => {
    // 페이지 새로고침
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  handleGoHome = () => {
    // 홈페이지로 이동
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  render() {
    if (this.state.hasError) {
      // 에러 발생시 폴백 UI
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="text-center">
                {/* 에러 아이콘 */}
                <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
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
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>

                <h2 className="text-xl font-semibold text-gray-900 mb-2">문제가 발생했습니다</h2>

                <p className="text-gray-600 mb-6">
                  페이지를 불러오는 중 오류가 발생했습니다. 새로고침하거나 잠시 후 다시
                  시도해주세요.
                </p>

                {/* 개발 환경에서만 에러 상세 정보 표시 */}
                {process.env.NODE_ENV === "development" && this.state.error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
                    <h3 className="text-sm font-medium text-red-800 mb-2">에러 정보:</h3>
                    <pre className="text-xs text-red-700 whitespace-pre-wrap overflow-auto">
                      {this.state.error.toString()}
                      {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                )}

                {/* 액션 버튼들 */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={this.handleReload} variant="primary">
                    페이지 새로고침
                  </Button>

                  <Button onClick={this.handleGoHome} variant="secondary">
                    홈으로 이동
                  </Button>
                </div>

                {/* 고객센터 정보 */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-500">
                    문제가 지속되면{" "}
                    <a
                      href="tel:1588-0000"
                      className="font-medium text-blue-600 hover:text-blue-500"
                    >
                      1588-0000
                    </a>
                    으로 연락주세요
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 에러가 없으면 자식 컴포넌트 렌더링
    return this.props.children;
  }
}

export default ErrorBoundary;
