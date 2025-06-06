// 📁 lib/middleware.js
import { NextResponse } from "next/server";
import { verifyToken } from "./auth.js";

/**
 * Next.js 미들웨어 - 인증 및 권한 체크
 * 4대보험 취득상실 통합 관리 시스템용 미들웨어
 */

// 인증이 필요 없는 공개 경로
const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
  "/api/auth", // 모든 auth 관련 API 제외
  "/favicon.ico",
  "/_next",
  "/images",
  "/icons",
];

// 역할별 접근 경로 매핑
const ROLE_ACCESS_PATHS = {
  // 노무사 사무실 전용 경로
  labor_office: ["/labor-office", "/api/labor-office"],

  // 회사 전용 경로
  company: ["/company", "/api/company"],

  // 🆕 Super Admin 전용 경로 추가
  super_admin: ["/super-admin", "/api/super-admin"],
};

// 특별 권한이 필요한 경로
const PERMISSION_PATHS = {
  "/labor-office/daily-workers": { resource: "daily_workers", action: "read" },
  "/labor-office/batch-processing": { resource: "batch_processing", action: "read" },
  "/labor-office/insurance/pending-actions": { resource: "insurance", action: "write" },
  "/labor-office/payroll-items": { resource: "payroll_items", action: "write" },
  "/labor-office/analytics": { resource: "analytics", action: "read" },
  "/api/batch": { resource: "batch_processing", action: "write" },
  "/api/daily-workers": { resource: "daily_workers", action: "write" },
};

/**
 * 메인 미들웨어 함수
 * @param {Request} request - Next.js 요청 객체
 * @returns {Response} Next.js 응답 객체
 */
// export async function middleware(request) {
//   const { pathname } = request.nextUrl;

//   // 공개 경로는 바로 통과
//   if (isPublicPath(pathname)) {
//     return NextResponse.next();
//   }

//   try {
//     // 토큰 추출 및 검증
//     const token = extractToken(request);

//     if (!token) {
//       return redirectToLogin(request);
//     }

//     const decoded = verifyToken(token);

//     if (!decoded) {
//       return redirectToLogin(request);
//     }

//     // 역할 기반 접근 제어
//     const roleCheckResult = checkRoleAccess(pathname, decoded);
//     if (!roleCheckResult.allowed) {
//       return createUnauthorizedResponse(roleCheckResult.reason);
//     }

//     // 권한 기반 접근 제어
//     const permissionCheckResult = checkPermissionAccess(pathname, decoded);
//     if (!permissionCheckResult.allowed) {
//       return createUnauthorizedResponse(permissionCheckResult.reason);
//     }

//     // 회사 접근 권한 확인 (회사별 데이터 접근시)
//     const companyAccessResult = await checkCompanyAccess(pathname, request, decoded);
//     if (!companyAccessResult.allowed) {
//       return createUnauthorizedResponse(companyAccessResult.reason);
//     }

//     // 요청 헤더에 사용자 정보 추가
//     const requestHeaders = new Headers(request.headers);
//     requestHeaders.set("x-user-id", decoded.userId.toString());
//     requestHeaders.set("x-user-username", decoded.username);
//     requestHeaders.set("x-user-roles", JSON.stringify(decoded.roles || []));
//     requestHeaders.set("x-user-permissions", JSON.stringify(decoded.permissions || {}));

//     // API 요청인 경우 추가 검증
//     if (pathname.startsWith("/api/")) {
//       return handleApiRequest(request, decoded, requestHeaders);
//     }

//     // 페이지 요청 처리
//     return NextResponse.next({
//       request: {
//         headers: requestHeaders,
//       },
//     });
//   } catch (error) {
//     console.error("❌ Middleware error:", error);

//     if (pathname.startsWith("/api/")) {
//       return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//     }

//     return redirectToLogin(request);
//   }
// }

/**
 * 공개 경로 확인
 * @param {string} pathname - 요청 경로
 * @returns {boolean} 공개 경로 여부
 */
function isPublicPath(pathname) {
  return PUBLIC_PATHS.some((path) => {
    if (path.endsWith("/")) {
      return pathname.startsWith(path);
    }
    return pathname === path || pathname.startsWith(path + "/");
  });
}

/**
 * 토큰 추출
 * @param {Request} request - 요청 객체
 * @returns {string|null} JWT 토큰
 */
function extractToken(request) {
  // Authorization 헤더에서 토큰 추출
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // 쿠키에서 토큰 추출
  const tokenCookie = request.cookies.get("access_token") || request.cookies.get("accessToken");
  if (tokenCookie) {
    return tokenCookie.value;
  }

  return null;
}

/**
 * 🆕 Super Admin 권한 체크 함수
 * @param {string} pathname - 요청 경로
 * @param {Object} decoded - 디코딩된 토큰
 * @returns {Object} 접근 허용 여부 및 사유
 */
function checkSuperAdminAccess(pathname, decoded) {
  // Super Admin 경로 확인
  if (pathname.startsWith("/super-admin") || pathname.startsWith("/api/super-admin")) {
    const userRoles = decoded.roles || [];

    console.log(`🔍 Checking Super Admin access for: ${pathname}`);
    console.log(`User roles:`, userRoles);

    const hasSuperAdminRole = userRoles.some(
      (role) => role.code === "SUPER_ADMIN" || role.code === "SYSTEM_ADMIN"
    );

    if (!hasSuperAdminRole) {
      console.log(`❌ Super Admin access denied for user: ${decoded.username}`);
      return {
        allowed: false,
        reason: "시스템 최고 관리자 권한이 필요합니다.",
      };
    }

    console.log(`✅ Super Admin access granted for user: ${decoded.username}`);
  }

  return { allowed: true };
}

/**
 * 🔧 역할 기반 접근 제어 (Super Admin 지원 추가)
 * @param {string} pathname - 요청 경로
 * @param {Object} decoded - 디코딩된 토큰
 * @returns {Object} 접근 허용 여부 및 사유
 */
function checkRoleAccess(pathname, decoded) {
  const userRoles = decoded.roles || [];

  // 🆕 Super Admin 경로 확인 (최우선)
  const superAdminCheck = checkSuperAdminAccess(pathname, decoded);
  if (!superAdminCheck.allowed) {
    return superAdminCheck;
  }

  // 노무사 사무실 경로 확인
  if (pathname.startsWith("/labor-office") || pathname.startsWith("/api/labor-office")) {
    const hasLaborOfficeRole = userRoles.some(
      (role) =>
        role.category === "labor_office" ||
        role.code === "LABOR_ADMIN" ||
        role.code === "LABOR_STAFF" ||
        role.code === "SUPER_ADMIN" // Super Admin은 모든 곳 접근 가능
    );

    if (!hasLaborOfficeRole) {
      return {
        allowed: false,
        reason: "노무사 사무실 권한이 필요합니다.",
      };
    }
  }

  // 회사 경로 확인
  if (pathname.startsWith("/company") || pathname.startsWith("/api/company")) {
    const hasCompanyRole = userRoles.some(
      (role) =>
        role.category === "company" ||
        role.code === "COMPANY_ADMIN" ||
        role.code === "COMPANY_HR" ||
        role.code === "SUPER_ADMIN" // Super Admin은 모든 곳 접근 가능
    );

    if (!hasCompanyRole) {
      return {
        allowed: false,
        reason: "회사 권한이 필요합니다.",
      };
    }
  }

  return { allowed: true };
}

/**
 * 권한 기반 접근 제어
 * @param {string} pathname - 요청 경로
 * @param {Object} decoded - 디코딩된 토큰
 * @returns {Object} 접근 허용 여부 및 사유
 */
function checkPermissionAccess(pathname, decoded) {
  const userPermissions = decoded.permissions || {};

  // 특별 권한이 필요한 경로 확인
  for (const [path, requiredPermission] of Object.entries(PERMISSION_PATHS)) {
    if (pathname.startsWith(path)) {
      const resourcePermissions = userPermissions[requiredPermission.resource];

      if (
        !resourcePermissions ||
        (!resourcePermissions.includes(requiredPermission.action) &&
          !resourcePermissions.includes("*"))
      ) {
        return {
          allowed: false,
          reason: `${requiredPermission.resource}에 대한 ${requiredPermission.action} 권한이 필요합니다.`,
        };
      }
    }
  }

  return { allowed: true };
}

/**
 * 회사 접근 권한 확인
 * @param {string} pathname - 요청 경로
 * @param {Request} request - 요청 객체
 * @param {Object} decoded - 디코딩된 토큰
 * @returns {Promise<Object>} 접근 허용 여부 및 사유
 */
async function checkCompanyAccess(pathname, request, decoded) {
  // 회사 ID가 포함된 경로 패턴 확인
  const companyPathPattern = /\/(labor-office|api)\/.*\/companies\/(\d+)(?:\/|$)/;
  const match = pathname.match(companyPathPattern);

  if (match) {
    const companyId = parseInt(match[2]);
    const userRoles = decoded.roles || [];

    // 전역 권한이 있는 경우 통과
    const hasGlobalAccess = userRoles.some(
      (role) =>
        role.scope?.type === "global" || role.code === "LABOR_ADMIN" || role.code === "SUPER_ADMIN"
    );

    if (hasGlobalAccess) {
      return { allowed: true };
    }

    // 특정 회사 권한 확인
    const hasCompanyAccess = userRoles.some(
      (role) => role.scope?.type === "company" && role.scope?.companyId === companyId
    );

    if (!hasCompanyAccess) {
      return {
        allowed: false,
        reason: "해당 회사에 대한 접근 권한이 없습니다.",
      };
    }
  }

  return { allowed: true };
}

/**
 * 🔧 API 요청 처리 (Super Admin API 특별 처리 추가)
 * @param {Request} request - 요청 객체
 * @param {Object} decoded - 디코딩된 토큰
 * @param {Headers} requestHeaders - 요청 헤더
 * @returns {Response} 응답 객체
 */
function handleApiRequest(request, decoded, requestHeaders) {
  const { pathname } = request.nextUrl;

  // 🆕 Super Admin API 특별 로깅
  if (pathname.startsWith("/api/super-admin")) {
    console.log(
      `🔐 SUPER_ADMIN API accessed by ${decoded.username}: ${request.method} ${pathname}`
    );

    // Super Admin API는 모든 활동을 로깅
    if (process.env.NODE_ENV === "production") {
      // 운영환경에서는 더 상세한 로깅 (추후 구현)
      console.log(`🔍 SUPER_ADMIN Activity:`, {
        user: decoded.username,
        userId: decoded.userId,
        method: request.method,
        path: pathname,
        timestamp: new Date().toISOString(),
        ip: request.headers.get("x-forwarded-for") || "unknown",
      });
    }
  }

  // 일용직 롤링 월별 배치 API는 특별한 권한 필요
  if (pathname.startsWith("/api/batch/rolling-monthly")) {
    const userPermissions = decoded.permissions || {};
    const batchPermissions = userPermissions.batch_processing || [];

    if (!batchPermissions.includes("execute") && !batchPermissions.includes("*")) {
      return NextResponse.json({ error: "배치 처리 실행 권한이 없습니다." }, { status: 403 });
    }
  }

  // API 호출 로깅 (개발환경에서만)
  if (process.env.NODE_ENV === "development") {
    console.log(`📡 API called by ${decoded.username}: ${request.method} ${pathname}`);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

/**
 * 로그인 페이지로 리다이렉트
 * @param {Request} request - 요청 객체
 * @returns {Response} 리다이렉트 응답
 */
function redirectToLogin(request) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("callbackUrl", pathname);

  return NextResponse.redirect(loginUrl);
}

/**
 * 권한 없음 응답 생성
 * @param {string} reason - 거부 사유
 * @returns {Response} 권한 없음 응답
 */
function createUnauthorizedResponse(reason) {
  return NextResponse.json(
    {
      error: "Forbidden",
      message: reason,
    },
    { status: 403 }
  );
}

/**
 * 사용자 정보 추출 헬퍼 (API Route에서 사용)
 * @param {Headers} headers - 요청 헤더
 * @returns {Object} 사용자 정보
 */
export function extractUserFromHeaders(headers) {
  return {
    userId: parseInt(headers.get("x-user-id")),
    username: headers.get("x-user-username"),
    roles: JSON.parse(headers.get("x-user-roles") || "[]"),
    permissions: JSON.parse(headers.get("x-user-permissions") || "{}"),
  };
}

/**
 * 권한 체크 헬퍼 (API Route에서 사용)
 * @param {Object} userPermissions - 사용자 권한
 * @param {string} resource - 리소스명
 * @param {string} action - 액션명
 * @returns {boolean} 권한 보유 여부
 */
export function checkPermission(userPermissions, resource, action) {
  if (!userPermissions || !userPermissions.permissions) {
    return false;
  }

  const resourcePermissions = userPermissions.permissions[resource];
  if (!resourcePermissions) {
    return false;
  }

  return resourcePermissions.includes(action) || resourcePermissions.includes("*");
}

/**
 * 🆕 Super Admin 권한 확인 (API Route에서 사용)
 */
export function isSuperAdmin(userRoles) {
  if (!Array.isArray(userRoles)) {
    return false;
  }

  return userRoles.some((role) => role.code === "SUPER_ADMIN" || role.code === "SYSTEM_ADMIN");
}

/**
 * 🆕 Super Admin API 요청 권한 체크 (API Route에서 사용)
 */
export function requireSuperAdmin(headers) {
  const userRoles = JSON.parse(headers.get("x-user-roles") || "[]");

  if (!isSuperAdmin(userRoles)) {
    throw new Error("시스템 최고 관리자 권한이 필요합니다.");
  }

  return {
    userId: parseInt(headers.get("x-user-id")),
    username: headers.get("x-user-username"),
    roles: userRoles,
  };
}

// 🔧 미들웨어 설정 - super-admin 경로 포함
export const config = {
  matcher: [
    /*
     * 다음 경로들을 제외한 모든 경로에 미들웨어 적용:
     * - api/auth/* (인증 관련 API는 제외)
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화)
     * - favicon.ico, robots.txt 등 정적 파일
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|api/auth).*)",
  ],
};

// ===============================
// 🆕 추가: 기존 middleware.js 파일에 추가할 엔터티 상태 체크 함수들
// (기존 코드 끝 부분에 추가)
// ===============================

/**
 * 🆕 엔터티 상태 확인 함수
 * @param {Object} decoded - 디코딩된 토큰
 * @returns {Promise<Object>} 상태 확인 결과
 */
async function checkEntityStatus(decoded) {
  try {
    const userRoles = decoded.roles || [];

    // SUPER_ADMIN은 상태 체크 패스
    if (userRoles.some((role) => role.code === "SUPER_ADMIN")) {
      console.log(
        `✅ EntityStatus: SUPER_ADMIN bypassing status check for user ${decoded.username}`
      );
      return {
        allowed: true,
        entityStatus: "active",
        entityType: "system",
        roleCategory: "system",
        message: "시스템 관리자 권한으로 모든 기능에 접근 가능합니다.",
      };
    }

    // 동적 import로 순환 참조 방지
    const { getUserEntityStatus } = await import("./database.js");

    console.log(
      `🔍 EntityStatus: Checking status for user ${decoded.userId} (${decoded.username})`
    );

    const statusInfo = await getUserEntityStatus(decoded.userId);

    console.log(`📊 EntityStatus: Retrieved status for ${decoded.username}:`, {
      entityType: statusInfo.entityType,
      entityStatus: statusInfo.entityStatus,
      roleCategory: statusInfo.roleCategory,
      canAccess: statusInfo.entityStatus === "active",
    });

    if (statusInfo.entityStatus !== "active") {
      console.log(
        `❌ EntityStatus: Access denied for ${decoded.username} - Status: ${statusInfo.entityStatus}`
      );

      return {
        allowed: false,
        entityStatus: statusInfo.entityStatus,
        entityType: statusInfo.entityType,
        roleCategory: statusInfo.roleCategory,
        reason: statusInfo.message || "계정이 비활성화 상태입니다.",
        statusDetails: {
          entityName: statusInfo.entityName,
          entityId: statusInfo.entityId,
          roleCode: statusInfo.roleCode,
          adminContact: getAdminContactByCategory(statusInfo.roleCategory, statusInfo.entityType),
        },
      };
    }

    console.log(`✅ EntityStatus: Access granted for ${decoded.username}`);

    return {
      allowed: true,
      entityStatus: statusInfo.entityStatus,
      entityType: statusInfo.entityType,
      roleCategory: statusInfo.roleCategory,
      entityName: statusInfo.entityName,
      entityId: statusInfo.entityId,
    };
  } catch (error) {
    console.error("❌ EntityStatus: Status check failed:", error);

    // 에러 시 기본적으로 비활성으로 처리 (보안상 안전)
    return {
      allowed: false,
      entityStatus: "inactive",
      entityType: "unknown",
      roleCategory: "unknown",
      reason: "상태 확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      statusDetails: {
        error: error.message,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * 🆕 역할 카테고리별 관리자 연락처 정보
 * @param {string} roleCategory - 역할 카테고리
 * @param {string} entityType - 엔터티 타입
 * @returns {string} 관리자 연락처 메시지
 */
function getAdminContactByCategory(roleCategory, entityType) {
  switch (roleCategory) {
    case "labor_office":
      return "노무사 사무실 관리자에게 문의하세요.";
    case "company":
      if (entityType === "worker") {
        return "회사 인사담당자에게 문의하세요.";
      }
      return "회사 관리자에게 문의하세요.";
    case "system":
      return "시스템이 정상 작동 중입니다.";
    default:
      return "시스템 관리자에게 문의하세요.";
  }
}

/**
 * 🆕 상태별 접근 허용 페이지 확인
 * @param {string} pathname - 요청 경로
 * @param {string} entityStatus - 엔터티 상태
 * @param {string} roleCategory - 역할 카테고리
 * @returns {boolean} 접근 허용 여부
 */
function isAllowedPageForStatus(pathname, entityStatus, roleCategory) {
  // system 카테고리는 모든 페이지 접근 가능
  if (roleCategory === "system") {
    return true;
  }

  // active 상태는 모든 페이지 접근 가능
  if (entityStatus === "active") {
    return true;
  }

  // 비활성/종료 상태에서 접근 가능한 페이지들
  const allowedPaths = [
    "/dashboard",
    "/profile",
    "/settings",
    "/help",
    "/contact",
    "/entity-status",
  ];

  // 읽기 전용 페이지들 (상세 보기는 허용, 수정은 불허)
  const readOnlyPaths = ["/labor-office/dashboard", "/company/dashboard", "/worker/dashboard"];

  const isAllowedPath = allowedPaths.some((path) => pathname.startsWith(path));
  const isReadOnlyPath = readOnlyPaths.some((path) => pathname.startsWith(path));

  return isAllowedPath || isReadOnlyPath;
}

/**
 * 🆕 API 엔드포인트별 상태 접근 제어
 * @param {string} pathname - API 경로
 * @param {string} method - HTTP 메소드
 * @param {string} entityStatus - 엔터티 상태
 * @param {string} roleCategory - 역할 카테고리
 * @returns {boolean} 접근 허용 여부
 */
function isAllowedApiForStatus(pathname, method, entityStatus, roleCategory) {
  // system 카테고리는 모든 API 접근 가능
  if (roleCategory === "system") {
    return true;
  }

  // active 상태는 모든 API 접근 가능
  if (entityStatus === "active") {
    return true;
  }

  // 비활성/종료 상태에서 허용되는 API들
  const allowedApis = [
    "/api/auth", // 인증 관련
    "/api/user/profile", // 프로필 조회
    "/api/user/settings", // 설정 조회
    "/api/entity-status", // 상태 확인
  ];

  // GET 요청만 허용되는 읽기 전용 API들
  const readOnlyApis = ["/api/dashboard", "/api/company/info", "/api/labor-office/info"];

  const isAllowedApi = allowedApis.some((path) => pathname.startsWith(path));
  const isReadOnlyApi = readOnlyApis.some((path) => pathname.startsWith(path)) && method === "GET";

  return isAllowedApi || isReadOnlyApi;
}

// ===============================
// 🆕 수정: 기존 middleware 함수에 상태 체크 추가
// (기존 middleware 함수를 복사해서 상태 체크 로직만 추가)
// ===============================

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // 기존: 공개 경로는 바로 통과
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  try {
    // 기존: 토큰 추출 및 검증
    const token = extractToken(request);
    if (!token) {
      return redirectToLogin(request);
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return redirectToLogin(request);
    }

    // 기존: 역할 기반 접근 제어
    const roleCheckResult = checkRoleAccess(pathname, decoded);
    if (!roleCheckResult.allowed) {
      return createUnauthorizedResponse(roleCheckResult.reason);
    }

    // 🆕 추가: 엔터티 상태 확인
    const entityStatusResult = await checkEntityStatus(decoded);

    if (!entityStatusResult.allowed) {
      console.log(`🚫 EntityStatus: Blocking access to ${pathname} for user ${decoded.username}`);

      // API 요청인 경우 JSON 응답
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          {
            error: "ENTITY_INACTIVE",
            code: "ENTITY_STATUS_CHECK_FAILED",
            message: entityStatusResult.reason,
            entityStatus: entityStatusResult.entityStatus,
            entityType: entityStatusResult.entityType,
            roleCategory: entityStatusResult.roleCategory,
            statusDetails: entityStatusResult.statusDetails,
            timestamp: new Date().toISOString(),
          },
          { status: 403 }
        );
      } else {
        // 페이지 요청인 경우 상태 페이지로 리다이렉트
        const statusUrl = new URL("/entity-status", request.url);
        statusUrl.searchParams.set("status", entityStatusResult.entityStatus);
        statusUrl.searchParams.set("type", entityStatusResult.entityType);
        statusUrl.searchParams.set("category", entityStatusResult.roleCategory);
        statusUrl.searchParams.set("reason", encodeURIComponent(entityStatusResult.reason));

        return NextResponse.redirect(statusUrl);
      }
    }

    // 🆕 추가: 상태별 세부 접근 제어 (active가 아닌 경우)
    if (
      entityStatusResult.entityStatus !== "active" &&
      entityStatusResult.roleCategory !== "system"
    ) {
      if (pathname.startsWith("/api/")) {
        // API 요청 - 상태별 접근 제어
        if (
          !isAllowedApiForStatus(
            pathname,
            method,
            entityStatusResult.entityStatus,
            entityStatusResult.roleCategory
          )
        ) {
          return NextResponse.json(
            {
              error: "FEATURE_RESTRICTED",
              message: `${entityStatusResult.entityStatus} 상태에서는 이 기능을 사용할 수 없습니다.`,
              entityStatus: entityStatusResult.entityStatus,
              allowedFeatures: ["profile", "dashboard_view", "auth"],
              statusDetails: entityStatusResult.statusDetails,
            },
            { status: 403 }
          );
        }
      } else {
        // 페이지 요청 - 상태별 접근 제어
        if (
          !isAllowedPageForStatus(
            pathname,
            entityStatusResult.entityStatus,
            entityStatusResult.roleCategory
          )
        ) {
          const statusUrl = new URL("/entity-status", request.url);
          statusUrl.searchParams.set("status", entityStatusResult.entityStatus);
          statusUrl.searchParams.set("blocked_path", pathname);
          statusUrl.searchParams.set("reason", "feature_restricted");

          return NextResponse.redirect(statusUrl);
        }
      }
    }

    // 기존: 권한 기반 접근 제어
    const permissionCheckResult = checkPermissionAccess(pathname, decoded);
    if (!permissionCheckResult.allowed) {
      return createUnauthorizedResponse(permissionCheckResult.reason);
    }

    // 기존: 회사 접근 권한 확인
    const companyAccessResult = await checkCompanyAccess(pathname, request, decoded);
    if (!companyAccessResult.allowed) {
      return createUnauthorizedResponse(companyAccessResult.reason);
    }

    // 기존: 요청 헤더 설정
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", decoded.userId.toString());
    requestHeaders.set("x-user-username", decoded.username);
    requestHeaders.set("x-user-roles", JSON.stringify(decoded.roles || []));
    requestHeaders.set("x-user-permissions", JSON.stringify(decoded.permissions || {}));

    // 🆕 추가: 엔터티 상태 헤더 추가
    requestHeaders.set("x-entity-status", entityStatusResult.entityStatus);
    requestHeaders.set("x-entity-type", entityStatusResult.entityType || "");
    requestHeaders.set("x-entity-category", entityStatusResult.roleCategory || "");
    requestHeaders.set("x-entity-name", entityStatusResult.entityName || "");
    requestHeaders.set("x-entity-id", entityStatusResult.entityId?.toString() || "");

    // 기존: API/페이지 처리
    if (pathname.startsWith("/api/")) {
      return handleApiRequestWithStatus(request, decoded, requestHeaders, entityStatusResult);
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    // 기존: 에러 처리
    console.error("❌ Middleware error:", error);

    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          error: "Internal server error",
          message: "시스템 오류가 발생했습니다.",
        },
        { status: 500 }
      );
    }

    return redirectToLogin(request);
  }
}

/**
 * 🆕 수정: API 요청 처리 (엔터티 상태 포함)
 * @param {Request} request - 요청 객체
 * @param {Object} decoded - 디코딩된 토큰
 * @param {Headers} requestHeaders - 요청 헤더
 * @param {Object} entityStatusResult - 엔터티 상태 결과
 * @returns {Response} 응답 객체
 */
function handleApiRequestWithStatus(request, decoded, requestHeaders, entityStatusResult) {
  const { pathname } = request.nextUrl;

  // 🆕 추가: 엔터티 상태별 API 호출 로깅
  if (
    entityStatusResult.entityStatus !== "active" &&
    entityStatusResult.roleCategory !== "system"
  ) {
    console.log(
      `⚠️ Restricted API accessed by ${decoded.username} (${entityStatusResult.entityStatus}): ${request.method} ${pathname}`
    );
  }

  // 🆕 추가: Super Admin API 특별 로깅 (기존)
  if (pathname.startsWith("/api/super-admin")) {
    console.log(
      `🔐 SUPER_ADMIN API accessed by ${decoded.username}: ${request.method} ${pathname}`
    );

    // Super Admin API는 모든 활동을 로깅
    if (process.env.NODE_ENV === "production") {
      console.log(`🔍 SUPER_ADMIN Activity:`, {
        user: decoded.username,
        userId: decoded.userId,
        method: request.method,
        path: pathname,
        entityStatus: entityStatusResult.entityStatus,
        timestamp: new Date().toISOString(),
        ip: request.headers.get("x-forwarded-for") || "unknown",
      });
    }
  }

  // 기존: 일용직 롤링 월별 배치 API 권한 확인
  if (pathname.startsWith("/api/batch/rolling-monthly")) {
    const userPermissions = decoded.permissions || {};
    const batchPermissions = userPermissions.batch_processing || [];

    if (!batchPermissions.includes("execute") && !batchPermissions.includes("*")) {
      return NextResponse.json({ error: "배치 처리 실행 권한이 없습니다." }, { status: 403 });
    }
  }

  // 기존: API 호출 로깅 (개발환경에서만)
  if (process.env.NODE_ENV === "development") {
    console.log(
      `📡 API called by ${decoded.username} (${entityStatusResult.entityStatus}): ${request.method} ${pathname}`
    );
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// ===============================
// 🆕 추가: 엔터티 상태 관련 헬퍼 함수들 (API Route에서 사용)
// ===============================

/**
 * 🆕 엔터티 상태 정보 추출 헬퍼 (API Route에서 사용)
 * @param {Headers} headers - 요청 헤더
 * @returns {Object} 엔터티 상태 정보
 */
export function extractEntityStatus(headers) {
  return {
    entityStatus: headers.get("x-entity-status") || "inactive",
    entityType: headers.get("x-entity-type") || null,
    entityCategory: headers.get("x-entity-category") || null,
    entityName: headers.get("x-entity-name") || "",
    entityId: headers.get("x-entity-id") ? parseInt(headers.get("x-entity-id")) : null,
  };
}

/**
 * 🆕 엔터티 활성 상태 확인 (API Route에서 사용)
 * @param {Headers} headers - 요청 헤더
 * @returns {boolean} 활성 상태 여부
 */
export function requireActiveEntity(headers) {
  const { entityStatus, entityCategory } = extractEntityStatus(headers);
  const userRoles = JSON.parse(headers.get("x-user-roles") || "[]");

  // SUPER_ADMIN은 패스
  if (userRoles.some((role) => role.code === "SUPER_ADMIN") || entityCategory === "system") {
    return true;
  }

  if (entityStatus !== "active") {
    throw new Error("계정이 비활성화 상태입니다.");
  }

  return true;
}

/**
 * 🆕 특정 기능 접근 권한 확인 (API Route에서 사용)
 * @param {Headers} headers - 요청 헤더
 * @param {string} feature - 기능명
 * @returns {boolean} 접근 가능 여부
 */
export function requireFeatureAccess(headers, feature) {
  const { entityStatus, entityCategory } = extractEntityStatus(headers);
  const userRoles = JSON.parse(headers.get("x-user-roles") || "[]");

  // SUPER_ADMIN은 모든 기능 접근 가능
  if (userRoles.some((role) => role.code === "SUPER_ADMIN") || entityCategory === "system") {
    return true;
  }

  // 엔터티가 활성 상태가 아니면 기능 제한 확인
  if (entityStatus !== "active") {
    const restrictedFeatures = {
      inactive: ["data_modification", "report_generation", "setting_changes"],
      terminated: ["data_modification", "report_generation", "setting_changes", "data_view"],
    };

    const restricted = restrictedFeatures[entityStatus] || restrictedFeatures["terminated"];

    if (restricted.includes(feature)) {
      throw new Error(`${entityStatus} 상태에서는 ${feature} 기능을 사용할 수 없습니다.`);
    }
  }

  return true;
}

/**
 * 🆕 API 응답에 엔터티 상태 정보 추가
 * @param {Object} data - 응답 데이터
 * @param {Headers} headers - 요청 헤더
 * @returns {Object} 상태 정보가 포함된 응답 데이터
 */
export function addEntityStatusToResponse(data, headers) {
  const entityStatus = extractEntityStatus(headers);

  return {
    ...data,
    _entityStatus: {
      status: entityStatus.entityStatus,
      type: entityStatus.entityType,
      category: entityStatus.entityCategory,
      canModify: entityStatus.entityStatus === "active" || entityStatus.entityCategory === "system",
      timestamp: new Date().toISOString(),
    },
  };
}

/***
 *
 *
 *
 *
 *
 */

// // 📁 lib/middleware.js (기존 파일에 추가할 Super Admin 보호 로직)

// /**
//  * 기존 middleware.js 파일의 PUBLIC_PATHS 배열에 추가
//  */
// const PUBLIC_PATHS = [
//   "/login",
//   "/register",
//   "/forgot-password",
//   "/reset-password",
//   "/api/auth/login",
//   "/api/auth/register",
//   "/api/auth/refresh",
//   "/favicon.ico",
//   "/_next",
//   "/images",
//   "/icons",
//   // 추가: API 인증 제외 경로
//   "/api/auth", // 모든 auth 관련 API 제외
// ];

// /**
//  * 기존 ROLE_ACCESS_PATHS에 super-admin 경로 추가
//  */
// const ROLE_ACCESS_PATHS = {
//   // 노무사 사무실 전용 경로
//   labor_office: ["/labor-office", "/api/labor-office"],

//   // 회사 전용 경로
//   company: ["/company", "/api/company"],

//   // 🆕 Super Admin 전용 경로 추가
//   super_admin: ["/super-admin", "/api/super-admin"],
// };

// /**
//  * 🆕 Super Admin 권한 체크 함수 추가
//  * 기존 checkRoleAccess 함수에 추가하거나 별도 함수로 생성
//  */
// function checkSuperAdminAccess(pathname, decoded) {
//   // Super Admin 경로 확인
//   if (pathname.startsWith("/super-admin") || pathname.startsWith("/api/super-admin")) {
//     const userRoles = decoded.roles || [];

//     console.log(`🔍 Checking Super Admin access for: ${pathname}`);
//     console.log(`User roles:`, userRoles);

//     const hasSuperAdminRole = userRoles.some(
//       (role) => role.code === "SUPER_ADMIN" || role.code === "SYSTEM_ADMIN"
//     );

//     if (!hasSuperAdminRole) {
//       console.log(`❌ Super Admin access denied for user: ${decoded.username}`);
//       return {
//         allowed: false,
//         reason: "시스템 최고 관리자 권한이 필요합니다.",
//       };
//     }

//     console.log(`✅ Super Admin access granted for user: ${decoded.username}`);
//   }

//   return { allowed: true };
// }

// /**
//  * 🔧 기존 checkRoleAccess 함수 수정
//  * 기존 함수를 이렇게 수정하세요
//  */
// function checkRoleAccess(pathname, decoded) {
//   const userRoles = decoded.roles || [];

//   // 🆕 Super Admin 경로 확인 (최우선)
//   const superAdminCheck = checkSuperAdminAccess(pathname, decoded);
//   if (!superAdminCheck.allowed) {
//     return superAdminCheck;
//   }

//   // 노무사 사무실 경로 확인
//   if (pathname.startsWith("/labor-office") || pathname.startsWith("/api/labor-office")) {
//     const hasLaborOfficeRole = userRoles.some(
//       (role) =>
//         role.category === "labor_office" ||
//         role.code === "LABOR_ADMIN" ||
//         role.code === "LABOR_STAFF" ||
//         role.code === "SUPER_ADMIN" // Super Admin은 모든 곳 접근 가능
//     );

//     if (!hasLaborOfficeRole) {
//       return {
//         allowed: false,
//         reason: "노무사 사무실 권한이 필요합니다.",
//       };
//     }
//   }

//   // 회사 경로 확인
//   if (pathname.startsWith("/company") || pathname.startsWith("/api/company")) {
//     const hasCompanyRole = userRoles.some(
//       (role) =>
//         role.category === "company" ||
//         role.code === "COMPANY_ADMIN" ||
//         role.code === "COMPANY_HR" ||
//         role.code === "SUPER_ADMIN" // Super Admin은 모든 곳 접근 가능
//     );

//     if (!hasCompanyRole) {
//       return {
//         allowed: false,
//         reason: "회사 권한이 필요합니다.",
//       };
//     }
//   }

//   return { allowed: true };
// }

// /**
//  * 🔧 기존 handleApiRequest 함수에 추가
//  * Super Admin API 요청에 대한 특별 처리
//  */
// function handleApiRequest(request, decoded, requestHeaders) {
//   const { pathname } = request.nextUrl;

//   // 🆕 Super Admin API 특별 로깅
//   if (pathname.startsWith("/api/super-admin")) {
//     console.log(
//       `🔐 SUPER_ADMIN API accessed by ${decoded.username}: ${request.method} ${pathname}`
//     );

//     // Super Admin API는 모든 활동을 로깅
//     if (process.env.NODE_ENV === "production") {
//       // 운영환경에서는 더 상세한 로깅 (추후 구현)
//       console.log(`🔍 SUPER_ADMIN Activity:`, {
//         user: decoded.username,
//         userId: decoded.userId,
//         method: request.method,
//         path: pathname,
//         timestamp: new Date().toISOString(),
//         ip: request.headers.get("x-forwarded-for") || "unknown",
//       });
//     }
//   }

//   // 일용직 롤링 월별 배치 API는 특별한 권한 필요
//   if (pathname.startsWith("/api/batch/rolling-monthly")) {
//     const userPermissions = decoded.permissions || {};
//     const batchPermissions = userPermissions.batch_processing || [];

//     if (!batchPermissions.includes("execute") && !batchPermissions.includes("*")) {
//       return NextResponse.json({ error: "배치 처리 실행 권한이 없습니다." }, { status: 403 });
//     }
//   }

//   // API 호출 로깅 (개발환경에서만)
//   if (process.env.NODE_ENV === "development") {
//     console.log(`📡 API called by ${decoded.username}: ${request.method} ${pathname}`);
//   }

//   return NextResponse.next({
//     request: {
//       headers: requestHeaders,
//     },
//   });
// }

// /**
//  * 🆕 Super Admin 전용 헬퍼 함수들
//  */

// /**
//  * Super Admin 권한 확인 (API Route에서 사용)
//  */
// export function isSuperAdmin(userRoles) {
//   if (!Array.isArray(userRoles)) {
//     return false;
//   }

//   return userRoles.some((role) => role.code === "SUPER_ADMIN" || role.code === "SYSTEM_ADMIN");
// }

// /**
//  * Super Admin API 요청 권한 체크 (API Route에서 사용)
//  */
// export function requireSuperAdmin(headers) {
//   const userRoles = JSON.parse(headers.get("x-user-roles") || "[]");

//   if (!isSuperAdmin(userRoles)) {
//     throw new Error("시스템 최고 관리자 권한이 필요합니다.");
//   }

//   return {
//     userId: parseInt(headers.get("x-user-id")),
//     username: headers.get("x-user-username"),
//     roles: userRoles,
//   };
// }

// /**
//  * 🔧 기존 config 수정 - super-admin 경로 포함
//  */
// export const config = {
//   matcher: [
//     /*
//      * 다음 경로들을 제외한 모든 경로에 미들웨어 적용:
//      * - api/auth/* (인증 관련 API는 제외)
//      * - _next/static (정적 파일)
//      * - _next/image (이미지 최적화)
//      * - favicon.ico, robots.txt 등 정적 파일
//      */
//     "/((?!_next/static|_next/image|favicon.ico|robots.txt|api/auth).*)",
//   ],
// };
