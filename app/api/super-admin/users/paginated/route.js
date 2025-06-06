// 📁 app/api/super-admin/users/paginated/route.js (수정된 페이지네이션 지원 API)
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { queryBuilder } from "@/lib/database";

/**
 * 🚀 수정된 페이지네이션 지원 SUPER_ADMIN 사용자 관리 API
 * - 서버 사이드 페이지네이션
 * - 검색 및 필터링 지원
 * - 성능 최적화
 * - 비활성 역할 포함
 * - Supabase count 이슈 해결
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

// 🚀 개선된 소속 정보 조회
async function getUserAffiliationInfoOptimized(userId) {
  try {
    // 노무사 사무실 소속 확인
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
      .eq("employment_status", "active")
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

    // 회사 부서 배정 확인
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
      .eq("is_active", true)
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

    // 회사 직접 배정 확인
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
      .eq("is_active", true)
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

    // 소속 정보 없음
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

// 🚀 직접 엔터티 상태 계산
function calculateEntityStatus(user, affiliation, roles) {
  try {
    const activeRoles = roles || [];

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

    // 노무사 사무실 직원
    if (affiliation.affiliationType === "labor_office") {
      const directStatus = user.is_active ? "active" : "inactive";
      const parentStatus = affiliation.status;
      const effectiveStatus = parentStatus === "active" ? directStatus : parentStatus;

      return {
        entityType: "labor_office",
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

    // 회사 직원
    if (affiliation.affiliationType === "company") {
      const directStatus = user.is_active ? "active" : "inactive";
      const parentStatus = affiliation.status;
      const effectiveStatus = parentStatus === "active" ? directStatus : parentStatus;

      return {
        entityType: "company",
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

    // 소속 없는 사용자
    return {
      entityType: "user",
      entityStatus: user.is_active ? "active" : "inactive",
      effectiveStatus: user.is_active ? "active" : "inactive",
      entityName: user.name,
      roleCategory: activeRoles[0]?.category || "unknown",
      roleCode: activeRoles[0]?.code || "unknown",
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

// 🆕 검색 및 필터링을 위한 쿼리 조건 구성
function buildWhereConditions(searchTerm, statusFilter) {
  const conditions = [];

  // 🔍 검색 조건 추가
  if (searchTerm && searchTerm.trim()) {
    const searchPattern = `%${searchTerm.trim().toLowerCase()}%`;
    conditions.push(
      `(name.ilike.${searchPattern},email.ilike.${searchPattern},username.ilike.${searchPattern})`
    );
  }

  // 🔍 상태 필터 추가
  if (statusFilter && statusFilter !== "all") {
    switch (statusFilter) {
      case "active":
        conditions.push("is_active.eq.true");
        break;
      case "inactive":
        conditions.push("is_active.eq.false");
        break;
      case "unverified":
        conditions.push("is_email_verified.eq.false");
        break;
      // terminated는 엔터티 수준에서 처리해야 하므로 여기서는 제외
    }
  }

  return conditions;
}

// 🆕 역할 필터링을 위한 사용자 ID 조회
async function getUserIdsByRoleFilter(roleFilter) {
  if (!roleFilter || roleFilter === "all") {
    return null; // 모든 사용자
  }

  try {
    const { data: userRoleData } = await queryBuilder
      .select("user_roles", `user_id`, { useAdmin: true })
      .eq("is_active", true) // 활성 역할만
      .in("role_id", [
        // 역할 코드를 역할 ID로 변환하는 서브쿼리 필요
        // 일단 단순화해서 처리
      ]);

    return userRoleData ? userRoleData.map((ur) => ur.user_id) : [];
  } catch (error) {
    console.error("❌ Error filtering by role:", error);
    return [];
  }
}

// 🆕 수정된 기본 쿼리 빌더
function buildBaseQuery(conditions, userIdsFromRoleFilter) {
  let query = queryBuilder.select(
    "users",
    `
    user_id, username, email, name, phone_number, 
    is_active, is_email_verified, created_at, 
    last_login, login_count, failed_login_attempts,
    locked_until, verification_attempts, verification_sent_at
  `,
    { useAdmin: true }
  );

  // 검색 및 기본 필터 조건 적용
  conditions.forEach((condition) => {
    if (condition.includes("ilike")) {
      // 검색 조건은 or로 처리
      const searchParts = condition.match(/\((.*)\)/)[1];
      query = query.or(searchParts);
    } else {
      // 다른 조건들은 개별적으로 적용
      const [field, operator, value] = condition.split(".");
      switch (operator) {
        case "eq":
          query = query.eq(field, value === "true" ? true : value === "false" ? false : value);
          break;
        // 다른 연산자들도 필요에 따라 추가
      }
    }
  });

  // 역할 필터가 있는 경우 사용자 ID로 추가 필터링
  if (userIdsFromRoleFilter && userIdsFromRoleFilter.length > 0) {
    query = query.in("user_id", userIdsFromRoleFilter);
  }

  return query;
}

// GET: 🚀 수정된 페이지네이션 지원 사용자 목록 조회
export async function GET(request) {
  try {
    console.log("🚀 FIXED PAGINATED API: Getting users with pagination");

    const authResult = await checkSuperAdminAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    // 🆕 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = Math.min(parseInt(searchParams.get("pageSize") || "20"), 100);
    const searchTerm = searchParams.get("search") || "";
    const roleFilter = searchParams.get("roleFilter") || "all";
    const statusFilter = searchParams.get("statusFilter") || "all";

    console.log("🔍 Query params:", { page, pageSize, searchTerm, roleFilter, statusFilter });

    // 🆕 역할 필터 처리 (단순화)
    let userIdsFromRoleFilter = null;
    if (roleFilter !== "all") {
      // 역할 필터링을 위해 서브쿼리 사용
      try {
        const { data: roleData } = await queryBuilder
          .select("roles", "role_id", { useAdmin: true })
          .eq("role_code", roleFilter)
          .single();

        if (roleData) {
          const { data: userRoleData } = await queryBuilder
            .select("user_roles", "user_id", { useAdmin: true })
            .eq("role_id", roleData.role_id)
            .eq("is_active", true);

          userIdsFromRoleFilter = userRoleData ? userRoleData.map((ur) => ur.user_id) : [];
        } else {
          userIdsFromRoleFilter = [];
        }
      } catch (roleError) {
        console.error("❌ Role filter error:", roleError);
        userIdsFromRoleFilter = [];
      }

      if (userIdsFromRoleFilter.length === 0) {
        return NextResponse.json({
          success: true,
          users: [],
          pagination: {
            currentPage: page,
            pageSize: pageSize,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          },
          filters: { searchTerm, roleFilter, statusFilter },
        });
      }
    }

    // 🆕 WHERE 조건 구성
    const conditions = buildWhereConditions(searchTerm, statusFilter);

    // 🆕 페이지네이션 정보 계산
    const offset = (page - 1) * pageSize;

    // 🚀 수정된 데이터 조회 방식 - count와 data를 한 번에
    let baseQuery = queryBuilder.select(
      "users",
      `
      user_id, username, email, name, phone_number, 
      is_active, is_email_verified, created_at, 
      last_login, login_count, failed_login_attempts,
      locked_until, verification_attempts, verification_sent_at
    `,
      { useAdmin: true }
    );

    // 검색 조건 적용
    if (searchTerm && searchTerm.trim()) {
      const searchPattern = `%${searchTerm.trim().toLowerCase()}%`;
      baseQuery = baseQuery.or(
        `name.ilike.${searchPattern},email.ilike.${searchPattern},username.ilike.${searchPattern}`
      );
    }

    // 상태 필터 적용
    if (statusFilter && statusFilter !== "all") {
      switch (statusFilter) {
        case "active":
          baseQuery = baseQuery.eq("is_active", true);
          break;
        case "inactive":
          baseQuery = baseQuery.eq("is_active", false);
          break;
        case "unverified":
          baseQuery = baseQuery.eq("is_email_verified", false);
          break;
      }
    }

    // 역할 필터 적용
    if (userIdsFromRoleFilter) {
      baseQuery = baseQuery.in("user_id", userIdsFromRoleFilter);
    }

    // 🆕 COUNT 조회 (head: true로 데이터 없이 count만)
    const { count: totalCount, error: countError } = await baseQuery.select("*", {
      count: "exact",
      head: true,
    });

    if (countError) {
      console.error("❌ Count query failed:", countError);
      throw countError;
    }

    // 🆕 실제 데이터 조회 (동일한 조건으로)
    let dataQuery = queryBuilder.select(
      "users",
      `
      user_id, username, email, name, phone_number, 
      is_active, is_email_verified, created_at, 
      last_login, login_count, failed_login_attempts,
      locked_until, verification_attempts, verification_sent_at
    `,
      { useAdmin: true }
    );

    // 동일한 조건 재적용
    if (searchTerm && searchTerm.trim()) {
      const searchPattern = `%${searchTerm.trim().toLowerCase()}%`;
      dataQuery = dataQuery.or(
        `name.ilike.${searchPattern},email.ilike.${searchPattern},username.ilike.${searchPattern}`
      );
    }

    if (statusFilter && statusFilter !== "all") {
      switch (statusFilter) {
        case "active":
          dataQuery = dataQuery.eq("is_active", true);
          break;
        case "inactive":
          dataQuery = dataQuery.eq("is_active", false);
          break;
        case "unverified":
          dataQuery = dataQuery.eq("is_email_verified", false);
          break;
      }
    }

    if (userIdsFromRoleFilter) {
      dataQuery = dataQuery.in("user_id", userIdsFromRoleFilter);
    }

    const { data: users, error } = await dataQuery
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error("❌ Users query failed:", error);
      throw error;
    }

    // 🆕 페이지네이션 정보 계산
    const total = totalCount || 0;
    const totalPages = Math.ceil(total / pageSize);

    const pagination = {
      currentPage: page,
      pageSize: pageSize,
      total: total,
      totalPages: totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };

    console.log("📊 Pagination info:", pagination);
    console.log(`📊 Retrieved ${users?.length || 0} users for page ${page}`);

    // 🚀 사용자별 정보 처리
    const processedUsers = await Promise.all(
      (users || []).map(async (user) => {
        try {
          // 역할 정보 조회 (비활성 역할 포함)
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
            isActive: ur.is_active,
          }));

          // 소속 정보 조회
          const affiliation = await getUserAffiliationInfoOptimized(user.user_id);

          // 엔터티 상태 계산 (활성 역할만 사용)
          const activeRoles = roles.filter((role) => role.isActive);
          const entityStatus = calculateEntityStatus(user, affiliation, activeRoles);

          return {
            id: user.user_id,
            username: user.username,
            email: user.email,
            name: user.name,
            phoneNumber: user.phone_number,
            isActive: user.is_active,
            isEmailVerified: user.is_email_verified,
            createdAt: user.created_at,
            lastLogin: user.last_login,
            loginCount: user.login_count || 0,
            failedLoginAttempts: user.failed_login_attempts || 0,
            lockedUntil: user.locked_until,
            verificationAttempts: user.verification_attempts || 0,
            verificationSentAt: user.verification_sent_at,
            roles: roles,
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
            isEmailVerified: user.is_email_verified,
            createdAt: user.created_at,
            lastLogin: user.last_login,
            loginCount: user.login_count || 0,
            failedLoginAttempts: user.failed_login_attempts || 0,
            lockedUntil: user.locked_until,
            verificationAttempts: user.verification_attempts || 0,
            verificationSentAt: user.verification_sent_at,
            roles: [],
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

    // 🆕 terminated 상태 필터링 (엔터티 상태 기준으로 추후 필터링)
    let finalUsers = processedUsers;
    if (statusFilter === "terminated") {
      finalUsers = processedUsers.filter(
        (user) => user.entityStatus.effectiveStatus === "terminated"
      );

      // terminated 필터링으로 인한 pagination 정보 조정
      const terminatedTotal = finalUsers.length;
      const terminatedTotalPages = Math.ceil(terminatedTotal / pageSize);

      pagination.total = terminatedTotal;
      pagination.totalPages = terminatedTotalPages;
      pagination.hasNextPage = page < terminatedTotalPages;
    }

    console.log(`✅ FIXED PAGINATED API: Processed ${finalUsers.length} users successfully`);

    return NextResponse.json({
      success: true,
      users: finalUsers,
      pagination: pagination,
      filters: {
        searchTerm,
        roleFilter,
        statusFilter,
      },
      metadata: {
        optimized: true,
        paginated: true,
        includeInactiveRoles: true,
        fixed: true,
        queryTime: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ FIXED PAGINATED API Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch users (fixed paginated)",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
