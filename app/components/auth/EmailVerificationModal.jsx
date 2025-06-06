// File: components/auth/EmailVerificationModal.jsx (AuthStore 연동 최적화)
"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { useRouter } from "next/navigation";

/**
 * 📧 이메일 인증 요구 모달 (AuthStore 연동 버전)
 */
export const EmailVerificationModal = ({
  isOpen,
  onClose,
  userEmail,
  userId,
  canResendEmail = true,
  verificationAttempts = 0,
}) => {
  const router = useRouter();
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);

  // 🔍 강화된 디버깅: 모든 props 변화 추적
  useEffect(() => {
    console.log("🔍 EmailVerificationModal RENDER with props:", {
      isOpen,
      userEmail,
      userId,
      canResendEmail,
      verificationAttempts,
    });

    // DOM에서 실제로 modal이 있는지 확인
    const modalElements = document.querySelectorAll('[role="dialog"]');
    console.log("🔍 Modal elements in DOM:", modalElements.length, modalElements);

    // AuthStore 연동 확인
    if (isOpen) {
      console.log("🔥 MODAL IS OPEN! AuthStore integration working!");
    }
  }, [isOpen, userEmail, userId, canResendEmail, verificationAttempts]);

  // 쿨다운 타이머
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResendEmail = async () => {
    if (!canResendEmail || resendCooldown > 0 || isResending) {
      return;
    }

    setIsResending(true);
    setResendSuccess(false);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (response.ok) {
        setResendSuccess(true);
        setResendCooldown(60);
        console.log("✅ 이메일 재발송 성공");
      } else {
        console.error("❌ 이메일 재발송 실패:", data.message);
        alert(data.message || "인증 메일 발송에 실패했습니다.");
      }
    } catch (error) {
      console.error("❌ 인증 메일 재발송 오류:", error);
      alert("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsResending(false);
    }
  };

  const handleGoToLogin = () => {
    onClose();
    router.push("/login");
  };

  // 🔍 렌더링 전 체크
  console.log("📋 EmailVerificationModal RENDERING:", { isOpen, userEmail, userId });

  return (
    <>
      {/* 🔍 Modal 컴포넌트 우회 테스트 - 개발 환경에서만 */}
      {/* {process.env.NODE_ENV === "development" && isOpen && (
        <div
          className="fixed top-4 left-4 z-[9999] bg-green-500 text-white p-4 rounded-lg max-w-sm"
          style={{ zIndex: 9999 }}
        >
          <div className="text-sm font-bold mb-2">✅ AuthStore 모달 연동 성공!</div>
          <div className="text-xs space-y-1">
            <div>✓ isOpen: {isOpen ? "TRUE" : "FALSE"}</div>
            <div>✓ Email: {userEmail}</div>
            <div>✓ UserID: {userId}</div>
            <div>✓ Modal component is working!</div>
          </div>
        </div>
      )} */}

      {/* 기존 Modal 컴포넌트 */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="이메일 인증 필요"
        size="md"
        closeOnOverlayClick={false}
        showCloseButton={false}
      >
        <div className="p-6">
          {/* 이메일 아이콘 */}
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
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
                  d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">이메일 인증이 필요합니다</h3>
          </div>

          {/* 안내 메시지 */}
          <div className="text-center mb-6">
            <p className="text-gray-600 mb-4">보안을 위해 이메일 인증 후 로그인이 가능합니다.</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>{userEmail}</strong>로 발송된 인증 메일을 확인하여 이메일 인증을
                완료해주세요.
              </p>
            </div>
          </div>

          {/* 인증 시도 횟수 표시 */}
          {verificationAttempts > 0 && (
            <div className="text-center mb-4">
              <p className="text-xs text-gray-500">인증 메일 발송 횟수: {verificationAttempts}회</p>
            </div>
          )}

          {/* 성공 메시지 */}
          {resendSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg animate-slide-down">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-green-400 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm text-green-600">
                  인증 메일을 다시 발송했습니다. 이메일을 확인해주세요.
                </p>
              </div>
            </div>
          )}

          {/* 액션 버튼들 */}
          <div className="space-y-3">
            <Button
              onClick={handleResendEmail}
              disabled={!canResendEmail || resendCooldown > 0 || isResending}
              loading={isResending}
              fullWidth
              variant="primary"
            >
              {resendCooldown > 0
                ? `인증 메일 재발송 (${resendCooldown}초 후 가능)`
                : isResending
                ? "발송 중..."
                : "인증 메일 재발송"}
            </Button>

            <Button onClick={handleGoToLogin} fullWidth variant="secondary">
              로그인 페이지로 돌아가기
            </Button>

            {/* 개발 환경에서는 테스트용 닫기 버튼 추가 */}
            {process.env.NODE_ENV === "development" && (
              <Button onClick={onClose} fullWidth variant="outline">
                🧪 테스트용 닫기
              </Button>
            )}
          </div>

          {/* 도움말 */}
          <div className="mt-6 text-center">
            <div className="text-xs text-gray-500 space-y-1">
              <p>• 이메일이 오지 않았다면 스팸함을 확인해보세요</p>
              <p>• 인증 링크는 24시간 동안 유효합니다</p>
              <p>
                • 문의사항:
                <a
                  href="mailto:support@insurance-system.co.kr"
                  className="text-blue-600 hover:text-blue-500 ml-1"
                >
                  support@insurance-system.co.kr
                </a>
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};
