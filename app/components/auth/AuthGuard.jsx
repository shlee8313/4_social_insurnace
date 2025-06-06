//file: app/components/auth/AuthGuard.jsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth, useEntityStatus } from "@/app/store/authStore";
import { LoadingSpinner } from "@/app/components/ui/LoadingSpinner";

/**
 * 강화된 AuthGuard 컴포넌트
 * 더 엄격한 상태 체크와 확실한 리다이렉트 보장
 */
export default function AuthGuard({ children, requireAuth = true, allowedRoles = [] }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isInitialized, user, hasRole, accessToken } = useAuth();

  const {
    isEntityActive,
    isActive,
    isInactive,
    isTerminated,
    checkEntityStatus,
    entityStatus,
    isStatusLoading,
  } = useEntityStatus();

  const [authCheckState, setAuthCheckState] = useState({
    isChecking: true,
    hasCheckedEntity: false,
    redirecting: false,
    debugInfo: {},
  });

  // 예외 경로 (접근제한 상태에서도 접근 가능한 페이지들)
  const exemptPaths = [
    "/access-restricted",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
    "/api",
    //        /dashboard 제거 - 정상적인 리다이렉트 작동을 위해
  ];

  // 현재 경로가 예외 경로인지 확인
  const isExemptPath = exemptPaths.some((path) => pathname.startsWith(path));

  //     디버깅 로그 함수
  const logDebug = useCallback((step, data) => {
    const timestamp = new Date().toISOString();
    console.log(`    AuthGuard [${timestamp}] ${step}:`, data);

    setAuthCheckState((prev) => ({
      ...prev,
      debugInfo: {
        ...prev.debugInfo,
        [step]: { timestamp, data },
      },
    }));
  }, []);

  // 리다이렉트 처리 함수
  const performRedirect = useCallback(
    (path, reason) => {
      console.log(`       AuthGuard: FORCING REDIRECT to ${path} - ${reason}`);

      setAuthCheckState((prev) => ({ ...prev, redirecting: true }));

      try {
        // 방법 1: Next.js router
        router.replace(path);

        // 방법 2: 100ms 후 브라우저 location 직접 변경 (백업)
        setTimeout(() => {
          if (window.location.pathname !== path) {
            console.log(`       AuthGuard: Router redirect failed, using window.location`);
            window.location.href = path;
          }
        }, 100);

        // 방법 3: 500ms 후 한 번 더 확인 (최종 백업)
        setTimeout(() => {
          if (window.location.pathname !== path) {
            console.log(`       AuthGuard: All redirects failed, forcing with replace`);
            window.location.replace(path);
          }
        }, 500);
      } catch (redirectError) {
        console.error("  AuthGuard: Redirect error:", redirectError);
        // 최후의 수단
        window.location.href = path;
      }
    },
    [router]
  );

  // 메인 인증 및 엔터티 체크 로직
  useEffect(() => {
    const performAuthAndEntityCheck = async () => {
      logDebug("START", {
        pathname,
        isInitialized,
        isAuthenticated,
        requireAuth,
        isExemptPath,
        user: user ? { id: user.id, username: user.username } : null,
      });

      // 1. 초기화 대기
      if (!isInitialized) {
        logDebug("WAITING_INIT", "Auth not initialized yet");
        return;
      }

      // 2. 인증이 필요하지 않은 페이지거나 예외 경로인 경우
      if (!requireAuth || isExemptPath) {
        logDebug("EXEMPT_PATH", { requireAuth, isExemptPath });
        setAuthCheckState((prev) => ({ ...prev, isChecking: false }));
        return;
      }

      // 3. 인증되지 않은 사용자
      if (!isAuthenticated || !user || !accessToken) {
        logDebug("NOT_AUTHENTICATED", {
          isAuthenticated,
          hasUser: !!user,
          hasToken: !!accessToken,
        });

        performRedirect("/login", "User not authenticated");
        return;
      }

      // 4. 엔터티 상태 확인 (한 번만 수행)
      if (!authCheckState.hasCheckedEntity && !isStatusLoading) {
        logDebug("CHECKING_ENTITY", "Starting entity status check");

        try {
          await checkEntityStatus(true); // 강제 새로고침

          setAuthCheckState((prev) => ({ ...prev, hasCheckedEntity: true }));

          logDebug("ENTITY_CHECK_DONE", {
            entityStatus: entityStatus,
            isActive: isActive(),
            isInactive: isInactive(),
            isTerminated: isTerminated(),
          });
        } catch (error) {
          logDebug("ENTITY_CHECK_ERROR", error.message);
          setAuthCheckState((prev) => ({ ...prev, isChecking: false })); //  참고하여 추가
          // 에러 발생 시 안전하게 접근제한 페이지로
          performRedirect("/access-restricted", "Entity status check failed");
          return;
        }
      }

      // 5. 엔터티 상태 확인이 완료된 후 판단
      if (authCheckState.hasCheckedEntity && !isStatusLoading) {
        // 5-1. 역할 기반 접근 제어 확인
        if (allowedRoles.length > 0 && user) {
          const hasRequiredRole = allowedRoles.some((role) => hasRole(role));

          logDebug("ROLE_CHECK", {
            allowedRoles,
            userRoles: user.roles?.map((r) => r.code) || [],
            hasRequiredRole,
          });

          if (!hasRequiredRole) {
            performRedirect("/access-restricted", "Missing required role");
            return;
          }
        }

        // 5-2. 엔터티 상태 확인 (핵심 부분)
        const currentIsActive = isActive();
        const currentIsInactive = isInactive();
        const currentIsTerminated = isTerminated();

        logDebug("FINAL_STATUS_CHECK", {
          entityStatus: entityStatus,
          isActive: currentIsActive,
          isInactive: currentIsInactive,
          isTerminated: currentIsTerminated,
          effectiveStatus: entityStatus?.effectiveStatus,
          directStatus: entityStatus?.entityStatus,
        });

        //        엔터티가 활성화되지 않은 경우 강제 리다이렉트
        if (!currentIsActive) {
          const reason = currentIsInactive
            ? "Entity is inactive"
            : currentIsTerminated
            ? "Entity is terminated"
            : "Entity status unknown";

          logDebug("ENTITY_NOT_ACTIVE", {
            redirectTo: "/access-restricted",
            reason,
            entityDetails: {
              entityStatus: entityStatus?.entityStatus,
              effectiveStatus: entityStatus?.effectiveStatus,
              roleCategory: entityStatus?.roleCategory,
            },
          });

          performRedirect("/access-restricted", reason);
          return;
        }

        // 6. 모든 검사 통과
        logDebug("ALL_CHECKS_PASSED", "User can access the page");
        setAuthCheckState((prev) => ({
          ...prev,
          isChecking: false,
          redirecting: false,
        }));
      }
    };

    performAuthAndEntityCheck();
  }, [
    isInitialized,
    isAuthenticated,
    pathname,
    requireAuth,
    isExemptPath,
    user,
    allowedRoles,
    authCheckState.hasCheckedEntity,
    isStatusLoading,
    entityStatus,
    logDebug,
    performRedirect,
    hasRole,
    accessToken,
    checkEntityStatus,
    isActive,
    isInactive,
    isTerminated,
  ]);

  //     디버그 정보를 콘솔에 주기적으로 출력 (개발 환경에서만)
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const interval = setInterval(() => {
      console.log("    AuthGuard Status:", {
        isInitialized,
        isAuthenticated,
        isActive: isActive(),
        entityStatus: entityStatus,
        authCheckState,
        pathname,
      });
    }, 10000); // 10초마다 (너무 자주 출력하지 않도록)

    return () => clearInterval(interval);
  }, [isInitialized, isAuthenticated, isActive, entityStatus, authCheckState, pathname]);

  // 로딩 상태 표시
  if (
    !isInitialized ||
    authCheckState.isChecking ||
    authCheckState.redirecting ||
    isStatusLoading
  ) {
    const loadingMessage = !isInitialized
      ? "시스템 초기화 중..."
      : isStatusLoading
      ? "상태 확인 중..."
      : authCheckState.redirecting
      ? "페이지 이동 중..."
      : "권한 확인 중...";

    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">{loadingMessage}</p>

          {/*     디버깅 모드에서만 상태 정보 표시 */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-4 text-xs text-gray-500 max-w-md">
              <details>
                <summary className="cursor-pointer">디버그 정보</summary>
                <pre className="mt-2 text-left bg-gray-100 p-2 rounded text-xs overflow-auto max-h-32">
                  {JSON.stringify(
                    {
                      isInitialized,
                      isAuthenticated,
                      isActive: isActive(),
                      entityStatus: entityStatus,
                      authCheckState,
                    },
                    null,
                    2
                  )}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 모든 검사를 통과한 경우 컴포넌트 렌더링
  return children;
}

/**
 * HOC (Higher-Order Component) 버전의 AuthGuard
 */
export function withAuthGuard(WrappedComponent, options = {}) {
  return function AuthGuardedComponent(props) {
    return (
      <AuthGuard {...options}>
        <WrappedComponent {...props} />
      </AuthGuard>
    );
  };
}

/**
 * 특정 역할만 접근 가능한 페이지를 위한 컴포넌트
 */
export function RoleGuard({ children, allowedRoles, fallbackPath = "/access-restricted" }) {
  const { user, hasRole, isAuthenticated, isInitialized } = useAuth();
  const { isActive } = useEntityStatus();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isInitialized) return;

    if (!isAuthenticated || !isActive()) {
      router.replace("/access-restricted");
      return;
    }

    if (allowedRoles.length > 0 && user) {
      const hasRequiredRole = allowedRoles.some((role) => hasRole(role));
      if (!hasRequiredRole) {
        router.replace(fallbackPath);
        return;
      }
    }

    setIsChecking(false);
  }, [isInitialized, isAuthenticated, isActive, user, allowedRoles, fallbackPath, router]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return children;
}

/**
 * 시스템 관리자만 접근 가능한 페이지를 위한 컴포넌트
 */
export function SuperAdminGuard({ children }) {
  return <RoleGuard allowedRoles={["SUPER_ADMIN", "SYSTEM_ADMIN"]}>{children}</RoleGuard>;
}

/**
 * 노무사 사무실 관련 역할만 접근 가능한 페이지를 위한 컴포넌트
 */
export function LaborOfficeGuard({ children }) {
  return <RoleGuard allowedRoles={["LABOR_ADMIN", "LABOR_STAFF"]}>{children}</RoleGuard>;
}
/**
 * 회사 관련 역할만 접근 가능한 페이지를 위한 컴포넌트
 */
export function CompanyGuard({ children }) {
  return <RoleGuard allowedRoles={["COMPANY_ADMIN", "COMPANY_HR"]}>{children}</RoleGuard>;
}
/**
 * 근로자만 접근 가능한 페이지를 위한 컴포넌트
 */
export function WorkerGuard({ children }) {
  return <RoleGuard allowedRoles={["WORKER"]}>{children}</RoleGuard>;
}

/********************
 *
 *
 *
 *
 *
 *
 *
 *
 *
 */

// "use client";

// import React, { useEffect } from "react";
// import { useRouter, usePathname } from "next/navigation";
// import { useAuth } from "../../store/authStore";
// import { LoadingSpinner } from "../ui/LoadingSpinner";
// import ErrorBoundary from "../shared/ErrorBoundary";
// // ErrorBoundary는 필요에 따라 AuthGuard 외부에서 래핑하는 것이 더 일반적일 수 있습니다.

// export default function AuthGuard({
//   children,
//   requireAuth = true,
//   requiredRoles = [],
//   requiredPermissions = [],
//   redirectTo = null,
//   showLoading = true,
// }) {
//   const router = useRouter();
//   const pathname = usePathname();
//   const {
//     isAuthenticated,
//     isInitialized,
//     isLoading,
//     user,
//     hasRole,
//     hasPermission,
//     getDefaultDashboard,
//     entityStatus,
//   } = useAuth();

//   useEffect(() => {
//     // 1. 초기화가 완료되지 않았거나 로딩 중이면 대기 (가장 먼저 체크)
//     if (!isInitialized || isLoading) {
//       return;
//     }

//     // 2. 인증되었지만 계정의 '유효한 상태'가 'active'가 아닌 경우 (최우선 리디렉션)
//     // 현재 경로가 이미 /status-inactive가 아니라면 해당 페이지로 리디렉션합니다.
//     if (
//       isAuthenticated &&
//       entityStatus.effectiveStatus !== "active" &&
//       pathname !== "/status-inactive"
//     ) {
//       router.push("/status-inactive");
//       return;
//     }

//     // 3. 인증이 필요한 페이지인데 미인증 상태인 경우 (로그인 페이지로 리디렉션)
//     if (requireAuth && !isAuthenticated) {
//       const redirectUrl = redirectTo || `/login?redirectTo=${encodeURIComponent(pathname)}`;
//       router.push(redirectUrl);
//       return;
//     }

//     // 4. 인증이 필요하지 않은 페이지인데 이미 인증된 상태인 경우 (대시보드로 리디렉션)
//     // (예: /login, /register 페이지)
//     // 단, 이 경우에도 /status-inactive 페이지 자체는 리디렉션하지 않도록 합니다.
//     if (!requireAuth && isAuthenticated && pathname !== "/status-inactive") {
//       const destination = redirectTo || getDefaultDashboard();
//       router.push(destination);
//       return;
//     }

//     // 5. 역할 및 권한 체크 (사용자가 활성 상태일 때만 적용)
//     // 이 체크는 앞선 모든 리디렉션 조건을 통과한 후 활성 사용자에게만 적용됩니다.
//     if (isAuthenticated && entityStatus?.effectiveStatus === "active") {
//       // 역할 체크
//       if (requiredRoles.length > 0) {
//         const hasRequiredRole = requiredRoles.some((role) => hasRole(role));
//         if (!hasRequiredRole) {
//           // 권한이 없는 역할이라면 기본 대시보드로 리디렉션
//           router.push(getDefaultDashboard());
//           return;
//         }
//       }

//       // 권한 체크
//       if (requiredPermissions.length > 0) {
//         const hasRequiredPermission = requiredPermissions.some(({ resource, action }) =>
//           hasPermission(resource, action)
//         );
//         if (!hasRequiredPermission) {
//           // 권한이 없다면 기본 대시보드로 리디렉션
//           router.push(getDefaultDashboard());
//           return;
//         }
//       }
//     }

//     // 모든 리디렉션 조건에 해당하지 않으면 아무것도 하지 않음 (children 렌더링 준비)
//   }, [
//     isInitialized,
//     isLoading,
//     isAuthenticated,
//     entityStatus,
//     router,
//     pathname,
//     requireAuth,
//     redirectTo,
//     getDefaultDashboard,
//     requiredRoles,
//     hasRole,
//     requiredPermissions,
//     hasPermission,
//   ]);

//   // 로딩 스피너 렌더링 조건:
//   // 1. 아직 초기화 중이거나 데이터 로딩 중일 때 을 때
//   //    (리디렉션이 완료될 때까지 콘텐츠 깜빡임을 방지)
//   if (
//     showLoading &&
//     (!isInitialized ||
//       isLoading ||
//       (isAuthenticated &&
//         entityStatus?.effectiveStatus !== "active" &&
//         pathname !== "/status-inactive"))
//   ) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <LoadingSpinner />
//       </div>
//     );
//   }
//   // 모든 체크를 통과하고 리디렉션이 발생하지 않았다면 자식 컴포넌트 렌더링
//   return <ErrorBoundary>{children}</ErrorBoundary>;
// }
// /**
//  *
//  *
//  */
// /**
//  *
//  */
// //엔터티 상태 기반 페이지 보호
// export function EntityStatusGuard({
//   children,
//   allowInactive = false,
//   allowTerminated = false,
//   redirectTo = "/entity-status",
//   showLoading = true,
//   ...props
// }) {
//   const { isEntityActive, entityStatus, hasRole, checkEntityStatus, isStatusLoading } = useAuth();
//   const router = useRouter();
//   const pathname = usePathname();
//   const [isChecking, setIsChecking] = useState(true);

//   useEffect(() => {
//     const checkStatus = async () => {
//       try {
//         // 엔터티 상태 확인
//         await checkEntityStatus();
//       } catch (error) {
//         console.error("  EntityStatusGuard: Failed to check status:", error);
//       } finally {
//         setIsChecking(false);
//       }
//     };

//     checkStatus();
//   }, [checkEntityStatus]);

//   useEffect(() => {
//     if (isChecking || isStatusLoading) return;

//     // SUPER_ADMIN은 항상 통과
//     if (hasRole("SUPER_ADMIN")) {
//       return;
//     }

//     const currentStatus = entityStatus.entityStatus;

//     // 상태별 접근 제어
//     if (currentStatus === "inactive" && !allowInactive) {
//       const statusUrl = `${redirectTo}?status=inactive&from=${encodeURIComponent(pathname)}`;
//       router.push(statusUrl);
//       return;
//     }

//     if (currentStatus === "terminated" && !allowTerminated) {
//       const statusUrl = `${redirectTo}?status=terminated&from=${encodeURIComponent(pathname)}`;
//       router.push(statusUrl);
//       return;
//     }
//   }, [
//     isChecking,
//     isStatusLoading,
//     hasRole,
//     entityStatus.entityStatus,
//     allowInactive,
//     allowTerminated,
//     redirectTo,
//     pathname,
//     router,
//   ]);

//   // 로딩 중
//   if ((isChecking || isStatusLoading) && showLoading) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex justify-center items-center">
//         <div className="text-center">
//           <LoadingSpinner size="lg" />
//           <p className="mt-4 text-gray-600">상태 확인 중...</p>
//         </div>
//       </div>
//     );
//   }

//   // SUPER_ADMIN이거나 허용된 상태인 경우
//   const currentStatus = entityStatus.entityStatus;
//   const isAllowed =
//     hasRole("SUPER_ADMIN") ||
//     currentStatus === "active" ||
//     (currentStatus === "inactive" && allowInactive) ||
//     (currentStatus === "terminated" && allowTerminated);

//   if (isAllowed) {
//     return (
//       <AuthGuard requireAuth={true} {...props}>
//         {children}
//       </AuthGuard>
//     );
//   }

//   // 상태 확인 중 또는 접근 불가 상태
//   if (showLoading) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex justify-center items-center">
//         <div className="text-center">
//           <LoadingSpinner size="lg" />
//           <p className="mt-4 text-gray-600">페이지 접근 권한을 확인하고 있습니 다...</p>
//         </div>
//       </div>
//     );
//   }

//   return null;
// }

// /**
//  *      기능별 접근 제어 가드
//  */
// export function FeatureGuard({ children, feature, fallback = null, showMessage = true, ...props }) {
//   const { canAccessFeature, hasRole, getStatusMessage } = useAuth();

//   // SUPER_ADMIN은 모든 기능 접근 가능
//   if (hasRole("SUPER_ADMIN") || canAccessFeature(feature)) {
//     return (
//       <AuthGuard requireAuth={true} {...props}>
//         {children}
//       </AuthGuard>
//     );
//   }

//   // 접근 불가 시 메시지 표시
//   if (showMessage) {
//     const message = getStatusMessage();
//     return (
//       <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
//         <div className="flex items-center">
//           <div className="flex-shrink-0">
//             <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
//               <path
//                 fillRule="evenodd"
//                 d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213
// 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1
// 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
//                 clipRule="evenodd"
//               />
//             </svg>
//           </div>
//           <div className="ml-3">
//             <p className="text-sm text-yellow-800">
//               {message || `${feature} 기능에 접근할 수 없습니다.`}
//             </p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return fallback;
// }

// /**
//  *      상태별 조건부 렌더링 (컴포넌트 레벨)
//  */
// export function ConditionalByStatus({
//   children,
//   allowedStatuses = ["active"],
//   fallback = null,
//   showStatusMessage = true,
// }) {
//   const { entityStatus, hasRole, getStatusMessage } = useAuth();

//   // SUPER_ADMIN은 항상 통과
//   if (hasRole("SUPER_ADMIN")) {
//     return children;
//   }

//   // 허용된 상태인지 확인
//   if (allowedStatuses.includes(entityStatus.entityStatus)) {
//     return children;
//   }

//   // 상태 메시지 표시
//   if (showStatusMessage) {
//     const message = getStatusMessage();
//     return (
//       <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
//         <div className="flex items-center">
//           <div className="flex-shrink-0">
//             <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
//               <path
//                 fillRule="evenodd"
//                 d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012
// 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
//                 clipRule="evenodd"
//               />
//             </svg>
//           </div>
//           <div className="ml-3">
//             <p className="text-sm text-blue-800">{message}</p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return fallback;
// }

// /**
//  *      네비게이션 메뉴 상태별 비활성화
//  */
// export function NavigationGuard({
//   children,
//   requiredFeatures = [],
//   disabledClassName = "opacity-50 cursor-not-allowed",
//   ...props
// }) {
//   const { canAccessFeature, hasRole } = useAuth();

//   // SUPER_ADMIN은 모든 네비게이션 접근 가능
//   if (hasRole("SUPER_ADMIN")) {
//     return children;
//   }

//   // 필요한 기능에 접근 가능한지 확인
//   const hasAccess =
//     requiredFeatures.length === 0 || requiredFeatures.some((feature) => canAccessFeature(feature));

//   if (!hasAccess) {
//     return React.cloneElement(children, {
//       className: `${children.props.className || ""} ${disabledClassName}`,
//       onClick: (e) => {
//         e.preventDefault();
//         e.stopPropagation();
//       },
//       "aria-disabled": true,
//       title: "현재 상태에서는 이 메뉴에 접근할 수 없습니다.",
//     });
//   }

//   return children;
// }

// /**
//  *      상태별 대시보드 레이아웃 보호
//  */
// export function DashboardLayoutGuard({ children, layout = "default" }) {
//   const { entityStatus, hasRole, isEntityActive } = useAuth();
//   const router = useRouter();

//   useEffect(() => {
//     // SUPER_ADMIN은 모든 레이아웃 접근 가능
//     if (hasRole("SUPER_ADMIN")) {
//       return;
//     }

//     // 비활성 상태에서는 제한된 레이아웃으로 전환
//     if (!isEntityActive() && layout !== "restricted") {
//       console.log("    DashboardLayoutGuard: Switching to restricted layout");
//       // 제한된 레이아웃으로 리다이렉트하거나 상태 변경
//       // 여기서는 일단 로그만 남김
//     }
//   }, [hasRole, isEntityActive, layout]);

//   return children;
// }

// // ===============================
// //      추가: 엔터티 상태 관련 커스텀 훅들
// // ===============================

// /**
//  *      페이지별 엔터티 상태 접근 권한 확인 훅
//  */
// export function usePageAccessByStatus() {
//   const auth = useAuth();
//   const entityStatus = useEntityStatus();
//   const featureAccess = useFeatureAccess();

//   return {
//     ...auth,
//     ...entityStatus,
//     ...featureAccess,

//     // 페이지별 접근 권한
//     canAccessDashboard: () => {
//       if (auth.hasRole("SUPER_ADMIN")) return true;
//       return entityStatus.isActive() || entityStatus.isInactive(); // terminated는 제외
//     },

//     canAccessDataPages: () => {
//       if (auth.hasRole("SUPER_ADMIN")) return true;
//       return entityStatus.isActive();
//     },

//     canAccessSettingsPages: () => {
//       if (auth.hasRole("SUPER_ADMIN")) return true;
//       return entityStatus.isActive() && featureAccess.canChangeSettings();
//     },

//     canAccessReportPages: () => {
//       if (auth.hasRole("SUPER_ADMIN")) return true;
//       return entityStatus.isActive() && featureAccess.canGenerateReports();
//     },

//     // 상태별 허용 경로 목록
//     getAllowedRoutes: () => {
//       const baseRoutes = ["/dashboard", "/profile", "/help"];

//       if (auth.hasRole("SUPER_ADMIN")) {
//         return ["*"]; // 모든 경로 접근 가능
//       }

//       if (entityStatus.isActive()) {
//         // 활성 상태: 역할에 따른 모든 경로
//         if (auth.isLaborOfficeUser()) {
//           return [...baseRoutes, "/labor-office"];
//         }
//         if (auth.isCompanyUser()) {
//           return [...baseRoutes, "/company"];
//         }
//         return baseRoutes;
//       }

//       if (entityStatus.isInactive()) {
//         // 비활성 상태: 읽기 전용 경로만
//         return [...baseRoutes, "/entity-status"];
//       }

//       // 종료 상태: 최소한의 경로만
//       return ["/dashboard", "/profile", "/entity-status"];
//     },

//     // 상태별 제한 정보
//     getAccessRestrictions: () => ({
//       currentStatus: entityStatus.entityStatus.entityStatus,
//       restrictedFeatures: entityStatus.getRestrictedFeatures(),
//       allowedActions: {
//         canView: entityStatus.isActive() || entityStatus.isInactive(),
//         canModify: entityStatus.isActive(),
//         canCreate: entityStatus.isActive(),
//         canDelete: entityStatus.isActive() && featureAccess.canModifyData(),
//         canExport: entityStatus.isActive() && featureAccess.canExportData(),
//         canImport: entityStatus.isActive() && featureAccess.canUploadFiles(),
//       },
//       statusMessage: entityStatus.getStatusMessage(),
//       contactInfo: null, // getAdminContactInfo()로 채워질 예정
//     }),
//   };
// }

// /**
//  *      실시간 상태 모니터링 훅
//  */
// export function useEntityStatusMonitor(options = {}) {
//   const {
//     checkInterval = 5 * 60 * 1000, // 5분마다 체크
//     enableRealtime = true,
//     onStatusChange = null,
//   } = options;

//   const { checkEntityStatus, entityStatus } = useAuth();
//   const [lastCheck, setLastCheck] = useState(null);

//   // 정기적 상태 체크
//   useEffect(() => {
//     if (!enableRealtime) return;

//     const interval = setInterval(async () => {
//       try {
//         await checkEntityStatus(false); // 캐시된 결과 사용
//         setLastCheck(new Date());
//       } catch (error) {
//         console.error("  EntityStatusMonitor: Failed to check status:", error);
//       }
//     }, checkInterval);

//     return () => clearInterval(interval);
//   }, [checkEntityStatus, checkInterval, enableRealtime]);

//   // 상태 변경 감지
//   useEffect(() => {
//     if (!enableRealtime || typeof window === "undefined") return;

//     const handleStatusChange = (event) => {
//       console.log("    EntityStatusMonitor: Status changed detected", event.detail);

//       if (onStatusChange) {
//         onStatusChange(event.detail);
//       }
//     };

//     window.addEventListener("entityStatusChanged", handleStatusChange);

//     return () => {
//       window.removeEventListener("entityStatusChanged", handleStatusChange);
//     };
//   }, [enableRealtime, onStatusChange]);

//   return {
//     currentStatus: entityStatus.entityStatus,
//     lastCheck,
//     isMonitoring: enableRealtime,
//     forceCheck: () => checkEntityStatus(true),
//   };
// }

// /**
//  *      네비게이션 메뉴 필터링 훅
//  */
// export function useNavigationFilter() {
//   const { entityStatus, hasRole, canAccessFeature } = useAuth();

//   const filterMenuItems = (menuItems) => {
//     if (hasRole("SUPER_ADMIN")) {
//       return menuItems; // SUPER_ADMIN은 모든 메뉴 표시
//     }

//     return menuItems.map((item) => {
//       const filteredItem = { ...item };

//       // 상태별 메뉴 비활성화
//       if (entityStatus.entityStatus !== "active") {
//         // 읽기 전용 메뉴만 활성화
//         if (!["dashboard", "profile", "help", "settings"].includes(item.key)) {
//           filteredItem.disabled = true;
//           filteredItem.tooltip = entityStatus.statusMessage;
//         }
//       }

//       // 기능별 메뉴 필터링
//       if (item.requiredFeature && !canAccessFeature(item.requiredFeature)) {
//         filteredItem.disabled = true;
//         filteredItem.tooltip = `${item.requiredFeature} 권한이 필요합니다.`;
//       }

//       // 하위 메뉴 재귀적 필터링
//       if (item.children) {
//         filteredItem.children = filterMenuItems(item.children);
//       }

//       return filteredItem;
//     });
//   };

//   return {
//     filterMenuItems,
//     getMenuStatus: (menuKey) => ({
//       isEnabled:
//         hasRole("SUPER_ADMIN") ||
//         entityStatus.entityStatus === "active" ||
//         ["dashboard", "profile", "help"].includes(menuKey),
//       tooltip: entityStatus.statusMessage,
//     }),
//   };
// }

// /**
//  *      SUPER_ADMIN 전용 페이지 보호 (최고 권한)
//  */
// export function SuperAdminGuard({ children, ...props }) {
//   return (
//     <AuthGuard
//       requireAuth={true}
//       requiredRoles={["SUPER_ADMIN"]}
//       redirectTo="/" // <--- 이 부분을 /login으로 변경
//       {...props}
//     >
//       {children}
//     </AuthGuard>
//   );
// }

// /**
//  * 노무사 사무실 전용 페이지 보호
//  */
// export function LaborOfficeGuard({ children, ...props }) {
//   return (
//     <AuthGuard
//       requireAuth={true}
//       requiredRoles={["LABOR_ADMIN", "LABOR_STAFF", "SUPER_ADMIN"]} //
//       SUPER_ADMIN도
//       접근
//       가능
//       redirectTo="/unauthorized"
//       {...props}
//     >
//       {children}
//     </AuthGuard>
//   );
// }

// /**
//  * 회사 전용 페이지 보호
//  */
// export function CompanyGuard({ children, ...props }) {
//   return (
//     <AuthGuard
//       requireAuth={true}
//       requiredRoles={["COMPANY_ADMIN", "COMPANY_HR", "SUPER_ADMIN"]} //
//       SUPER_ADMIN도
//       접근
//       가능
//       redirectTo="/unauthorized"
//       {...props}
//     >
//       {children}
//     </AuthGuard>
//   );
// }

// /**
//  * 관리자 전용 페이지 보호
//  */
// export function AdminGuard({ children, ...props }) {
//   return (
//     <AuthGuard
//       requireAuth={true}
//       requiredRoles={["SYSTEM_ADMIN", "SUPER_ADMIN"]} // SUPER_ADMIN도 접근 가
//       능
//       redirectTo="/unauthorized"
//       {...props}
//     >
//       {children}
//     </AuthGuard>
//   );
// }

// /**
//  * 근로자 전용 페이지 보호
//  */
// export function WorkerGuard({ children, ...props }) {
//   return (
//     <AuthGuard
//       requireAuth={true}
//       requiredRoles={["WORKER", "SUPER_ADMIN"]} // SUPER_ADMIN도 접근 가능
//       redirectTo="/unauthorized"
//       {...props}
//     >
//       {children}
//     </AuthGuard>
//   );
// }
// /**
//  * 공개 페이지 (로그인된 사용자는 대시보드로 리다이렉트)
//  */
// export function PublicOnlyGuard({ children, redirectTo = null, ...props }) {
//   return (
//     <AuthGuard requireAuth={false} redirectTo={redirectTo} {...props}>
//       {children}
//     </AuthGuard>
//   );
// }

// /**
//  * 특정 권한이 필요한 페이지 보호
//  */
// export function PermissionGuard({ children, resource, action, ...props }) {
//   return (
//     <AuthGuard
//       requireAuth={true}
//       requiredPermissions={[{ resource, action }]}
//       redirectTo="/unauthorized"
//       {...props}
//     >
//       {children}
//     </AuthGuard>
//   );
// }

// /**
//  * 회사 접근 권한 확인 (특정 회사 ID에 대한 접근 권한)
//  */
// export function CompanyAccessGuard({ children, companyId, ...props }) {
//   const { canAccessCompany, hasRole } = useAuth();

//   // SUPER_ADMIN은 모든 회사에 접근 가능
//   if (hasRole("SUPER_ADMIN") || canAccessCompany(companyId)) {
//     return (
//       <AuthGuard requireAuth={true} {...props}>
//         {children}
//       </AuthGuard>
//     );
//   }

//   // 접근 권한이 없으면 unauthorized 페이지로
//   return (
//     <AuthGuard requireAuth={true} redirectTo="/unauthorized" {...props}>
//       <div></div> {/* 빈 컴포넌트 */}
//     </AuthGuard>
//   );
// }

// /**
//  * 인증 상태에 따른 조건부 렌더링 (페이지 레벨이 아닌 컴포넌트 레벨)
//  */
// export function ConditionalAuth({
//   children,
//   fallback = null,
//   requireAuth = true,
//   roles = [],
//   permissions = [],
// }) {
//   const { isAuthenticated, hasRole, hasPermission } = useAuth();

//   // 인증 체크
//   if (requireAuth && !isAuthenticated) {
//     return fallback;
//   }

//   if (!requireAuth && isAuthenticated) {
//     return fallback;
//   }

//   // 역할 체크
//   if (roles.length > 0) {
//     const hasRequiredRole = roles.some((role) => hasRole(role));
//     if (!hasRequiredRole) {
//       return fallback;
//     }
//   }

//   // 권한 체크
//   if (permissions.length > 0) {
//     const hasRequiredPermission = permissions.some(({ resource, action }) =>
//       hasPermission(resource, action)
//     );
//     if (!hasRequiredPermission) {
//       return fallback;
//     }
//   }

//   return children;
// }

// /**
//  * Hook: 현재 사용자의 페이지 접근 권한 확인
//  */
// export function usePageAccess() {
//   const auth = useAuth();

//   return {
//     ...auth,
//     canAccessWorker: () => auth.hasRole("WORKER") || auth.hasRole("SUPER_ADMIN"),
//     canAccessSuperAdmin: () => auth.hasRole("SUPER_ADMIN"),
//     canAccessLaborOffice: () =>
//       auth.hasRole("LABOR_ADMIN") || auth.hasRole("LABOR_STAFF") || auth.hasRole("SUPER_ADMIN"),
//     canAccessCompany: () =>
//       auth.hasRole("COMPANY_ADMIN") || auth.hasRole("COMPANY_HR") || auth.hasRole("SUPER_ADMIN"),
//     canAccessAdmin: () => auth.hasRole("SYSTEM_ADMIN") || auth.hasRole("SUPER_ADMIN"),

//     getAccessibleRoutes: () => {
//       const routes = ["/dashboard"];

//       if (auth.hasRole("SUPER_ADMIN")) {
//         routes.push("/super-admin", "/labor-office", "/company", "/worker", "/admin"); //      /worker 추가
//       } else {
//         if (auth.hasRole("WORKER")) {
//           routes.push("/worker"); //      WORKER 경로 추가
//         }
//         if (auth.hasRole("LABOR_ADMIN") || auth.hasRole("LABOR_STAFF")) {
//           routes.push("/labor-office");
//         }
//         if (auth.hasRole("COMPANY_ADMIN") || auth.hasRole("COMPANY_HR")) {
//           routes.push("/company");
//         }
//         if (auth.hasRole("SYSTEM_ADMIN")) {
//           routes.push("/admin");
//         }
//       }
//       return routes;
//     },
//   };
// }
