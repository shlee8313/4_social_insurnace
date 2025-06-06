// File: app/(auth)/register/company/page.jsx
import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import RegisterForm from "../../../components/auth/RegisterForm";

export const metadata = {
  title: "회사 가입 - 4대보험 통합 관리 시스템",
  description: "회사 계정으로 가입하여 자사의 4대보험 업무를 효율적으로 관리하세요.",
};

/**
 * 회사 회원가입 페이지
 * 경로: /register/company
 */
export default function CompanyRegisterPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 sm:px-6 lg:px-8">
      {/* 배경 패턴 */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-emerald-50" />
        <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-green-100 to-transparent opacity-30" />
      </div>

      <div className="relative z-10">
        {/* 헤더 */}
        <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="mx-auto h-16 w-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
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
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
          </Link>

          <div className="mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              회사 전용
            </span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">회사 가입</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            자사의 4대보험 업무를 효율적으로 관리할 수 있는 회사 전용 계정을 생성합니다.
          </p>
        </div>

        {/* 특별 안내 */}
        <div className="sm:mx-auto sm:w-full sm:max-w-2xl mb-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-green-900 mb-2">회사 계정의 핵심 기능</h3>
                <ul className="text-sm text-green-800 space-y-2">
                  <li className="flex items-center">
                    <svg
                      className="w-4 h-4 text-green-600 mr-2 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <strong>자사 직원 통합 관리:</strong> 정규직, 계약직, 일용직 모든 직원 관리
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-4 h-4 text-green-600 mr-2 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <strong>4대보험 자동 판정:</strong> 고용형태별 맞춤 4대보험 가입 판정
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-4 h-4 text-green-600 mr-2 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <strong>급여 항목 커스터마이징:</strong> 회사별 급여 구조에 맞는 설정
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-4 h-4 text-green-600 mr-2 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <strong>실시간 근태 관리:</strong> 출퇴근, 연장근무, 휴가 등 통합 관리
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 회사 규모별 안내 */}
        <div className="sm:mx-auto sm:w-full sm:max-w-2xl mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">소규모 기업</h3>
              <p className="text-sm text-gray-600">직원 1-30명</p>
              <p className="text-xs text-gray-500 mt-2">간단한 설정으로 빠른 시작</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">중간 규모 기업</h3>
              <p className="text-sm text-gray-600">직원 31-100명</p>
              <p className="text-xs text-gray-500 mt-2">부서별 관리 및 권한 설정</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">대규모 기업</h3>
              <p className="text-sm text-gray-600">직원 100명 이상</p>
              <p className="text-xs text-gray-500 mt-2">고급 분석 및 배치 처리</p>
            </div>
          </div>
        </div>

        {/* 회원가입 폼 */}
        <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
          <RegisterForm userType="company" />
        </div>

        {/* 추가 정보 */}
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">가입 후 진행 과정</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">이메일 인증</h4>
                  <p className="text-sm text-gray-600">
                    가입 시 입력한 이메일로 인증 링크가 발송됩니다.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">사업자등록증 확인</h4>
                  <p className="text-sm text-gray-600">제출하신 사업자등록증을 확인합니다.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">계정 승인</h4>
                  <p className="text-sm text-gray-600">
                    관리자 승인 후 서비스를 이용하실 수 있습니다. (1-2 영업일)
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  4
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">초기 설정</h4>
                  <p className="text-sm text-gray-600">
                    회사 정보, 급여 항목, 부서 구조 등을 설정합니다.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  5
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">직원 등록 및 관리 시작</h4>
                  <p className="text-sm text-gray-600">
                    직원 정보를 등록하고 4대보험 관리를 시작하세요.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 노무사 연결 옵션 */}
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                  전문가 도움이 필요하신가요?
                </h3>
                <p className="text-sm text-yellow-800 mb-3">
                  4대보험 업무가 복잡하거나 전문적인 관리가 필요한 경우, 등록된 노무사 사무실과
                  연결해드릴 수 있습니다.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    전문 상담
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    업무 대행
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    법령 업데이트
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 고객센터 정보 */}
        <div className="mt-8 text-center">
          <div className="bg-gray-100 rounded-lg p-4 sm:mx-auto sm:w-full sm:max-w-2xl">
            <h4 className="font-semibold text-gray-900 mb-2">가입 관련 문의</h4>
            <p className="text-sm text-gray-600 mb-3">
              회사 가입에 대한 문의사항이 있으시면 언제든 연락주세요.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-6">
              <a
                href="tel:1588-0000"
                className="inline-flex items-center text-sm font-medium text-green-600 hover:text-green-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                1588-0000 (평일 9:00-18:00)
              </a>
              <a
                href="mailto:business@insurance-system.co.kr"
                className="inline-flex items-center text-sm font-medium text-green-600 hover:text-green-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                  />
                </svg>
                business@insurance-system.co.kr
              </a>
            </div>
          </div>
        </div>

        {/* 다른 가입 유형 */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            노무사 사무실로 가입하고 싶으신가요?{" "}
            <Link
              href="/register/labor-office"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              노무사 사무실 가입하기
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
