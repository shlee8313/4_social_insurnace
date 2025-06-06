// File: app/api/auth/change-password/route.js
import { NextResponse } from "next/server";
import { verifyToken, hashPassword, verifyPassword } from "../../../../lib/auth.js";
import { supabaseAdmin, SupabaseError } from "../../../../lib/database.js";

/**
 * 비밀번호 변경 API
 * POST /api/auth/change-password
 */
export async function POST(request) {
  try {
    console.log("🔐 Password change request received");

    // 1. Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          message: "인증 토큰이 필요합니다.",
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // 2. JWT 토큰 검증
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        {
          success: false,
          message: "유효하지 않은 토큰입니다.",
        },
        { status: 401 }
      );
    }

    // 3. 요청 데이터 파싱
    const { currentPassword, newPassword, confirmPassword } = await request.json();

    // 4. 입력값 검증
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "모든 필드를 입력해주세요.",
        },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "새 비밀번호와 확인 비밀번호가 일치하지 않습니다.",
        },
        { status: 400 }
      );
    }

    // 5. 새 비밀번호 강도 검사
    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: "새 비밀번호는 최소 8자 이상이어야 합니다.",
        },
        { status: 400 }
      );
    }

    // 6. 현재 사용자 정보 조회
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("user_id, username, email, password_hash")
      .eq("user_id", decoded.userId)
      .eq("is_active", true)
      .single();

    if (userError || !user) {
      console.log("❌ User not found:", decoded.userId);
      return NextResponse.json(
        {
          success: false,
          message: "사용자를 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

    // 7. 현재 비밀번호 확인
    const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      console.log("❌ Invalid current password for user:", user.username);
      return NextResponse.json(
        {
          success: false,
          message: "현재 비밀번호가 올바르지 않습니다.",
        },
        { status: 400 }
      );
    }

    // 8. 새 비밀번호와 현재 비밀번호가 같은지 확인
    const isSamePassword = await verifyPassword(newPassword, user.password_hash);
    if (isSamePassword) {
      return NextResponse.json(
        {
          success: false,
          message: "새 비밀번호는 현재 비밀번호와 달라야 합니다.",
        },
        { status: 400 }
      );
    }

    // 9. 새 비밀번호 해시화
    const newPasswordHash = await hashPassword(newPassword);

    // 10. 데이터베이스 업데이트
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        password_hash: newPasswordHash,
        password_changed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.user_id);

    if (updateError) {
      console.error("❌ Password update failed:", updateError);
      return NextResponse.json(
        {
          success: false,
          message: "비밀번호 변경에 실패했습니다.",
        },
        { status: 500 }
      );
    }

    // 11. Supabase Auth 비밀번호도 업데이트 (있다면)
    try {
      await supabaseAdmin.auth.admin.updateUserById(user.auth_user_id || user.user_id, {
        password: newPassword,
      });
      console.log("✅ Supabase Auth password also updated");
    } catch (authError) {
      console.warn(
        "⚠️ Supabase Auth password update failed (continuing anyway):",
        authError.message
      );
    }

    console.log(`✅ Password changed successfully for user: ${user.username}`);

    // 12. 성공 응답
    return NextResponse.json({
      success: true,
      message: "비밀번호가 성공적으로 변경되었습니다.",
    });
  } catch (error) {
    console.error("❌ Password change error:", error);

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
        message: "서버 오류가 발생했습니다.",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
