// LoginForm.jsx - 무한로딩 해결 버전
"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "../ui/Button";
import { Input, PasswordInput } from "../ui/Input";
import { useAuth } from "../../store/authStore";
import { EmailVerificationModal } from "./EmailVerificationModal";

/**
 * 이메일 인증 처리가 추가된 로그인 폼 컴포넌트 (무한로딩 해결)
 */
export const LoginForm = ({ redirectTo = null, showRegisterLink = true, className = "" }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    login,
    isLoading,
    error,
    clearError,
    isAuthenticated,
    isInitialized,
    getDefaultDashboard,
    waitForInitialization,
    emailVerificationModal,
    openEmailVerificationModal,
    closeEmailVerificationModal,
    user,
  } = useAuth();

  // 기본 상태들
  const [formData, setFormData] = useState({
    emailOrUsername: "",
    password: "",
    rememberMe: false,
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVerificationSuccess, setShowVerificationSuccess] = useState(false);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false); // 인증 체크 완료 플래그

  // URL 파라미터에서 인증 완료 상태 확인
  useEffect(() => {
    const verified = searchParams.get("verified");
    if (verified === "true") {
      setShowVerificationSuccess(true);
      const timer = setTimeout(() => {
        setShowVerificationSuccess(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  // 인증 상태 확인 (한 번만 실행)
  useEffect(() => {
    console.log("🔍 LoginForm useEffect TRIGGERED:", {
      hasCheckedAuth,
      isInitialized,
      isAuthenticated,
      user: user ? { id: user.user_id, username: user.username } : null,
      timestamp: new Date().toISOString(),
    });

    // 🚨 조건 수정: 인증되지 않은 상태에서만 스킵
    if (hasCheckedAuth && !isAuthenticated) {
      console.log("🔍 LoginForm: Already checked auth and not authenticated, skipping");
      return;
    }

    const checkAuthStatus = async () => {
      try {
        console.log("🔍 LoginForm: Starting auth check");
        await waitForInitialization();

        console.log("🔍 LoginForm: After waitForInitialization:", {
          isAuthenticated,
          user: user ? { id: user.user_id, username: user.username } : null,
        });

        if (isAuthenticated) {
          console.log("🔄 LoginForm: User is authenticated, preparing redirect");
          const destination = redirectTo || getDefaultDashboard();
          console.log("🔄 LoginForm: Destination calculated:", destination);

          // 강제 리다이렉트 시도
          console.log("🚨 LoginForm: ATTEMPTING REDIRECT NOW");

          setTimeout(() => {
            console.log("🚨 LoginForm: Executing router.push to:", destination);
            router.push(destination);
          }, 100);

          setTimeout(() => {
            console.log("🚨 LoginForm: Backup redirect attempt");
            if (window.location.pathname === "/login") {
              console.log("🚨 LoginForm: Still on login page, forcing redirect");
              window.location.href = destination;
            }
          }, 1000);
        }
      } catch (error) {
        console.error("❌ LoginForm: Auth check error:", error);
      } finally {
        console.log("🔍 LoginForm: Setting hasCheckedAuth to true");
        setHasCheckedAuth(true);
      }
    };

    // 초기화가 완료된 경우에만 체크
    if (isInitialized) {
      console.log("🔍 LoginForm: isInitialized=true, calling checkAuthStatus");
      checkAuthStatus();
    } else {
      console.log("🔍 LoginForm: Still waiting for initialization...");
    }
  }, [
    isInitialized,
    isAuthenticated, // 🔥 이 의존성이 중요 - 로그인 성공 시 useEffect 재실행
    hasCheckedAuth,
    redirectTo,
    getDefaultDashboard,
    router,
    waitForInitialization,
    user,
  ]);

  // 에러 메시지 자동 클리어 (20초 후)
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 20000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // 입력시 해당 필드 에러 클리어
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }

    // 사용자가 실제로 텍스트를 입력했을 때만 에러 클리어
    if (error && type !== "checkbox" && value.trim().length > 2) {
      clearError();
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.emailOrUsername.trim()) {
      errors.emailOrUsername = "이메일 또는 사용자명을 입력해주세요.";
    }

    if (!formData.password.trim()) {
      errors.password = "비밀번호를 입력해주세요.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login(formData);

      if (result && result.success) {
        // 로그인 성공 - 리다이렉트는 위의 useEffect에서 처리됨
        console.log("Login successful");
      }
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 초기화되지 않았으면 로딩 표시
  if (!isInitialized) {
    return (
      <div className={`w-full max-w-md mx-auto ${className}`}>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-6"></div>
              <div className="space-y-4">
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`w-full max-w-md mx-auto ${className}`}>
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* 헤더 */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">로그인</h2>
            <p className="text-gray-600">4대보험 통합 관리 시스템</p>
          </div>

          {/* 이메일 인증 완료 성공 메시지 */}
          {showVerificationSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg animate-slide-down">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-green-400 mt-0.5 mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-green-600">
                    이메일 인증이 완료되었습니다!
                  </p>
                  <p className="text-xs text-green-500 mt-1">
                    이제 정상적으로 로그인할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 에러 메시지 표시 */}
          {error && !emailVerificationModal.isOpen && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg animate-slide-down">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-red-400 mt-0.5 mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-600">로그인 실패</p>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
                <button
                  onClick={clearError}
                  className="ml-2 text-red-400 hover:text-red-600 transition-colors"
                  title="닫기"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* 로그인 폼 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 이메일/사용자명 입력 */}
            <Input
              name="emailOrUsername"
              placeholder="이메일 또는 사용자명"
              value={formData.emailOrUsername}
              onChange={handleInputChange}
              error={formErrors.emailOrUsername}
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              }
              disabled={isLoading || isSubmitting}
              autoComplete="username"
              autoFocus
              required
            />

            {/* 비밀번호 입력 */}
            <PasswordInput
              name="password"
              placeholder="비밀번호"
              value={formData.password}
              onChange={handleInputChange}
              error={formErrors.password}
              disabled={isLoading || isSubmitting}
              autoComplete="current-password"
              required
            />

            {/* 로그인 유지 및 비밀번호 찾기 */}
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded transition-colors"
                  disabled={isLoading || isSubmitting}
                />
                <span className="ml-2 text-sm text-gray-600 select-none">로그인 유지</span>
              </label>

              <Link
                href="/forgot-password"
                className="text-sm text-primary-600 hover:text-primary-500 transition-colors"
              >
                비밀번호 찾기
              </Link>
            </div>

            {/* 로그인 버튼 */}
            <Button
              type="submit"
              loading={isLoading || isSubmitting}
              disabled={isLoading || isSubmitting}
              fullWidth
              size="lg"
              className="transition-all duration-200"
            >
              {isSubmitting ? "로그인 중..." : "로그인"}
            </Button>
          </form>

          {/* 구분선 */}
          <div className="mt-6 mb-6 flex items-center">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-sm text-gray-500">또는</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* 소셜 로그인 버튼들 */}
          <div className="space-y-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => console.log("Google 로그인")}
              icon={
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              }
              disabled={isLoading || isSubmitting}
            >
              Google로 로그인
            </Button>

            <Button
              variant="secondary"
              fullWidth
              onClick={() => console.log("카카오 로그인")}
              icon={
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#000000"
                    d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z"
                  />
                </svg>
              }
              disabled={isLoading || isSubmitting}
            >
              카카오로 로그인
            </Button>
          </div>

          {/* 회원가입 링크 */}
          {showRegisterLink && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                계정이 없으신가요?{" "}
                <Link
                  href="/register"
                  className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
                >
                  회원가입
                </Link>
              </p>
            </div>
          )}

          {/* 도움말 */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              로그인에 문제가 있으신가요?{" "}
              <Link
                href="/contact"
                className="text-primary-600 hover:text-primary-500 transition-colors"
              >
                고객센터
              </Link>
            </p>
          </div>
        </div>

        {/* 개발 환경용 빠른 로그인 */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">🧪 개발용 테스트</h3>
            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    emailOrUsername: "lsh.makem@gmail.com",
                    password: "password123",
                    rememberMe: false,
                  })
                }
                className="p-2 bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors"
                disabled={isLoading || isSubmitting}
              >
                ✅ 정상 계정
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    emailOrUsername: "wrong@email.com",
                    password: "wrongpassword",
                    rememberMe: false,
                  })
                }
                className="p-2 bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
                disabled={isLoading || isSubmitting}
              >
                ❌ 잘못된 정보
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    emailOrUsername: "test.unverified@gmail.com",
                    password: "password123",
                    rememberMe: false,
                  })
                }
                className="p-2 bg-orange-100 text-orange-800 rounded hover:bg-orange-200 transition-colors"
                disabled={isLoading || isSubmitting}
              >
                📧 미인증 계정
              </button>
              <button
                type="button"
                onClick={() => {
                  openEmailVerificationModal({
                    userEmail: "t***@gmail.com",
                    userId: 999,
                    canResendEmail: true,
                    verificationAttempts: 1,
                  });
                }}
                className="p-2 bg-purple-100 text-purple-800 rounded hover:bg-purple-200 transition-colors text-xs"
                disabled={isLoading || isSubmitting}
              >
                📧 모달 테스트
              </button>
            </div>
            {/* 디버깅 정보 */}
            <div className="text-xs text-yellow-700 bg-yellow-100 p-2 rounded">
              <div>🔍 Debug Info:</div>
              <div>• isInitialized: {isInitialized ? "true" : "false"}</div>
              <div>• isAuthenticated: {isAuthenticated ? "true" : "false"}</div>
              <div>• hasCheckedAuth: {hasCheckedAuth ? "true" : "false"}</div>
              <div>• error: "{error || "null"}"</div>
              <div>• emailModal.isOpen: {emailVerificationModal.isOpen ? "true" : "false"}</div>
            </div>
          </div>
        )}
      </div>

      {/* 이메일 인증 요구 모달 */}
      <EmailVerificationModal
        isOpen={emailVerificationModal.isOpen}
        onClose={closeEmailVerificationModal}
        userEmail={emailVerificationModal.userEmail}
        userId={emailVerificationModal.userId}
        canResendEmail={emailVerificationModal.canResendEmail}
        verificationAttempts={emailVerificationModal.verificationAttempts}
      />
    </>
  );
};

/**
 * 래핑된 로그인 폼 (AuthGuard 포함) - PublicOnly로 변경
 */
export default function WrappedLoginForm(props) {
  return (
    <div>
      <LoginForm {...props} />
    </div>
  );
}

// // LoginForm.jsx - 최종 정리된 버전
// "use client";
// import React, { useState, useEffect } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import Link from "next/link";
// import { Button } from "../ui/Button";
// import { Input, PasswordInput } from "../ui/Input";
// import { useAuth } from "../../store/authStore";
// import { EmailVerificationModal } from "./EmailVerificationModal";
// import PublicOnlyGuard from "./AuthGuard";

// /**
//  * 📧 이메일 인증 처리가 추가된 로그인 폼 컴포넌트 (AuthStore 통합)
//  */
// export const LoginForm = ({ redirectTo = null, showRegisterLink = true, className = "" }) => {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const {
//     login,
//     isLoading,
//     error,
//     clearError,
//     isAuthenticated,
//     isInitialized,
//     getDefaultDashboard,
//     waitForInitialization,
//     // 📧 AuthStore에서 모달 관련 상태/함수들 가져오기
//     emailVerificationModal,
//     openEmailVerificationModal,
//     closeEmailVerificationModal,
//   } = useAuth();

//   // 기본 상태들
//   const [formData, setFormData] = useState({
//     emailOrUsername: "",
//     password: "",
//     rememberMe: false,
//   });

//   const [formErrors, setFormErrors] = useState({});
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [showVerificationSuccess, setShowVerificationSuccess] = useState(false);

//   // 📧 URL 파라미터에서 인증 완료 상태 확인
//   useEffect(() => {
//     const verified = searchParams.get("verified");
//     if (verified === "true") {
//       setShowVerificationSuccess(true);
//       setTimeout(() => {
//         setShowVerificationSuccess(false);
//       }, 5000);
//     }
//   }, [searchParams]);

//   // 초기화 완료 후 인증 상태 확인
//   useEffect(() => {
//     const checkAuthStatus = async () => {
//       await waitForInitialization();

//       if (isAuthenticated) {
//         const destination = redirectTo || getDefaultDashboard();
//         router.push(destination);
//       }
//     };

//     checkAuthStatus();
//   }, [
//     isAuthenticated,
//     isInitialized,
//     redirectTo,
//     router,
//     getDefaultDashboard,
//     waitForInitialization,
//   ]);

//   // ✅ 에러 메시지 자동 클리어 (20초 후)
//   useEffect(() => {
//     if (error) {
//       const timer = setTimeout(() => {
//         clearError();
//       }, 20000); // 20초 후 자동 클리어
//       return () => clearTimeout(timer);
//     }
//   }, [error, clearError]);

//   const handleInputChange = (e) => {
//     const { name, value, type, checked } = e.target;

//     setFormData((prev) => ({
//       ...prev,
//       [name]: type === "checkbox" ? checked : value,
//     }));

//     // 입력시 해당 필드 에러 클리어
//     if (formErrors[name]) {
//       setFormErrors((prev) => ({
//         ...prev,
//         [name]: null,
//       }));
//     }

//     // ✅ 사용자가 실제로 텍스트를 입력했을 때만 에러 클리어
//     if (error && type !== "checkbox" && value.trim().length > 2) {
//       clearError();
//     }
//   };

//   const validateForm = () => {
//     const errors = {};

//     if (!formData.emailOrUsername.trim()) {
//       errors.emailOrUsername = "이메일 또는 사용자명을 입력해주세요.";
//     }

//     if (!formData.password.trim()) {
//       errors.password = "비밀번호를 입력해주세요.";
//     }

//     setFormErrors(errors);
//     return Object.keys(errors).length === 0;
//   };

//   // ✅ 최종 handleSubmit 함수
//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!validateForm() || isSubmitting) {
//       return;
//     }

//     setIsSubmitting(true);

//     const result = await login(formData);

//     if (result && result.success) {
//       // 로그인 성공시 리다이렉트는 useEffect에서 처리됨
//     } else if (result) {
//       // 📧 이메일 인증 필요한 경우는 AuthStore에서 자동으로 모달 처리
//       // 기타 에러는 AuthStore에서 error 상태로 설정되어 UI에 표시됨
//     }

//     setIsSubmitting(false);
//   };

//   // 초기화되지 않았으면 로딩 표시
//   if (!isInitialized) {
//     return (
//       <div className={`w-full max-w-md mx-auto ${className}`}>
//         <div className="bg-white rounded-lg shadow-md p-6">
//           <div className="text-center">
//             <div className="animate-pulse">
//               <div className="h-8 bg-gray-200 rounded mb-4"></div>
//               <div className="h-4 bg-gray-200 rounded mb-6"></div>
//               <div className="space-y-4">
//                 <div className="h-12 bg-gray-200 rounded"></div>
//                 <div className="h-12 bg-gray-200 rounded"></div>
//                 <div className="h-12 bg-gray-200 rounded"></div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <>
//       <div className={`w-full max-w-md mx-auto ${className}`}>
//         <div className="bg-white rounded-lg shadow-md p-6">
//           {/* 헤더 */}
//           <div className="text-center mb-6">
//             <h2 className="text-2xl font-bold text-gray-900 mb-2">로그인</h2>
//             <p className="text-gray-600">4대보험 통합 관리 시스템</p>
//           </div>

//           {/* 📧 이메일 인증 완료 성공 메시지 */}
//           {showVerificationSuccess && (
//             <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg animate-slide-down">
//               <div className="flex items-start">
//                 <svg
//                   className="w-5 h-5 text-green-400 mt-0.5 mr-2 flex-shrink-0"
//                   fill="currentColor"
//                   viewBox="0 0 20 20"
//                 >
//                   <path
//                     fillRule="evenodd"
//                     d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
//                     clipRule="evenodd"
//                   />
//                 </svg>
//                 <div>
//                   <p className="text-sm font-medium text-green-600">
//                     이메일 인증이 완료되었습니다!
//                   </p>
//                   <p className="text-xs text-green-500 mt-1">
//                     이제 정상적으로 로그인할 수 있습니다.
//                   </p>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* ✅ 에러 메시지 표시 (이메일 인증 모달이 열리지 않은 경우에만) */}
//           {error && !emailVerificationModal.isOpen && (
//             <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg animate-slide-down">
//               <div className="flex items-start">
//                 <svg
//                   className="w-5 h-5 text-red-400 mt-0.5 mr-2 flex-shrink-0"
//                   fill="currentColor"
//                   viewBox="0 0 20 20"
//                 >
//                   <path
//                     fillRule="evenodd"
//                     d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
//                     clipRule="evenodd"
//                   />
//                 </svg>
//                 <div className="flex-1">
//                   <p className="text-sm font-medium text-red-600">로그인 실패</p>
//                   <p className="text-sm text-red-600 mt-1">{error}</p>
//                 </div>
//                 {/* 에러 닫기 버튼 */}
//                 <button
//                   onClick={clearError}
//                   className="ml-2 text-red-400 hover:text-red-600 transition-colors"
//                   title="닫기"
//                 >
//                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={2}
//                       d="M6 18L18 6M6 6l12 12"
//                     />
//                   </svg>
//                 </button>
//               </div>
//             </div>
//           )}

//           {/* 로그인 폼 */}
//           <form onSubmit={handleSubmit} className="space-y-4">
//             {/* 이메일/사용자명 입력 */}
//             <Input
//               name="emailOrUsername"
//               placeholder="이메일 또는 사용자명"
//               value={formData.emailOrUsername}
//               onChange={handleInputChange}
//               error={formErrors.emailOrUsername}
//               leftIcon={
//                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
//                   />
//                 </svg>
//               }
//               disabled={isLoading || isSubmitting}
//               autoComplete="username"
//               autoFocus
//               required
//             />

//             {/* 비밀번호 입력 */}
//             <PasswordInput
//               name="password"
//               placeholder="비밀번호"
//               value={formData.password}
//               onChange={handleInputChange}
//               error={formErrors.password}
//               disabled={isLoading || isSubmitting}
//               autoComplete="current-password"
//               required
//             />

//             {/* 로그인 유지 및 비밀번호 찾기 */}
//             <div className="flex items-center justify-between">
//               <label className="flex items-center cursor-pointer">
//                 <input
//                   type="checkbox"
//                   name="rememberMe"
//                   checked={formData.rememberMe}
//                   onChange={handleInputChange}
//                   className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded transition-colors"
//                   disabled={isLoading || isSubmitting}
//                 />
//                 <span className="ml-2 text-sm text-gray-600 select-none">로그인 유지</span>
//               </label>

//               <Link
//                 href="/forgot-password"
//                 className="text-sm text-primary-600 hover:text-primary-500 transition-colors"
//               >
//                 비밀번호 찾기
//               </Link>
//             </div>

//             {/* 로그인 버튼 */}
//             <Button
//               type="submit"
//               loading={isLoading || isSubmitting}
//               disabled={isLoading || isSubmitting}
//               fullWidth
//               size="lg"
//               className="transition-all duration-200"
//             >
//               {isSubmitting ? "로그인 중..." : "로그인"}
//             </Button>
//           </form>

//           {/* 구분선 */}
//           <div className="mt-6 mb-6 flex items-center">
//             <div className="flex-1 border-t border-gray-300"></div>
//             <span className="px-4 text-sm text-gray-500">또는</span>
//             <div className="flex-1 border-t border-gray-300"></div>
//           </div>

//           {/* 소셜 로그인 버튼들 */}
//           <div className="space-y-3">
//             <Button
//               variant="secondary"
//               fullWidth
//               onClick={() => console.log("Google 로그인")}
//               icon={
//                 <svg className="w-5 h-5" viewBox="0 0 24 24">
//                   <path
//                     fill="#4285F4"
//                     d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
//                   />
//                   <path
//                     fill="#34A853"
//                     d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
//                   />
//                   <path
//                     fill="#FBBC05"
//                     d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
//                   />
//                   <path
//                     fill="#EA4335"
//                     d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
//                   />
//                 </svg>
//               }
//               disabled={isLoading || isSubmitting}
//             >
//               Google로 로그인
//             </Button>

//             <Button
//               variant="secondary"
//               fullWidth
//               onClick={() => console.log("카카오 로그인")}
//               icon={
//                 <svg className="w-5 h-5" viewBox="0 0 24 24">
//                   <path
//                     fill="#000000"
//                     d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z"
//                   />
//                 </svg>
//               }
//               disabled={isLoading || isSubmitting}
//             >
//               카카오로 로그인
//             </Button>
//           </div>

//           {/* 회원가입 링크 */}
//           {showRegisterLink && (
//             <div className="mt-6 text-center">
//               <p className="text-sm text-gray-600">
//                 계정이 없으신가요?{" "}
//                 <Link
//                   href="/register"
//                   className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
//                 >
//                   회원가입
//                 </Link>
//               </p>
//             </div>
//           )}

//           {/* 도움말 */}
//           <div className="mt-6 text-center">
//             <p className="text-xs text-gray-500">
//               로그인에 문제가 있으신가요?{" "}
//               <Link
//                 href="/contact"
//                 className="text-primary-600 hover:text-primary-500 transition-colors"
//               >
//                 고객센터
//               </Link>
//             </p>
//           </div>
//         </div>

//         {/* 개발 환경용 빠른 로그인 */}
//         {process.env.NODE_ENV === "development" && (
//           <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
//             <h3 className="text-sm font-medium text-yellow-800 mb-2">🧪 개발용 테스트</h3>
//             <div className="grid grid-cols-2 gap-2 text-xs mb-3">
//               <button
//                 type="button"
//                 onClick={() =>
//                   setFormData({
//                     emailOrUsername: "lsh.makem@gmail.com",
//                     password: "password123",
//                     rememberMe: false,
//                   })
//                 }
//                 className="p-2 bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors"
//                 disabled={isLoading || isSubmitting}
//               >
//                 ✅ 정상 계정
//               </button>
//               <button
//                 type="button"
//                 onClick={() =>
//                   setFormData({
//                     emailOrUsername: "wrong@email.com",
//                     password: "wrongpassword",
//                     rememberMe: false,
//                   })
//                 }
//                 className="p-2 bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
//                 disabled={isLoading || isSubmitting}
//               >
//                 ❌ 잘못된 정보
//               </button>
//               <button
//                 type="button"
//                 onClick={() =>
//                   setFormData({
//                     emailOrUsername: "test.unverified@gmail.com",
//                     password: "password123",
//                     rememberMe: false,
//                   })
//                 }
//                 className="p-2 bg-orange-100 text-orange-800 rounded hover:bg-orange-200 transition-colors"
//                 disabled={isLoading || isSubmitting}
//               >
//                 📧 미인증 계정
//               </button>
//               <button
//                 type="button"
//                 onClick={() => {
//                   openEmailVerificationModal({
//                     userEmail: "t***@gmail.com",
//                     userId: 999,
//                     canResendEmail: true,
//                     verificationAttempts: 1,
//                   });
//                 }}
//                 className="p-2 bg-purple-100 text-purple-800 rounded hover:bg-purple-200 transition-colors text-xs"
//                 disabled={isLoading || isSubmitting}
//               >
//                 📧 모달 테스트
//               </button>
//             </div>
//             {/* 디버깅 정보 */}
//             <div className="text-xs text-yellow-700 bg-yellow-100 p-2 rounded">
//               <div>🔍 Debug Info:</div>
//               <div>• error: "{error || "null"}"</div>
//               <div>• isLoading: {isLoading ? "true" : "false"}</div>
//               <div>• emailModal.isOpen: {emailVerificationModal.isOpen ? "true" : "false"}</div>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* 📧 이메일 인증 요구 모달 (AuthStore 상태 사용) */}
//       <EmailVerificationModal
//         isOpen={emailVerificationModal.isOpen}
//         onClose={closeEmailVerificationModal}
//         userEmail={emailVerificationModal.userEmail}
//         userId={emailVerificationModal.userId}
//         canResendEmail={emailVerificationModal.canResendEmail}
//         verificationAttempts={emailVerificationModal.verificationAttempts}
//       />
//     </>
//   );
// };

// /**
//  * 래핑된 로그인 폼 (AuthGuard 포함)
//  */
// export default function WrappedLoginForm(props) {
//   return (
//     <PublicOnlyGuard>
//       <LoginForm {...props} />
//     </PublicOnlyGuard>
//   );
// }
