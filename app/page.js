// File: app/page.js (개선된 버전)
import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { Button } from "./components/ui/Button";
import { Card, StatCard } from "./components/ui/Card";
import HomeNavigation from "./components/layout/HomeNavigation";

export const metadata = {
  title: "4대보험 취득상실 통합 관리 시스템",
  description:
    "노무사 사무실과 회사를 위한 4대보험 자동화 솔루션. 일용직 롤링 월별 판정, 자동 취득상실 신고, 통합 급여 관리를 제공합니다.",
};

/**
 * 홈페이지 (랜딩 페이지)
 * 경로: /
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* 🔧 개선된 네비게이션 헤더 (인증 상태에 따라 동적 변경) */}
      <HomeNavigation />

      {/* 히어로 섹션 */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              4대보험 업무를
              <br />
              <span className="text-blue-600">스마트하게 자동화</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              일용직 롤링 월별 판정부터 자동 취득상실 신고까지, 복잡한 4대보험 업무를 간단하게
              관리하세요.
            </p>

            {/* CTA 버튼들 */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link href="/register/labor-office">
                <Button size="lg" className="w-full sm:w-auto">
                  <svg
                    className="w-5 h-5 mr-2"
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
                  노무사 사무실 가입
                </Button>
              </Link>
              <Link href="/register/company">
                <Button variant="success" size="lg" className="w-full sm:w-auto">
                  <svg
                    className="w-5 h-5 mr-2"
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
                  회사 가입
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="ghost" size="lg" className="w-full sm:w-auto">
                  기존 계정으로 로그인
                </Button>
              </Link>
            </div>

            {/* 신뢰도 지표 */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-green-500 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                국세청 연동 인증
              </div>
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-green-500 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                4대보험 공단 API 연동
              </div>
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-green-500 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                개인정보보호 인증
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 통계 섹션 */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StatCard
              title="등록된 노무사 사무실"
              value="1,200+"
              change="+15%"
              changeType="positive"
              color="blue"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              }
            />
            <StatCard
              title="관리 중인 회사"
              value="15,000+"
              change="+22%"
              changeType="positive"
              color="green"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              }
            />
            <StatCard
              title="월간 처리 건수"
              value="850K+"
              change="+35%"
              changeType="positive"
              color="purple"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              }
            />
          </div>
        </div>
      </section>

      {/* 주요 기능 섹션 */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              왜 우리 시스템을 선택해야 할까요?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              복잡한 4대보험 업무를 자동화하여 시간과 비용을 절약하세요
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* 일용직 롤링 월별 판정 */}
            <Card variant="shadow" className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">일용직 롤링 월별 판정</h3>
              <p className="text-gray-600 mb-4">
                복잡한 일용직 4대보험 가입 판정을 1개월 단위로 자동 순환 처리하여 정확성을
                보장합니다.
              </p>
              <div className="text-sm text-blue-600 font-medium">매일 자동 배치 처리 ✓</div>
            </Card>

            {/* 자동 취득상실 신고 */}
            <Card variant="shadow" className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">자동 취득상실 신고</h3>
              <p className="text-gray-600 mb-4">
                가입 판정 결과에 따라 취득상실 신고서를 자동 생성하고, 4대보험 공단에 직접 제출
                가능합니다.
              </p>
              <div className="text-sm text-green-600 font-medium">공단 API 직접 연동 ✓</div>
            </Card>

            {/* 통합 급여 관리 */}
            <Card variant="shadow" className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">동적 급여 관리</h3>
              <p className="text-gray-600 mb-4">
                회사별 급여 항목을 자유롭게 설정하고, 비과세 한도를 자동 적용하여 정확한 급여 계산을
                지원합니다.
              </p>
              <div className="text-sm text-purple-600 font-medium">커스터마이징 가능 ✓</div>
            </Card>

            {/* 실시간 배치 모니터링 */}
            <Card variant="shadow" className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">실시간 배치 모니터링</h3>
              <p className="text-gray-600 mb-4">
                대량 데이터 처리 상황을 실시간으로 모니터링하고, 처리 결과를 상세하게 추적할 수
                있습니다.
              </p>
              <div className="text-sm text-yellow-600 font-medium">실시간 알림 ✓</div>
            </Card>

            {/* 권한 기반 관리 */}
            <Card variant="shadow" className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">권한 기반 보안 관리</h3>
              <p className="text-gray-600 mb-4">
                사용자별, 회사별, 부서별 세분화된 권한 설정으로 데이터 보안과 업무 효율성을 동시에
                확보합니다.
              </p>
              <div className="text-sm text-red-600 font-medium">RLS 정책 적용 ✓</div>
            </Card>

            {/* 24/7 지원 */}
            <Card variant="shadow" className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 110 19.5 9.75 9.75 0 010-19.5z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">24/7 전문 지원</h3>
              <p className="text-gray-600 mb-4">
                노무 전문가들이 24시간 대기하여 4대보험 관련 문의사항과 시스템 사용법을 친절하게
                안내합니다.
              </p>
              <div className="text-sm text-indigo-600 font-medium">전문 상담 가능 ✓</div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="bg-blue-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">지금 바로 시작하세요</h2>
          <p className="text-xl text-blue-100 mb-8">
            무료 체험으로 4대보험 자동화의 편리함을 직접 경험해보세요
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                무료로 시작하기
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                variant="ghost"
                size="lg"
                className="w-full sm:w-auto text-white border-white hover:bg-white hover:text-blue-600"
              >
                상담 신청하기
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg
                    className="h-5 w-5 text-white"
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
                <span className="ml-2 text-lg font-bold">4대보험 통합관리</span>
              </div>
              <p className="text-gray-400 text-sm">
                노무사 사무실과 회사를 위한 스마트한 4대보험 관리 솔루션
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">서비스</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    일용직 관리
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    급여 관리
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    근태 관리
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    신고 관리
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">지원</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    고객센터
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    사용자 가이드
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    API 문서
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">연락처</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>📞 1588-0000</li>
                <li>📧 support@insurance-system.co.kr</li>
                <li>🏢 서울시 강남구 테헤란로 123</li>
                <li>🕒 평일 9:00 - 18:00</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2025 4대보험 통합 관리 시스템. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
