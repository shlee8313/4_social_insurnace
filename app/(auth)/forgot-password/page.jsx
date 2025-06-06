// /app/(auth)/forgot-password/page.jsx
"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/Button";
import { EmailInput } from "../../components/ui/Input";
import { useAuth } from "../../store/authStore";

/**
 * 🔐 비밀번호 찾기 페이지 컴포넌트
 * 이메일 입력 → 재설정 링크 발송
 */
export default function ForgotPasswordPage() {
  const router = useRouter();
  const { forgotPassword, isLoading, error, clearError, isInitialized } = useAuth(); // isInitialized 상태 추가로 가져옴

  const [formData, setFormData] = useState({
    email: "",
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  // 디버깅을 위해 추가: useAuth에서 가져온 값 확인
  // console.log("ForgotPasswordPage: forgotPassword, isLoading, error, isInitialized:", { forgotPassword, isLoading, error, isInitialized });

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }

    if (error && value.trim().length > 2) {
      clearError();
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.email.trim()) {
      errors.email = "이메일을 입력해주세요.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = "올바른 이메일 형식을 입력해주세요.";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    // 폼 유효성 검사 및 중복 제출 방지
    if (!validateForm() || isSubmitting) {
      return;
    }

    // ⭐ 추가: forgotPassword 함수가 유효한지 확인 ⭐
    if (typeof forgotPassword !== "function") {
      console.error("Forgot password function is not available yet.");
      setFormErrors((prev) => ({
        ...prev,
        general: "인증 시스템이 초기화되지 않았습니다. 잠시 후 다시 시도해주세요.",
      }));
      // 또는 사용자에게 오류를 시각적으로 알리는 다른 방법을 사용
      return;
    }

    setIsSubmitting(true);

    try {
      // ⭐ 변경: await를 사용하여 결과 대기 ⭐
      const result = await forgotPassword(formData.email.trim());

      if (result.success) {
        setIsEmailSent(true);
        setFormData({ email: "" });
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      // 에러는 useAuth 스토어에서 이미 처리하므로 여기서는 추가 설정 없이 단순히 콘솔에 로깅
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToLogin = () => {
    router.push("/login");
  };

  const handleTryAgain = () => {
    setIsEmailSent(false);
    setFormData({ email: "" });
    setFormErrors({});
    clearError();
  };

  // ... (이메일 발송 완료 화면 및 이메일 입력 화면 부분은 동일)

  // 이메일 입력 화면
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">비밀번호 찾기</h2>
          <p className="text-gray-600 mb-8">
            등록된 이메일 주소를 입력하시면
            <br />
            비밀번호 재설정 링크를 보내드립니다.
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* 에러 메시지 표시 */}
          {error && (
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
                  <p className="text-sm font-medium text-red-600">오류</p>
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
          {/* 추가된 general 에러 표시 (forgotPassword 함수 부재 시) */}
          {formErrors.general && (
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
                  <p className="text-sm font-medium text-red-600">오류</p>
                  <p className="text-sm text-red-600 mt-1">{formErrors.general}</p>
                </div>
                <button
                  onClick={() => setFormErrors((prev) => ({ ...prev, general: null }))}
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

          {/* 비밀번호 찾기 폼 */}
          <div className="space-y-6">
            <EmailInput
              name="email"
              placeholder="등록된 이메일 주소를 입력하세요"
              value={formData.email}
              onChange={handleInputChange}
              error={formErrors.email}
              // ⭐ disabled 조건에 !isInitialized 추가하여 스토어 초기화 전에는 비활성화 ⭐
              disabled={isLoading || isSubmitting || !isInitialized}
              autoComplete="email"
              autoFocus
              required
            />

            <Button
              onClick={handleSubmit}
              loading={isLoading || isSubmitting}
              // ⭐ disabled 조건에 !isInitialized 추가하여 스토어 초기화 전에는 비활성화 ⭐
              disabled={isLoading || isSubmitting || !isInitialized}
              fullWidth
              size="lg"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              }
            >
              {isSubmitting ? "발송 중..." : "재설정 링크 발송"}
            </Button>
          </div>

          {/* 링크들 */}
          <div className="mt-6">
            <div className="flex items-center justify-center">
              <Link
                href="/login"
                className="text-sm text-primary-600 hover:text-primary-500 transition-colors"
              >
                ← 로그인 페이지로 돌아가기
              </Link>
            </div>
          </div>

          {/* 추가 도움말 */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              계정이 없으신가요?{" "}
              <Link href="/register" className="text-primary-600 hover:text-primary-500">
                회원가입
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
