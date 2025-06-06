// app/api/auth/logout/route.js
import { NextResponse } from "next/server";
import { signOut } from "@/lib/auth"; // Supabase signOut 함수 임포트
import { clearUserContext } from "@/lib/database"; // RLS 컨텍스트 클리어 함수 임포트

/**
 * POST /api/auth/logout
 * 사용자 로그아웃 처리
 * 클라이언트의 JWT 토큰을 무효화하고 Supabase 세션을 종료합니다.
 */
export async function POST(request) {
  try {
    // 클라이언트에서 토큰을 이미 삭제하도록 되어 있으므로,
    // 서버에서는 주로 Supabase 세션 무효화 및 RLS 컨텍스트 클리어 작업을 수행합니다.

    // 1. Supabase 세션 종료
    // 이 함수는 내부적으로 Supabase의 세션을 무효화합니다.
    await signOut();
    console.log("✅ Supabase session signed out successfully.");

    // 2. RLS 사용자 컨텍스트 클리어 (선택 사항, 보안 강화 목적)
    // 현재 요청 스코프에서 설정된 사용자 컨텍스트를 클리어합니다.
    // 이는 이 요청 이후의 다른 DB 작업에 혹시 모를 이전 사용자 컨텍스트의 영향을 방지합니다.
    await clearUserContext();
    console.log("✅ RLS user context cleared.");

    // 성공 응답
    return NextResponse.json({ message: "로그아웃이 성공적으로 처리되었습니다." }, { status: 200 });
  } catch (error) {
    console.error("❌ 로그아웃 처리 중 오류 발생:", error);

    // 에러 응답
    return NextResponse.json(
      { message: "로그아웃 처리 중 오류가 발생했습니다.", error: error.message },
      { status: 500 }
    );
  }
}
