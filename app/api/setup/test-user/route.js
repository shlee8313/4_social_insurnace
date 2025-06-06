// ===============================
// 2. app/api/setup/test-user/route.js
// 테스트 사용자 생성 API
// ===============================

import { createInitialUser, findUserByEmail, getRoleIdByCode } from "@/lib/database";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    const { email, password, name, role = "SYSTEM_ADMIN" } = await request.json();

    console.log(`🚀 Creating test user: ${email}`);

    // 1. 기존 사용자 확인
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: "User already exists",
        },
        { status: 400 }
      );
    }

    // 2. 비밀번호 해시
    const password_hash = await bcrypt.hash(password, 12);

    // 3. 역할 ID 조회
    const roleId = await getRoleIdByCode(role);
    if (!roleId) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid role specified: ${role}`,
        },
        { status: 400 }
      );
    }

    // 4. 사용자 생성
    const user = await createInitialUser({
      username: email.split("@")[0],
      email,
      password_hash,
      name,
      role_id: roleId,
      scope_type: "global",
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.user_id,
        email: user.email,
        name: user.name,
        role: role,
      },
    });
  } catch (error) {
    console.error("❌ Test user creation failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: error.stack,
      },
      { status: 500 }
    );
  }
}

// GET 요청으로 기본 사용자 생성
export async function GET() {
  return POST({
    json: async () => ({
      email: "lsh.makem@gmail.com",
      password: "test123456",
      name: "이수현",
      role: "SYSTEM_ADMIN",
    }),
  });
}
