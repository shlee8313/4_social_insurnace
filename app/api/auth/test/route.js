// File: app/api/auth/test/route.js (디버깅용 API)
import { NextResponse } from "next/server";
import { queryBuilder, testConnection } from "../../../../lib/database.js";

/**
 * 디버깅용 테스트 API
 * GET /api/auth/test
 */
export async function GET(request) {
  try {
    const testResults = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      tests: {},
    };

    // 1. 데이터베이스 연결 테스트
    console.log("🔍 Testing database connection...");
    testResults.tests.dbConnection = await testConnection();

    // 2. 환경 변수 확인
    console.log("🔍 Checking environment variables...");
    testResults.tests.envVariables = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      jwtSecret: !!process.env.JWT_SECRET,
    };

    // 3. 필수 테이블 존재 확인
    console.log("🔍 Checking required tables...");
    const requiredTables = [
      "users",
      "roles",
      "labor_offices",
      "companies",
      "labor_office_staff",
      "user_roles",
    ];
    testResults.tests.tables = {};

    for (const table of requiredTables) {
      try {
        const { data, error } = await queryBuilder
          .select(table, "count(*)", { useAdmin: true })
          .limit(1);
        testResults.tests.tables[table] = !error;

        if (error) {
          console.log(`❌ Table ${table}: ${error.message}`);
        } else {
          console.log(`✅ Table ${table}: OK`);
        }
      } catch (err) {
        testResults.tests.tables[table] = false;
        console.log(`❌ Table ${table}: ${err.message}`);
      }
    }

    // 4. 기본 역할 데이터 확인
    console.log("🔍 Checking roles data...");
    try {
      const { data: roles, error: rolesError } = await queryBuilder
        .select("roles", "role_code, role_name, is_active", { useAdmin: true })
        .eq("is_active", true);

      testResults.tests.rolesData = {
        success: !rolesError,
        count: roles?.length || 0,
        roles: roles?.map((r) => r.role_code) || [],
        hasRequiredRoles:
          roles?.some((r) => r.role_code === "LABOR_ADMIN") &&
          roles?.some((r) => r.role_code === "COMPANY_ADMIN"),
      };

      if (rolesError) {
        console.log("❌ Roles check failed:", rolesError.message);
      } else {
        console.log(`✅ Found ${roles.length} roles:`, roles.map((r) => r.role_code).join(", "));
      }
    } catch (err) {
      testResults.tests.rolesData = { success: false, error: err.message };
      console.log("❌ Roles check error:", err.message);
    }

    // 5. 고용형태 데이터 확인
    console.log("🔍 Checking employment types...");
    try {
      const { data: employmentTypes, error: etError } = await queryBuilder
        .select("employment_types", "type_code, type_name", { useAdmin: true })
        .eq("is_active", true);

      testResults.tests.employmentTypes = {
        success: !etError,
        count: employmentTypes?.length || 0,
        types: employmentTypes?.map((et) => et.type_code) || [],
      };

      if (etError) {
        console.log("❌ Employment types check failed:", etError.message);
      } else {
        console.log(`✅ Found ${employmentTypes.length} employment types`);
      }
    } catch (err) {
      testResults.tests.employmentTypes = { success: false, error: err.message };
    }

    // 6. 테스트 요약
    const allTestsPassed = Object.values(testResults.tests).every((test) => {
      if (typeof test === "boolean") return test;
      if (typeof test === "object" && test !== null) return test.success !== false;
      return true;
    });

    testResults.summary = {
      allTestsPassed,
      readyForRegistration:
        allTestsPassed &&
        testResults.tests.rolesData?.hasRequiredRoles &&
        testResults.tests.employmentTypes?.count > 0,
    };

    console.log("📊 Test Summary:", testResults.summary);

    return NextResponse.json({
      success: true,
      message: allTestsPassed ? "모든 테스트 통과" : "일부 테스트 실패",
      data: testResults,
    });
  } catch (error) {
    console.error("❌ Test API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "테스트 중 오류 발생",
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * 기본 데이터 초기화 API
 * POST /api/auth/test
 */
export async function POST(request) {
  try {
    const { action } = await request.json();

    if (action === "init_roles") {
      console.log("🔧 Initializing basic roles...");

      // 기본 역할 생성
      const basicRoles = [
        {
          role_code: "LABOR_ADMIN",
          role_name: "노무사 사무실 관리자",
          role_category: "labor_office",
          permissions: {
            companies: ["create", "read", "update"],
            workers: ["create", "read", "update", "delete"],
            payroll: ["create", "read", "update", "delete"],
            insurance: ["create", "read", "update", "delete"],
          },
          is_active: true,
        },
        {
          role_code: "COMPANY_ADMIN",
          role_name: "회사 관리자",
          role_category: "company",
          permissions: {
            workers: ["create", "read", "update"],
            payroll: ["read", "update"],
            insurance: ["read"],
            attendance: ["create", "read", "update"],
          },
          is_active: true,
        },
      ];

      const results = [];
      for (const role of basicRoles) {
        try {
          const { data, error } = await queryBuilder.insert("roles", role, { useAdmin: true });
          if (error) {
            console.log(`❌ Failed to create role ${role.role_code}:`, error.message);
            results.push({ role: role.role_code, success: false, error: error.message });
          } else {
            console.log(`✅ Created role ${role.role_code}`);
            results.push({ role: role.role_code, success: true });
          }
        } catch (err) {
          console.log(`❌ Error creating role ${role.role_code}:`, err.message);
          results.push({ role: role.role_code, success: false, error: err.message });
        }
      }

      return NextResponse.json({
        success: true,
        message: "기본 역할 초기화 완료",
        data: results,
      });
    }

    if (action === "init_employment_types") {
      console.log("🔧 Initializing employment types...");

      const employmentTypes = [
        {
          type_code: "REGULAR",
          type_name: "정규직",
          type_category: "regular",
          judgment_method: "immediate",
          is_active: true,
        },
        {
          type_code: "CONTRACT",
          type_name: "계약직",
          type_category: "contract",
          judgment_method: "immediate",
          is_active: true,
        },
        {
          type_code: "DAILY",
          type_name: "일용직",
          type_category: "daily",
          judgment_method: "rolling_monthly",
          is_active: true,
        },
      ];

      const results = [];
      for (const empType of employmentTypes) {
        try {
          const { data, error } = await queryBuilder.insert("employment_types", empType, {
            useAdmin: true,
          });
          if (error) {
            console.log(`❌ Failed to create employment type ${empType.type_code}:`, error.message);
            results.push({ type: empType.type_code, success: false, error: error.message });
          } else {
            console.log(`✅ Created employment type ${empType.type_code}`);
            results.push({ type: empType.type_code, success: true });
          }
        } catch (err) {
          results.push({ type: empType.type_code, success: false, error: err.message });
        }
      }

      return NextResponse.json({
        success: true,
        message: "고용형태 초기화 완료",
        data: results,
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: "알 수 없는 액션입니다.",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("❌ Init API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "초기화 중 오류 발생",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
