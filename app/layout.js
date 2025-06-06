// File: app/layout.jsx (완전 개선된 버전)
import "./globals.css";
import { Inter, Noto_Sans_KR } from "next/font/google";
import AuthProvider from "./components/auth/AuthProvider";
import ErrorBoundary from "./components/shared/ErrorBoundary";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  variable: "--font-noto-sans-kr",
  display: "swap",
});

export const metadata = {
  title: {
    default: "4대보험 취득상실 통합 관리 시스템",
    template: "%s | 4대보험 통합 관리",
  },
  description:
    "노무사 사무실과 회사를 위한 4대보험 자동화 솔루션 - 일용직 롤링 월별 판정, 자동 신고서 생성, 통합 급여 관리",
  keywords: ["4대보험", "취득상실", "노무사", "급여관리", "근태관리", "일용직", "보험판정"],
  authors: [{ name: "Insurance Management System" }],
  creator: "Insurance Management System",
  publisher: "Insurance Management System",
  robots: {
    index: false, // 개발 중이므로 검색엔진 노출 방지
    follow: false,
  },
  // viewport: {
  //   width: "device-width",
  //   initialScale: 1,
  //   maximumScale: 1,
  // },
  // themeColor: "#2563eb",
  // colorScheme: "light",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko" className={`${inter.variable} ${notoSansKR.variable}`}>
      <head>
        {/* Tailwind CSS CDN (임시 해결책) */}
        <script src="https://cdn.tailwindcss.com"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              tailwind.config = {
                theme: {
                  extend: {
                    fontFamily: {
                      'noto-sans-kr': ['Noto Sans KR', 'sans-serif'],
                      'inter': ['Inter', 'sans-serif'],
                    },
                    colors: {
                      primary: {
                        50: '#eff6ff',
                        100: '#dbeafe',
                        200: '#bfdbfe',
                        300: '#93c5fd',
                        400: '#60a5fa',
                        500: '#3b82f6',
                        600: '#2563eb',
                        700: '#1d4ed8',
                        800: '#1e40af',
                        900: '#1e3a8a',
                        950: '#172554',
                      },
                      secondary: {
                        50: '#f0fdf4',
                        100: '#dcfce7',
                        200: '#bbf7d0',
                        300: '#86efac',
                        400: '#4ade80',
                        500: '#22c55e',
                        600: '#16a34a',
                        700: '#15803d',
                        800: '#166534',
                        900: '#14532d',
                        950: '#052e16',
                      },
                      danger: {
                        50: '#fef2f2',
                        100: '#fee2e2',
                        200: '#fecaca',
                        300: '#fca5a5',
                        400: '#f87171',
                        500: '#ef4444',
                        600: '#dc2626',
                        700: '#b91c1c',
                        800: '#991b1b',
                        900: '#7f1d1d',
                        950: '#450a0a',
                      },
                      warning: {
                        50: '#fffbeb',
                        100: '#fef3c7',
                        200: '#fde68a',
                        300: '#fcd34d',
                        400: '#fbbf24',
                        500: '#f59e0b',
                        600: '#d97706',
                        700: '#b45309',
                        800: '#92400e',
                        900: '#78350f',
                        950: '#451a03',
                      }
                    },
                    animation: {
                      'fade-in': 'fadeIn 0.5s ease-in-out',
                      'slide-up': 'slideUp 0.3s ease-out',
                      'slide-down': 'slideDown 0.3s ease-out',
                      'bounce-subtle': 'bounceSubtle 2s infinite',
                    },
                    keyframes: {
                      fadeIn: {
                        '0%': { opacity: '0' },
                        '100%': { opacity: '1' },
                      },
                      slideUp: {
                        '0%': { transform: 'translateY(20px)', opacity: '0' },
                        '100%': { transform: 'translateY(0)', opacity: '1' },
                      },
                      slideDown: {
                        '0%': { transform: 'translateY(-20px)', opacity: '0' },
                        '100%': { transform: 'translateY(0)', opacity: '1' },
                      },
                      bounceSubtle: {
                        '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
                        '40%': { transform: 'translateY(-10px)' },
                        '60%': { transform: 'translateY(-5px)' },
                      }
                    }
                  }
                }
              }
            `,
          }}
        />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />

        {/* 추가 메타 태그들 */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* 보안 관련 헤더들 */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />

        {/* PWA 관련 (향후 확장용) */}
        {/* <link rel="manifest" href="/manifest.json" /> */}
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="4대보험 통합관리" />
      </head>

      <body className={`${notoSansKR.className} antialiased bg-white text-gray-900`}>
        {/* 전역 에러 바운더리 */}
        <ErrorBoundary>
          {/* 인증 상태 관리 Provider */}
          <AuthProvider>
            {/* 메인 애플리케이션 컨테이너 */}
            <div id="root" className="min-h-screen">
              {children}
            </div>
          </AuthProvider>
        </ErrorBoundary>

        {/* 모달 포털 */}
        <div id="modal-root"></div>

        {/* 토스트 알림 포털 */}
        <div id="toast-root"></div>

        {/* 개발 환경 전용 디버그 정보 */}
        {process.env.NODE_ENV === "development" && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                console.log("🚀 4대보험 통합 관리 시스템 개발 모드");
                console.log("📊 환경:", "${process.env.NODE_ENV}");
                console.log("🔧 Next.js 버전: ${process.env.NEXT_PUBLIC_VERSION || "Unknown"}");
                
                // 전역 디버그 함수들
                window.__debugAuth = () => {
                  const authData = JSON.parse(localStorage.getItem('insurance-auth-storage') || '{}');
                  console.table(authData.state || {});
                };
                
                window.__clearAuth = () => {
                  localStorage.removeItem('insurance-auth-storage');
                  window.location.reload();
                };
                
                console.log("🛠️ 디버그 명령어:");
                console.log("  - window.__debugAuth(): 인증 상태 확인");
                console.log("  - window.__clearAuth(): 인증 상태 초기화");
              `,
            }}
          />
        )}
      </body>
    </html>
  );
}

/**
 * 전역 에러 바운더리 컴포넌트
 * 애플리케이션 전체의 예상치 못한 에러를 캐치
 */
function GlobalErrorBoundary({ children }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
          <div className="text-center max-w-md mx-auto p-6">
            {/* 에러 아이콘 */}
            <div className="mx-auto h-20 w-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <svg
                className="h-10 w-10 text-red-600"
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

            <h1 className="text-3xl font-bold text-gray-900 mb-4">시스템 오류</h1>
            <p className="text-gray-600 mb-8">
              예상치 못한 오류가 발생했습니다. 페이지를 새로고침하거나 관리자에게 문의해주세요.
            </p>

            {/* 액션 버튼들 */}
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                페이지 새로고침
              </button>

              <button
                onClick={() => (window.location.href = "/")}
                className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                홈페이지로 이동
              </button>
            </div>

            {/* 고객센터 정보 */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-2">문제가 지속되면 고객센터로 연락주세요</p>
              <div className="flex justify-center space-x-4 text-sm">
                <a href="tel:1588-0000" className="text-primary-600 hover:text-primary-500">
                  📞 1588-0000
                </a>
                <a
                  href="mailto:support@insurance-system.co.kr"
                  className="text-primary-600 hover:text-primary-500"
                >
                  📧 고객지원
                </a>
              </div>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
