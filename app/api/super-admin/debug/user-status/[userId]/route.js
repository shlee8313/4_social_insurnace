// 📁 app/api/super-admin/debug/user-status/[userId]/route.js (완전 수정된 버전)
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { queryBuilder } from "@/lib/database";

/**
 * 🚀 완전한 함수 우회 방식 - PostgreSQL 함수 없이 직접 쿼리로 상태 계산
 */

// SUPER_ADMIN 권한 체크 함수
async function checkSuperAdminAuth(request) {
  try {
    const authHeader = request.headers.get("authorization");
    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    if (!token) {
      const cookies = request.headers.get("cookie");
      if (cookies) {
        const tokenMatch = cookies.match(/(?:access_token|accessToken)=([^;]+)/);
        if (tokenMatch) {
          token = tokenMatch[1];
        }
      }
    }

    if (!token) {
      return { success: false, error: "No access token available" };
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return { success: false, error: "Invalid token" };
    }

    const roles = decoded.roles || [];
    const hasSuperAdminRole = roles.some((role) => {
      const roleCode = typeof role === "string" ? role : role.code;
      return roleCode === "SUPER_ADMIN" || roleCode === "SYSTEM_ADMIN";
    });

    if (!hasSuperAdminRole) {
      return { success: false, error: "SUPER_ADMIN required" };
    }

    return { success: true, userId: decoded.userId, username: decoded.username };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 🎯 완전한 직접 쿼리로 엔터티 상태 계산
async function calculateEntityStatusDirect(userId) {
  try {
    console.log(`🔄 Direct calculation for user ${userId}`);

    // 1. 사용자 기본 정보
    const { data: user } = await queryBuilder
      .select("users", "user_id, username, name, is_active, user_status", { useAdmin: true })
      .eq("user_id", userId)
      .single();

    if (!user) {
      return {
        entityType: "unknown",
        entityStatus: "inactive",
        effectiveStatus: "inactive",
        entityName: "User Not Found",
        roleCategory: "unknown",
        roleCode: "unknown",
        message: "사용자를 찾을 수 없습니다.",
      };
    }

    console.log(`🔍 User found: ${user.name} (${user.username})`);

    // 2. 역할 정보 조회
    const { data: userRoles } = await queryBuilder
      .select(
        "user_roles",
        `
        roles!inner (
          role_code, role_name, role_category
        )
      `,
        { useAdmin: true }
      )
      .eq("user_id", userId)
      .eq("is_active", true);

    const activeRoles = userRoles || [];
    console.log(`🔍 Active roles found: ${activeRoles.length}`);

    // 3. SUPER_ADMIN 체크
    const superAdminRole = activeRoles.find((ur) => ur.roles.role_code === "SUPER_ADMIN");
    if (superAdminRole) {
      console.log(`✅ SUPER_ADMIN detected`);
      return {
        entityType: "system",
        entityStatus: "active",
        effectiveStatus: "active",
        entityName: "System Administrator",
        roleCategory: "system",
        roleCode: "SUPER_ADMIN",
        message: "시스템 관리자 권한으로 모든 기능에 접근 가능합니다.",
      };
    }

    // 4. 노무사 사무실 소속 체크
    const { data: laborInfo } = await queryBuilder
      .select(
        "labor_office_staff",
        `
        labor_office_id, position, employment_status,
        labor_offices!inner (
          office_name, office_status
        )
      `,
        { useAdmin: true }
      )
      .eq("user_id", userId)
      .eq("employment_status", "active")
      .single();

    if (laborInfo) {
      console.log(`🔍 Labor office found: ${laborInfo.labor_offices.office_name}`);

      const directStatus = user.is_active ? "active" : "inactive";
      const parentStatus = laborInfo.labor_offices.office_status;
      const effectiveStatus = parentStatus === "active" ? directStatus : parentStatus;

      const laborRole = activeRoles.find((ur) => ur.roles.role_category === "labor_office");

      return {
        entityType: "labor_office",
        entityStatus: directStatus,
        effectiveStatus: effectiveStatus,
        entityName: laborInfo.labor_offices.office_name,
        roleCategory: "labor_office",
        roleCode: laborRole?.roles.role_code || "LABOR_STAFF",
        message:
          effectiveStatus === "active"
            ? "모든 기능을 이용하실 수 있습니다."
            : parentStatus !== "active"
            ? "노무사 사무실이 비활성화 상태입니다."
            : "계정이 비활성화 상태입니다.",
      };
    }

    // 5. 회사 소속 체크 (부서 배정)
    const { data: departmentInfo } = await queryBuilder
      .select(
        "user_department_assignments",
        `
        assignment_type, is_active,
        departments!inner (
          company_id,
          companies!inner (
            company_name, client_status
          )
        )
      `,
        { useAdmin: true }
      )
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    if (departmentInfo) {
      console.log(
        `🔍 Company found (via department): ${departmentInfo.departments.companies.company_name}`
      );

      const directStatus = user.is_active ? "active" : "inactive";
      const parentStatus = departmentInfo.departments.companies.client_status;
      const effectiveStatus = parentStatus === "active" ? directStatus : parentStatus;

      const companyRole = activeRoles.find((ur) => ur.roles.role_category === "company");

      return {
        entityType: "company",
        entityStatus: directStatus,
        effectiveStatus: effectiveStatus,
        entityName: departmentInfo.departments.companies.company_name,
        roleCategory: "company",
        roleCode: companyRole?.roles.role_code || "COMPANY_HR",
        message:
          effectiveStatus === "active"
            ? "모든 기능을 이용하실 수 있습니다."
            : parentStatus !== "active"
            ? "소속 회사가 비활성화 상태입니다."
            : "계정이 비활성화 상태입니다.",
      };
    }

    // 6. 회사 소속 체크 (직접 배정)
    const { data: companyInfo } = await queryBuilder
      .select(
        "user_company_assignments",
        `
        assignment_type, is_active,
        companies!inner (
          company_name, client_status
        )
      `,
        { useAdmin: true }
      )
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    if (companyInfo) {
      console.log(`🔍 Company found (direct): ${companyInfo.companies.company_name}`);

      const directStatus = user.is_active ? "active" : "inactive";
      const parentStatus = companyInfo.companies.client_status;
      const effectiveStatus = parentStatus === "active" ? directStatus : parentStatus;

      const companyRole = activeRoles.find((ur) => ur.roles.role_category === "company");

      return {
        entityType: "company",
        entityStatus: directStatus,
        effectiveStatus: effectiveStatus,
        entityName: companyInfo.companies.company_name,
        roleCategory: "company",
        roleCode: companyRole?.roles.role_code || "COMPANY_HR",
        message:
          effectiveStatus === "active"
            ? "모든 기능을 이용하실 수 있습니다."
            : parentStatus !== "active"
            ? "소속 회사가 비활성화 상태입니다."
            : "계정이 비활성화 상태입니다.",
      };
    }

    // 7. 기본 사용자 (소속 없음)
    console.log(`🔍 No affiliation found, basic user`);

    const directStatus = user.is_active ? "active" : "inactive";
    const primaryRole = activeRoles[0]; // 첫 번째 활성 역할 사용

    return {
      entityType: "user",
      entityStatus: directStatus,
      effectiveStatus: directStatus,
      entityName: user.name,
      roleCategory: primaryRole?.roles.role_category || "user",
      roleCode: primaryRole?.roles.role_code || "USER",
      message:
        directStatus === "active"
          ? "기본 기능을 이용하실 수 있습니다."
          : "계정이 비활성화 상태입니다.",
    };
  } catch (error) {
    console.error(`❌ Direct calculation error:`, error);
    return {
      entityType: "error",
      entityStatus: "inactive",
      effectiveStatus: "inactive",
      entityName: "Calculation Error",
      roleCategory: "error",
      roleCode: "error",
      message: `상태 계산 실패: ${error.message}`,
    };
  }
}

// GET: 완전한 함수 우회 방식 상태 분석
export async function GET(request, { params }) {
  try {
    const userId = parseInt((await params).userId);
    console.log(
      `🚀 COMPLETE DIRECT CALCULATION: Analyzing user ${userId} without PostgreSQL functions`
    );

    const authResult = await checkSuperAdminAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    // 📊 모든 데이터를 병렬로 조회 (성능 향상)
    const [
      userResult,
      rolesResult,
      laborInfoResult,
      departmentInfoResult,
      companyInfoResult,
      directCalculation,
    ] = await Promise.allSettled([
      // 사용자 기본 정보
      queryBuilder
        .select(
          "users",
          "user_id, username, email, name, is_active, user_status, is_email_verified",
          { useAdmin: true }
        )
        .eq("user_id", userId)
        .single(),

      // 역할 정보
      queryBuilder
        .select(
          "user_roles",
          `
          roles!inner (
            role_code, role_name, role_category
          )
        `,
          { useAdmin: true }
        )
        .eq("user_id", userId)
        .eq("is_active", true),

      // 노무사 사무실 정보
      queryBuilder
        .select(
          "labor_office_staff",
          `
          labor_office_id, position, employment_status,
          labor_offices!inner (
            office_name, office_status
          )
        `,
          { useAdmin: true }
        )
        .eq("user_id", userId),

      // 부서 배정 정보
      queryBuilder
        .select(
          "user_department_assignments",
          `
          assignment_type, is_active,
          departments!inner (
            company_id,
            companies!inner (
              company_name, client_status
            )
          )
        `,
          { useAdmin: true }
        )
        .eq("user_id", userId)
        .eq("is_active", true),

      // 회사 직접 배정 정보
      queryBuilder
        .select(
          "user_company_assignments",
          `
          assignment_type, is_active,
          companies!inner (
            company_name, client_status
          )
        `,
          { useAdmin: true }
        )
        .eq("user_id", userId)
        .eq("is_active", true),

      // 직접 계산으로 엔터티 상태 확인
      calculateEntityStatusDirect(userId),
    ]);

    // 결과 추출 (에러 안전하게)
    const user = userResult.status === "fulfilled" ? userResult.value.data : null;
    const userRoles = rolesResult.status === "fulfilled" ? rolesResult.value.data : [];
    const laborInfo = laborInfoResult.status === "fulfilled" ? laborInfoResult.value.data : [];
    const departmentInfo =
      departmentInfoResult.status === "fulfilled" ? departmentInfoResult.value.data : [];
    const companyInfo =
      companyInfoResult.status === "fulfilled" ? companyInfoResult.value.data : [];
    const entityStatus = directCalculation.status === "fulfilled" ? directCalculation.value : null;

    // 분석 결과 구성
    const analysis = {
      userBasicInfo: {
        id: user?.user_id,
        name: user?.name,
        email: user?.email,
        username: user?.username,
        isActive: user?.is_active,
        userStatus: user?.user_status,
        isEmailVerified: user?.is_email_verified,
      },
      roles: (userRoles || []).map((ur) => ({
        code: ur.roles.role_code,
        name: ur.roles.role_name,
        category: ur.roles.role_category,
      })),
      affiliations: {
        laborOffice: laborInfo?.[0]
          ? {
              id: laborInfo[0].labor_office_id,
              name: laborInfo[0].labor_offices.office_name,
              position: laborInfo[0].position,
              employmentStatus: laborInfo[0].employment_status,
              officeStatus: laborInfo[0].labor_offices.office_status,
            }
          : null,
        company: departmentInfo?.[0]
          ? {
              name: departmentInfo[0].departments.companies.company_name,
              assignmentType: departmentInfo[0].assignment_type,
              clientStatus: departmentInfo[0].departments.companies.client_status,
              source: "department_assignment",
            }
          : companyInfo?.[0]
          ? {
              name: companyInfo[0].companies.company_name,
              assignmentType: companyInfo[0].assignment_type,
              clientStatus: companyInfo[0].companies.client_status,
              source: "direct_assignment",
            }
          : null,
      },
      directCalculationResult: entityStatus,
      calculationMethod: "COMPLETE_DIRECT_QUERY_BYPASS",
      queryResults: {
        userQuery: userResult.status === "fulfilled" ? "success" : "failed",
        rolesQuery: rolesResult.status === "fulfilled" ? "success" : "failed",
        laborQuery: laborInfoResult.status === "fulfilled" ? "success" : "failed",
        departmentQuery: departmentInfoResult.status === "fulfilled" ? "success" : "failed",
        companyQuery: companyInfoResult.status === "fulfilled" ? "success" : "failed",
        calculationQuery: directCalculation.status === "fulfilled" ? "success" : "failed",
      },
    };

    console.log(`✅ COMPLETE DIRECT CALCULATION SUCCESS for user ${userId}:`, entityStatus);

    return NextResponse.json({
      success: true,
      message: "Complete direct calculation completed (bypassing ALL PostgreSQL functions)",
      user: {
        id: userId,
        name: user?.name,
        email: user?.email,
        username: user?.username,
      },
      analysis: analysis,
      timestamp: new Date().toISOString(),
      systemUsed: "COMPLETE_DIRECT_BYPASS",
      rawQueries: [
        {
          query: "User Basic Info",
          result: user,
          error: userResult.status === "rejected" ? userResult.reason?.message : null,
        },
        {
          query: "User Roles",
          result: userRoles,
          error: rolesResult.status === "rejected" ? rolesResult.reason?.message : null,
        },
        {
          query: "Labor Office Info",
          result: laborInfo,
          error: laborInfoResult.status === "rejected" ? laborInfoResult.reason?.message : null,
        },
        {
          query: "Department Info",
          result: departmentInfo,
          error:
            departmentInfoResult.status === "rejected"
              ? departmentInfoResult.reason?.message
              : null,
        },
        {
          query: "Company Info",
          result: companyInfo,
          error: companyInfoResult.status === "rejected" ? companyInfoResult.reason?.message : null,
        },
        {
          query: "Direct Entity Calculation",
          result: entityStatus,
          error: directCalculation.status === "rejected" ? directCalculation.reason?.message : null,
        },
      ],
    });
  } catch (error) {
    console.error("❌ COMPLETE DIRECT CALCULATION API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Complete direct calculation failed",
        details: error.message,
        systemUsed: "COMPLETE_DIRECT_BYPASS",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
