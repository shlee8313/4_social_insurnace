// File: app/api/auth/login/route.js (JWT audience 추가 버전)
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  authenticateUser,
  checkCanResendVerification,
  maskEmail,
  getUserPermissions,
} from "../../../../lib/auth";
import { queryBuilder, getCachedEntityStatus } from "../../../../lib/database";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

/**
 * 🔐 로그인 API - JWT audience 추가 버전
 * POST /api/auth/login
 */
export async function POST(request) {
  try {
    const { emailOrUsername, password, rememberMe = false } = await request.json();

    if (!emailOrUsername || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "이메일과 비밀번호를 모두 입력해주세요.",
          code: "MISSING_CREDENTIALS",
        },
        { status: 400 }
      );
    }

    console.log("🔄 Attempting login with:", emailOrUsername);

    // 1. 기본 인증 (사용자 존재 여부, 비밀번호 확인)
    const authResult = await authenticateUser(emailOrUsername, password);

    if (!authResult) {
      return NextResponse.json(
        {
          success: false,
          message: "이메일 또는 비밀번호가 올바르지 않습니다.",
          code: "INVALID_CREDENTIALS",
        },
        { status: 401 }
      );
    }

    // 2. 계정 잠금 확인
    if (authResult.error === "ACCOUNT_LOCKED") {
      return NextResponse.json(
        {
          success: false,
          message: "계정이 잠겨있습니다. 잠시 후 다시 시도해주세요.",
          code: "ACCOUNT_LOCKED",
          data: { lockedUntil: authResult.lockedUntil },
        },
        { status: 423 }
      );
    }

    // 3. 이메일 인증 상태 확인
    if (authResult.requiresEmailVerification) {
      const canResendEmail = checkCanResendVerification(authResult.user);

      return NextResponse.json(
        {
          success: false,
          message: "이메일 인증이 필요합니다. 가입 시 받으신 인증 메일을 확인해주세요.",
          code: "EMAIL_NOT_VERIFIED",
          data: {
            userId: authResult.user.user_id,
            email: maskEmail(authResult.user.email),
            canResendEmail,
            verificationAttempts: authResult.user.verificationAttempts || 0,
            lastSentAt: authResult.user.lastSentAt || null,
          },
        },
        { status: 403 }
      );
    }

    const user = authResult.user;

    // 🚨 중요: user 객체 구조 확인 및 user_id 추출
    console.log("🔍 Full user object structure:", user);
    const userId = user.user_id || user.id || user.userId;
    console.log("✅ Basic authentication successful for user:", userId);

    if (!userId) {
      console.error("❌ User ID not found in user object:", user);
      return NextResponse.json(
        {
          success: false,
          message: "사용자 정보를 찾을 수 없습니다.",
          code: "USER_ID_MISSING",
        },
        { status: 500 }
      );
    }

    // 4. 권한 정보 가져오기
    let permissions;
    try {
      console.log("🔍 Before getUserPermissions call with userId:", userId);
      permissions = await getUserPermissions(userId);
      console.log("🔍 After getUserPermissions call:", permissions);
      console.log("✅ Permissions loaded:", {
        userId: userId,
        rolesCount: permissions.roles?.length || 0,
        roles: permissions.roles,
        permissions: permissions.permissions,
      });
    } catch (permError) {
      console.error("❌ Failed to get permissions:", permError);
      permissions = { roles: [], permissions: {} };
    }

    // 5. 엔터티 상태 확인
    let entityStatus;
    try {
      entityStatus = await getCachedEntityStatus(userId, true); // 강제 새로고침
      console.log("🔍 Entity status check result:", {
        userId: userId,
        entityStatus: entityStatus.entityStatus,
        effectiveStatus: entityStatus.effectiveStatus,
        roleCategory: entityStatus.roleCategory,
        roleCode: entityStatus.roleCode,
        entityType: entityStatus.entityType,
        entityName: entityStatus.entityName,
      });
    } catch (entityError) {
      console.error("❌ Failed to get entity status:", entityError);
      // 엔터티 상태 확인 실패시 기본값
      entityStatus = {
        entityType: "unknown",
        entityStatus: "inactive",
        effectiveStatus: "inactive",
        roleCategory: "unknown",
        roleCode: "unknown",
        canAccess: false,
        message: "상태 확인 중 오류가 발생했습니다.",
      };
    }

    // 🚨 6. 개선된 접근 권한 체크 로직
    const isSystemAdmin =
      permissions.roles?.some(
        (role) => role.code === "SUPER_ADMIN" || role.code === "SYSTEM_ADMIN"
      ) || entityStatus.roleCategory === "system";

    const isLaborAdmin = permissions.roles?.some((role) => role.code === "LABOR_ADMIN");

    const isEntityActive =
      entityStatus.effectiveStatus === "active" || entityStatus.entityStatus === "active";

    console.log("🔍 Entity Status Check Details:", {
      userId: userId,
      entityStatus: entityStatus,
      isSystemAdmin: isSystemAdmin,
      isLaborAdmin: isLaborAdmin,
      isEntityActive: isEntityActive,
      rolesFound: permissions.roles,
      roleCategory: entityStatus.roleCategory,
      willRedirectToAccessRestricted: !isSystemAdmin && !isLaborAdmin && !isEntityActive,
    });

    // 🚨 7. 비활성/종료 사용자 체크 (LABOR_ADMIN 예외 처리)
    // SUPER_ADMIN, SYSTEM_ADMIN, LABOR_ADMIN은 엔터티 상태와 관계없이 정상 접근 허용
    if (!isSystemAdmin && !isLaborAdmin && !isEntityActive) {
      console.log("⚠️ User entity is not active, redirecting to access-restricted:", {
        userId: userId,
        entityStatus: entityStatus.entityStatus,
        effectiveStatus: entityStatus.effectiveStatus,
        roleCategory: entityStatus.roleCategory,
        isSystemAdmin,
        isLaborAdmin,
      });

      // 비활성 사용자도 로그인은 성공시키되, 클라이언트에서 access-restricted로 보내기 위한 플래그 추가
      const userWithPermissions = {
        ...user,
        roles: permissions.roles || [],
        permissions: permissions.permissions || {},
        entityStatus: entityStatus,
        requiresAccessRestricted: true, // 특별 플래그
      };

      // 🔥 JWT 토큰 생성 (비활성 사용자도 토큰은 발급) - audience 추가
      const tokenPayload = {
        userId: userId,
        username: user.username,
        email: user.email,
        roles: permissions.roles || [],
        entityStatus: entityStatus.entityStatus,
      };

      const accessToken = jwt.sign(tokenPayload, JWT_SECRET, {
        expiresIn: "1h",
        audience: "insurance-management-users",
        issuer: "insurance-management-system",
      });
      const refreshToken = jwt.sign({ userId: userId }, JWT_SECRET, {
        expiresIn: "7d",
        audience: "insurance-management-users",
        issuer: "insurance-management-system",
      });

      // 쿠키 설정
      const cookieStore = await cookies();
      cookieStore.set("accessToken", accessToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60,
        path: "/",
      });
      cookieStore.set("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 12 * 60 * 60,
        path: "/",
      });

      // 로그인 카운트 업데이트 (수정된 매개변수명)
      try {
        await queryBuilder.rpc(
          "increment_login_count",
          { user_id_param: userId }, // ✅ 수정: 올바른 매개변수명과 userId 사용
          { useAdmin: true }
        );
      } catch (rpcError) {
        console.warn("⚠️ Failed to update login count:", rpcError);
      }

      console.log("✅ Login successful but user requires access restriction");

      return NextResponse.json({
        success: true,
        message: "로그인이 완료되었습니다.",
        data: {
          user: userWithPermissions,
          accessToken,
          refreshToken,
          entityStatus,
          redirectTo: "/access-restricted", // 🚨 특별 리다이렉트 지시
        },
      });
    }

    // 8. 정상 활성 사용자 처리 (SYSTEM_ADMIN, LABOR_ADMIN 포함)
    console.log("✅ User has full access, proceeding with normal login:", {
      userId: userId,
      roleCategory: entityStatus.roleCategory,
      isSystemAdmin,
      isLaborAdmin,
      isEntityActive,
    });

    const userWithPermissions = {
      ...user,
      roles: permissions.roles || [],
      permissions: permissions.permissions || {},
      entityStatus: entityStatus,
    };

    // 🔥 JWT 토큰 생성 - audience 추가
    const tokenPayload = {
      userId: userId,
      username: user.username,
      email: user.email,
      roles: permissions.roles || [],
      entityStatus: entityStatus.entityStatus,
    };

    const accessToken = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: "1h",
      audience: "insurance-management-users",
      issuer: "insurance-management-system",
    });
    const refreshToken = jwt.sign({ userId: userId }, JWT_SECRET, {
      expiresIn: "7d",
      audience: "insurance-management-users",
      issuer: "insurance-management-system",
    });

    // 쿠키 설정
    const cookieStore = await cookies();
    cookieStore.set("accessToken", accessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60,
      path: "/",
    });
    cookieStore.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 12 * 60 * 60,
      path: "/",
    });

    // 로그인 카운트 업데이트 (수정된 매개변수명)
    try {
      await queryBuilder.rpc(
        "increment_login_count",
        { user_id_param: userId }, // ✅ 수정: 올바른 매개변수명과 userId 사용
        { useAdmin: true }
      );
    } catch (rpcError) {
      console.warn("⚠️ Failed to update login count:", rpcError);
    }

    console.log("✅ User authenticated successfully:", user.username);
    console.log("🔍 Final API Response Structure:", {
      userId: userId,
      user: userWithPermissions,
      roles: userWithPermissions.roles,
      permissions: permissions,
      entityStatus: entityStatus,
    });

    return NextResponse.json({
      success: true,
      message: "로그인이 완료되었습니다.",
      data: {
        user: userWithPermissions,
        accessToken,
        refreshToken,
        entityStatus,
      },
    });
  } catch (error) {
    console.error("🔐 Login API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        code: "INTERNAL_SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
