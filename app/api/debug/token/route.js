// File: app/api/debug/token/route.js (개발용 디버깅 API)
import { NextResponse } from "next/server";
import { queryBuilder } from "../../../../lib/database.js";

/**
 * 🔧 토큰 상태 확인 API (개발용)
 * GET /api/debug/token?userId=32
 */
export async function GET(request) {
  // 개발 환경에서만 사용 가능
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { success: false, message: "이 API는 개발 환경에서만 사용할 수 있습니다." },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "userId 파라미터가 필요합니다." },
        { status: 400 }
      );
    }

    console.log("🔍 토큰 상태 확인:", userId);

    // 사용자 정보 조회
    const { data: userInfo, error } = await queryBuilder
      .select(
        "users",
        `user_id, username, email, is_email_verified, 
         email_verification_token, email_verification_expires_at,
         verification_attempts, verification_sent_at`,
        { useAdmin: true }
      )
      .eq("user_id", parseInt(userId))
      .single();

    if (error || !userInfo) {
      return NextResponse.json(
        { success: false, message: "사용자를 찾을 수 없습니다.", error },
        { status: 404 }
      );
    }

    const now = new Date();
    const expiresAt = userInfo.email_verification_expires_at
      ? new Date(userInfo.email_verification_expires_at)
      : null;

    return NextResponse.json({
      success: true,
      data: {
        userId: userInfo.user_id,
        username: userInfo.username,
        email: userInfo.email,
        isEmailVerified: userInfo.is_email_verified,
        hasToken: !!userInfo.email_verification_token,
        token: userInfo.email_verification_token
          ? userInfo.email_verification_token.substring(0, 8) + "..."
          : null,
        fullToken: userInfo.email_verification_token, // 개발용으로만
        expiresAt: userInfo.email_verification_expires_at,
        isExpired: expiresAt ? expiresAt < now : null,
        timeToExpiry: expiresAt ? Math.round((expiresAt - now) / 1000 / 60) + " minutes" : null,
        verificationAttempts: userInfo.verification_attempts,
        lastSentAt: userInfo.verification_sent_at,
        currentTime: now.toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ 토큰 상태 확인 오류:", error);
    return NextResponse.json(
      { success: false, message: "서버 오류", error: error.message },
      { status: 500 }
    );
  }
}
