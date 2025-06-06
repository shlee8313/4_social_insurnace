// File: app/api/auth/reset-password/route.js
import { NextResponse } from "next/server";
import { resetUserPassword } from "../../../../lib/auth.js";

/**
 * 비밀번호 재설정 API Route Handler
 * POST /api/auth/reset-password
 */
export async function POST(request) {
  try {
    const { token, newPassword, confirmPassword } = await request.json();

    console.log("🔐 Password reset request received");

    // 1. 필수 필드 검증
    if (!token || !newPassword || !confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "모든 필드를 입력해주세요.",
          code: "MISSING_REQUIRED_FIELDS",
        },
        { status: 400 }
      );
    }

    // 2. 비밀번호 일치 확인
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "새 비밀번호와 확인 비밀번호가 일치하지 않습니다.",
          code: "PASSWORD_MISMATCH",
        },
        { status: 400 }
      );
    }

    // 3. 비밀번호 강도 검사
    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: "새 비밀번호는 최소 8자 이상이어야 합니다.",
          code: "WEAK_PASSWORD",
        },
        { status: 400 }
      );
    }

    // 4. 추가 비밀번호 복잡성 검사 (선택적)
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!hasLowerCase || !hasNumbers) {
      return NextResponse.json(
        {
          success: false,
          message: "새 비밀번호는 영문 소문자와 숫자를 포함해야 합니다.",
          code: "WEAK_PASSWORD",
        },
        { status: 400 }
      );
    }

    // 5. 비밀번호 재설정 실행
    try {
      console.log("🔄 Executing password reset...");
      const resetResult = await resetUserPassword(token, newPassword);

      if (!resetResult.success) {
        console.log("❌ Password reset failed:", resetResult.message);
        return NextResponse.json(
          {
            success: false,
            message: resetResult.message,
            code: "RESET_FAILED",
          },
          { status: 400 }
        );
      }

      console.log(`✅ Password reset successful for user: ${resetResult.user.username}`);

      // 6. 성공 응답
      return NextResponse.json(
        {
          success: true,
          message:
            "비밀번호가 성공적으로 재설정되었습니다. 이제 새 비밀번호로 로그인할 수 있습니다.",
          user: {
            username: resetResult.user.username,
            email: resetResult.user.email,
            name: resetResult.user.name,
          },
        },
        { status: 200 }
      );
    } catch (resetError) {
      console.error("❌ Password reset execution error:", resetError);

      return NextResponse.json(
        {
          success: false,
          message: "비밀번호 재설정 중 오류가 발생했습니다.",
          code: "RESET_ERROR",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("❌ Reset password API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        code: "INTERNAL_SERVER_ERROR",
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
      success: false,
      message: "POST 메서드만 지원됩니다.",
    },
    { status: 405 }
  );
}
