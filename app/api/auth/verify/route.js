// File: app/api/auth/verify/route.js
import { NextResponse } from "next/server";
import { verifyToken, getUserPermissions } from "../../../../lib/auth.js";
import { supabaseAdmin, SupabaseError } from "../../../../lib/database.js";

/**
 * 토큰 검증 API
 * GET /api/auth/verify
 */
export async function GET(request) {
  try {
    console.log("🔍 Token verification requested");

    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ No bearer token found");
      return NextResponse.json(
        {
          success: false,
          message: "인증 토큰이 필요합니다.",
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // "Bearer " 제거

    // JWT 토큰 검증
    const decoded = verifyToken(token);

    if (!decoded) {
      console.log("❌ Invalid token");
      return NextResponse.json(
        {
          success: false,
          message: "유효하지 않은 토큰입니다.",
        },
        { status: 401 }
      );
    }

    console.log("✅ Token valid for user:", decoded.userId);

    // 사용자 정보 조회 (관리자 클라이언트 사용)
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("user_id, username, email, name, is_active, is_email_verified")
      .eq("user_id", decoded.userId)
      .eq("is_active", true)
      .single();

    if (userError || !user) {
      console.log("❌ User not found or inactive:", decoded.userId);
      return NextResponse.json(
        {
          success: false,
          message: "사용자를 찾을 수 없습니다.",
        },
        { status: 401 }
      );
    }

    console.log("✅ User found:", user.username);

    // 사용자 권한 조회
    const permissions = await getUserPermissions(user.user_id);

    // 성공 응답
    return NextResponse.json({
      success: true,
      message: "토큰 검증 성공",
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        name: user.name,
        isEmailVerified: user.is_email_verified,
        roles: permissions.roles,
        permissions: permissions.permissions,
      },
    });
  } catch (error) {
    console.error("❌ Token verification error:", error);

    if (error instanceof SupabaseError) {
      return NextResponse.json(
        {
          success: false,
          message: "데이터베이스 오류가 발생했습니다.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "토큰 검증에 실패했습니다.",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
