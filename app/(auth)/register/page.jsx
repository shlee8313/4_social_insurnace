// File: app/(auth)/register/page.jsx
import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { Button } from "../../components/ui/Button";
import { Card, ActionCard } from "../../components/ui/Card";

export const metadata = {
  title: "회원가입 - 4대보험 통합 관리 시스템",
  description: "노무사 사무실 또는 회사 계정으로 가입하세요.",
};

/**
 * 회원가입 유형 선택 페이지
 * 경로: /register
 */
export default function RegisterSelectPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* 배경 패턴 */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50" />
        <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-indigo-100 to-transparent opacity-50" />
      </div>

      <div className="relative z-10">
        {/* 헤더 */}
        <div className="sm:mx-auto sm:w-full sm:max-w-3xl text-center mb-8">
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
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">회원가입 유형 선택</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            서비스 이용 목적에 맞는 계정 유형을 선택해주세요. 각 유형별로 최적화된 기능과
            인터페이스를 제공합니다.
          </p>
        </div>

        {/* 가입 유형 카드들 */}
        <div className="sm:mx-auto sm:w-full sm:max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4">
            {/* 노무사 사무실 가입 */}
            <Card variant="shadow" className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100 rounded-full -translate-y-12 translate-x-12 opacity-50" />
              <div className="relative p-8">
                <div className="text-center mb-6">
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
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">노무사 사무실</h2>
                  <p className="text-gray-600">
                    클라이언트 회사들의 4대보험 업무를 대행하는 노무사 사무실용 계정
                  </p>
                </div>

                <div className="space-y-4 mb-8">
                  <h3 className="font-semibold text-gray-900 mb-3">주요 기능</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center text-sm text-gray-700">
                      <svg
                        className="w-4 h-4 text-green-500 mr-3 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      다중 클라이언트 회사 관리
                    </li>
                    <li className="flex items-center text-sm text-gray-700">
                      <svg
                        className="w-4 h-4 text-green-500 mr-3 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      일용직 롤링 월별 4대보험 자동 판정
                    </li>
                    <li className="flex items-center text-sm text-gray-700">
                      <svg
                        className="w-4 h-4 text-green-500 mr-3 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      자동 취득상실 신고서 생성
                    </li>
                    <li className="flex items-center text-sm text-gray-700">
                      <svg
                        className="w-4 h-4 text-green-500 mr-3 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      통합 급여 및 근태 관리
                    </li>
                    <li className="flex items-center text-sm text-gray-700">
                      <svg
                        className="w-4 h-4 text-green-500 mr-3 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      배치 처리 모니터링
                    </li>
                    <li className="flex items-center text-sm text-gray-700">
                      <svg
                        className="w-4 h-4 text-green-500 mr-3 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      클라이언트별 권한 관리
                    </li>
                  </ul>
                </div>

                <Link href="/register/labor-office" className="block">
                  <Button variant="primary" fullWidth size="lg">
                    노무사 사무실로 가입하기
                  </Button>
                </Link>

                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500">
                    노무사 자격증 및 사업자등록증이 필요합니다
                  </p>
                </div>
              </div>
            </Card>

            {/* 회사 가입 */}
            <Card variant="shadow" className="relative overflow-hidden">
              <div className="absolute top-0 left-0 w-24 h-24 bg-green-100 rounded-full -translate-y-12 -translate-x-12 opacity-50" />
              <div className="relative p-8">
                <div className="text-center mb-6">
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
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">회사 직접 관리</h2>
                  <p className="text-gray-600">자사의 4대보험 업무를 직접 관리하는 회사용 계정</p>
                </div>

                <div className="space-y-4 mb-8">
                  <h3 className="font-semibold text-gray-900 mb-3">주요 기능</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center text-sm text-gray-700">
                      <svg
                        className="w-4 h-4 text-green-500 mr-3 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      자사 직원 관리
                    </li>
                    <li className="flex items-center text-sm text-gray-700">
                      <svg
                        className="w-4 h-4 text-green-500 mr-3 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      4대보험 가입 판정 및 현황 조회
                    </li>
                    <li className="flex items-center text-sm text-gray-700">
                      <svg
                        className="w-4 h-4 text-green-500 mr-3 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      근태 입력 및 관리
                    </li>
                    <li className="flex items-center text-sm text-gray-700">
                      <svg
                        className="w-4 h-4 text-green-500 mr-3 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      급여 항목 커스터마이징
                    </li>
                    <li className="flex items-center text-sm text-gray-700">
                      <svg
                        className="w-4 h-4 text-green-500 mr-3 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      부서별 권한 관리
                    </li>
                    <li className="flex items-center text-sm text-gray-700">
                      <svg
                        className="w-4 h-4 text-green-500 mr-3 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      선택가입 신청 관리
                    </li>
                  </ul>
                </div>

                <Link href="/register/company" className="block">
                  <Button variant="success" fullWidth size="lg">
                    회사로 가입하기
                  </Button>
                </Link>

                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500">사업자등록증이 필요합니다</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* 비교 표 */}
        <div className="mt-12 sm:mx-auto sm:w-full sm:max-w-4xl px-4">
          <Card variant="shadow">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
                계정 유형별 기능 비교
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">기능</th>
                      <th className="text-center py-3 px-4 font-semibold text-blue-600">
                        노무사 사무실
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-green-600">회사</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4">클라이언트 회사 관리</td>
                      <td className="text-center py-3 px-4">
                        <svg
                          className="w-5 h-5 text-green-500 mx-auto"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </td>
                      <td className="text-center py-3 px-4">
                        <svg
                          className="w-5 h-5 text-gray-300 mx-auto"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4">4대보험 가입 판정</td>
                      <td className="text-center py-3 px-4">
                        <svg
                          className="w-5 h-5 text-green-500 mx-auto"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </td>
                      <td className="text-center py-3 px-4">
                        <svg
                          className="w-5 h-5 text-green-500 mx-auto"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4">급여 관리</td>
                      <td className="text-center py-3 px-4">
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                          전체
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                          자사만
                        </span>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4">근태 관리</td>
                      <td className="text-center py-3 px-4">
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                          전체
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                          자사만
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">배치 처리 관리</td>
                      <td className="text-center py-3 px-4">
                        <svg
                          className="w-5 h-5 text-green-500 mx-auto"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          제한적
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>

        {/* 로그인 링크 */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              로그인하기
            </Link>
          </p>
        </div>

        {/* 고객센터 정보 */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            가입 문의:{" "}
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
          </p>
        </div>
      </div>
    </div>
  );
}
