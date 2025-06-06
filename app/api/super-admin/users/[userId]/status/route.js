// 📁 app/api/super-admin/users/[userId]/status/route.js (퇴사일자/사유 저장 개선 버전)
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { queryBuilder } from "@/lib/database";

/**
 * 🛡️ 통합 엔터티 상태 관리 시스템 + 퇴사일자/사유 저장 개선
 * - PostgreSQL 함수 기반 안전한 상태 변경
 * - 사용자 컨텍스트 설정으로 권한 문제 해결
 * - 🔧 퇴사자 소속 표시 완전 개선 (terminated 우선 처리)
 * - 🆕 termination_date, termination_reason 저장 추가
 * - Fallback 처리 강화
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
async function getUserAffiliationInfoOptimized(userId) {
  try {
    // 🔧 먼저 users.user_status 확인
    const { data: user } = await queryBuilder
      .select("users", "user_status", { useAdmin: true })
      .eq("user_id", userId)
      .single();

    // 🔧 terminated 사용자는 다른 소속과 관계없이 "퇴사자"로 표시
    if (user?.user_status === "terminated") {
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
        details: `${deptInfo.departments.companies.company_name} - ${deptInfo.assignment_type}`,
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

// 🚀 직접 엔터티 상태 계산 (역할 기반 entityType 결정) - 개선된 버전
function calculateCurrentEntityStatus(user, affiliation, roles) {
  try {
    // 🔧 핵심 개선: 퇴사자는 바로 terminated 반환
    if (user.user_status === "terminated") {
      console.log(`🔧 User ${user.user_id} is terminated - returning terminated entity status`);
      return {
        entityType: "user",
        currentStatus: "terminated",
        effectiveStatus: "terminated",
        entityName: user.name,
        roleCategory: "terminated",
      };
    }

    // ✅ 이 줄을 맨 앞에 추가
    const activeRoles = roles.filter((role) => role.isActive);

    // SUPER_ADMIN인 경우
    if (activeRoles.some((role) => role.code === "SUPER_ADMIN")) {
      return {
        entityType: "system",
        currentStatus: "active",
        effectiveStatus: "active",
        entityName: "System Administrator",
        roleCategory: "system",
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
        currentStatus: directStatus,
        effectiveStatus: effectiveStatus,
        entityName: affiliation.affiliationName,
        roleCategory: "labor_office",
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
        currentStatus: directStatus,
        effectiveStatus: effectiveStatus,
        entityName: affiliation.affiliationName,
        roleCategory: "company",
      };
    }

    // 🔧 퇴사자는 별도 처리 (이미 위에서 처리되지만 안전장치)
    if (affiliation.affiliationType === "terminated") {
      return {
        entityType: "user",
        currentStatus: "terminated",
        effectiveStatus: "terminated",
        entityName: user.name,
        roleCategory: "terminated",
      };
    }

    // 소속 없는 사용자
    return {
      entityType: "user",
      currentStatus: user.is_active ? "active" : "inactive",
      effectiveStatus: user.is_active ? "active" : "inactive",
      entityName: user.name,
      roleCategory: "user",
    };
  } catch (error) {
    console.error(`❌ Error calculating entity status:`, error);
    return {
      entityType: "unknown",
      currentStatus: "inactive",
      effectiveStatus: "inactive",
      entityName: "Error",
      roleCategory: "unknown",
    };
  }
}

// 🔍 영향받는 엔터티 조회 (terminated 보호 강화)
async function getAffectedEntities(userId, currentEntityType, newStatus) {
  try {
    const affectedEntities = [];

    // 🚀 노무사 대표만 계층적 영향 분석
    if (currentEntityType === "labor_office_admin") {
      console.log(`🔍 Processing labor_office_admin impact for user ${userId}`);

      // 같은 노무사 사무실의 다른 직원들만 조회 (terminated 제외)
      const { data: userInfo } = await queryBuilder
        .select("labor_office_staff", "labor_office_id", { useAdmin: true })
        .eq("user_id", userId)
        .eq("employment_status", "active")
        .single();

      if (userInfo?.labor_office_id) {
        const { data: colleagueStaff } = await queryBuilder
          .select(
            "labor_office_staff",
            `
            users (
              user_id,
              name,
              email,
              user_status
            ),
            position
          `,
            { useAdmin: true }
          )
          .eq("labor_office_id", userInfo.labor_office_id)
          .eq("employment_status", "active")
          .neq("user_id", userId);

        for (const staff of colleagueStaff || []) {
          if (staff.users) {
            // 🔧 terminated 사용자는 영향 분석에서 제외
            if (staff.users.user_status === "terminated") {
              console.log(`🚫 Excluding terminated user from impact analysis: ${staff.users.name}`);
              continue;
            }

            affectedEntities.push({
              type: "user",
              id: staff.users.user_id,
              name: staff.users.name,
              email: staff.users.email,
              currentRole: staff.position || "직원",
              impactType: "direct_employee",
              currentStatus: staff.users.user_status, // 현재 상태 추가
            });
          }
        }
      }
    }
    // 🚀 회사 대표만 계층적 영향 분석
    else if (currentEntityType === "company_admin") {
      console.log(`🔍 Processing company_admin impact for user ${userId}`);

      // 담당 회사의 근로자들 조회 (terminated 제외)
      const { data: userCompanyInfo } = await queryBuilder
        .select("user_company_assignments", "company_id", { useAdmin: true })
        .eq("user_id", userId)
        .eq("assignment_type", "primary")
        .eq("is_active", true)
        .single();

      if (userCompanyInfo?.company_id) {
        // 🔧 수정: workers와 users를 proper JOIN으로 연결하고 terminated 제외
        const { data: workers } = await queryBuilder
          .select(
            "workers",
            `
            worker_id, 
            name, 
            position,
            users (
              user_id,
              user_status,
              email
            )
          `,
            { useAdmin: true }
          )
          .eq("company_id", userCompanyInfo.company_id)
          .eq("employment_status", "active")
          .not("user_id", "is", null) // user_id가 있는 workers만
          .limit(20);

        for (const worker of workers || []) {
          if (worker.users) {
            // 🔧 terminated 사용자는 영향 분석에서 제외
            if (worker.users.user_status === "terminated") {
              console.log(`🚫 Excluding terminated worker from impact analysis: ${worker.name}`);
              continue;
            }

            affectedEntities.push({
              type: "worker",
              id: worker.worker_id,
              name: worker.name,
              currentRole: worker.position || "근로자",
              impactType: "company_employee",
              currentStatus: worker.users.user_status, // 현재 상태 추가
              email: worker.users.email,
            });
          }
        }
      }
    }
    // 🚀 일반 사용자는 영향 없음
    else if (currentEntityType === "user") {
      console.log(`🔍 Individual user impact: no cascade effects for user ${userId}`);
      // 개별 사용자는 다른 엔터티에 영향을 주지 않음
      // affectedEntities 배열은 비어있음
    }
    // 🚀 시스템 관리자는 변경 불가
    else if (currentEntityType === "system") {
      console.log(`🔍 System admin: status change not allowed for user ${userId}`);
      // 시스템 관리자는 상태 변경 자체가 불가능
    } else {
      console.log(`🔍 Unknown entity type ${currentEntityType} for user ${userId}`);
    }

    console.log(`🔍 Total affected entities (excluding terminated): ${affectedEntities.length}`);
    return affectedEntities;
  } catch (error) {
    console.error("❌ Error getting affected entities:", error);
    return [];
  }
}

// GET: 영향 분석 (퇴사자 처리 개선)
export async function GET(request, { params }) {
  try {
    const { userId } = await params;
    const url = new URL(request.url);
    const requestedStatus = url.searchParams.get("status");

    console.log(`🔍 STATUS API: Analyzing impact for user ${userId} → ${requestedStatus}`);

    const authResult = await checkSuperAdminAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    // 🚀 사용자 정보 직접 조회
    const { data: user } = await queryBuilder
      .select("users", "user_id, username, email, name, is_active, user_status", { useAdmin: true })
      .eq("user_id", userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 🚀 역할 정보 조회
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
      .eq("user_id", userId);

    const roles = (userRoles || []).map((ur) => ({
      code: ur.roles.role_code,
      name: ur.roles.role_name,
      category: ur.roles.role_category,
      isActive: ur.is_active, // 🔧 추가: 역할 활성 상태
    }));

    // 🔧 개선된 소속 정보 조회 (terminated 우선 처리)
    const affiliation = await getUserAffiliationInfoOptimized(userId);

    // 🚀 현재 상태 직접 계산
    const rolesToUse =
      requestedStatus === "active" && !user.is_active
        ? roles.map((role) => ({ ...role, isActive: true })) // 🚀 모든 역할을 활성으로 간주
        : roles; // 기존 로직 유지

    // 🚀 현재 상태 직접 계산 (수정된 roles 사용)
    const currentEntityInfo = calculateCurrentEntityStatus(user, affiliation, rolesToUse);

    // 🔍 디버깅: 야해마트의 경우 상세 로깅
    if (user.name === "야해마트") {
      console.log(`🔍 DEBUG 야해마트 상태 분석:`, {
        userIsActive: user.is_active,
        userStatus: user.user_status,
        affiliationType: affiliation.affiliationType,
        affiliationStatus: affiliation.status,
        currentStatus: currentEntityInfo.currentStatus,
        effectiveStatus: currentEntityInfo.effectiveStatus,
        requestedStatus: requestedStatus,
      });
    }

    // 🎯 중요: 효과적 상태 기준으로 비교
    const currentStatus = currentEntityInfo.effectiveStatus;

    // 요청된 상태와 현재 상태가 같은 경우
    if (currentStatus === requestedStatus) {
      console.log(`⚠️ User ${userId} is already ${requestedStatus}`);
      return NextResponse.json({
        success: false,
        canChange: false,
        reason: `이미 ${requestedStatus} 상태입니다.`,
        entityInfo: {
          ...currentEntityInfo,
          currentStatus: currentStatus, // 효과적 상태 반환
        },
      });
    }

    // 🚀 퇴사자 관련 특수 처리
    if (currentStatus === "terminated") {
      // 퇴사자는 terminated → active/inactive만 가능 (복구)
      if (requestedStatus === "terminated") {
        return NextResponse.json({
          success: false,
          canChange: false,
          reason: "이미 퇴사 처리된 사용자입니다.",
          entityInfo: currentEntityInfo,
        });
      }
      // 복구 가능
    } else if (requestedStatus === "terminated") {
      // 일반 사용자 → terminated (퇴사 처리)
      // 별도 영향 분석 필요
    }

    // 시스템 관리자는 상태 변경 불가
    if (currentEntityInfo.roleCategory === "system") {
      return NextResponse.json({
        success: false,
        canChange: false,
        reason: "시스템 관리자의 상태는 변경할 수 없습니다.",
        entityInfo: currentEntityInfo,
      });
    }

    // 영향받는 엔터티 조회
    const affectedEntities = await getAffectedEntities(
      userId,
      currentEntityInfo.entityType,
      requestedStatus
    );

    const impactSummary = {
      users: affectedEntities.filter((e) => e.type === "user").length,
      companies: affectedEntities.filter((e) => e.type === "company").length,
      workers: affectedEntities.filter((e) => e.type === "worker").length,
    };

    console.log(`✅ STATUS API: Analysis complete for user ${userId}`);

    return NextResponse.json({
      success: true,
      canChange: true,
      entityInfo: currentEntityInfo,
      impact: {
        totalAffected: affectedEntities.length,
        affectedEntities: affectedEntities,
        impactSummary: impactSummary,
      },
      // 🚀 추가: 퇴사자 관련 정보
      isTerminatedUser: currentStatus === "terminated",
      isTerminationRequest: requestedStatus === "terminated",
      isRestoreRequest: currentStatus === "terminated" && requestedStatus !== "terminated",
    });
  } catch (error) {
    console.error("❌ STATUS API Error:", error);
    return NextResponse.json(
      { error: "Failed to analyze status impact", details: error.message },
      { status: 500 }
    );
  }
}

// POST: 🚀 퇴사자 처리 개선된 상태 변경 실행 + 퇴사일자/사유 저장
export async function POST(request, { params }) {
  try {
    const { userId } = await params;
    const body = await request.json();
    const { status: newStatus, reason, confirm, effectiveDate, isRestore } = body;

    console.log(`🔄 Status change request: user ${userId} → ${newStatus}`, {
      isRestore,
      reason: reason ? `"${reason.substring(0, 50)}..."` : "없음",
      confirm,
      effectiveDate,
    });

    // 1. 권한 확인
    const authResult = await checkSuperAdminAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    // 2. 기본 검증 강화
    if (!confirm) {
      return NextResponse.json(
        {
          success: false,
          error: "확인이 필요합니다.",
          code: "CONFIRMATION_REQUIRED",
        },
        { status: 400 }
      );
    }

    if (!["active", "inactive", "terminated"].includes(newStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `잘못된 상태입니다: ${newStatus}`,
          code: "INVALID_STATUS",
        },
        { status: 400 }
      );
    }

    // 3. 사용자 확인
    const { data: user, error: userError } = await queryBuilder
      .select("users", "user_id, username, name, is_active, user_status", { useAdmin: true })
      .eq("user_id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 🚀 추가: 퇴사자 복구 로직 강화
    if (isRestore && user.user_status === "terminated") {
      console.log(`🔄 Processing restore request: ${user.name} → ${newStatus}`);

      // 복구 요청 validation
      if (newStatus === "terminated") {
        return NextResponse.json(
          {
            success: false,
            error: "복구 요청에서는 terminated 상태로 변경할 수 없습니다.",
          },
          { status: 400 }
        );
      }

      // 복구 사유 필수 (최소 2자로 완화)
      if (!reason || reason.trim().length < 2) {
        return NextResponse.json(
          {
            success: false,
            error: "복구 사유를 최소 2자 이상 입력해주세요.",
          },
          { status: 400 }
        );
      }

      console.log(`✅ Restore validation passed for ${user.name}`);
    }

    // 🚀 추가: 퇴사 처리 로직
    if (newStatus === "terminated" && user.user_status !== "terminated") {
      console.log(`🔄 Processing termination request: ${user.name}`);

      // 퇴사 사유 필수
      if (!reason || reason.trim().length < 2) {
        return NextResponse.json(
          {
            error: "퇴사 사유를 최소 2자 이상 입력해주세요.",
          },
          { status: 400 }
        );
      }

      // 퇴사 일자 검증
      if (effectiveDate) {
        const effDate = new Date(effectiveDate);
        const now = new Date();
        if (effDate > now) {
          console.log(`⚠️ Future termination date: ${effectiveDate}`);
        }
      }
    }

    // 4. 현재 user_roles 상태 확인 (디버깅용)
    const { data: currentRoles } = await queryBuilder
      .select("user_roles", "user_role_id, role_id, is_active", { useAdmin: true })
      .eq("user_id", userId);

    console.log(`🔍 Current user_roles for user ${userId}:`, currentRoles);

    // 5. PostgreSQL 함수 시도
    try {
      console.log(`🔄 Trying PostgreSQL functions...`);

      // 🚀 사용자 컨텍스트 설정
      const { error: contextError } = await queryBuilder.rpc(
        "set_current_user_context",
        { p_user_id: parseInt(authResult.userId) },
        { useAdmin: true }
      );

      if (contextError) {
        throw new Error(`Context failed: ${contextError.message}`);
      }

      // ✅ 새로운 코드 - JavaScript에서 직접 entityType 결정
      // 🔍 역할 정보 조회 (모든 역할 포함)
      const { data: userRoles } = await queryBuilder
        .select("user_roles", `is_active, roles (role_code, role_name, role_category)`, {
          useAdmin: true,
        })
        .eq("user_id", userId);

      const roles = (userRoles || []).map((ur) => ({
        code: ur.roles.role_code,
        name: ur.roles.role_name,
        category: ur.roles.role_category,
        isActive: ur.is_active,
      }));

      console.log(`🔍 All roles for user ${userId}:`, roles);

      // 🔍 소속 정보 조회
      const { data: laborOfficeData } = await queryBuilder
        .select("labor_office_staff", "labor_office_id, employment_status", { useAdmin: true })
        .eq("user_id", userId)
        .single();

      const { data: companyData } = await queryBuilder
        .select("user_company_assignments", "company_id, assignment_type, is_active", {
          useAdmin: true,
        })
        .eq("user_id", userId)
        .eq("assignment_type", "primary")
        .single();

      // 🎯 JavaScript에서 직접 entityType 결정
      let finalEntityType = "user"; // 기본값

      // 🚀 핵심 수정: 복구 요청이거나 활성화 요청이고 비활성 사용자라면 모든 역할 고려
      const rolesToCheck =
        (newStatus === "active" && !user.is_active) || isRestore
          ? roles // 활성화 또는 복구 요청 시: 모든 역할 고려 (비활성 역할도 포함)
          : roles.filter((role) => role.isActive); // 기타 요청 시: 활성 역할만 고려

      console.log(
        `🔍 Roles to check for entity type:`,
        rolesToCheck.map((r) => `${r.code}(${r.isActive ? "active" : "inactive"})`)
      );

      // 🔍 노무사 관리자 확인
      if (
        rolesToCheck.some((role) => role.code === "LABOR_ADMIN") &&
        laborOfficeData?.labor_office_id
      ) {
        finalEntityType = "labor_office_admin";
        console.log(
          `🎯 Detected as labor_office_admin: office_id=${laborOfficeData.labor_office_id}`
        );
      }
      // 🔍 회사 관리자 확인
      else if (
        rolesToCheck.some((role) => role.code === "COMPANY_ADMIN") &&
        companyData?.company_id
      ) {
        finalEntityType = "company_admin";
        console.log(`🎯 Detected as company_admin: company_id=${companyData.company_id}`);
      }
      // 🔍 시스템 관리자 확인
      else if (
        rolesToCheck.some((role) => role.code === "SUPER_ADMIN" || role.code === "SYSTEM_ADMIN")
      ) {
        finalEntityType = "system";
        console.log(`🎯 Detected as system admin`);
      }

      console.log(`🎯 Final entity type determined: ${finalEntityType}`);

      // 🚀 시스템 관리자는 상태 변경 불가
      if (finalEntityType === "system") {
        return NextResponse.json(
          {
            success: false,
            error: "시스템 관리자의 상태는 변경할 수 없습니다.",
          },
          { status: 403 }
        );
      }

      // 🚀 계층적 전파를 위한 cascade 설정
      const shouldCascade = finalEntityType !== "user"; // 관리자급만 계층적 전파
      console.log(`🔗 Cascade enabled: ${shouldCascade}`);

      // 🚀 확장된 reason 처리
      let finalReason = reason || `Changed by ${authResult.username}`;
      if (newStatus === "terminated" && effectiveDate) {
        finalReason += ` (퇴사일: ${effectiveDate})`;
      }
      if (isRestore) {
        finalReason = `[복구] ${finalReason}`;
      }

      // 🚀 상태 변경 함수 호출 (확장된 버전)
      const { data: result, error: functionError } = await queryBuilder.rpc(
        "smart_set_entity_status",
        {
          p_entity_type: finalEntityType, // ✅ JavaScript에서 결정한 타입 사용
          p_entity_id: parseInt(userId),
          p_new_status: newStatus,
          p_cascade: shouldCascade, // ✅ 계층적 전파 활성화
          p_reason: finalReason,
        },
        { useAdmin: true }
      );

      // 🆕 퇴사일자/사유 별도 저장 (PostgreSQL 함수와 독립적으로)
      if (newStatus === "terminated" || isRestore) {
        console.log(`🗓️ Updating termination data in users table...`);

        const terminationUpdateData = {
          updated_at: new Date().toISOString(),
        };

        if (newStatus === "terminated") {
          // 퇴사 처리 시
          terminationUpdateData.termination_date =
            effectiveDate || new Date().toISOString().split("T")[0];
          terminationUpdateData.termination_reason = reason;
        } else if (isRestore) {
          // 복구 처리 시 - termination 데이터 초기화
          terminationUpdateData.termination_date = null;
          terminationUpdateData.termination_reason = null;
        }

        const { error: terminationUpdateError } = await queryBuilder
          .update("users", terminationUpdateData, { useAdmin: true })
          .eq("user_id", userId);

        if (terminationUpdateError) {
          console.error(`❌ Failed to update termination data:`, terminationUpdateError);
          // 에러가 있어도 메인 처리는 계속 진행
        } else {
          console.log(`✅ Termination data updated successfully`);
        }
      }

      // 컨텍스트 정리
      await queryBuilder.rpc("clear_user_context", {}, { useAdmin: true });

      if (functionError) {
        throw new Error(`Function error: ${functionError.message}`);
      }

      if (!result || !result.success) {
        throw new Error(`Function failed: ${result?.error || "Unknown error"}`);
      }

      console.log(`✅ PostgreSQL function result:`, result);

      // 6. 결과 검증 - user_roles 실제 변경 확인
      const { data: updatedRoles } = await queryBuilder
        .select("user_roles", "user_role_id, role_id, is_active", { useAdmin: true })
        .eq("user_id", userId);

      console.log(`🔍 Updated user_roles for user ${userId}:`, updatedRoles);

      const rolesChanged = updatedRoles?.some(
        (role) => role.is_active === (newStatus === "active")
      );

      // 🚀 결과 메시지 개선 (퇴사/복구 처리 포함)
      let successMessage;
      if (isRestore) {
        successMessage = `사용자가 "${
          newStatus === "active" ? "활성" : "비활성"
        }" 상태로 복구되었습니다.`;
      } else if (newStatus === "terminated") {
        successMessage = `사용자가 퇴사 처리되었습니다.`;
      } else {
        successMessage = `사용자 상태가 ${newStatus}로 변경되었습니다.`;
      }

      if (result.cascade_result && !result.cascade_result.cascade_disabled) {
        const cascadeInfo = result.cascade_result;
        if (finalEntityType === "labor_office_admin") {
          successMessage += ` (노무사 사무실 직원 ${
            cascadeInfo.total_processed || cascadeInfo.users_updated || 0
          }명 함께 변경됨)`;
        } else if (finalEntityType === "company_admin") {
          successMessage += ` (회사 근로자 ${
            cascadeInfo.total_processed || cascadeInfo.workers_updated || 0
          }명 함께 변경됨)`;
        }
      }

      return NextResponse.json({
        success: true,
        message: successMessage,
        method: "enhanced_postgresql_function_with_cascade_js_determined",
        user: {
          id: parseInt(userId),
          username: user.username,
          name: user.name,
          new_status: newStatus,
        },
        entityInfo: {
          entity_type: finalEntityType,
          cascade_enabled: shouldCascade,
          entity_name: result.entity_name || user.name,
          office_name: result.office_name,
          company_name: result.company_name,
          determination_method: "javascript_direct", // 🔧 추가: 결정 방식 표시
        },
        cascadeResults: {
          enabled: shouldCascade,
          result: result.cascade_result || null,
        },
        // 🚀 추가: 특수 처리 정보
        specialProcessing: {
          isRestore: isRestore || false,
          isTermination: newStatus === "terminated",
          effectiveDate: effectiveDate || null,
          previousStatus: user.user_status,
        },
        // 🆕 퇴사 데이터 저장 정보
        terminationData: {
          stored: newStatus === "terminated" || isRestore,
          termination_date:
            newStatus === "terminated"
              ? effectiveDate || new Date().toISOString().split("T")[0]
              : null,
          termination_reason: newStatus === "terminated" ? reason : null,
          cleared_on_restore: isRestore,
        },
        debug: {
          functionResult: result,
          rolesBeforeUpdate: currentRoles,
          rolesAfterUpdate: updatedRoles,
          rolesChanged: rolesChanged,
          usersAffected: result.users_affected || result.admin_users_affected,
          rolesAffected: result.roles_affected,
          allRoles: roles,
          rolesToCheck: rolesToCheck,
          laborOfficeData: laborOfficeData,
          companyData: companyData,
          entityTypeDetermination: {
            user_is_active: user.is_active,
            user_status: user.user_status,
            new_status: newStatus,
            should_check_all_roles: (newStatus === "active" && !user.is_active) || isRestore,
            determined_type: finalEntityType,
          },
        },
        changedBy: authResult.userId,
        changedAt: new Date().toISOString(),
      });
    } catch (functionError) {
      console.log(`❌ PostgreSQL function failed: ${functionError.message}`);
      console.log(`🔄 Using enhanced direct update fallback...`);

      // 7. 강화된 Fallback (기존 코드 유지)
      return await enhancedDirectUpdate(userId, newStatus, reason, authResult, user, {
        isRestore,
        effectiveDate,
      });
    }
  } catch (error) {
    console.error("❌ POST Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Server error",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// 🔧 강화된 Direct Update 함수 (퇴사자 처리 개선 + 퇴사일자/사유 저장)
async function enhancedDirectUpdate(userId, newStatus, reason, authResult, user, options = {}) {
  try {
    const { isRestore, effectiveDate } = options;
    const oldStatus = user.user_status || (user.is_active ? "active" : "inactive");

    if (oldStatus === newStatus) {
      return NextResponse.json(
        {
          success: false,
          error: `이미 ${newStatus} 상태입니다.`,
        },
        { status: 400 }
      );
    }

    console.log(`🔧 Enhanced direct update for user ${userId} (fallback mode)`, {
      isRestore,
      effectiveDate,
      oldStatus,
      newStatus,
    });

    // 1. users 테이블 업데이트 (🆕 퇴사일자/사유 포함)
    const updateData = {
      is_active: newStatus === "active",
      user_status: newStatus,
      updated_at: new Date().toISOString(),
    };

    // 🆕 퇴사 관련 데이터 처리
    if (newStatus === "terminated") {
      updateData.termination_date = effectiveDate || new Date().toISOString().split("T")[0];
      updateData.termination_reason = reason;
    } else if (isRestore) {
      // 복구 시 퇴사 데이터 초기화
      updateData.termination_date = null;
      updateData.termination_reason = null;
    }

    const { data: updatedUser, error: updateError } = await queryBuilder
      .update("users", updateData, { useAdmin: true })
      .eq("user_id", userId)
      .select(
        "user_id, username, name, is_active, user_status, termination_date, termination_reason"
      )
      .single();

    if (updateError) {
      throw new Error(`Users update failed: ${updateError.message}`);
    }

    console.log(`✅ Users table updated:`, updatedUser);

    // 2. user_roles 업데이트 전 현재 상태 확인
    const { data: beforeRoles, error: beforeError } = await queryBuilder
      .select("user_roles", "*", { useAdmin: true })
      .eq("user_id", userId);

    console.log(`🔍 User roles before update:`, beforeRoles);

    // 3. 🔧 user_roles 업데이트 (스키마에 맞게 수정)
    const { data: rolesUpdateResult, error: rolesError } = await queryBuilder
      .update(
        "user_roles",
        {
          is_active: newStatus === "active",
          // updated_at 제거 - 이 테이블에는 없음
          // assigned_at은 역할 배정 시점이므로 수정하지 않음
        },
        { useAdmin: true }
      )
      .eq("user_id", userId)
      .select("user_role_id, user_id, role_id, is_active, assigned_at");

    if (rolesError) {
      console.error(`❌ User roles update error:`, rolesError);

      // 4. 에러 발생시 개별 레코드별로 수동 업데이트 시도
      console.log(`🔧 Attempting individual role updates...`);

      let manualUpdateSuccess = 0;
      let manualUpdateFailed = 0;

      for (const role of beforeRoles || []) {
        try {
          const { error: manualError } = await queryBuilder
            .update("user_roles", { is_active: newStatus === "active" }, { useAdmin: true })
            .eq("user_role_id", role.user_role_id);

          if (manualError) {
            console.error(`❌ Manual update failed for role ${role.user_role_id}:`, manualError);
            manualUpdateFailed++;
          } else {
            console.log(`✅ Manual update success for role ${role.user_role_id}`);
            manualUpdateSuccess++;
          }
        } catch (manualError) {
          console.error(`❌ Manual update exception for role ${role.user_role_id}:`, manualError);
          manualUpdateFailed++;
        }
      }

      console.log(
        `🔧 Manual update results: ${manualUpdateSuccess} success, ${manualUpdateFailed} failed`
      );
    } else {
      console.log(`✅ User roles updated successfully:`, rolesUpdateResult);
    }

    // 5. 최종 상태 검증
    const { data: finalRoles } = await queryBuilder
      .select("user_roles", "*", { useAdmin: true })
      .eq("user_id", userId);

    console.log(`🔍 Final user roles state:`, finalRoles);

    // ⚠️ Fallback 모드에서는 계층적 전파가 없음을 명시
    console.log(`⚠️ Fallback mode: No cascade processing (individual user only)`);

    // 🚀 메시지 개선 (퇴사/복구 처리 포함)
    let successMessage;
    if (isRestore) {
      successMessage = `사용자가 "${
        newStatus === "active" ? "활성" : "비활성"
      }" 상태로 복구되었습니다. (Fallback 모드)`;
    } else if (newStatus === "terminated") {
      successMessage = `사용자가 퇴사 처리되었습니다. (Fallback 모드)`;
    } else {
      successMessage = `사용자 상태가 ${newStatus}로 변경되었습니다. (Fallback 모드)`;
    }

    return NextResponse.json({
      success: true,
      message: successMessage,
      method: "enhanced_direct_update_fallback",
      user: {
        id: updatedUser.user_id,
        username: updatedUser.username,
        name: updatedUser.name,
        is_active: updatedUser.is_active,
        user_status: updatedUser.user_status,
      },
      statusChange: {
        oldStatus: oldStatus,
        newStatus: newStatus,
      },
      cascadeResults: {
        enabled: false,
        reason: "Fallback mode - PostgreSQL function failed",
      },
      // 🚀 추가: 특수 처리 정보
      specialProcessing: {
        isRestore: isRestore || false,
        isTermination: newStatus === "terminated",
        effectiveDate: effectiveDate || null,
        previousStatus: oldStatus,
      },
      // 🆕 퇴사 데이터 저장 정보
      terminationData: {
        stored: true,
        termination_date: updatedUser.termination_date,
        termination_reason: updatedUser.termination_reason,
        cleared_on_restore: isRestore && !updatedUser.termination_date,
      },
      debug: {
        rolesBeforeUpdate: beforeRoles,
        rolesAfterUpdate: finalRoles,
        rolesUpdateError: rolesError?.message || null,
        rolesUpdateResult: rolesUpdateResult,
        schemaInfo: "user_roles table has no updated_at column - using assigned_at only",
        terminationDataUpdate: {
          termination_date: updateData.termination_date,
          termination_reason: updateData.termination_reason,
          was_restore: isRestore,
        },
      },
      changedBy: authResult.userId,
      changedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`❌ Enhanced direct update failed:`, error);
    return NextResponse.json(
      {
        success: false,
        error: "Enhanced update failed",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
