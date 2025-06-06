"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "../../components/ui/Button";
import { PasswordInput } from "../../components/ui/Input";
import { useAuth } from "../../store/authStore";

/**
 * 🔐 비밀번호 재설정 페이지 컴포넌트
 * 토큰 검증 → 새 비밀번호 설정
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyResetToken, resetPassword, isLoading, error, clearError } = useAuth();

  const [token, setToken] = useState("");
  const [tokenVerified, setTokenVerified] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [tokenError, setTokenError] = useState("");

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetComplete, setIsResetComplete] = useState(false);

  // URL에서 토큰 추출 및 검증
  useEffect(() => {
    const tokenParam = searchParams.get("token");

    if (!tokenParam) {
      setTokenError("유효하지 않은 링크입니다.");
      return;
    }

    setToken(tokenParam);
    verifyToken(tokenParam);
  }, [searchParams]);

  const verifyToken = async (tokenToVerify) => {
    try {
      const result = await verifyResetToken(tokenToVerify);

      if (result.success) {
        setTokenVerified(true);
        setUserInfo(result.user);
        console.log("✅ Token verified successfully");
      } else {
        setTokenError(result.error || "유효하지 않은 토큰입니다.");
      }
    } catch (err) {
      console.error("Token verification error:", err);
      setTokenError("토큰 검증 중 오류가 발생했습니다.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // 입력시 해당 필드 에러 클리어
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }

    // 사용자가 실제로 텍스트를 입력했을 때만 에러 클리어
    if (error && value.trim().length > 2) {
      clearError();
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.newPassword.trim()) {
      errors.newPassword = "새 비밀번호를 입력해주세요.";
    } else if (formData.newPassword.length < 8) {
      errors.newPassword = "비밀번호는 최소 8자 이상이어야 합니다.";
    } else {
      // 추가 비밀번호 복잡성 검사
      const hasLowerCase = /[a-z]/.test(formData.newPassword);
      const hasNumbers = /\d/.test(formData.newPassword);

      if (!hasLowerCase || !hasNumbers) {
        errors.newPassword = "영문 소문자와 숫자를 포함해야 합니다.";
      }
    }

    if (!formData.confirmPassword.trim()) {
      errors.confirmPassword = "비밀번호 확인을 입력해주세요.";
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = "새 비밀번호와 일치하지 않습니다.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || isSubmitting || !tokenVerified) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await resetPassword(token, formData.newPassword, formData.confirmPassword);

      if (result.success) {
        setIsResetComplete(true);
        setFormData({ newPassword: "", confirmPassword: "" });
      }
    } catch (err) {
      console.error("Reset password error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToLogin = () => {
    router.push("/login");
  };

  // 토큰 오류 화면
  if (tokenError) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {/* 오류 아이콘 */}
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">링크 오류</h2>
              <p className="text-gray-600">{tokenError}</p>
            </div>

            {/* 안내 메시지 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">가능한 원인</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>링크가 만료되었습니다 (1시간 유효)</li>
                      <li>이미 사용된 링크입니다</li>
                      <li>잘못된 링크입니다</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* 액션 버튼들 */}
            <div className="space-y-3">
              <Link href="/forgot-password">
                <Button
                  variant="primary"
                  fullWidth
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  }
                >
                  새로운 재설정 링크 요청
                </Button>
              </Link>

              <Button
                onClick={handleGoToLogin}
                variant="ghost"
                fullWidth
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                }
              >
                로그인 페이지로 돌아가기
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 비밀번호 재설정 완료 화면
  if (isResetComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {/* 성공 아이콘 */}
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">재설정 완료!</h2>
              <p className="text-gray-600">비밀번호가 성공적으로 변경되었습니다.</p>
            </div>

            {/* 사용자 정보 */}
            {userInfo && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">계정 정보</h3>
                    <div className="mt-1 text-sm text-blue-700">
                      <p>
                        <strong>{userInfo.name}</strong> ({userInfo.username})
                      </p>
                      <p>{userInfo.email}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 로그인 버튼 */}
            <Button
              onClick={handleGoToLogin}
              variant="primary"
              fullWidth
              size="lg"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
              }
            >
              새 비밀번호로 로그인하기
            </Button>

            {/* 보안 안내 */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                보안을 위해 다른 기기에서도 다시 로그인해주세요.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 토큰 검증 중 로딩 화면
  if (!tokenVerified && !tokenError) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">링크 확인 중...</h2>
              <p className="text-gray-600">잠시만 기다려주세요.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 새 비밀번호 설정 화면
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">새 비밀번호 설정</h2>
          <p className="text-gray-600 mb-8">
            {userInfo?.name}님의 계정에 대한
            <br />
            새로운 비밀번호를 설정해주세요.
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

          {/* 비밀번호 재설정 폼 */}
          <div className="space-y-6">
            <PasswordInput
              name="newPassword"
              placeholder="새 비밀번호 (8자 이상, 영문+숫자)"
              value={formData.newPassword}
              onChange={handleInputChange}
              error={formErrors.newPassword}
              disabled={isLoading || isSubmitting}
              autoComplete="new-password"
              autoFocus
              required
            />

            <PasswordInput
              name="confirmPassword"
              placeholder="새 비밀번호 확인"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              error={formErrors.confirmPassword}
              disabled={isLoading || isSubmitting}
              autoComplete="new-password"
              required
            />

            {/* 비밀번호 요구사항 */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">비밀번호 요구사항</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li className="flex items-center">
                  <svg
                    className={`w-4 h-4 mr-2 ${
                      formData.newPassword.length >= 8 ? "text-green-500" : "text-gray-400"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  최소 8자 이상
                </li>
                <li className="flex items-center">
                  <svg
                    className={`w-4 h-4 mr-2 ${
                      /[a-z]/.test(formData.newPassword) ? "text-green-500" : "text-gray-400"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  영문 소문자 포함
                </li>
                <li className="flex items-center">
                  <svg
                    className={`w-4 h-4 mr-2 ${
                      /\d/.test(formData.newPassword) ? "text-green-500" : "text-gray-400"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  숫자 포함
                </li>
                <li className="flex items-center">
                  <svg
                    className={`w-4 h-4 mr-2 ${
                      formData.newPassword === formData.confirmPassword &&
                      formData.confirmPassword.length > 0
                        ? "text-green-500"
                        : "text-gray-400"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  비밀번호 확인 일치
                </li>
              </ul>
            </div>

            <Button
              onClick={handleSubmit}
              loading={isLoading || isSubmitting}
              disabled={isLoading || isSubmitting || !tokenVerified}
              fullWidth
              size="lg"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              }
            >
              {isSubmitting ? "설정 중..." : "새 비밀번호 설정"}
            </Button>
          </div>

          {/* 링크 */}
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm text-primary-600 hover:text-primary-500 transition-colors"
            >
              ← 로그인 페이지로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
