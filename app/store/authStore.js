// File: store/authStore.js (완전히 수정된 버전 - HMR 대응 + accessToken 추가)
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // 기존 상태
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
      error: null,
      permissions: {
        roles: [],
        permissions: {},
      },

      // 📧 이메일 인증 모달 상태 추가
      emailVerificationModal: {
        isOpen: false,
        userEmail: "",
        userId: null,
        canResendEmail: true,
        verificationAttempts: 0,
      },
      entityStatus: {
        entityType: null, // 'system' | 'labor_office' | 'company' | 'worker' | 'unknown'
        entityStatus: "active", // 직접 상태: 'active' | 'inactive' | 'terminated'
        effectiveStatus: "active", // 🆕 추가: 효과적 상태 (계층적 상태 고려)
        entityId: null,
        entityName: "",
        statusMessage: "",
        canAccess: true,
        restrictedFeatures: [],
        adminContact: "",
        roleCategory: null, // 'system' | 'labor_office' | 'company'
        roleCode: null, // 'SUPER_ADMIN' | 'LABOR_ADMIN' | etc.
        lastStatusCheck: null,
        isStatusLoading: false,
      },

      // 🆕 초기화 액션 (HMR 대응 강화)
      initialize: async () => {
        const state = get();

        if (state.isInitialized || state.isLoading) {
          return state.isAuthenticated;
        }

        set({ isLoading: true });

        try {
          const { accessToken, refreshToken } = state;

          console.log("🔍 AuthStore Initialize - Token check:", {
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken,
            isAuthenticated: state.isAuthenticated,
          });

          if (!accessToken && !refreshToken) {
            console.log("🔍 No tokens found, setting unauthenticated");
            set({
              isLoading: false,
              isInitialized: true,
              isAuthenticated: false,
            });
            return false;
          }

          // 🔧 HMR 환경에서 토큰이 있으면 상태 복원
          if (accessToken && state.user) {
            console.log("🔄 HMR detected - restoring auth state from persisted data");
            set({
              isAuthenticated: true,
              isLoading: false,
              isInitialized: true,
              error: null,
            });
            return true;
          }

          const response = await fetch("/api/auth/verify", {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            console.log("✅ Token verification successful");
            set({
              user: data.user,
              isAuthenticated: true,
              isLoading: false,
              isInitialized: true,
              error: null,
              permissions: {
                roles: data.user.roles || [],
                permissions: data.user.permissions || {},
              },
            });
            return true;
          } else if (response.status === 401) {
            console.log("🔄 Token expired, attempting refresh");
            const refreshed = await get().refreshAccessToken();
            set({
              isLoading: false,
              isInitialized: true,
            });
            return refreshed;
          } else {
            console.error("🔐 Token verification failed");
            set({
              user: null,
              accessToken: null,
              refreshToken: null,
              isAuthenticated: false,
              isLoading: false,
              isInitialized: true,
              error: null,
              permissions: {
                roles: [],
                permissions: {},
              },
            });
            return false;
          }
        } catch (error) {
          console.error("🔐 Authentication initialization failed:", error);

          // 🔧 HMR 환경에서 네트워크 에러 시 기존 상태 유지
          if (error.name === "TypeError" && error.message.includes("fetch")) {
            const { user, accessToken } = state;
            if (user && accessToken) {
              console.log("🔄 Network error during HMR - maintaining existing auth state");
              set({
                isAuthenticated: true,
                isLoading: false,
                isInitialized: true,
                error: null,
              });
              return true;
            }
          }

          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: true,
            error: null,
            permissions: {
              roles: [],
              permissions: {},
            },
          });
          return false;
        }
      },

      // 🔧 완전히 수정된 로그인 함수 (throw 완전 제거)
      login: async (credentials) => {
        set({ isLoading: true, error: null });

        try {
          console.log("🔄 Attempting login with:", credentials.emailOrUsername);

          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(credentials),
          });

          const data = await response.json();

          console.log("🔍 API Response:", {
            status: response.status,
            ok: response.ok,
            data: data,
          });

          // 🔧 응답 실패 처리 (throw 사용하지 않음)
          if (!response.ok) {
            // 📧 이메일 인증 에러 처리
            if (data.code === "EMAIL_NOT_VERIFIED") {
              console.log("📧 AuthStore: Email verification required, opening modal");

              set({
                isLoading: false,
                error: null, // 📧 이메일 인증은 에러가 아니므로 null
                isAuthenticated: false,
                emailVerificationModal: {
                  isOpen: true,
                  userEmail: data.data?.email || "",
                  userId: data.data?.userId || null,
                  canResendEmail: data.data?.canResendEmail || true,
                  verificationAttempts: data.data?.verificationAttempts || 0,
                },
              });

              return {
                success: false,
                error: data.message,
                code: data.code,
                data: data.data,
              };
            }

            // 🔧 기타 실제 에러 - throw 대신 상태 설정 후 return
            console.log("❌ AuthStore: Login failed with code:", data.code);
            const errorMessage = data.message || "로그인에 실패했습니다.";

            console.log("🔧 AuthStore: Setting error state:", errorMessage);
            set({
              isLoading: false,
              error: errorMessage,
              isAuthenticated: false,
            });

            return {
              success: false,
              error: errorMessage,
              code: data.code,
              data: data.data,
            };
          }

          // ✅ 로그인 성공 처리
          console.log("✅ AuthStore: Login successful, setting auth state");

          set({
            user: data.data.user,
            accessToken: data.data.accessToken,
            refreshToken: data.data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true,
            error: null,
            permissions: {
              roles: data.data.user.roles || [],
              permissions: data.data.user.permissions || {},
            },
            // 성공시 모달 닫기
            emailVerificationModal: {
              isOpen: false,
              userEmail: "",
              userId: null,
              canResendEmail: true,
              verificationAttempts: 0,
            },
            // 🆕 추가: 엔터티 상태 관련 (기존 통일된 시스템 활용)
            entityStatus: {
              entityType: null, // 'system' | 'labor_office' | 'company' | 'worker' | 'unknown'
              entityStatus: "active", // 직접 상태: 'active' | 'inactive' | 'terminated'
              effectiveStatus: "active", // 🆕 추가: 효과적 상태 (계층적 상태 고려)
              entityId: null,
              entityName: "",
              statusMessage: "",
              canAccess: true,
              restrictedFeatures: [],
              adminContact: "",
              roleCategory: null, // 'system' | 'labor_office' | 'company'
              roleCode: null, // 'SUPER_ADMIN' | 'LABOR_ADMIN' | etc.
              lastStatusCheck: null,
              isStatusLoading: false,
            },
          });

          return { success: true, data: data.data };
        } catch (error) {
          // 🔧 네트워크 에러만 여기서 처리
          console.error("❌ AuthStore: Network error:", error);
          const networkErrorMessage =
            "네트워크 오류가 발생했습니다. 인터넷 연결을 확인하고 다시 시도해주세요.";

          set({
            isLoading: false,
            error: networkErrorMessage,
            isAuthenticated: false,
          });

          return {
            success: false,
            error: networkErrorMessage,
            code: "NETWORK_ERROR",
          };
        }
      },

      // 📧 이메일 인증 모달 관련 액션들
      openEmailVerificationModal: (data) => {
        console.log("🔍 AuthStore: Opening email verification modal with:", data);
        set({
          emailVerificationModal: {
            isOpen: true,
            userEmail: data.userEmail || "",
            userId: data.userId || null,
            canResendEmail: data.canResendEmail || true,
            verificationAttempts: data.verificationAttempts || 0,
          },
        });
      },

      closeEmailVerificationModal: () => {
        console.log("🔍 AuthStore: Closing email verification modal");
        set({
          emailVerificationModal: {
            isOpen: false,
            userEmail: "",
            userId: null,
            canResendEmail: true,
            verificationAttempts: 0,
          },
        });
      },

      // 🔧 회원가입 함수 수정 (throw 제거)
      register: async (userData) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(userData),
          });

          const data = await response.json();

          if (!response.ok) {
            const errorMessage = data.message || "회원가입에 실패했습니다.";
            set({
              isLoading: false,
              error: errorMessage,
            });
            return { success: false, error: errorMessage };
          }

          set({ isLoading: false, error: null });
          return { success: true, data };
        } catch (error) {
          const errorMessage = "네트워크 오류가 발생했습니다. 다시 시도해주세요.";
          set({
            isLoading: false,
            error: errorMessage,
          });
          return { success: false, error: errorMessage };
        }
      },

      logout: async () => {
        console.log("🚨 LOGOUT CALLED! Stack trace:");
        console.trace();
        console.log("🚨 Current timestamp:", new Date().toLocaleTimeString());

        set({ isLoading: true });

        try {
          await fetch("/api/auth/logout", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${get().accessToken}`,
            },
          });
        } catch (error) {
          console.error("로그아웃 요청 실패:", error);
        } finally {
          console.log("🚨 Executing logout - clearing all state");
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: true,
            error: null,
            permissions: {
              roles: [],
              permissions: {},
            },
            emailVerificationModal: {
              isOpen: false,
              userEmail: "",
              userId: null,
              canResendEmail: true,
              verificationAttempts: 0,
            },
            // 🆕 추가: 엔터티 상태 관련 (기존 통일된 시스템 활용)
            entityStatus: {
              entityType: null, // 'system' | 'labor_office' | 'company' | 'worker' | 'unknown'
              entityStatus: "active", // 직접 상태: 'active' | 'inactive' | 'terminated'
              effectiveStatus: "active", // 🆕 추가: 효과적 상태 (계층적 상태 고려)
              entityId: null,
              entityName: "",
              statusMessage: "",
              canAccess: true,
              restrictedFeatures: [],
              adminContact: "",
              roleCategory: null, // 'system' | 'labor_office' | 'company'
              roleCode: null, // 'SUPER_ADMIN' | 'LABOR_ADMIN' | etc.
              lastStatusCheck: null,
              isStatusLoading: false,
            },
          });
        }
      },

      // 🔧 토큰 갱신 함수 수정 (throw 제거)
      refreshAccessToken: async () => {
        const { refreshToken } = get();

        if (!refreshToken) {
          await get().logout();
          return false;
        }

        try {
          const response = await fetch("/api/auth/refresh", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ refreshToken }),
          });

          if (!response.ok) {
            console.error("토큰 갱신 실패");
            await get().logout();
            return false;
          }

          const data = await response.json();

          set({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            user: data.user,
            isAuthenticated: true,
            permissions: {
              roles: data.user.roles || [],
              permissions: data.user.permissions || {},
            },
          });

          return true;
        } catch (error) {
          console.error("토큰 갱신 실패:", error);
          await get().logout();
          return false;
        }
      },

      waitForInitialization: () => {
        return new Promise((resolve) => {
          const checkInitialized = () => {
            const state = get();
            if (state.isInitialized) {
              resolve(state.isAuthenticated);
            } else {
              setTimeout(checkInitialized, 100);
            }
          };
          checkInitialized();
        });
      },

      // 권한 확인 헬퍼 함수들
      hasPermission: (resource, action) => {
        const { permissions } = get();
        const resourcePermissions = permissions.permissions[resource];

        if (!resourcePermissions) return false;

        return resourcePermissions.includes(action) || resourcePermissions.includes("*");
      },

      hasRole: (roleCode) => {
        const { permissions } = get();
        return permissions.roles.some((role) => role.code === roleCode);
      },

      canAccessCompany: (companyId) => {
        const { permissions } = get();
        return permissions.roles.some((role) => {
          if (role.scope.type === "global") return true;
          if (role.scope.type === "company" && role.scope.companyId === companyId) return true;
          return false;
        });
      },

      isLaborOfficeUser: () => {
        return get().hasRole("LABOR_ADMIN") || get().hasRole("LABOR_STAFF");
      },

      isCompanyUser: () => {
        return get().hasRole("COMPANY_ADMIN") || get().hasRole("COMPANY_HR");
      },

      isSystemAdmin: () => {
        return get().hasRole("SUPER_ADMIN") || get().hasRole("SYSTEM_ADMIN");
      },

      getDefaultDashboard: () => {
        const state = get();
        const roles = state.permissions.roles || [];

        if (roles.some((role) => role.code === "SUPER_ADMIN")) {
          return "/super-admin";
        } else if (roles.some((role) => role.code === "SYSTEM_ADMIN")) {
          return "/admin";
        } else if (
          roles.some((role) => role.code === "LABOR_ADMIN" || role.code === "LABOR_STAFF")
        ) {
          return "/labor-office/dashboard";
        } else if (
          roles.some((role) => role.code === "COMPANY_ADMIN" || role.code === "COMPANY_HR")
        ) {
          return "/company/dashboard";
        } else if (roles.some((role) => role.code === "WORKER")) {
          return "/worker/dashboard"; // 🆕 WORKER 대시보드 추가
        } else {
          return "/dashboard";
        }
      },

      clearError: () => {
        console.log("🔧 AuthStore: Clearing error");
        console.trace("🔍 clearError called from:");
        console.log("🚨 clearError 호출 무시됨 - 수동 닫기만 허용");
      },

      // 🔧 수동 에러 닫기 함수 (임시)
      forceCloseError: () => {
        console.log("🔧 AuthStore: Force closing error manually");
        set({ error: null });
      },

      setAuthState: (authData) => {
        set({
          user: authData.user,
          accessToken: authData.accessToken,
          refreshToken: authData.refreshToken,
          isAuthenticated: true,
          isInitialized: true,
          permissions: {
            roles: authData.user.roles || [],
            permissions: authData.user.permissions || {},
          },
        });
      },

      forceReInitialize: async () => {
        set({ isInitialized: false });
        return await get().initialize();
      },
      // 🔐 비밀번호 찾기 요청 (이메일 발송)
      forgotPassword: async (email) => {
        set({ isLoading: true, error: null });

        try {
          console.log("🔄 Requesting password reset for:", email);

          const response = await fetch("/api/auth/forgot-password", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email }),
          });

          const data = await response.json();

          console.log("🔍 Forgot password response:", {
            status: response.status,
            ok: response.ok,
            data: data,
          });

          if (!response.ok) {
            const errorMessage = data.message || "비밀번호 재설정 요청에 실패했습니다.";
            console.log("❌ AuthStore: Forgot password failed:", errorMessage);

            set({
              isLoading: false,
              error: errorMessage,
            });

            return {
              success: false,
              error: errorMessage,
              code: data.code,
            };
          }

          // ✅ 성공 응답 (보안상 항상 성공 메시지)
          console.log("✅ AuthStore: Password reset email sent");

          set({
            isLoading: false,
            error: null,
          });

          return {
            success: true,
            message:
              data.message || "이메일이 등록되어 있다면 비밀번호 재설정 링크를 발송했습니다.",
          };
        } catch (error) {
          console.error("❌ AuthStore: Forgot password network error:", error);
          const networkErrorMessage =
            "네트워크 오류가 발생했습니다. 인터넷 연결을 확인하고 다시 시도해주세요.";

          set({
            isLoading: false,
            error: networkErrorMessage,
          });

          return {
            success: false,
            error: networkErrorMessage,
            code: "NETWORK_ERROR",
          };
        }
      },

      // 🔐 비밀번호 재설정 토큰 검증
      verifyResetToken: async (token) => {
        set({ isLoading: true, error: null });

        try {
          console.log("🔄 Verifying reset token");

          const response = await fetch("/api/auth/verify-reset-token", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token }),
          });

          const data = await response.json();

          console.log("🔍 Token verification response:", {
            status: response.status,
            ok: response.ok,
            valid: data.valid,
          });

          set({ isLoading: false });

          if (!response.ok || !data.valid) {
            const errorMessage = data.message || "유효하지 않은 토큰입니다.";
            console.log("❌ AuthStore: Invalid reset token");

            set({ error: errorMessage });

            return {
              success: false,
              error: errorMessage,
            };
          }

          console.log("✅ AuthStore: Reset token is valid");

          return {
            success: true,
            user: data.user,
            expiresAt: data.expiresAt,
          };
        } catch (error) {
          console.error("❌ AuthStore: Token verification network error:", error);
          const networkErrorMessage = "네트워크 오류가 발생했습니다.";

          set({
            isLoading: false,
            error: networkErrorMessage,
          });

          return {
            success: false,
            error: networkErrorMessage,
          };
        }
      },

      // 🔐 새 비밀번호 설정
      resetPassword: async (token, newPassword, confirmPassword) => {
        set({ isLoading: true, error: null });

        try {
          console.log("🔄 Resetting password");

          // 클라이언트 측 검증
          if (!newPassword || !confirmPassword) {
            set({
              isLoading: false,
              error: "모든 필드를 입력해주세요.",
            });
            return {
              success: false,
              error: "모든 필드를 입력해주세요.",
            };
          }

          if (newPassword !== confirmPassword) {
            set({
              isLoading: false,
              error: "새 비밀번호와 확인 비밀번호가 일치하지 않습니다.",
            });
            return {
              success: false,
              error: "새 비밀번호와 확인 비밀번호가 일치하지 않습니다.",
            };
          }

          if (newPassword.length < 8) {
            set({
              isLoading: false,
              error: "새 비밀번호는 최소 8자 이상이어야 합니다.",
            });
            return {
              success: false,
              error: "새 비밀번호는 최소 8자 이상이어야 합니다.",
            };
          }

          const response = await fetch("/api/auth/reset-password", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              token,
              newPassword,
              confirmPassword,
            }),
          });

          const data = await response.json();

          console.log("🔍 Reset password response:", {
            status: response.status,
            ok: response.ok,
            data: data,
          });

          if (!response.ok) {
            const errorMessage = data.message || "비밀번호 재설정에 실패했습니다.";
            console.log("❌ AuthStore: Password reset failed:", errorMessage);

            set({
              isLoading: false,
              error: errorMessage,
            });

            return {
              success: false,
              error: errorMessage,
              code: data.code,
            };
          }

          console.log("✅ AuthStore: Password reset successful");

          set({
            isLoading: false,
            error: null,
          });

          return {
            success: true,
            message: data.message || "비밀번호가 성공적으로 재설정되었습니다.",
          };
        } catch (error) {
          console.error("❌ AuthStore: Reset password network error:", error);
          const networkErrorMessage = "네트워크 오류가 발생했습니다.";

          set({
            isLoading: false,
            error: networkErrorMessage,
          });

          return {
            success: false,
            error: networkErrorMessage,
            code: "NETWORK_ERROR",
          };
        }
      },
    }),
    {
      name: "insurance-auth-storage",
      storage: createJSONStorage(() => localStorage),
      // 🔧 HMR 환경에서 persist 강화
      // partialize: (state) => ({
      //   user: state.user,
      //   accessToken: state.accessToken,
      //   refreshToken: state.refreshToken,
      //   isAuthenticated: state.isAuthenticated,
      //   permissions: state.permissions,
      //   // 모달 상태는 영구 저장하지 않음 (새로고침시 초기화)
      // }),
      // 🔧 HMR 대응 강화된 rehydration
      onRehydrateStorage: () => {
        console.log("🔄 AuthStore: Starting rehydration...");
        return (state, error) => {
          if (error) {
            console.error("🔧 AuthStore: Rehydration error:", error);
            return;
          }

          if (state) {
            console.log("🔄 AuthStore: Rehydration successful, initializing...", {
              hasUser: !!state.user,
              hasAccessToken: !!state.accessToken,
              isAuthenticated: state.isAuthenticated,
            });

            // 🔧 HMR 환경에서는 즉시 초기화
            setTimeout(() => {
              console.log("🔄 AuthStore: Calling initialize from rehydration");
              state.initialize().catch((error) => {
                console.error("🔧 AuthStore: Initialize error after rehydration:", error);
              });
            }, 100);
          } else {
            console.log("🔄 AuthStore: No state to rehydrate");
          }
        };
      },
      // 🔧 HMR 감지를 위한 추가 설정
      serialize: (state) => {
        console.log("💾 AuthStore: Serializing state for persistence");
        return JSON.stringify(state);
      },
      deserialize: (str) => {
        console.log("📖 AuthStore: Deserializing state from persistence");
        try {
          return JSON.parse(str);
        } catch (error) {
          console.error("❌ AuthStore: Deserialization error:", error);
          return {};
        }
      },
      // 🆕 추가: 엔터티 상태 확인 액션
      checkEntityStatus: async (forceRefresh = false) => {
        const state = get();

        if (!state.user || !state.isAuthenticated) {
          console.log("🔍 EntityStatus: No user authenticated, skipping status check");
          return;
        }

        // 이미 로딩 중인 경우 중복 요청 방지
        if (state.entityStatus.isStatusLoading && !forceRefresh) {
          console.log("🔍 EntityStatus: Already loading, skipping");
          return;
        }

        set({
          entityStatus: {
            ...state.entityStatus,
            isStatusLoading: true,
          },
        });

        try {
          console.log(`🔍 EntityStatus: Checking status for user ${state.user.user_id}`);

          // 동적 import로 순환 참조 방지
          const { getCachedEntityStatus } = await import("@/lib/database.js");

          const statusInfo = await getCachedEntityStatus(state.user.user_id, forceRefresh);

          const newEntityStatus = {
            entityType: statusInfo.entityType,
            entityStatus: statusInfo.entityStatus,
            effectiveStatus: statusInfo.effectiveStatus, // 🆕 추가: 효과적 상태
            entityId: statusInfo.entityId,
            entityName: statusInfo.entityName || "",
            statusMessage: statusInfo.message || "",
            canAccess:
              statusInfo.effectiveStatus === "active" || statusInfo.roleCategory === "system", // 효과적 상태 기준
            restrictedFeatures: statusInfo.restrictedFeatures || [],
            adminContact: statusInfo.adminContact || "",
            roleCategory: statusInfo.roleCategory,
            roleCode: statusInfo.roleCode,
            lastStatusCheck: new Date().toISOString(),
            isStatusLoading: false,
          };

          set({
            entityStatus: newEntityStatus,
          });

          console.log(`✅ EntityStatus: Status updated for user ${state.user.user_id}:`, {
            entityType: statusInfo.entityType,
            entityStatus: statusInfo.entityStatus,
            roleCategory: statusInfo.roleCategory,
            canAccess: newEntityStatus.canAccess,
          });

          // 상태 변경 감지 및 알림
          const oldStatus = state.entityStatus.entityStatus;
          if (oldStatus && oldStatus !== statusInfo.entityStatus) {
            console.log(
              `🔄 EntityStatus: Status changed from ${oldStatus} to ${statusInfo.entityStatus}`
            );

            // 상태 변경 알림 생성 (필요한 경우)
            if (typeof window !== "undefined") {
              const { createStatusChangeNotification } = await import("@/lib/database.js");
              const notification = createStatusChangeNotification(
                oldStatus,
                statusInfo.entityStatus,
                statusInfo.roleCategory
              );

              // 상태 변경 이벤트 발생 (다른 컴포넌트에서 감지 가능)
              window.dispatchEvent(
                new CustomEvent("entityStatusChanged", {
                  detail: { oldStatus, newStatus: statusInfo.entityStatus, notification },
                })
              );
            }
          }
        } catch (error) {
          console.error("❌ EntityStatus: Failed to check entity status:", error);

          // 에러 시 안전한 기본값 설정
          set({
            entityStatus: {
              entityType: "unknown",
              entityStatus: "inactive",
              entityId: null,
              entityName: "Error",
              statusMessage: "상태 확인 중 오류가 발생했습니다.",
              canAccess: false,
              restrictedFeatures: [
                "data_modification",
                "report_generation",
                "setting_changes",
                "data_view",
              ],
              adminContact: "시스템 관리자에게 문의하세요.",
              roleCategory: "unknown",
              roleCode: "unknown",
              lastStatusCheck: new Date().toISOString(),
              isStatusLoading: false,
            },
          });
        }
      },

      // 🆕 추가: 엔터티 상태 강제 새로고침
      refreshEntityStatus: async () => {
        console.log("🔄 EntityStatus: Force refreshing status");
        await get().checkEntityStatus(true);
      },

      // 🆕 추가: 기존 initialize 함수에 상태 체크 추가
      // (기존 initialize 함수를 수정하지 않고, 새로운 함수로 래핑)
      initializeWithStatusCheck: async () => {
        const state = get();

        // 기존 initialize 실행
        const result = await state.initialize();

        // 🆕 추가: 인증 성공 후 엔터티 상태 확인
        if (result && get().isAuthenticated) {
          // 상태 체크를 비동기로 실행 (initialize 블로킹 방지)
          setTimeout(async () => {
            await get().checkEntityStatus();
          }, 100);
        }

        return result;
      },

      // 🆕 추가: 기존 login 함수에 상태 체크 추가
      // (기존 login 함수를 수정하지 않고, 래핑)
      loginWithStatusCheck: async (credentials) => {
        const state = get();

        // 기존 login 실행
        const result = await state.login(credentials);

        // 🆕 추가: 로그인 성공 후 엔터티 상태 확인
        if (result.success) {
          // 상태 체크를 비동기로 실행 (login 블로킹 방지)
          setTimeout(async () => {
            await get().checkEntityStatus();
          }, 100);
        }

        return result;
      },

      // 🆕 추가: 엔터티 상태 관련 헬퍼 함수들 (효과적 상태 기준)
      isEntityActive: () => {
        const { entityStatus, user } = get();

        // SUPER_ADMIN은 항상 활성으로 처리
        if (
          user?.roles?.some((role) => role.code === "SUPER_ADMIN") ||
          entityStatus.roleCategory === "system"
        ) {
          return true;
        }

        // 효과적 상태 기준으로 판단 (계층적 상태 고려)
        return entityStatus.effectiveStatus === "active";
      },

      canAccessFeature: (feature) => {
        const { entityStatus, user } = get();

        // SUPER_ADMIN은 모든 기능 접근 가능
        if (
          user?.roles?.some((role) => role.code === "SUPER_ADMIN") ||
          entityStatus.roleCategory === "system"
        ) {
          return true;
        }

        return !entityStatus.restrictedFeatures.includes(feature);
      },

      getStatusMessage: () => {
        const { entityStatus } = get();
        return entityStatus.statusMessage || "";
      },

      getEntityInfo: () => {
        const { entityStatus } = get();
        return {
          type: entityStatus.entityType,
          name: entityStatus.entityName,
          status: entityStatus.entityStatus,
          category: entityStatus.roleCategory,
          code: entityStatus.roleCode,
        };
      },

      isStatusLoading: () => {
        const { entityStatus } = get();
        return entityStatus.isStatusLoading;
      },

      // 🆕 추가: 상태별 접근 가능한 기능 목록 조회 (효과적 상태 기준)
      getAccessibleFeatures: async () => {
        const { entityStatus } = get();

        try {
          const { getAccessibleFeatures } = await import("@/lib/database.js");

          // 효과적 상태를 사용하여 기능 접근성 판단
          return getAccessibleFeatures(
            entityStatus.effectiveStatus, // 🔄 수정: 효과적 상태 사용
            entityStatus.roleCategory,
            entityStatus.entityType
          );
        } catch (error) {
          console.error("❌ Failed to get accessible features:", error);

          // 에러 시 안전한 기본값
          return {
            canViewDashboard: true,
            canManageData: false,
            canAccessReports: false,
            canModifySettings: false,
            canUploadFiles: false,
            canExportData: false,
            message: "기능 접근 권한을 확인할 수 없습니다.",
          };
        }
      },

      // 🆕 추가: 관리자 연락처 정보 조회
      getAdminContactInfo: async () => {
        const { entityStatus } = get();

        try {
          const { getAdminContactInfo } = await import("@/lib/database.js");

          return getAdminContactInfo(entityStatus.roleCategory, entityStatus.entityType);
        } catch (error) {
          console.error("❌ Failed to get admin contact info:", error);

          return {
            title: "시스템 관리자",
            message: "시스템 관리자에게 문의하세요.",
            action: "고객지원 센터 연락",
          };
        }
      },

      // 🆕 추가: 상태별 대시보드 경로 반환
      getDefaultDashboardByStatus: async () => {
        const { entityStatus } = get();

        try {
          const { getDefaultDashboardByRole } = await import("@/lib/database.js");

          return getDefaultDashboardByRole(entityStatus.roleCategory, entityStatus.roleCode);
        } catch (error) {
          console.error("❌ Failed to get default dashboard:", error);
          return "/dashboard";
        }
      },

      // ===============================
      // 🆕 추가: persist 설정에 entityStatus 추가
      // ===============================

      // 기존 partialize 함수 수정
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        permissions: state.permissions,
        // 🆕 추가: entityStatus도 영구 저장 (isStatusLoading 제외)
        entityStatus: {
          ...state.entityStatus,
          isStatusLoading: false, // 로딩 상태는 저장하지 않음
        },
      }),
    }
  )
);

// 🔧 useAuth 훅 (accessToken 추가 + 디버깅 로그)
export const useAuth = () => {
  const store = useAuthStore();

  // 🔍 디버깅: error 상태 변화 추적
  // console.log("🔍 useAuth hook - current error:", store.error);

  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    isInitialized: store.isInitialized,
    error: store.error,
    accessToken: store.accessToken, // 🔧 추가된 accessToken!
    refreshToken: store.refreshToken, // 🔧 추가된 refreshToken!
    login: store.login,
    logout: store.logout,
    register: store.register,
    hasRole: store.hasRole,
    hasPermission: store.hasPermission,
    getDefaultDashboard: store.getDefaultDashboard,
    waitForInitialization: store.waitForInitialization,
    clearError: store.clearError,
    forceCloseError: store.forceCloseError,
    // 📧 모달 관련 추가
    emailVerificationModal: store.emailVerificationModal,
    openEmailVerificationModal: store.openEmailVerificationModal,
    closeEmailVerificationModal: store.closeEmailVerificationModal,
    // 🔧 기타 유틸리티 추가
    initialize: store.initialize,
    forceReInitialize: store.forceReInitialize,
    setAuthState: store.setAuthState,
    canAccessCompany: store.canAccessCompany,
    isLaborOfficeUser: store.isLaborOfficeUser,
    isCompanyUser: store.isCompanyUser,
    isSystemAdmin: store.isSystemAdmin,

    // 🆕 추가: 엔터티 상태 관련
    entityStatus: store.entityStatus,
    checkEntityStatus: store.checkEntityStatus,
    refreshEntityStatus: store.refreshEntityStatus,
    initializeWithStatusCheck: store.initializeWithStatusCheck,
    loginWithStatusCheck: store.loginWithStatusCheck,
    isEntityActive: store.isEntityActive,
    canAccessFeature: store.canAccessFeature,
    getStatusMessage: store.getStatusMessage,
    getEntityInfo: store.getEntityInfo,
    isStatusLoading: store.isStatusLoading,
    getAccessibleFeatures: store.getAccessibleFeatures,
    getAdminContactInfo: store.getAdminContactInfo,
    getDefaultDashboardByStatus: store.getDefaultDashboardByStatus,

    // 🔐 새로 추가: 비밀번호 리셋 관련 함수들
    forgotPassword: store.forgotPassword,
    verifyResetToken: store.verifyResetToken,
    resetPassword: store.resetPassword,
  };
};

// 기존 createAuthenticatedRequest는 그대로 유지
export const createAuthenticatedRequest = () => {
  const { accessToken, refreshAccessToken, logout } = useAuthStore.getState();

  return async (url, options = {}) => {
    let token = accessToken;

    let response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      const refreshed = await refreshAccessToken();

      if (refreshed) {
        const newToken = useAuthStore.getState().accessToken;
        response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${newToken}`,
          },
        });
      } else {
        logout();
        console.error("인증이 만료되었습니다. 다시 로그인해주세요.");
        return null;
      }
    }

    return response;
  };
};

/**
 * 🆕 엔터티 상태 전용 훅
 */
export const useEntityStatus = () => {
  const {
    entityStatus,
    checkEntityStatus,
    refreshEntityStatus,
    isEntityActive,
    canAccessFeature,
    getStatusMessage,
    getEntityInfo,
    isStatusLoading,
    getAccessibleFeatures,
    getAdminContactInfo,
  } = useAuth();

  return {
    entityStatus,
    checkEntityStatus,
    refreshEntityStatus,
    isEntityActive,
    canAccessFeature,
    getStatusMessage,
    getEntityInfo,
    isStatusLoading,
    getAccessibleFeatures,
    getAdminContactInfo,

    // 상태별 체크 헬퍼들 (효과적 상태 기준)
    isActive: () => entityStatus.effectiveStatus === "active",
    isInactive: () => entityStatus.effectiveStatus === "inactive",
    isTerminated: () => entityStatus.effectiveStatus === "terminated",
    isSystemUser: () => entityStatus.roleCategory === "system",
    isLaborOfficeUser: () => entityStatus.roleCategory === "labor_office",
    isCompanyUser: () => entityStatus.roleCategory === "company",
    isWorker: () => entityStatus.roleCode === "WORKER",

    // 🆕 추가: 직접 상태와 효과적 상태 비교
    getStatusComparison: () => ({
      directStatus: entityStatus.entityStatus,
      effectiveStatus: entityStatus.effectiveStatus,
      isInherited: entityStatus.entityStatus !== entityStatus.effectiveStatus,
      statusReason:
        entityStatus.entityStatus !== entityStatus.effectiveStatus
          ? "상위 엔터티의 상태로 인해 제한됨"
          : "직접 설정된 상태",
    }),
  };
};

/**
 * 🆕 기능 접근 권한 체크 훅
 */
export const useFeatureAccess = () => {
  const { canAccessFeature, entityStatus } = useAuth();

  return {
    canModifyData: () => canAccessFeature("data_modification"),
    canGenerateReports: () => canAccessFeature("report_generation"),
    canChangeSettings: () => canAccessFeature("setting_changes"),
    canViewData: () => canAccessFeature("data_view"),
    canUploadFiles: () => canAccessFeature("file_upload"),
    canExportData: () => canAccessFeature("data_export"),

    // 전체 기능 체크
    getFeatureAccess: () => ({
      canModifyData: canAccessFeature("data_modification"),
      canGenerateReports: canAccessFeature("report_generation"),
      canChangeSettings: canAccessFeature("setting_changes"),
      canViewData: canAccessFeature("data_view"),
      canUploadFiles: canAccessFeature("file_upload"),
      canExportData: canAccessFeature("data_export"),
    }),

    // 제한된 기능 목록
    getRestrictedFeatures: () => entityStatus.restrictedFeatures || [],
  };
};
