// File: app/api/auth/forgot-password/route.js
import { NextResponse } from "next/server";
import { createPasswordResetToken } from "../../../../lib/auth.js";
import { sendPasswordResetEmail } from "../../../../lib/emailService.js";

/**
 * 비밀번호 찾기 API Route Handler
 * POST /api/auth/forgot-password
 */
export async function POST(request) {
  try {
    const { email } = await request.json();

    console.log("🔐 Password reset request received for:", email);

    // 1. 이메일 필수 검증
    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "이메일을 입력해주세요.",
          code: "MISSING_EMAIL",
        },
        { status: 400 }
      );
    }

    // 2. 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "올바른 이메일 형식을 입력해주세요.",
          code: "INVALID_EMAIL_FORMAT",
        },
        { status: 400 }
      );
    }

    try {
      // 3. 비밀번호 재설정 토큰 생성
      console.log("🔄 Creating password reset token...");
      const tokenResult = await createPasswordResetToken(email);

      // 4. 사용자가 존재하지 않는 경우 (보안상 성공으로 응답)
      if (!tokenResult.userExists) {
        console.log("📧 User not found, but returning success for security");
        return NextResponse.json(
          {
            success: true,
            message: "이메일이 등록되어 있다면 비밀번호 재설정 링크를 발송했습니다.",
          },
          { status: 200 }
        );
      }

      // 5. 이메일 인증이 안된 경우
      if (tokenResult.code === "EMAIL_NOT_VERIFIED") {
        return NextResponse.json(
          {
            success: false,
            message: tokenResult.message,
            code: "EMAIL_NOT_VERIFIED",
          },
          { status: 400 }
        );
      }

      // 6. 이메일 발송
      console.log("📧 Sending password reset email...");
      const emailResult = await sendPasswordResetEmail({
        email: tokenResult.user.email,
        name: tokenResult.user.name || tokenResult.user.username,
        token: tokenResult.token,
      });

      console.log("📧 Email send result:", emailResult);

      // 7. 이메일 발송 실패해도 보안상 성공으로 응답
      if (!emailResult.success && !emailResult.developmentMode) {
        console.error("❌ Failed to send reset email, but returning success for security");
      } else {
        console.log("✅ Password reset email sent successfully");
      }

      // 8. 성공 응답 (보안상 항상 같은 메시지)
      return NextResponse.json(
        {
          success: true,
          message: "이메일이 등록되어 있다면 비밀번호 재설정 링크를 발송했습니다.",
          developmentInfo:
            process.env.NODE_ENV === "development"
              ? {
                  emailSent: emailResult.success,
                  token: tokenResult.token.substring(0, 8) + "...",
                  expiresAt: tokenResult.expiresAt,
                }
              : undefined,
        },
        { status: 200 }
      );
    } catch (tokenError) {
      console.error("❌ Token creation error:", tokenError);

      // 토큰 생성 오류도 보안상 성공으로 응답
      return NextResponse.json(
        {
          success: true,
          message: "이메일이 등록되어 있다면 비밀번호 재설정 링크를 발송했습니다.",
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("❌ Forgot password API error:", error);

    // 🔐 보안상 모든 에러를 성공으로 응답
    return NextResponse.json(
      {
        success: true,
        message: "이메일이 등록되어 있다면 비밀번호 재설정 링크를 발송했습니다.",
      },
      { status: 200 }
    );
  }
}

/**
 * 토큰 검증 API Route Handler
 * POST /api/auth/verify-reset-token
 */
export async function GET(request) {
  // GET 요청은 지원하지 않음
  return NextResponse.json(
    {
      success: false,
      message: "POST 메서드만 지원됩니다.",
    },
    { status: 405 }
  );
}
