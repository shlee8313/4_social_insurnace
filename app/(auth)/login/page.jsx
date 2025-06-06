// File: app/(auth)/login/page.jsx (완전 수정 버전)
import React, { Suspense } from "react";
import { Metadata } from "next";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import LoginPageClient from "../../components/auth/LoginPageClient";

export const metadata = {
  title: "로그인 - 4대보험 통합 관리 시스템",
  description: "4대보험 취득상실 통합 관리 시스템에 로그인하세요.",
};

/**
 * 로그인 페이지 (서버 컴포넌트)
 * 경로: /login
 * Hydration 에러 해결을 위해 클라이언트 컴포넌트로 분리
 */
export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* 배경 패턴 */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50" />
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-blue-100 to-transparent opacity-50" />
      </div>

      <div className="relative z-10">
        {/* 로고 및 헤더 */}
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
            <svg
              className="h-8 w-8 text-white"
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

          <h1 className="mt-4 text-3xl font-bold text-gray-900">4대보험 통합 관리</h1>
          <p className="mt-2 text-lg text-gray-600">노무사 사무실과 회사를 위한 스마트 솔루션</p>
        </div>

        {/* 클라이언트 컴포넌트로 분리된 로그인 폼 */}
        <Suspense
          fallback={
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <LoadingSpinner size="lg" text="로딩 중..." />
              </div>
            </div>
          }
        >
          <LoginPageClient />
        </Suspense>

        {/* 추가 정보 */}
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">주요 기능</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-sm text-gray-700">일용직 롤링 월별 4대보험 자동 판정</span>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-sm text-gray-700">자동 취득상실 신고서 생성</span>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-sm text-gray-700">통합 급여 및 근태 관리</span>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-sm text-gray-700">실시간 배치 처리 모니터링</span>
              </div>
            </div>
          </div>
        </div>

        {/* 고객센터 정보 */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            문의사항이 있으시면{" "}
            <a href="tel:1588-0000" className="font-medium text-blue-600 hover:text-blue-500">
              1588-0000
            </a>{" "}
            또는{" "}
            <a
              href="mailto:support@insurance-system.co.kr"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              support@insurance-system.co.kr
            </a>
            로 연락주세요
          </p>
        </div>
      </div>
    </div>
  );
}
