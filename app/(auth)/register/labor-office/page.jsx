// File: app/(auth)/register/labor-office/page.jsx
import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import RegisterForm from "../../../components/auth/RegisterForm";

export const metadata = {
  title: "노무사 사무실 가입 - 4대보험 통합 관리 시스템",
  description:
    "노무사 사무실 계정으로 가입하여 클라이언트 회사들의 4대보험 업무를 효율적으로 관리하세요.",
};

/**
 * 노무사 사무실 회원가입 페이지
 * 경로: /register/labor-office
 */
export default function LaborOfficeRegisterPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 sm:px-6 lg:px-8">
      {/* 배경 패턴 */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50" />
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-blue-100 to-transparent opacity-30" />
      </div>

      <div className="relative z-10">
        {/* 헤더 */}
        <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
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
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              노무사 전용
            </span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">노무사 사무실 가입</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            클라이언트 회사들의 4대보험 업무를 효율적으로 관리할 수 있는 전문 노무사 사무실용 계정을
            생성합니다.
          </p>
        </div>

        {/* 특별 안내 */}
        <div className="sm:mx-auto sm:w-full sm:max-w-2xl mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-blue-600"
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
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  노무사 사무실 계정의 특별 기능
                </h3>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li className="flex items-center">
                    <svg
                      className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <strong>일용직 롤링 월별 판정:</strong> 복잡한 일용직 4대보험 가입 판정 자동화
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <strong>배치 처리 모니터링:</strong> 대량 데이터 처리 상황 실시간 모니터링
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <strong>다중 클라이언트 관리:</strong> 여러 회사의 업무를 통합 관리
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <strong>자동 신고서 생성:</strong> 4대보험 취득상실 신고서 자동 생성 및 제출
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 회원가입 폼 */}
        <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
          <RegisterForm userType="labor_office" />
        </div>

        {/* 추가 정보 */}
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">가입 후 진행 과정</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
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
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">서류 검증</h4>
                  <p className="text-sm text-gray-600">
                    노무사 자격증, 사업자등록증 등 제출 서류를 검증합니다.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">계정 승인</h4>
                  <p className="text-sm text-gray-600">
                    관리자 승인 후 모든 기능을 이용하실 수 있습니다. (1-2 영업일)
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  4
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">서비스 이용 시작</h4>
                  <p className="text-sm text-gray-600">
                    클라이언트 회사 등록 및 4대보험 관리 업무를 시작하세요.
                  </p>
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
              노무사 사무실 가입에 대한 문의사항이 있으시면 언제든 연락주세요.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-6">
              <a
                href="tel:1588-0000"
                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
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
                href="mailto:sales@insurance-system.co.kr"
                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                  />
                </svg>
                sales@insurance-system.co.kr
              </a>
            </div>
          </div>
        </div>

        {/* 다른 가입 유형 */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            회사 계정으로 가입하고 싶으신가요?{" "}
            <Link
              href="/register/company"
              className="font-medium text-green-600 hover:text-green-500"
            >
              회사 가입하기
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
