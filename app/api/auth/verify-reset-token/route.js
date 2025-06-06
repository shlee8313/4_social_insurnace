// File: app/api/auth/verify-reset-token/route.js
import { NextResponse } from "next/server";
import { verifyPasswordResetToken } from "../../../../lib/auth.js";

/**
 * 비밀번호 재설정 토큰 검증 API
 * POST /api/auth/verify-reset-token
 */
export async function POST(request) {
  try {
    const { token } = await request.json();

    console.log("🔍 Token verification request received");

    // 1. 토큰 필수 검증
    if (!token) {
      return NextResponse.json(
        {
          valid: false,
          message: "토큰이 필요합니다.",
        },
        { status: 400 }
      );
    }

    // 2. 토큰 검증
    console.log("🔄 Verifying reset token...");
    const verificationResult = await verifyPasswordResetToken(token);

    // 3. 검증 결과 반환
    if (verificationResult.valid) {
      console.log("✅ Reset token is valid");
      return NextResponse.json(
        {
          valid: true,
          user: {
            username: verificationResult.user.username,
            email: verificationResult.user.email,
            name: verificationResult.user.name,
          },
          expiresAt: verificationResult.expiresAt,
        },
        { status: 200 }
      );
    } else {
      console.log("❌ Reset token is invalid or expired");
      return NextResponse.json(
        {
          valid: false,
          message: verificationResult.message,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("❌ Token verification API error:", error);

    return NextResponse.json(
      {
        valid: false,
        message: "토큰 검증 중 오류가 발생했습니다.",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET 요청은 지원하지 않음
 */
export async function GET(request) {
  return NextResponse.json(
    {
      valid: false,
      message: "POST 메서드만 지원됩니다.",
    },
    { status: 405 }
  );
}
