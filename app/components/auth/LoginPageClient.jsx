// File: components/auth/LoginPageClient.jsx
"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import LoginForm from "./LoginForm";

/**
 * 로그인 페이지 클라이언트 컴포넌트
 * Hydration 에러 방지를 위해 클라이언트 컴포넌트로 분리
 */
export default function LoginPageClient() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");
  const message = searchParams.get("message");

  const renderMessage = () => {
    if (!message) return null;

    const messages = {
      registration_success: {
        type: "success",
        text: "회원가입이 완료되었습니다. 로그인해주세요.",
      },
      session_expired: {
        type: "warning",
        text: "로그인 세션이 만료되었습니다. 다시 로그인해주세요.",
      },
      access_denied: {
        type: "error",
        text: "접근 권한이 없습니다. 로그인해주세요.",
      },
      logout_success: {
        type: "info",
        text: "로그아웃되었습니다.",
      },
    };

    const messageData = messages[message];
    if (!messageData) return null;

    const bgColors = {
      success: "bg-green-50 border-green-200 text-green-700",
      warning: "bg-yellow-50 border-yellow-200 text-yellow-700",
      error: "bg-red-50 border-red-200 text-red-700",
      info: "bg-blue-50 border-blue-200 text-blue-700",
    };

    return (
      <div className={`mb-6 p-4 border rounded-lg ${bgColors[messageData.type]}`}>
        <p className="text-sm font-medium text-center">{messageData.text}</p>
      </div>
    );
  };

  return (
    <>
      {/* 메시지 표시 */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">{renderMessage()}</div>

      {/* 로그인 폼 */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <LoginForm redirectTo={redirectTo} />
      </div>
    </>
  );
}
