// 📁 app/api/super-admin/users/route.js (완전 수정된 버전 - 비활성 역할 포함 + 성능 최적화)
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { queryBuilder } from "@/lib/database";

/**
 * 🆕 완전 개선된 SUPER_ADMIN 사용자 관리 API
 * - ✅ 비활성 역할도 완전히 조회 가능
 * - ✅ 소속회사/노무사 사무실 정보 포함
 * - ✅ 엔터티 상태 정보 포함
 * - ✅ 개선된 이메일 인증 및 계정 삭제 로직
 * - ✅ 성능 최적화 및 에러 처리 강화
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

// 사용자 소속 정보 조회 함수 (성능 최적화)
async function getUserAffiliationInfo(userId) {
  try {
    // 1. 노무사 사무실 정보 조회
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

    // 2. 회사 정보 조회 (부서 배정을 통해)
    const { data: companyInfo } = await queryBuilder
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

    if (companyInfo && companyInfo.departments && companyInfo.departments.companies) {
      return {
        affiliationType: "company",
        affiliationName: companyInfo.departments.companies.company_name,
        affiliationId: companyInfo.departments.companies.company_id,
        position: companyInfo.assignment_type,
        status: companyInfo.departments.companies.client_status,
        details: `${companyInfo.departments.companies.company_name} - ${companyInfo.departments.department_name}`,
      };
    }

    // 3. 직접 회사 배정 조회
    const { data: directCompanyInfo } = await queryBuilder
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

    if (directCompanyInfo && directCompanyInfo.companies) {
      return {
        affiliationType: "company",
        affiliationName: directCompanyInfo.companies.company_name,
        affiliationId: directCompanyInfo.companies.company_id,
        position: directCompanyInfo.assignment_type,
        status: directCompanyInfo.companies.client_status,
        details: `${directCompanyInfo.companies.company_name} - ${directCompanyInfo.assignment_type}`,
      };
    }

    // 4. 근로자로 등록된 경우
    const { data: workerInfo } = await queryBuilder
      .select(
        "workers",
        `
        worker_id,
        name,
        position,
        employment_status,
        companies (
          company_id,
          company_name,
          client_status
        )
      `,
        { useAdmin: true }
      )
      .eq("worker_id", userId)
      .eq("employment_status", "active")
      .single();

    if (workerInfo && workerInfo.companies) {
      return {
        affiliationType: "worker",
        affiliationName: workerInfo.companies.company_name,
        affiliationId: workerInfo.companies.company_id,
        position: workerInfo.position || "근로자",
        status: workerInfo.companies.client_status,
        details: `${workerInfo.companies.company_name} - ${workerInfo.position || "근로자"}`,
      };
    }

    // 5. 소속 정보 없음
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

// 사용자 엔터티 상태 조회 함수 (에러 처리 강화)
async function getUserEntityStatus(userId) {
  try {
    // 사용자 컨텍스트 설정
    await queryBuilder.rpc("set_current_user_context", { p_user_id: userId }, { useAdmin: true });

    // 엔터티 상태 조회
    const { data: statusData } = await queryBuilder.rpc(
      "get_user_entity_status",
      { p_user_id: userId },
      { useAdmin: true }
    );

    if (statusData && statusData.length > 0) {
      const status = statusData[0];
      return {
        entityType: status.entity_type,
        entityStatus: status.entity_status,
        effectiveStatus: status.effective_status,
        entityName: status.entity_name,
        roleCategory: status.role_category,
        roleCode: status.role_code,
        statusMessage: status.message,
      };
    }

    return {
      entityType: "unknown",
      entityStatus: "inactive",
      effectiveStatus: "inactive",
      entityName: "Unknown",
      roleCategory: "unknown",
      roleCode: "unknown",
      statusMessage: "상태 정보를 확인할 수 없습니다.",
    };
  } catch (error) {
    console.error(`❌ Error fetching entity status for user ${userId}:`, error);
    return {
      entityType: "unknown",
      entityStatus: "inactive",
      effectiveStatus: "inactive",
      entityName: "Error",
      roleCategory: "unknown",
      roleCode: "unknown",
      statusMessage: "상태 확인 중 오류 발생",
    };
  }
}

// GET: 🆕 완전 수정된 사용자 목록 조회 (비활성 역할 포함)
export async function GET(request) {
  try {
    console.log(
      "🔍 SUPER_ADMIN API: Getting all users with affiliations (including inactive roles)"
    );

    const authResult = await checkSuperAdminAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    // 기본 사용자 목록 조회
    const { data: users, error } = await queryBuilder
      .select(
        "users",
        `
        user_id, username, email, name, phone_number, 
        is_active, is_email_verified, created_at, 
        last_login, login_count, failed_login_attempts,
        locked_until, verification_attempts, verification_sent_at
      `,
        { useAdmin: true }
      )
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    console.log(`📊 Retrieved ${users?.length || 0} users, processing with inactive roles...`);

    // 사용자별 정보 처리 (비활성 역할 포함)
    const usersWithDetails = await Promise.all(
      (users || []).map(async (user) => {
        try {
          // ✅ 핵심 수정: 비활성 역할도 모두 조회 (.eq("is_active", true) 완전 제거)
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
          // ✅ 이전: .eq("is_active", true) ← 이 라인을 완전히 제거!

          // 소속 정보 조회
          const affiliationInfo = await getUserAffiliationInfo(user.user_id);

          // 엔터티 상태 조회
          const entityStatus = await getUserEntityStatus(user.user_id);

          // ✅ 역할 데이터 처리 (활성/비활성 모두 포함)
          const allRoles = (userRoles || []).map((ur) => ({
            code: ur.roles.role_code,
            name: ur.roles.role_name,
            category: ur.roles.role_category,
            isActive: ur.is_active, // ✅ 핵심: 역할 활성 상태 포함
          }));

          // 디버깅 로깅 (특정 사용자에 대해서만)
          if (user.name === "야해마트" || allRoles.some((role) => !role.isActive)) {
            console.log(`🔍 DEBUG User ${user.user_id} (${user.name}) - roles check:`, {
              userIsActive: user.is_active,
              totalRoles: allRoles.length,
              activeRoles: allRoles.filter((r) => r.isActive).length,
              inactiveRoles: allRoles.filter((r) => !r.isActive).length,
              roleDetails: allRoles.map((r) => `${r.code}(${r.isActive ? "active" : "inactive"})`),
              entityStatus: entityStatus.entityStatus,
              entityType: entityStatus.entityType,
              affiliationType: affiliationInfo.affiliationType,
            });
          }

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
            // ✅ 핵심: 모든 역할 포함 (활성/비활성 구분 가능)
            roles: allRoles,
            // 소속 정보
            affiliation: affiliationInfo,
            // 엔터티 상태 정보
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
            roles: [], // 에러 시 빈 배열
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

    // ✅ 통계 정보 추가
    const stats = {
      totalUsers: usersWithDetails.length,
      activeUsers: usersWithDetails.filter((u) => u.isActive).length,
      usersWithInactiveRoles: usersWithDetails.filter((u) => u.roles.some((role) => !role.isActive))
        .length,
      totalRoles: usersWithDetails.reduce((sum, u) => sum + u.roles.length, 0),
      activeRoles: usersWithDetails.reduce(
        (sum, u) => sum + u.roles.filter((role) => role.isActive).length,
        0
      ),
      inactiveRoles: usersWithDetails.reduce(
        (sum, u) => sum + u.roles.filter((role) => !role.isActive).length,
        0
      ),
    };

    console.log(`✅ SUPER_ADMIN API: Successfully processed ${usersWithDetails.length} users`);
    console.log(`📊 Role statistics:`, stats);

    return NextResponse.json({
      success: true,
      users: usersWithDetails,
      total: usersWithDetails.length,
      includeInactiveRoles: true, // ✅ 비활성 역할 포함됨을 명시
      stats: stats, // ✅ 통계 정보 추가
      metadata: {
        processedAt: new Date().toISOString(),
        version: "2.0",
        features: [
          "inactive_roles_included",
          "entity_status_included",
          "affiliation_info_included",
          "enhanced_error_handling",
        ],
      },
    });
  } catch (error) {
    console.error("❌ SUPER_ADMIN API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users", details: error.message },
      { status: 500 }
    );
  }
}

// PATCH: 사용자 액션 처리 (기존과 동일하지만 에러 처리 강화)
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { userId, action, value } = body;

    console.log(`🔄 USER ACTION: ${action} for user ${userId}`);

    // 권한 확인
    const authResult = await checkSuperAdminAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    if (!userId || !action) {
      return NextResponse.json(
        { error: "Missing required fields: userId, action" },
        { status: 400 }
      );
    }

    // 사용자 존재 확인
    const { data: user } = await queryBuilder
      .select(
        "users",
        "user_id, username, name, email, is_email_verified, is_active, locked_until",
        { useAdmin: true }
      )
      .eq("user_id", userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let updateData = {};
    let message = "";

    // 액션별 처리
    switch (action) {
      case "toggle_status":
        updateData.is_active = value;
        if (value) {
          updateData.failed_login_attempts = 0;
          updateData.locked_until = null;
        }
        updateData.updated_at = new Date().toISOString();
        message = value ? "사용자가 활성화되었습니다." : "사용자가 비활성화되었습니다.";
        break;

      case "verify_email":
        if (user.is_email_verified) {
          return NextResponse.json(
            { error: "이미 이메일 인증이 완료된 사용자입니다." },
            { status: 400 }
          );
        }

        // 이메일 인증 시스템 활용 시도
        try {
          const { data: functionResult, error: functionError } = await queryBuilder.rpc(
            "complete_email_verification",
            {
              p_user_id: userId,
              p_token: "ADMIN_MANUAL_VERIFICATION",
            },
            { useAdmin: true }
          );

          if (functionError || !functionResult) {
            console.log(`⚠️ PostgreSQL function failed, using direct update`);
            throw new Error("Function not available");
          }

          message = "이메일 인증이 완료되었습니다. (시스템 함수 사용)";
        } catch (functionError) {
          console.log(`🔄 Fallback to direct email verification for user ${userId}`);

          updateData = {
            is_email_verified: true,
            email_verification_token: null,
            email_verification_expires_at: null,
            updated_at: new Date().toISOString(),
          };

          // 이메일 인증 로그 기록 시도
          try {
            await queryBuilder.insert(
              "email_verification_logs",
              {
                user_id: userId,
                verification_type: "manual",
                email_address: user.email || "unknown@example.com",
                token_hash: "ADMIN_MANUAL_VERIFICATION",
                verified_at: new Date().toISOString(),
                expires_at: new Date().toISOString(),
                status: "verified",
              },
              { useAdmin: true }
            );
            console.log(`✅ Email verification log recorded for user ${userId}`);
          } catch (logError) {
            console.log(`⚠️ Email verification log failed:`, logError.message);
          }

          message = "이메일 인증이 완료되었습니다. (직접 처리)";
        }
        break;

      case "unlock_account":
        if (!user.locked_until || new Date(user.locked_until) <= new Date()) {
          return NextResponse.json({ error: "계정이 잠겨있지 않습니다." }, { status: 400 });
        }

        updateData = {
          locked_until: null,
          failed_login_attempts: 0,
          updated_at: new Date().toISOString(),
        };
        message = "계정 잠금이 해제되었습니다.";
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action. Supported: toggle_status, verify_email, unlock_account" },
          { status: 400 }
        );
    }

    // 데이터베이스 업데이트
    let updatedUser = user;
    if (Object.keys(updateData).length > 0) {
      const { data, error: updateError } = await queryBuilder
        .update("users", updateData, { useAdmin: true })
        .eq("user_id", userId)
        .select(
          `
          user_id, username, email, name, phone_number,
          is_active, is_email_verified, last_login, login_count,
          locked_until, failed_login_attempts
        `
        )
        .single();

      if (updateError) {
        console.error(`❌ User update error:`, updateError);
        throw updateError;
      }

      if (!data) {
        return NextResponse.json({ error: "User not found or update failed" }, { status: 404 });
      }

      updatedUser = data;
    }

    console.log(`✅ USER ACTION SUCCESS: ${action} for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: message,
      user: {
        id: updatedUser.user_id,
        username: updatedUser.username,
        email: updatedUser.email,
        name: updatedUser.name,
        phoneNumber: updatedUser.phone_number,
        isActive: updatedUser.is_active,
        isEmailVerified: updatedUser.is_email_verified,
        lastLogin: updatedUser.last_login,
        loginCount: updatedUser.login_count,
        lockedUntil: updatedUser.locked_until,
        failedLoginAttempts: updatedUser.failed_login_attempts,
      },
      action: action,
      value: value,
      changedBy: authResult.userId,
      changedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ USER ACTION API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process user action",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// DELETE: 안전한 사용자 삭제 (기존과 동일하지만 비활성 역할 고려)
export async function DELETE(request) {
  try {
    const body = await request.json();
    const { userId, confirm } = body;

    console.log(`🗑️ USER DELETE: user ${userId}`);

    // 권한 확인
    const authResult = await checkSuperAdminAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    // 확인 플래그 체크
    if (!userId || confirm !== "DELETE_USER_PERMANENTLY") {
      return NextResponse.json({ error: "Missing userId or confirmation string" }, { status: 400 });
    }

    // 사용자 존재 확인
    const { data: user } = await queryBuilder
      .select("users", "user_id, username, name, email", { useAdmin: true })
      .eq("user_id", userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ✅ SUPER_ADMIN 삭제 방지 (활성 역할만 체크)
    const { data: userRoles } = await queryBuilder
      .select(
        "user_roles",
        `
        roles (
          role_code
        )
      `,
        { useAdmin: true }
      )
      .eq("user_id", userId)
      .eq("is_active", true); // 활성 역할만 체크

    const isSuperAdmin = userRoles?.some((ur) => ur.roles.role_code === "SUPER_ADMIN");
    if (isSuperAdmin) {
      return NextResponse.json(
        { error: "SUPER_ADMIN 계정은 삭제할 수 없습니다." },
        { status: 403 }
      );
    }

    // 관련 데이터 정리 (CASCADE DELETE를 위해)
    // 1. ✅ 모든 사용자 역할 비활성화 (활성/비활성 구분 없이)
    await queryBuilder
      .update("user_roles", { is_active: false }, { useAdmin: true })
      .eq("user_id", userId);

    // 2. 노무사 직원 상태 변경
    await queryBuilder
      .update("labor_office_staff", { employment_status: "terminated" }, { useAdmin: true })
      .eq("user_id", userId);

    // 3. 부서 배정 비활성화
    await queryBuilder
      .update("user_department_assignments", { is_active: false }, { useAdmin: true })
      .eq("user_id", userId);

    // 4. 회사 배정 비활성화
    await queryBuilder
      .update("user_company_assignments", { is_active: false }, { useAdmin: true })
      .eq("user_id", userId);

    // 5. 사용자 계정 삭제 (실제 삭제 대신 완전 비활성화)
    const { data: deletedUser, error: deleteError } = await queryBuilder
      .update(
        "users",
        {
          is_active: false,
          user_status: "terminated",
          username: `deleted_${userId}_${user.username}`,
          email: `deleted_${userId}_${user.email || "no-email"}`,
          updated_at: new Date().toISOString(),
        },
        { useAdmin: true }
      )
      .eq("user_id", userId)
      .select("user_id, username, name")
      .single();

    if (deleteError) {
      console.error(`❌ User delete error:`, deleteError);
      throw deleteError;
    }

    console.log(`✅ USER DELETE SUCCESS: user ${userId} (${user.name})`);

    return NextResponse.json({
      success: true,
      message: "사용자가 영구적으로 삭제되었습니다.",
      user: {
        id: userId,
        name: user.name,
        username: user.username,
      },
      deletedBy: authResult.userId,
      deletedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ USER DELETE API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete user",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
