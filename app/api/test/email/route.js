// File: app/api/test/email/route.js
import { NextResponse } from "next/server";
import { sendTestEmail, testEmailConfiguration } from "../../../../lib/emailService.js";

/**
 * 🔧 이메일 설정 테스트 API (개발용)
 * GET /api/test/email - 이메일 설정 확인
 * POST /api/test/email - 테스트 이메일 발송
 */

// 개발 환경에서만 사용 가능
const isDevelopment = process.env.NODE_ENV === "development";

export async function GET() {
  if (!isDevelopment) {
    return NextResponse.json(
      { success: false, message: "이 API는 개발 환경에서만 사용할 수 있습니다." },
      { status: 403 }
    );
  }

  try {
    console.log("📧 이메일 설정 테스트 시작...");

    // 이메일 설정 확인
    const configTest = await testEmailConfiguration();

    return NextResponse.json({
      success: true,
      message: "이메일 설정 테스트 완료",
      data: {
        configuration: configTest,
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          SMTP_HOST: process.env.SMTP_HOST || "설정되지 않음",
          SMTP_PORT: process.env.SMTP_PORT || "설정되지 않음",
          SMTP_USER: process.env.SMTP_USER ? "설정됨" : "설정되지 않음",
          SMTP_PASS: process.env.SMTP_PASS ? "설정됨" : "설정되지 않음",
          SMTP_FROM: process.env.SMTP_FROM || "설정되지 않음",
          NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "설정되지 않음",
          EMAIL_FORCE_SEND: process.env.EMAIL_FORCE_SEND || "false",
          EMAIL_DEBUG: process.env.EMAIL_DEBUG || "false",
        },
      },
    });
  } catch (error) {
    console.error("❌ 이메일 설정 테스트 실패:", error);

    return NextResponse.json(
      {
        success: false,
        message: "이메일 설정 테스트에 실패했습니다.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  if (!isDevelopment) {
    return NextResponse.json(
      { success: false, message: "이 API는 개발 환경에서만 사용할 수 있습니다." },
      { status: 403 }
    );
  }

  try {
    const { to = "test@example.com" } = await request.json();

    console.log("📧 테스트 이메일 발송 시작:", to);

    // 테스트 이메일 발송
    const result = await sendTestEmail(to);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "테스트 이메일이 성공적으로 발송되었습니다.",
        data: {
          messageId: result.messageId,
          accepted: result.accepted,
          rejected: result.rejected,
          developmentMode: result.developmentMode,
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "테스트 이메일 발송에 실패했습니다.",
          error: result.error,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("❌ 테스트 이메일 발송 실패:", error);

    return NextResponse.json(
      {
        success: false,
        message: "테스트 이메일 발송 중 오류가 발생했습니다.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
