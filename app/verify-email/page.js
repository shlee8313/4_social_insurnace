// File: app/verify-email/page.js
"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "../components/ui/Button";

/**
 * 📧 이메일 인증 완료 페이지
 */
function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState("loading"); // loading, success, error
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get("token");
      const userId = searchParams.get("userId");

      console.log("📧 이메일 인증 시도:", { token: token?.substring(0, 8) + "...", userId });

      if (!token || !userId) {
        setVerificationStatus("error");
        setMessage("유효하지 않은 인증 링크입니다.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token, userId: parseInt(userId) }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          console.log("✅ 이메일 인증 성공");
          setVerificationStatus("success");
          setMessage("이메일 인증이 완료되었습니다!");

          // 3초 후 로그인 페이지로 리다이렉트
          setTimeout(() => {
            router.push("/login?verified=true");
          }, 3000);
        } else {
          console.log("❌ 이메일 인증 실패:", data.message);
          setVerificationStatus("error");
          setMessage(data.message || "인증에 실패했습니다.");
        }
      } catch (error) {
        console.error("❌ 이메일 인증 오류:", error);
        setVerificationStatus("error");
        setMessage("서버 오류가 발생했습니다. 다시 시도해주세요.");
      } finally {
        setIsLoading(false);
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">이메일 인증 중...</h2>
            <p className="text-gray-600 mt-2">잠시만 기다려주세요.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* 아이콘 */}
          <div
            className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
              verificationStatus === "success" ? "bg-green-100" : "bg-red-100"
            }`}
          >
            {verificationStatus === "success" ? (
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ) : (
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
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
          </div>

          {/* 제목 */}
          <h2
            className={`text-2xl font-bold mb-2 ${
              verificationStatus === "success" ? "text-green-900" : "text-red-900"
            }`}
          >
            {verificationStatus === "success" ? "인증 완료!" : "인증 실패"}
          </h2>

          {/* 메시지 */}
          <p
            className={`text-sm mb-6 ${
              verificationStatus === "success" ? "text-green-600" : "text-red-600"
            }`}
          >
            {message}
          </p>

          {/* 성공시 추가 안내 */}
          {verificationStatus === "success" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-700">
                이제 정상적으로 로그인할 수 있습니다.
                <br />
                3초 후 자동으로 로그인 페이지로 이동합니다.
              </p>
            </div>
          )}

          {/* 실패시 추가 안내 */}
          {verificationStatus === "error" && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-700 mb-2">가능한 원인:</p>
              <ul className="text-xs text-red-600 text-left space-y-1">
                <li>• 인증 링크가 만료되었습니다 (24시간)</li>
                <li>• 이미 인증이 완료된 계정입니다</li>
                <li>• 잘못된 인증 링크입니다</li>
              </ul>
            </div>
          )}

          {/* 액션 버튼들 */}
          <div className="space-y-3">
            {verificationStatus === "success" ? (
              <Button
                onClick={() => router.push("/login?verified=true")}
                fullWidth
                variant="primary"
              >
                로그인 페이지로 이동
              </Button>
            ) : (
              <>
                <Button onClick={() => router.push("/login")} fullWidth variant="primary">
                  로그인 페이지로 이동
                </Button>
                <Button onClick={() => router.push("/register")} fullWidth variant="secondary">
                  다시 회원가입
                </Button>
              </>
            )}
          </div>

          {/* 도움말 */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              문제가 지속되면{" "}
              <a
                href="mailto:support@insurance-system.co.kr"
                className="text-blue-600 hover:text-blue-500"
              >
                고객센터
              </a>
              로 문의해주세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
