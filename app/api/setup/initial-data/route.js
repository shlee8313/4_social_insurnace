// ===============================
// 1. app/api/setup/initial-data/route.js
// 초기 데이터 생성 API
// ===============================

import { createInitialData, testConnection } from "@/lib/database";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    console.log("🚀 Starting initial data setup...");

    // 1. 데이터베이스 연결 테스트
    const connectionOk = await testConnection();
    if (!connectionOk) {
      throw new Error("Database connection failed");
    }

    // 2. 초기 데이터 생성
    await createInitialData();

    return NextResponse.json({
      success: true,
      message: "Initial data created successfully",
    });
  } catch (error) {
    console.error("❌ Setup failed:", error);
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

// GET 요청으로도 실행 가능 (브라우저에서 직접 호출)
export async function GET() {
  return POST();
}
