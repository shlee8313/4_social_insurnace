// 📁 app/api/super-admin/users/simple/route.js (퇴사자 처리 완전 개선 버전)
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { queryBuilder } from "@/lib/database";

/**
 * 🛡️ 안전한 최적화 버전 - 기존 로직 + 성능 개선 + 퇴사자 처리 개선
 */

// SUPER_ADMIN 권한 체크 함수 (기존과 동일)
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
      return { success: false, error: "No token provided" };
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
      return { success: false, error: "Insufficient permissions - SUPER_ADMIN required" };
    }

    return { success: true, userId: decoded.userId, username: decoded.username };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 🚀 완전 개선된 소속 정보 조회 (퇴사자 우선 처리)
async function getUserAffiliationInfoOptimized(userId, userStatus) {
  try {
    // 🔧 핵심 개선: terminated 사용자는 다른 소속과 관계없이 "퇴사자"로 표시
    if (userStatus === "terminated") {
      console.log(`🔧 User ${userId} is terminated - returning terminated affiliation`);
      return {
        affiliationType: "terminated",
        affiliationName: "퇴사자",
        affiliationId: null,
        position: null,
        status: "terminated",
        details: "퇴사 처리됨",
      };
    }

    // 🔧 노무사 사무실 소속 확인 (active만 조회)
    const { data: laborOfficeInfo } = await queryBuilder
      .select(
        "labor_office_staff",
        `
        labor_office_id,
        position,
        employment_status,
        labor_offices (
          office_name,
          office_status
        )
      `,
        { useAdmin: true }
      )
      .eq("user_id", userId)
      .eq("employment_status", "active") // ✅ active만 조회 (terminated는 이미 위에서 처리됨)
      .single();

    if (laborOfficeInfo && laborOfficeInfo.labor_offices) {
      return {
        affiliationType: "labor_office",
        affiliationName: laborOfficeInfo.labor_offices.office_name,
        affiliationId: laborOfficeInfo.labor_office_id,
        position: laborOfficeInfo.position,
        status: laborOfficeInfo.labor_offices.office_status,
        details: `${laborOfficeInfo.labor_offices.office_name} - ${laborOfficeInfo.position}`,
      };
    }

    // 🔧 회사 부서 배정 확인 (active만 조회)
    const { data: deptInfo } = await queryBuilder
      .select(
        "user_department_assignments",
        `
        assignment_type,
        is_active,
        departments (
          department_name,
          companies (
            company_id,
            company_name,
            client_status
          )
        )
      `,
        { useAdmin: true }
      )
      .eq("user_id", userId)
      .eq("is_active", true) // ✅ active만 조회
      .single();

    if (deptInfo && deptInfo.departments && deptInfo.departments.companies) {
      return {
        affiliationType: "company",
        affiliationName: deptInfo.departments.companies.company_name,
        affiliationId: deptInfo.departments.companies.company_id,
        position: deptInfo.assignment_type,
        status: deptInfo.departments.companies.client_status,
        details: `${deptInfo.departments.companies.company_name} - ${deptInfo.departments.department_name}`,
      };
    }

    // 🔧 회사 직접 배정 확인 (active만 조회)
    const { data: companyInfo } = await queryBuilder
      .select(
        "user_company_assignments",
        `
        assignment_type,
        is_active,
        companies (
          company_id,
          company_name,
          client_status
        )
      `,
        { useAdmin: true }
      )
      .eq("user_id", userId)
      .eq("is_active", true) // ✅ active만 조회
      .single();

    if (companyInfo && companyInfo.companies) {
      return {
        affiliationType: "company",
        affiliationName: companyInfo.companies.company_name,
        affiliationId: companyInfo.companies.company_id,
        position: companyInfo.assignment_type,
        status: companyInfo.companies.client_status,
        details: `${companyInfo.companies.company_name} - ${companyInfo.assignment_type}`,
      };
    }

    // 🔧 소속 정보 없음 → "시스템 사용자"로 표시
    return {
      affiliationType: "none",
      affiliationName: "소속 없음",
      affiliationId: null,
      position: null,
      status: null,
      details: "시스템 사용자",
    };
  } catch (error) {
    console.error(`❌ Error fetching affiliation for user ${userId}:`, error);
    return {
      affiliationType: "unknown",
      affiliationName: "확인 불가",
      affiliationId: null,
      position: null,
      status: null,
      details: "소속 정보 확인 실패",
    };
  }
}

// 🚀 수정된 엔터티 상태 계산 (퇴사자 처리 개선)
function calculateEntityStatus(user, affiliation, roles) {
  try {
    // 🔧 핵심 개선: 퇴사자는 바로 terminated 반환
    if (user.user_status === "terminated") {
      console.log(`🔧 User ${user.user_id} is terminated - returning terminated entity status`);
      return {
        entityType: "user",
        entityStatus: "terminated",
        effectiveStatus: "terminated",
        entityName: user.name,
        roleCategory: "terminated",
        roleCode: "TERMINATED",
        statusMessage: "퇴사 처리된 사용자입니다.",
      };
    }

    // ✅ 활성 역할만 필터링
    const activeRoles = roles.filter((role) => role.isActive);

    // SUPER_ADMIN인 경우
    if (activeRoles.some((role) => role.code === "SUPER_ADMIN")) {
      return {
        entityType: "system",
        entityStatus: "active",
        effectiveStatus: "active",
        entityName: "System Administrator",
        roleCategory: "system",
        roleCode: "SUPER_ADMIN",
        statusMessage: "시스템 관리자 권한으로 모든 기능에 접근 가능합니다.",
      };
    }

    // 🚀 노무사 사무실 직원 - 역할별 구분 추가
    if (affiliation.affiliationType === "labor_office") {
      const directStatus = user.is_active ? "active" : "inactive";
      const parentStatus = affiliation.status; // office_status

      // 🎯 계층적 상태: 부모가 비활성이면 자식도 비활성
      const effectiveStatus = parentStatus === "active" ? directStatus : parentStatus;

      // 🚀 핵심 수정: 역할에 따른 entityType 결정
      const isLaborAdmin = activeRoles.some((role) => role.code === "LABOR_ADMIN");
      const entityType = isLaborAdmin ? "labor_office_admin" : "user";

      return {
        entityType: entityType, // ✅ LABOR_ADMIN → "labor_office_admin", LABOR_STAFF → "user"
        entityStatus: directStatus,
        effectiveStatus: effectiveStatus,
        entityName: affiliation.affiliationName,
        roleCategory: "labor_office",
        roleCode: activeRoles[0]?.code || "LABOR_STAFF",
        statusMessage:
          effectiveStatus === "active"
            ? "모든 기능을 이용하실 수 있습니다."
            : parentStatus !== "active"
            ? "노무사 사무실이 비활성화 상태입니다."
            : "계정이 비활성화 상태입니다.",
      };
    }

    // 🚀 회사 직원 - 역할별 구분 추가
    if (affiliation.affiliationType === "company") {
      const directStatus = user.is_active ? "active" : "inactive";
      const parentStatus = affiliation.status; // client_status

      // 🎯 계층적 상태: 부모가 비활성이면 자식도 비활성
      const effectiveStatus = parentStatus === "active" ? directStatus : parentStatus;

      // 🚀 핵심 수정: 역할에 따른 entityType 결정
      const isCompanyAdmin = activeRoles.some((role) => role.code === "COMPANY_ADMIN");
      const entityType = isCompanyAdmin ? "company_admin" : "user";

      return {
        entityType: entityType, // ✅ COMPANY_ADMIN → "company_admin", COMPANY_HR → "user"
        entityStatus: directStatus,
        effectiveStatus: effectiveStatus,
        entityName: affiliation.affiliationName,
        roleCategory: "company",
        roleCode: activeRoles[0]?.code || "COMPANY_HR",
        statusMessage:
          effectiveStatus === "active"
            ? "모든 기능을 이용하실 수 있습니다."
            : parentStatus !== "active"
            ? "소속 회사가 비활성화 상태입니다."
            : "계정이 비활성화 상태입니다.",
      };
    }

    // 🔧 퇴사자는 별도 처리 (이미 위에서 처리되지만 안전장치)
    if (affiliation.affiliationType === "terminated") {
      return {
        entityType: "user",
        entityStatus: "terminated",
        effectiveStatus: "terminated",
        entityName: user.name,
        roleCategory: "terminated",
        roleCode: "TERMINATED",
        statusMessage: "퇴사 처리된 사용자입니다.",
      };
    }

    // 소속 없는 사용자
    return {
      entityType: "user",
      entityStatus: user.is_active ? "active" : "inactive",
      effectiveStatus: user.is_active ? "active" : "inactive",
      entityName: user.name,
      roleCategory: activeRoles[0]?.category || "user",
      roleCode: activeRoles[0]?.code || "USER",
      statusMessage: user.is_active
        ? "기본 기능을 이용하실 수 있습니다."
        : "계정이 비활성화 상태입니다.",
    };
  } catch (error) {
    console.error(`❌ Error calculating entity status:`, error);
    return {
      entityType: "unknown",
      entityStatus: "inactive",
      effectiveStatus: "inactive",
      entityName: "Error",
      roleCategory: "unknown",
      roleCode: "unknown",
      statusMessage: "상태 계산 실패",
    };
  }
}

// GET: 🚀 안전한 최적화 버전 (퇴사자 처리 개선)
export async function GET(request) {
  try {
    console.log("🛡️ SAFE OPTIMIZED API: Getting all users (with terminated support)");

    const authResult = await checkSuperAdminAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    // 🚀 기본 사용자 목록 조회 (user_status 포함)
    const { data: users, error } = await queryBuilder
      .select(
        "users",
        `
        user_id, username, email, name, phone_number, 
        is_active, user_status, is_email_verified, created_at, 
        last_login, login_count, failed_login_attempts,
        locked_until, verification_attempts, verification_sent_at
      `,
        { useAdmin: true }
      )
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    console.log(`📊 Retrieved ${users?.length || 0} users, processing...`);

    // 🚀 사용자별 정보 처리 (퇴사자 개선)
    const processedUsers = await Promise.all(
      (users || []).map(async (user) => {
        try {
          // 🔧 수정된 역할 정보 조회 - 비활성 역할도 포함하고 is_active 정보 포함
          const { data: userRoles } = await queryBuilder
            .select(
              "user_roles",
              `
              is_active,
              roles (
                role_code, 
                role_name, 
                role_category
              )
            `,
              { useAdmin: true }
            )
            .eq("user_id", user.user_id);

          const roles = (userRoles || []).map((ur) => ({
            code: ur.roles.role_code,
            name: ur.roles.role_name,
            category: ur.roles.role_category,
            isActive: ur.is_active, // 🔧 추가: 역할 활성 상태 포함
          }));

          // 🔧 개선된 소속 정보 조회 (user_status 전달)
          const affiliation = await getUserAffiliationInfoOptimized(user.user_id, user.user_status);

          // 🎯 엔터티 상태 직접 계산 (퇴사자 처리 개선)
          const entityStatus = calculateEntityStatus(user, affiliation, roles);

          // 🔍 디버깅: 정미영 사용자 로깅
          if (user.name === "정미영") {
            console.log(`🔍 DEBUG 정미영 처리 결과:`, {
              userIsActive: user.is_active,
              userStatus: user.user_status,
              affiliationType: affiliation.affiliationType,
              affiliationName: affiliation.affiliationName,
              entityStatus: entityStatus.entityStatus,
              effectiveStatus: entityStatus.effectiveStatus,
              roleCategory: entityStatus.roleCategory,
              allRoles: roles.map((r) => ({ code: r.code, isActive: r.isActive })),
            });
          }

          return {
            id: user.user_id,
            username: user.username,
            email: user.email,
            name: user.name,
            phoneNumber: user.phone_number,
            isActive: user.is_active,
            userStatus: user.user_status, // 🔧 추가: user_status 포함
            isEmailVerified: user.is_email_verified,
            createdAt: user.created_at,
            lastLogin: user.last_login,
            loginCount: user.login_count || 0,
            failedLoginAttempts: user.failed_login_attempts || 0,
            lockedUntil: user.locked_until,
            verificationAttempts: user.verification_attempts || 0,
            verificationSentAt: user.verification_sent_at,
            roles: roles, // 🔧 수정: 모든 역할 포함 (활성/비활성 구분 가능)
            affiliation: affiliation,
            entityStatus: entityStatus,
          };
        } catch (userError) {
          console.error(`❌ Error processing user ${user.user_id}:`, userError);
          return {
            id: user.user_id,
            username: user.username,
            email: user.email,
            name: user.name,
            phoneNumber: user.phone_number,
            isActive: user.is_active,
            userStatus: user.user_status, // 🔧 추가: user_status 포함
            isEmailVerified: user.is_email_verified,
            createdAt: user.created_at,
            lastLogin: user.last_login,
            loginCount: user.login_count || 0,
            failedLoginAttempts: user.failed_login_attempts || 0,
            lockedUntil: user.locked_until,
            verificationAttempts: user.verification_attempts || 0,
            verificationSentAt: user.verification_sent_at,
            roles: [], // 🔧 에러 시 빈 배열
            affiliation: {
              affiliationType: "error",
              affiliationName: "확인 실패",
              affiliationId: null,
              position: null,
              status: null,
              details: "정보 로딩 실패",
            },
            entityStatus: {
              entityType: "unknown",
              entityStatus: "inactive",
              effectiveStatus: "inactive",
              entityName: "Error",
              roleCategory: "unknown",
              roleCode: "unknown",
              statusMessage: "상태 확인 실패",
            },
          };
        }
      })
    );

    console.log(`✅ SAFE OPTIMIZED API: Processed ${processedUsers.length} users successfully`);

    return NextResponse.json({
      success: true,
      users: processedUsers,
      total: processedUsers.length,
      optimized: true,
      safe: true, // 안전한 버전임을 표시
      includeInactiveRoles: true, // 🔧 추가: 비활성 역할 포함됨을 표시
      terminatedSupport: true, // 🔧 추가: 퇴사자 처리 개선됨을 표시
    });
  } catch (error) {
    console.error("❌ SAFE OPTIMIZED API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users (safe optimized)", details: error.message },
      { status: 500 }
    );
  }
}
