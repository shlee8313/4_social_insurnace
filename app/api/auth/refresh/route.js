// File: app/api/auth/refresh/route.js
import { NextResponse } from "next/server";
import { refreshTokens } from "../../../../lib/auth.js";
import { SupabaseError } from "../../../../lib/database.js";

/**
 * 토큰 갱신 API
 * POST /api/auth/refresh
 */
export async function POST(request) {
  try {
    console.log("🔄 Token refresh requested");

    const body = await request.json();
    const { refreshToken } = body;

    // 쿠키에서도 리프레시 토큰 확인
    const cookieRefreshToken = request.cookies.get("refreshToken")?.value;
    const tokenToUse = refreshToken || cookieRefreshToken;

    if (!tokenToUse) {
      console.log("❌ No refresh token provided");
      return NextResponse.json(
        {
          success: false,
          message: "리프레시 토큰이 필요합니다.",
        },
        { status: 401 }
      );
    }

    // 토큰 갱신 시도
    const authResult = await refreshTokens(tokenToUse);

    console.log("✅ Token refresh successful for user:", authResult.user.username);

    // 성공 응답
    const response = NextResponse.json({
      success: true,
      message: "토큰 갱신 성공",
      user: authResult.user,
      accessToken: authResult.accessToken,
      refreshToken: authResult.refreshToken,
    });

    // 새로운 리프레시 토큰을 쿠키에 설정
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      // maxAge: 7 * 24 * 60 * 60, // 7일
      maxAge: 12 * 60 * 60, // ✅ 12시간 = 43,200초
    };

    response.cookies.set("refreshToken", authResult.refreshToken, cookieOptions);

    // Supabase 세션이 있는 경우
    if (authResult.supabaseSession) {
      response.cookies.set("supabase-auth-token", authResult.supabaseSession.access_token, {
        ...cookieOptions,
        maxAge: authResult.supabaseSession.expires_in,
      });
    }

    return response;
  } catch (error) {
    console.error("❌ Token refresh error:", error);

    // 토큰 만료 또는 유효하지 않음
    if (
      error.message?.includes("Invalid refresh token") ||
      error.message?.includes("expired") ||
      error.message?.includes("User not found")
    ) {
      // 쿠키 클리어
      const response = NextResponse.json(
        {
          success: false,
          message: "토큰이 만료되었습니다. 다시 로그인해주세요.",
        },
        { status: 401 }
      );

      response.cookies.set("refreshToken", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0, // 즉시 만료
      });

      return response;
    }

    // 데이터베이스 에러
    if (error instanceof SupabaseError) {
      return NextResponse.json(
        {
          success: false,
          message: "데이터베이스 오류가 발생했습니다.",
        },
        { status: 500 }
      );
    }

    // 기타 에러
    return NextResponse.json(
      {
        success: false,
        message: "토큰 갱신에 실패했습니다.",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
