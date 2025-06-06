// File: app/api/auth/resend-verification/route.js
import { NextResponse } from "next/server";
import { queryBuilder } from "../../../../lib/database.js";
import {
  createEmailVerificationToken,
  checkCanResendVerification,
  maskEmail,
} from "../../../../lib/auth.js";

// 🔧 이메일 서비스 import (에러 처리 포함)
import { sendVerificationEmail } from "../../../../lib/emailService.js";

/**
 * 📧 인증 메일 재발송 API (안전한 버전)
 * POST /api/auth/resend-verification
 */
export async function POST(request) {
  try {
    console.log("📧 재전송 API 호출됨");

    const { userId } = await request.json();
    console.log("📧 요청 사용자 ID:", userId);

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "사용자 ID가 필요합니다.",
          code: "MISSING_USER_ID",
        },
        { status: 400 }
      );
    }

    // 사용자 정보 조회 (기존 필드명 사용)
    console.log("🔍 사용자 정보 조회 중...");
    const { data: userData, error: userError } = await queryBuilder
      .select(
        "users",
        "user_id, username, email, is_email_verified, verification_attempts, verification_sent_at",
        { useAdmin: true }
      )
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    if (userError || !userData) {
      console.error("❌ 사용자 조회 실패:", userError);
      return NextResponse.json(
        {
          success: false,
          message: "사용자를 찾을 수 없습니다.",
          code: "USER_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    const user = userData;
    console.log("✅ 사용자 조회 성공:", user.email);

    // 이미 인증된 사용자인지 확인
    if (user.is_email_verified) {
      console.log("ℹ️ 이미 인증된 사용자");
      return NextResponse.json(
        {
          success: false,
          message: "이미 이메일 인증이 완료된 계정입니다.",
          code: "ALREADY_VERIFIED",
        },
        { status: 400 }
      );
    }

    // 재발송 제한 확인 (1분 쿨다운) - 단순화
    if (user.verification_sent_at) {
      const lastSentTime = new Date(user.verification_sent_at);
      const now = new Date();
      const timeDiff = now - lastSentTime;
      const oneMinute = 60 * 1000;

      if (timeDiff < oneMinute) {
        const remainingSeconds = Math.ceil((oneMinute - timeDiff) / 1000);
        console.log("⏰ 재발송 제한:", remainingSeconds, "초 남음");
        return NextResponse.json(
          {
            success: false,
            message: `잠시 후 다시 시도해주세요. (${remainingSeconds}초 후 가능)`,
            code: "TOO_MANY_REQUESTS",
            data: { remainingSeconds },
          },
          { status: 429 }
        );
      }
    }

    // 일일 제한 확인 (하루 최대 5회) - 단순화
    const attempts = user.verification_attempts || 0;
    if (attempts >= 5) {
      console.log("🚫 일일 제한 초과:", attempts);
      return NextResponse.json(
        {
          success: false,
          message: "일일 인증 메일 발송 한도를 초과했습니다. 내일 다시 시도해주세요.",
          code: "DAILY_LIMIT_EXCEEDED",
        },
        { status: 429 }
      );
    }

    // 새 인증 토큰 생성
    console.log("🔑 인증 토큰 생성 중...");
    let verificationToken;
    try {
      verificationToken = await createEmailVerificationToken(userId, "resend");
      console.log("✅ 토큰 생성 성공");
    } catch (tokenError) {
      console.error("❌ 토큰 생성 실패:", tokenError);
      return NextResponse.json(
        {
          success: false,
          message: "토큰 생성에 실패했습니다.",
          code: "TOKEN_GENERATION_FAILED",
        },
        { status: 500 }
      );
    }

    // 인증 메일 발송
    console.log("📧 이메일 발송 시도...");
    try {
      const emailResult = await sendVerificationEmail({
        email: user.email,
        name: user.username,
        userId: user.user_id,
        token: verificationToken,
      });

      console.log("✅ 이메일 발송 결과:", emailResult);

      return NextResponse.json({
        success: true,
        message: emailResult?.developmentMode
          ? "[개발 모드] 인증 메일 발송이 시뮬레이션되었습니다."
          : "인증 메일을 다시 발송했습니다. 이메일을 확인해주세요.",
        data: {
          email: maskEmail(user.email),
          attemptsRemaining: 5 - (attempts + 1),
          developmentMode: emailResult?.developmentMode || false,
        },
      });
    } catch (emailError) {
      console.error("❌ 이메일 발송 실패:", emailError);

      // 개발 환경에서는 항상 성공으로 처리
      if (process.env.NODE_ENV === "development") {
        console.log("🔧 개발 환경: 이메일 발송 실패하지만 성공으로 처리");
        return NextResponse.json({
          success: true,
          message: "[개발 모드] 인증 메일 발송이 시뮬레이션되었습니다.",
          data: {
            email: maskEmail(user.email),
            attemptsRemaining: 5 - (attempts + 1),
            developmentMode: true,
          },
        });
      }

      return NextResponse.json(
        {
          success: false,
          message: "이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.",
          code: "EMAIL_SEND_FAILED",
          error: emailError.message,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("📧 Resend verification API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        code: "INTERNAL_SERVER_ERROR",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
