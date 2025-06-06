// File: app/api/auth/verify-email/route.js (디버깅 강화)
import { NextResponse } from "next/server";
import { queryBuilder } from "../../../../lib/database.js";

/**
 * 📧 이메일 인증 완료 API (디버깅 강화)
 * POST /api/auth/verify-email
 */
export async function POST(request) {
  try {
    const { token, userId } = await request.json();

    console.log("📧 이메일 인증 API 호출:", {
      token: token?.substring(0, 8) + "...",
      userId,
      tokenLength: token?.length,
    });

    if (!token || !userId) {
      console.log("❌ 필수 파라미터 누락:", { token: !!token, userId: !!userId });
      return NextResponse.json(
        {
          success: false,
          message: "필수 파라미터가 누락되었습니다.",
          code: "MISSING_PARAMETERS",
        },
        { status: 400 }
      );
    }

    // 🔍 1. 먼저 해당 사용자의 토큰 정보 조회 (디버깅)
    console.log("🔍 사용자 토큰 정보 조회 중...");
    const { data: userTokenInfo, error: userError } = await queryBuilder
      .select(
        "users",
        "user_id, email, is_email_verified, email_verification_token, email_verification_expires_at",
        { useAdmin: true }
      )
      .eq("user_id", parseInt(userId))
      .single();

    if (userError || !userTokenInfo) {
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

    console.log("🔍 데이터베이스 토큰 정보:", {
      userId: userTokenInfo.user_id,
      email: userTokenInfo.email,
      isEmailVerified: userTokenInfo.is_email_verified,
      hasToken: !!userTokenInfo.email_verification_token,
      tokenMatch: userTokenInfo.email_verification_token === token,
      expiresAt: userTokenInfo.email_verification_expires_at,
      now: new Date().toISOString(),
      isExpired: userTokenInfo.email_verification_expires_at
        ? new Date(userTokenInfo.email_verification_expires_at) < new Date()
        : null,
    });

    // 🔍 2. 상세 검증
    if (userTokenInfo.is_email_verified) {
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

    if (!userTokenInfo.email_verification_token) {
      console.log("❌ 토큰이 존재하지 않음");
      return NextResponse.json(
        {
          success: false,
          message: "인증 토큰이 존재하지 않습니다.",
          code: "NO_TOKEN",
        },
        { status: 400 }
      );
    }

    if (userTokenInfo.email_verification_token !== token) {
      console.log("❌ 토큰 불일치");
      console.log("DB 토큰:", userTokenInfo.email_verification_token);
      console.log("요청 토큰:", token);
      return NextResponse.json(
        {
          success: false,
          message: "유효하지 않은 인증 토큰입니다.",
          code: "INVALID_TOKEN",
        },
        { status: 400 }
      );
    }

    if (
      userTokenInfo.email_verification_expires_at &&
      new Date(userTokenInfo.email_verification_expires_at) < new Date()
    ) {
      console.log("❌ 토큰 만료");
      return NextResponse.json(
        {
          success: false,
          message: "인증 토큰이 만료되었습니다.",
          code: "TOKEN_EXPIRED",
        },
        { status: 400 }
      );
    }

    // 🔍 3. 인증 완료 처리
    console.log("✅ 모든 검증 통과, 인증 완료 처리 중...");
    const { data: updateResult, error: updateError } = await queryBuilder
      .update(
        "users",
        {
          is_email_verified: true,
          email_verification_token: null,
          email_verification_expires_at: null,
        },
        { useAdmin: true }
      )
      .eq("user_id", parseInt(userId))
      .select(); // select를 추가해서 업데이트된 결과 반환

    if (updateError) {
      console.error("❌ 인증 완료 업데이트 실패:", updateError);
      return NextResponse.json(
        {
          success: false,
          message: "인증 완료 처리 중 오류가 발생했습니다.",
          code: "UPDATE_FAILED",
        },
        { status: 500 }
      );
    }

    console.log("✅ 인증 완료 성공:", updateResult);

    return NextResponse.json({
      success: true,
      message: "이메일 인증이 완료되었습니다.",
      data: {
        userId: parseInt(userId),
        verifiedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("📧 Email verification API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        code: "INTERNAL_SERVER_ERROR",
        debug: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
