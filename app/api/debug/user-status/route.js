// File: app/api/debug/user-status/route.js
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth.js";
import {
  queryBuilder,
  getUserEntityStatus,
  setUserContext,
  getCachedEntityStatus,
} from "@/lib/database.js";

export async function GET(request) {
  try {
    console.log("🔍 Debug API: Starting user status check...");

    // 1. 토큰 검증
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authorization header missing or invalid" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const userId = decoded.userId;
    console.log(`🔍 Debug API: Checking status for user ${userId}`);

    // 2. 데이터베이스에서 직접 사용자 정보 조회
    const { data: userFromDB, error: userError } = await queryBuilder
      .select(
        "users",
        `
        user_id, username, email, name, is_active, is_email_verified,
        created_at, last_login, login_count, failed_login_attempts,
        locked_until, verification_attempts, verification_sent_at
        `,
        { useAdmin: true }
      )
      .eq("user_id", userId)
      .single();

    if (userError) {
      console.error("❌ Debug API: Failed to fetch user from DB:", userError);
      return NextResponse.json(
        { error: "Failed to fetch user data", details: userError },
        { status: 500 }
      );
    }

    // 3. 사용자 역할 정보 조회
    const { data: userRoles, error: rolesError } = await queryBuilder
      .select(
        "user_roles",
        `
        role_id, scope_type, scope_company_id, scope_department_id, 
        scope_labor_office_id, is_active, start_date, end_date,
        roles (
          role_code, role_name, role_category, permissions, is_active
        )
        `,
        { useAdmin: true }
      )
      .eq("user_id", userId)
      .eq("is_active", true);

    // 4. 엔터티 상태 정보 조회 (여러 방법으로)
    let entityStatusFromFunction = null;
    let entityStatusFromCache = null;
    let entityStatusError = null;

    try {
      // 4-1. 함수를 통한 엔터티 상태 조회
      entityStatusFromFunction = await getUserEntityStatus(userId);
      console.log("🔍 Debug API: Entity status from function:", entityStatusFromFunction);
    } catch (error) {
      console.error("❌ Debug API: Entity status function error:", error);
      entityStatusError = error.message;
    }

    try {
      // 4-2. 캐시를 통한 엔터티 상태 조회
      entityStatusFromCache = await getCachedEntityStatus(userId, true); // 강제 새로고침
      console.log("🔍 Debug API: Entity status from cache:", entityStatusFromCache);
    } catch (error) {
      console.error("❌ Debug API: Entity status cache error:", error);
    }

    // 5. 회사/노무사사무실 정보 조회 (사용자 역할에 따라)
    let organizationInfo = null;

    if (userRoles?.length > 0) {
      const role = userRoles[0]; // 첫 번째 역할 기준

      try {
        if (role.scope_company_id) {
          // 회사 정보 조회
          const { data: companyData } = await queryBuilder
            .select(
              "companies",
              "company_id, company_name, business_registration_number, client_status",
              { useAdmin: true }
            )
            .eq("company_id", role.scope_company_id)
            .single();

          organizationInfo = {
            type: "company",
            data: companyData,
          };
        } else if (role.scope_labor_office_id) {
          // 노무사 사무실 정보 조회
          const { data: laborOfficeData } = await queryBuilder
            .select(
              "labor_offices",
              "labor_office_id, office_name, business_registration_number, office_status",
              { useAdmin: true }
            )
            .eq("labor_office_id", role.scope_labor_office_id)
            .single();

          organizationInfo = {
            type: "labor_office",
            data: laborOfficeData,
          };
        }
      } catch (orgError) {
        console.error("❌ Debug API: Organization info error:", orgError);
      }
    }

    // 6. 추가 디버그 정보
    const debugInfo = {
      serverTimestamp: new Date().toISOString(),
      tokenPayload: {
        userId: decoded.userId,
        username: decoded.username,
        email: decoded.email,
        name: decoded.name,
        iat: decoded.iat,
        exp: decoded.exp,
      },
      databaseQueries: {
        userQuery: userError ? `Error: ${userError.message}` : "Success",
        rolesQuery: rolesError ? `Error: ${rolesError.message}` : "Success",
        entityStatusQuery: entityStatusError || "Success",
      },
    };

    // 7. 응답 데이터 구성
    const responseData = {
      // 기본 사용자 정보
      user: userFromDB,

      // 역할 정보
      roles: userRoles || [],

      // 엔터티 상태 (여러 소스)
      entityStatus: {
        fromFunction: entityStatusFromFunction,
        fromCache: entityStatusFromCache,
        error: entityStatusError,
      },

      // 조직 정보
      organization: organizationInfo,

      // 토큰 정보
      token: {
        isValid: true,
        expiresAt: new Date(decoded.exp * 1000).toISOString(),
        payload: debugInfo.tokenPayload,
      },

      // 디버그 정보
      debug: debugInfo,

      // 분석 결과
      analysis: {
        shouldBeActive: analyzeUserStatus(userFromDB, userRoles, organizationInfo),
        recommendations: generateRecommendations(userFromDB, userRoles, entityStatusFromFunction),
      },
    };

    console.log("✅ Debug API: Status check completed for user", userId);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("❌ Debug API: Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * 사용자 상태 분석
 */
function analyzeUserStatus(user, roles, organization) {
  const analysis = {
    userActive: user?.is_active === true,
    emailVerified: user?.is_email_verified === true,
    hasValidRoles: roles && roles.length > 0,
    organizationActive: true, // 기본값
    accountLocked: user?.locked_until ? new Date(user.locked_until) > new Date() : false,
  };

  // 조직 상태 확인
  if (organization) {
    if (organization.type === "company") {
      analysis.organizationActive = organization.data?.client_status === "active";
    } else if (organization.type === "labor_office") {
      analysis.organizationActive = organization.data?.office_status === "active";
    }
  }

  // 전체 판단
  analysis.shouldBeActive =
    analysis.userActive &&
    analysis.emailVerified &&
    analysis.hasValidRoles &&
    analysis.organizationActive &&
    !analysis.accountLocked;

  return analysis;
}

/**
 * 권장 사항 생성
 */
function generateRecommendations(user, roles, entityStatus) {
  const recommendations = [];

  if (!user?.is_active) {
    recommendations.push("사용자 계정이 비활성화되어 있습니다. 관리자가 계정을 활성화해야 합니다.");
  }

  if (!user?.is_email_verified) {
    recommendations.push("이메일 인증이 완료되지 않았습니다. 이메일 인증을 완료해주세요.");
  }

  if (!roles || roles.length === 0) {
    recommendations.push("사용자에게 할당된 역할이 없습니다. 적절한 역할을 할당해주세요.");
  }

  if (user?.locked_until && new Date(user.locked_until) > new Date()) {
    recommendations.push(
      "계정이 잠금 상태입니다. 잠금이 해제될 때까지 기다리거나 관리자에게 문의하세요."
    );
  }

  if (entityStatus?.entityStatus === "inactive") {
    recommendations.push("엔터티(조직)가 비활성 상태입니다. 조직 관리자에게 문의하세요.");
  } else if (entityStatus?.entityStatus === "terminated") {
    recommendations.push("엔터티(조직)가 종료 상태입니다. 시스템 관리자에게 문의하세요.");
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "모든 조건이 정상입니다. 다른 문제가 있을 수 있으니 클라이언트 상태를 확인해보세요."
    );
  }

  return recommendations;
}
