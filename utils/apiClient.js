// 📁 utils/apiClient.js
/**
 * API 통신 클라이언트
 * 4대보험 취득상실 통합 관리 시스템용 HTTP 클라이언트
 */

// 기본 API 설정
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const DEFAULT_TIMEOUT = 30000; // 30초

/**
 * HTTP 응답 상태 코드
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

/**
 * API 에러 클래스
 */
export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/**
 * 로컬 스토리지에서 토큰 관리
 */
const TokenManager = {
  getAccessToken: () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("access_token") || localStorage.getItem("accessToken");
    }
    return null;
  },

  setAccessToken: (token) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", token);
      localStorage.setItem("accessToken", token); // 호환성을 위해 두 키 모두 저장
    }
  },

  getRefreshToken: () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("refresh_token") || localStorage.getItem("refreshToken");
    }
    return null;
  },

  setRefreshToken: (token) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("refresh_token", token);
      localStorage.setItem("refreshToken", token); // 호환성을 위해 두 키 모두 저장
    }
  },

  clearTokens: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user_info");
      // 호환성을 위해 다른 키도 정리
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    }
  },

  setUserInfo: (userInfo) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("user_info", JSON.stringify(userInfo));
    }
  },

  getUserInfo: () => {
    if (typeof window !== "undefined") {
      const userInfo = localStorage.getItem("user_info");
      return userInfo ? JSON.parse(userInfo) : null;
    }
    return null;
  },
};

/**
 * 메인 API 클라이언트 클래스
 */
class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.timeout = DEFAULT_TIMEOUT;
    this.isRefreshing = false;
    this.refreshSubscribers = [];
  }

  /**
   * 기본 fetch 설정 생성
   * @param {string} method - HTTP 메서드
   * @param {Object} options - 추가 옵션
   * @returns {Object} fetch 설정 객체
   */
  createRequestConfig(method, options = {}) {
    const config = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      timeout: this.timeout,
      ...options,
    };

    // 인증 토큰 추가
    const token = TokenManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // FormData인 경우 Content-Type 제거 (브라우저가 자동 설정)
    if (options.body instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  }

  /**
   * URL 생성
   * @param {string} endpoint - API 엔드포인트
   * @param {Object} queryParams - 쿼리 파라미터
   * @returns {string} 완전한 URL
   */
  createURL(endpoint, queryParams = {}) {
    const url = new URL(endpoint, this.baseURL);

    Object.keys(queryParams).forEach((key) => {
      if (queryParams[key] !== undefined && queryParams[key] !== null) {
        url.searchParams.append(key, queryParams[key]);
      }
    });

    return url.toString();
  }

  /**
   * HTTP 요청 실행
   * @param {string} endpoint - API 엔드포인트
   * @param {Object} options - 요청 옵션
   * @returns {Promise<any>} 응답 데이터
   */
  async request(endpoint, options = {}) {
    const url = this.createURL(endpoint, options.params);
    const config = this.createRequestConfig(options.method || "GET", options);

    try {
      console.log(`🚀 API Request: ${config.method} ${url}`);

      // 🔧 토큰 만료 사전 검사
      const token = TokenManager.getAccessToken();
      if (token && this.isTokenExpired(token)) {
        console.log("🕐 Token expired, attempting refresh before request");

        const refreshedResponse = await this.handleTokenRefresh(url, config);
        if (refreshedResponse) {
          return await this.processResponse(refreshedResponse);
        } else {
          throw new ApiError("인증이 만료되었습니다. 다시 로그인해 주세요.", 401);
        }
      }

      const response = await fetch(url, config);

      // 401 Unauthorized - 토큰 갱신 시도
      if (response.status === HTTP_STATUS.UNAUTHORIZED) {
        console.log("🔒 401 Unauthorized, attempting token refresh");

        const refreshedResponse = await this.handleTokenRefresh(url, config);
        if (refreshedResponse) {
          return await this.processResponse(refreshedResponse);
        } else {
          throw new ApiError("인증이 실패했습니다. 다시 로그인해 주세요.", 401);
        }
      }

      return await this.processResponse(response);
    } catch (error) {
      console.error(`❌ API Request failed: ${config.method} ${url}`, error);

      if (error.name === "AbortError") {
        throw new ApiError("요청 시간이 초과되었습니다.", 408);
      }

      // ApiError인 경우 그대로 전파
      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError("네트워크 오류가 발생했습니다.", 0, error);
    }
  }

  /**
   * 응답 처리
   * @param {Response} response - fetch 응답 객체
   * @returns {Promise<any>} 처리된 응답 데이터
   */
  async processResponse(response) {
    const contentType = response.headers.get("content-type");

    let data;
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      console.error(`❌ API Error: ${response.status}`, data);

      throw new ApiError(
        data.message || data.error || `HTTP ${response.status}`,
        response.status,
        data
      );
    }

    console.log(`✅ API Success: ${response.status}`);
    return data;
  }

  /**
   * 토큰 갱신 처리
   * @param {string} originalUrl - 원래 요청 URL
   * @param {Object} originalConfig - 원래 요청 설정
   * @returns {Promise<Response|null>} 갱신된 토큰으로 재요청한 응답
   */
  /**
   * 🔧 개선된 토큰 갱신 처리
   * @param {string} originalUrl - 원래 요청 URL
   * @param {Object} originalConfig - 원래 요청 설정
   * @returns {Promise<Response|null>} 갱신된 토큰으로 재요청한 응답
   */
  async handleTokenRefresh(originalUrl, originalConfig) {
    if (this.isRefreshing) {
      // 이미 갱신 중이면 대기
      return new Promise((resolve) => {
        this.refreshSubscribers.push(() => {
          const newToken = TokenManager.getAccessToken();
          if (newToken) {
            originalConfig.headers.Authorization = `Bearer ${newToken}`;
            resolve(fetch(originalUrl, originalConfig));
          } else {
            resolve(null); // 토큰 갱신 실패
          }
        });
      });
    }

    this.isRefreshing = true;

    try {
      const refreshToken = TokenManager.getRefreshToken();

      if (!refreshToken) {
        console.log("❌ No refresh token available");
        throw new Error("No refresh token available");
      }

      console.log("🔄 Attempting token refresh...");

      const refreshResponse = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      const refreshData = await refreshResponse.json();

      if (!refreshResponse.ok) {
        console.error("❌ Token refresh failed:", refreshData);

        // 🔧 리프레시 토큰도 만료된 경우
        if (refreshData.requiresLogin || refreshResponse.status === 401) {
          console.log("🔒 Refresh token expired, redirecting to login");
          throw new Error("REFRESH_TOKEN_EXPIRED");
        }

        throw new Error(refreshData.message || "Token refresh failed");
      }

      if (!refreshData.success || !refreshData.accessToken) {
        throw new Error("Invalid refresh response");
      }

      console.log("✅ Token refreshed successfully");

      // 새 토큰 저장
      TokenManager.setAccessToken(refreshData.accessToken);
      TokenManager.setRefreshToken(refreshData.refreshToken);
      TokenManager.setUserInfo(refreshData.user);

      // 대기 중인 요청들 재실행
      this.refreshSubscribers.forEach((callback) => {
        try {
          callback();
        } catch (error) {
          console.error("❌ Error executing refresh subscriber:", error);
        }
      });
      this.refreshSubscribers = [];

      // 원래 요청 재실행
      originalConfig.headers.Authorization = `Bearer ${refreshData.accessToken}`;
      return await fetch(originalUrl, originalConfig);
    } catch (error) {
      console.error("❌ Token refresh failed:", error);

      // 토큰 갱신 실패 시 정리 작업
      TokenManager.clearTokens();

      // 대기 중인 요청들에게 null 반환
      this.refreshSubscribers.forEach((callback) => {
        try {
          callback();
        } catch (callbackError) {
          console.error("❌ Error executing failed refresh callback:", callbackError);
        }
      });
      this.refreshSubscribers = [];

      // 🔧 자동 리다이렉트 조건 개선
      if (typeof window !== "undefined") {
        // 특정 에러의 경우에만 자동 리다이렉트
        if (
          error.message === "REFRESH_TOKEN_EXPIRED" ||
          error.message.includes("No refresh token") ||
          error.message.includes("Invalid refresh token")
        ) {
          console.log("🔄 Redirecting to login due to token refresh failure");

          // 현재 페이지가 로그인 페이지가 아닌 경우에만 리다이렉트
          if (!window.location.pathname.includes("/login")) {
            window.location.href = "/login?message=세션이 만료되었습니다. 다시 로그인해 주세요.";
          }
        }
      }

      return null;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * 🆕 토큰 만료 검사 헬퍼 함수
   * @param {string} token - JWT 토큰
   * @returns {boolean} 만료 여부
   */
  isTokenExpired(token) {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      const decoded = JSON.parse(jsonPayload);

      // 5분 여유를 두고 만료 검사 (토큰이 곧 만료될 예정인 경우도 갱신)
      const expiryTime = decoded.exp * 1000;
      const fiveMinutesFromNow = Date.now() + 5 * 60 * 1000;

      return expiryTime < fiveMinutesFromNow;
    } catch (error) {
      console.error("❌ Token expiry check failed:", error);
      return true; // 파싱 실패 시 만료된 것으로 간주
    }
  }

  /**
   * 🆕 토큰 상태 확인
   * @returns {Object} 토큰 상태 정보
   */
  getTokenStatus() {
    const accessToken = TokenManager.getAccessToken();
    const refreshToken = TokenManager.getRefreshToken();

    return {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      isAccessTokenExpired: accessToken ? this.isTokenExpired(accessToken) : true,
      isRefreshing: this.isRefreshing,
    };
  }
  // HTTP 메서드별 편의 함수들

  /**
   * GET 요청
   * @param {string} endpoint - API 엔드포인트
   * @param {Object} params - 쿼리 파라미터
   * @param {Object} options - 추가 옵션
   * @returns {Promise<any>} 응답 데이터
   */
  async get(endpoint, params = {}, options = {}) {
    return this.request(endpoint, {
      method: "GET",
      params,
      ...options,
    });
  }

  /**
   * POST 요청
   * @param {string} endpoint - API 엔드포인트
   * @param {any} data - 요청 데이터
   * @param {Object} options - 추가 옵션
   * @returns {Promise<any>} 응답 데이터
   */
  async post(endpoint, data = null, options = {}) {
    return this.request(endpoint, {
      method: "POST",
      body: data instanceof FormData ? data : JSON.stringify(data),
      ...options,
    });
  }

  /**
   * PUT 요청
   * @param {string} endpoint - API 엔드포인트
   * @param {any} data - 요청 데이터
   * @param {Object} options - 추가 옵션
   * @returns {Promise<any>} 응답 데이터
   */
  async put(endpoint, data = null, options = {}) {
    return this.request(endpoint, {
      method: "PUT",
      body: data instanceof FormData ? data : JSON.stringify(data),
      ...options,
    });
  }

  /**
   * PATCH 요청
   * @param {string} endpoint - API 엔드포인트
   * @param {any} data - 요청 데이터
   * @param {Object} options - 추가 옵션
   * @returns {Promise<any>} 응답 데이터
   */
  async patch(endpoint, data = null, options = {}) {
    return this.request(endpoint, {
      method: "PATCH",
      body: data instanceof FormData ? data : JSON.stringify(data),
      ...options,
    });
  }

  /**
   * DELETE 요청
   * @param {string} endpoint - API 엔드포인트
   * @param {Object} options - 추가 옵션
   * @returns {Promise<any>} 응답 데이터
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      method: "DELETE",
      ...options,
    });
  }
}

// API 클라이언트 인스턴스 생성
const apiClient = new ApiClient();

/**
 * 도메인별 API 클라이언트
 */

// 인증 관련 API
export const authApi = {
  login: (credentials) => apiClient.post("/api/auth/login", credentials),
  logout: () => apiClient.post("/api/auth/logout"),
  register: (userData) => apiClient.post("/api/auth/register", userData),
  refresh: (refreshToken) => apiClient.post("/api/auth/refresh", { refreshToken }),
  forgotPassword: (email) => apiClient.post("/api/auth/forgot-password", { email }),
  resetPassword: (token, password) =>
    apiClient.post("/api/auth/reset-password", { token, password }),
};

// =================================
// 🆕 Super Admin API 클라이언트 함수들
// =================================

/**
 * Super Admin API 클라이언트 함수들
 */
export const superAdminAPI = {
  /**
   * 모든 사용자 목록 조회
   * @returns {Promise<Object>} 사용자 목록 응답
   */
  async getAllUsers() {
    try {
      console.log("🔍 API: Fetching all users for Super Admin");
      const response = await apiClient.get("/api/super-admin/users");

      console.log(`✅ API: Retrieved ${response.users?.length || 0} users`);
      return response;
    } catch (error) {
      console.error("❌ API Error fetching users:", error);
      throw new Error(`사용자 목록 조회 실패: ${error.message}`);
    }
  },

  /**
   * 사용자 상태 변경 (활성화/비활성화)
   * @param {number} userId - 사용자 ID
   * @param {boolean} isActive - 활성화 상태
   * @returns {Promise<Object>} 업데이트 응답
   */
  async toggleUserStatus(userId, isActive) {
    try {
      console.log(`🔧 API: Toggling user ${userId} status to ${isActive}`);
      const response = await apiClient.patch("/api/super-admin/users", {
        userId,
        action: "toggle_status",
        value: isActive,
      });

      console.log(`✅ API: User ${userId} status updated`);
      return response;
    } catch (error) {
      console.error("❌ API Error updating user status:", error);
      throw new Error(`사용자 상태 변경 실패: ${error.message}`);
    }
  },

  /**
   * 사용자 이메일 인증 상태 변경
   * @param {number} userId - 사용자 ID
   * @param {boolean} isVerified - 인증 상태
   * @returns {Promise<Object>} 업데이트 응답
   */
  async updateEmailVerification(userId, isVerified) {
    try {
      console.log(`📧 API: Updating email verification for user ${userId} to ${isVerified}`);
      const response = await apiClient.patch("/api/super-admin/users", {
        userId,
        action: "verify_email",
        value: isVerified,
      });

      console.log(`✅ API: User ${userId} email verification updated`);
      return response;
    } catch (error) {
      console.error("❌ API Error updating email verification:", error);
      throw new Error(`이메일 인증 상태 변경 실패: ${error.message}`);
    }
  },

  /**
   * 사용자 계정 잠금 해제
   * @param {number} userId - 사용자 ID
   * @returns {Promise<Object>} 업데이트 응답
   */
  async unlockUserAccount(userId) {
    try {
      console.log(`🔓 API: Unlocking user account ${userId}`);
      const response = await apiClient.patch("/api/super-admin/users", {
        userId,
        action: "unlock_account",
        value: true,
      });

      console.log(`✅ API: User ${userId} account unlocked`);
      return response;
    } catch (error) {
      console.error("❌ API Error unlocking account:", error);
      throw new Error(`계정 잠금 해제 실패: ${error.message}`);
    }
  },

  /**
   * 사용자 완전 삭제 (매우 주의)
   * @param {number} userId - 사용자 ID
   * @param {string} confirmString - 확인 문자열
   * @returns {Promise<Object>} 삭제 응답
   */
  async deleteUser(userId, confirmString = "DELETE_USER_PERMANENTLY") {
    try {
      console.log(`🗑️ API: Permanently deleting user ${userId}`);
      const response = await apiClient.delete("/api/super-admin/users", {
        body: JSON.stringify({
          userId,
          confirm: confirmString,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log(`✅ API: User ${userId} permanently deleted`);
      return response;
    } catch (error) {
      console.error("❌ API Error deleting user:", error);
      throw new Error(`사용자 삭제 실패: ${error.message}`);
    }
  },

  /**
   * 대시보드 통계 및 상태 데이터 조회
   * @returns {Promise<Object>} 대시보드 데이터
   */
  async getDashboardData() {
    try {
      console.log("🔍 API: Fetching Super Admin dashboard data");
      const response = await apiClient.get("/api/super-admin/dashboard");

      console.log("✅ API: Dashboard data retrieved successfully");
      return response;
    } catch (error) {
      console.error("❌ API Error fetching dashboard data:", error);
      throw new Error(`대시보드 데이터 조회 실패: ${error.message}`);
    }
  },

  /**
   * 시스템 상태 새로고침
   * @returns {Promise<Object>} 업데이트된 시스템 상태
   */
  async refreshSystemStatus() {
    try {
      console.log("🔄 API: Refreshing system status");
      const response = await apiClient.get("/api/super-admin/system/status");

      console.log("✅ API: System status refreshed");
      return response;
    } catch (error) {
      console.error("❌ API Error refreshing system status:", error);
      throw new Error(`시스템 상태 새로고침 실패: ${error.message}`);
    }
  },

  /**
   * 최근 활동 로그 조회
   * @param {number} limit - 가져올 활동 수 (기본값: 10)
   * @returns {Promise<Object>} 최근 활동 목록
   */
  async getRecentActivities(limit = 10) {
    try {
      console.log(`🔍 API: Fetching recent activities (limit: ${limit})`);
      const response = await apiClient.get(`/api/super-admin/activities`, { limit });

      console.log(`✅ API: Retrieved ${response.activities?.length || 0} activities`);
      return response;
    } catch (error) {
      console.error("❌ API Error fetching activities:", error);
      throw new Error(`최근 활동 조회 실패: ${error.message}`);
    }
  },

  /**
   * 시스템 알림 조회
   * @returns {Promise<Object>} 시스템 알림 목록
   */
  async getSystemAlerts() {
    try {
      console.log("🔍 API: Fetching system alerts");
      const response = await apiClient.get("/api/super-admin/alerts");

      console.log(`✅ API: Retrieved ${response.alerts?.length || 0} alerts`);
      return response;
    } catch (error) {
      console.error("❌ API Error fetching alerts:", error);
      throw new Error(`시스템 알림 조회 실패: ${error.message}`);
    }
  },

  /**
   * 시스템 백업 실행
   * @returns {Promise<Object>} 백업 실행 결과
   */
  async triggerSystemBackup() {
    try {
      console.log("💾 API: Triggering system backup");
      const response = await apiClient.post("/api/super-admin/backup/trigger");

      console.log("✅ API: System backup triggered");
      return response;
    } catch (error) {
      console.error("❌ API Error triggering backup:", error);
      throw new Error(`시스템 백업 실행 실패: ${error.message}`);
    }
  },

  /**
   * 데이터베이스 상태 확인
   * @returns {Promise<Object>} 데이터베이스 상태 정보
   */
  async getDatabaseStatus() {
    try {
      console.log("🗄️ API: Checking database status");
      const response = await apiClient.get("/api/super-admin/database/status");

      console.log("✅ API: Database status retrieved");
      return response;
    } catch (error) {
      console.error("❌ API Error checking database status:", error);
      throw new Error(`데이터베이스 상태 확인 실패: ${error.message}`);
    }
  },
};

// =================================
// 🆕 Super Admin 편의 함수들
// =================================

/**
 * 사용자 액션 처리 통합 함수
 * @param {number} userId - 사용자 ID
 * @param {string} action - 액션 타입
 * @param {any} value - 액션 값
 * @returns {Promise<Object>} 응답
 */
export const handleUserAction = async (userId, action, value) => {
  switch (action) {
    case "toggle_status":
      return await superAdminAPI.toggleUserStatus(userId, value);

    case "verify_email":
      return await superAdminAPI.updateEmailVerification(userId, value);

    case "unlock_account":
      return await superAdminAPI.unlockUserAccount(userId);

    case "delete_user":
      return await superAdminAPI.deleteUser(userId, value);

    default:
      throw new Error(`Unknown action: ${action}`);
  }
};

/**
 * 사용자 상태 토글 (확인 다이얼로그 포함)
 * @param {Object} user - 사용자 객체
 * @param {Function} onSuccess - 성공 콜백
 * @param {Function} onError - 에러 콜백
 */
export const toggleUserStatusWithConfirm = async (user, onSuccess, onError) => {
  const newStatus = !user.isActive;
  const action = newStatus ? "활성화" : "비활성화";

  if (window.confirm(`정말 "${user.name}" 사용자를 ${action}하시겠습니까?`)) {
    try {
      const response = await superAdminAPI.toggleUserStatus(user.id, newStatus);

      if (onSuccess) {
        onSuccess(response, user);
      }

      return response;
    } catch (error) {
      if (onError) {
        onError(error, user);
      }
      throw error;
    }
  }

  return null; // 사용자가 취소한 경우
};

/**
 * 사용자 삭제 (강력한 확인 포함)
 * @param {Object} user - 사용자 객체
 * @param {Function} onSuccess - 성공 콜백
 * @param {Function} onError - 에러 콜백
 */
export const deleteUserWithConfirm = async (user, onSuccess, onError) => {
  const confirmMessage = `
⚠️ 경고: 이 작업은 되돌릴 수 없습니다!

사용자 "${user.name}" (${user.username})를 완전히 삭제하시겠습니까?

모든 관련 데이터가 함께 삭제됩니다:
- 사용자 정보
- 역할 및 권한
- 관련된 모든 기록

계속하려면 "${user.username}"을 정확히 입력하세요:`;

  const userInput = window.prompt(confirmMessage);

  if (userInput === user.username) {
    try {
      const response = await superAdminAPI.deleteUser(user.id);

      if (onSuccess) {
        onSuccess(response, user);
      }

      return response;
    } catch (error) {
      if (onError) {
        onError(error, user);
      }
      throw error;
    }
  } else if (userInput !== null) {
    // 사용자가 취소하지 않았지만 잘못 입력한 경우
    alert("사용자명이 일치하지 않습니다. 삭제가 취소되었습니다.");
  }

  return null; // 취소되거나 잘못 입력된 경우
};

/**
 * 대시보드 데이터 새로고침 (모든 데이터 다시 로드)
 * @returns {Promise<Object>} 전체 대시보드 데이터
 */
export const refreshDashboard = async () => {
  try {
    console.log("🔄 Refreshing entire dashboard");

    const [dashboardData, systemStatus, recentActivities] = await Promise.all([
      superAdminAPI.getDashboardData(),
      superAdminAPI.refreshSystemStatus().catch(() => null), // 실패해도 계속 진행
      superAdminAPI.getRecentActivities(5).catch(() => null), // 실패해도 계속 진행
    ]);

    const combinedData = {
      ...dashboardData.data,
      systemStatus: systemStatus?.data || dashboardData.data.systemStatus,
      recentActivities: recentActivities?.activities || dashboardData.data.recentActivities,
      lastRefreshed: new Date().toISOString(),
    };

    console.log("✅ Dashboard refresh completed");
    return combinedData;
  } catch (error) {
    console.error("❌ Dashboard refresh failed:", error);
    throw error;
  }
};

/**
 * 통계 카드에 표시할 트렌드 아이콘 반환
 * @param {number} trend - 트렌드 값 (%)
 * @returns {string} 트렌드 아이콘
 */
export const getTrendIcon = (trend) => {
  if (trend > 5) return "📈"; // 큰 증가
  if (trend > 0) return "📊"; // 작은 증가
  if (trend === 0) return "➖"; // 변화 없음
  if (trend > -5) return "📉"; // 작은 감소
  return "⚠️"; // 큰 감소
};

/**
 * 시스템 상태에 따른 색상 반환
 * @param {string} health - 시스템 상태
 * @returns {Object} 색상 정보
 */
export const getHealthColor = (health) => {
  switch (health) {
    case "healthy":
      return {
        bg: "bg-green-100",
        text: "text-green-800",
        icon: "✅",
        message: "정상",
      };
    case "warning":
      return {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        icon: "⚠️",
        message: "주의",
      };
    case "error":
      return {
        bg: "bg-red-100",
        text: "text-red-800",
        icon: "❌",
        message: "오류",
      };
    default:
      return {
        bg: "bg-gray-100",
        text: "text-gray-800",
        icon: "❓",
        message: "알 수 없음",
      };
  }
};

/**
 * 대시보드 에러 처리 헬퍼
 * @param {Error} error - 에러 객체
 * @param {Function} setError - 에러 상태 설정 함수
 * @param {Function} setLoading - 로딩 상태 설정 함수
 */
export const handleDashboardError = (error, setError, setLoading) => {
  console.error("❌ Dashboard error:", error);

  if (setError) {
    setError(error.message || "대시보드 데이터를 불러오는 중 오류가 발생했습니다.");
  }

  if (setLoading) {
    setLoading(false);
  }

  // 토큰 만료 등의 인증 오류인 경우 로그인 페이지로 리다이렉트
  if (error.message?.includes("Unauthorized") || error.message?.includes("Invalid token")) {
    TokenManager.clearTokens();
    window.location.href = "/login?message=세션이 만료되었습니다. 다시 로그인해 주세요.";
  }
};

/**
 * 자동 새로고침 설정 헬퍼
 * @param {Function} refreshFunction - 새로고침 함수
 * @param {number} intervalMs - 새로고침 간격 (밀리초, 기본값: 5분)
 * @returns {Function} 정리 함수
 */
export const setupAutoRefresh = (refreshFunction, intervalMs = 5 * 60 * 1000) => {
  console.log(`🕐 Setting up auto-refresh every ${intervalMs / 1000} seconds`);

  const intervalId = setInterval(() => {
    console.log("🔄 Auto-refreshing dashboard data");
    refreshFunction().catch((error) => {
      console.error("❌ Auto-refresh failed:", error);
    });
  }, intervalMs);

  // 정리 함수 반환
  return () => {
    console.log("🛑 Clearing auto-refresh interval");
    clearInterval(intervalId);
  };
};

// =================================
// 기존 API 클라이언트들 (그대로 유지)
// =================================

// 일용직 관련 API
export const dailyWorkerApi = {
  getContinuousPeriods: (workerId) =>
    apiClient.get(`/api/daily-workers/continuous-periods`, { workerId }),
  updateContinuousPeriod: (workerId, workDate) =>
    apiClient.post("/api/daily-workers/continuous-periods", { workerId, workDate }),
  getRollingJudgment: (workerId, date) =>
    apiClient.get("/api/daily-workers/rolling-judgment", { workerId, date }),
  processRollingJudgment: (workerId, evaluationDate) =>
    apiClient.post("/api/daily-workers/rolling-judgment", { workerId, evaluationDate }),
  getAttendanceTracking: (workerId, startDate, endDate) =>
    apiClient.get("/api/daily-workers/attendance-tracking", { workerId, startDate, endDate }),
};

// 배치 처리 관련 API
export const batchApi = {
  getLogs: (batchType, startDate, endDate) =>
    apiClient.get("/api/batch/logs", { batchType, startDate, endDate }),
  runRollingMonthlyBatch: (batchDate) =>
    apiClient.post("/api/batch/rolling-monthly", { batchDate }),
  getMonitoring: () => apiClient.get("/api/batch/monitoring"),
  getBatchStatus: (logId) => apiClient.get(`/api/batch/logs/${logId}`),
};

// 4대보험 관련 API
export const insuranceApi = {
  getRates: (year, month) => apiClient.get("/api/insurance/rates", { year, month }),
  getEligibility: (workerId) => apiClient.get("/api/insurance/eligibility", { workerId }),
  processRollingMonthly: (workerId, evaluationDate) =>
    apiClient.post("/api/insurance/rolling-monthly", { workerId, evaluationDate }),
  getPendingActions: (companyId) => apiClient.get("/api/insurance/pending-actions", { companyId }),
  processAction: (actionId, approve) =>
    apiClient.post(`/api/insurance/pending-actions/${actionId}`, { approve }),
  getVoluntaryApplications: (companyId) => apiClient.get("/api/insurance/voluntary", { companyId }),
  submitVoluntaryApplication: (application) =>
    apiClient.post("/api/insurance/voluntary", application),
};

// 급여 관련 API
export const payrollApi = {
  getItems: (companyId) => apiClient.get("/api/payroll/items", { companyId }),
  createItem: (item) => apiClient.post("/api/payroll/items", item),
  updateItem: (itemId, item) => apiClient.put(`/api/payroll/items/${itemId}`, item),
  deleteItem: (itemId) => apiClient.delete(`/api/payroll/items/${itemId}`),
  calculateDynamic: (workerId, payYear, payMonth, payrollData) =>
    apiClient.post("/api/payroll/dynamic", { workerId, payYear, payMonth, payrollData }),
  getNontaxLimits: (companyId) => apiClient.get("/api/payroll/nontax-limits", { companyId }),
  updateNontaxLimit: (limitId, limit) =>
    apiClient.put(`/api/payroll/nontax-limits/${limitId}`, limit),
  generatePayslips: (companyId, payYear, payMonth) =>
    apiClient.post("/api/payroll/payslips/generate", { companyId, payYear, payMonth }),
};

// 노무사 사무실 관련 API
export const laborOfficeApi = {
  register: (officeData) => apiClient.post("/api/labor-office/register", officeData),
  getStaff: () => apiClient.get("/api/labor-office/staff"),
  addStaff: (staffData) => apiClient.post("/api/labor-office/staff", staffData),
  getCompanies: (filters) => apiClient.get("/api/labor-office/companies", filters),
  addCompany: (companyData) => apiClient.post("/api/labor-office/companies", companyData),
  getCompanyEmployees: (companyId, filters) =>
    apiClient.get(`/api/labor-office/companies/${companyId}/employees`, filters),
  addEmployee: (companyId, employeeData) =>
    apiClient.post(`/api/labor-office/companies/${companyId}/employees`, employeeData),
  getReports: (filters) => apiClient.get("/api/labor-office/reports", filters),
  generateReport: (reportData) => apiClient.post("/api/labor-office/reports", reportData),
};

// 회사 관련 API
export const companyApi = {
  register: (companyData) => apiClient.post("/api/company/register", companyData),
  getEmployees: (filters) => apiClient.get("/api/company/employees", filters),
  addEmployee: (employeeData) => apiClient.post("/api/company/employees", employeeData),
  updateEmployee: (employeeId, employeeData) =>
    apiClient.put(`/api/company/employees/${employeeId}`, employeeData),
  getDepartments: () => apiClient.get("/api/company/departments"),
  addDepartment: (departmentData) => apiClient.post("/api/company/departments", departmentData),
  getAttendance: (filters) => apiClient.get("/api/company/attendance", filters),
  submitAttendance: (attendanceData) => apiClient.post("/api/company/attendance", attendanceData),
  getPayroll: (filters) => apiClient.get("/api/company/payroll", filters),
  getInsurance: (filters) => apiClient.get("/api/company/insurance", filters),
};

// 공통 API
export const commonApi = {
  uploadFile: (file, category) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);
    return apiClient.post("/api/shared/file-upload", formData);
  },
  getNotifications: () => apiClient.get("/api/shared/notifications"),
  markNotificationRead: (notificationId) =>
    apiClient.patch(`/api/shared/notifications/${notificationId}`, { read: true }),
};

// 기본 API 클라이언트 내보내기
export default apiClient;

// 토큰 관리자 내보내기
export { TokenManager };

/***
 *
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

// // utils/apiClient.js
// /**
//  * API 통신 클라이언트
//  * 4대보험 취득상실 통합 관리 시스템용 HTTP 클라이언트
//  */

// // 기본 API 설정
// const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";
// const DEFAULT_TIMEOUT = 30000; // 30초

// /**
//  * HTTP 응답 상태 코드
//  */
// export const HTTP_STATUS = {
//   OK: 200,
//   CREATED: 201,
//   NO_CONTENT: 204,
//   BAD_REQUEST: 400,
//   UNAUTHORIZED: 401,
//   FORBIDDEN: 403,
//   NOT_FOUND: 404,
//   CONFLICT: 409,
//   UNPROCESSABLE_ENTITY: 422,
//   INTERNAL_SERVER_ERROR: 500,
//   SERVICE_UNAVAILABLE: 503,
// };

// /**
//  * API 에러 클래스
//  */
// export class ApiError extends Error {
//   constructor(message, status, data = null) {
//     super(message);
//     this.name = "ApiError";
//     this.status = status;
//     this.data = data;
//   }
// }

// /**
//  * 로컬 스토리지에서 토큰 관리
//  */
// const TokenManager = {
//   getAccessToken: () => {
//     if (typeof window !== "undefined") {
//       return localStorage.getItem("access_token");
//     }
//     return null;
//   },

//   setAccessToken: (token) => {
//     if (typeof window !== "undefined") {
//       localStorage.setItem("access_token", token);
//     }
//   },

//   getRefreshToken: () => {
//     if (typeof window !== "undefined") {
//       return localStorage.getItem("refresh_token");
//     }
//     return null;
//   },

//   setRefreshToken: (token) => {
//     if (typeof window !== "undefined") {
//       localStorage.setItem("refresh_token", token);
//     }
//   },

//   clearTokens: () => {
//     if (typeof window !== "undefined") {
//       localStorage.removeItem("access_token");
//       localStorage.removeItem("refresh_token");
//       localStorage.removeItem("user_info");
//     }
//   },

//   setUserInfo: (userInfo) => {
//     if (typeof window !== "undefined") {
//       localStorage.setItem("user_info", JSON.stringify(userInfo));
//     }
//   },

//   getUserInfo: () => {
//     if (typeof window !== "undefined") {
//       const userInfo = localStorage.getItem("user_info");
//       return userInfo ? JSON.parse(userInfo) : null;
//     }
//     return null;
//   },
// };

// /**
//  * 메인 API 클라이언트 클래스
//  */
// class ApiClient {
//   constructor() {
//     this.baseURL = API_BASE_URL;
//     this.timeout = DEFAULT_TIMEOUT;
//     this.isRefreshing = false;
//     this.refreshSubscribers = [];
//   }

//   /**
//    * 기본 fetch 설정 생성
//    * @param {string} method - HTTP 메서드
//    * @param {Object} options - 추가 옵션
//    * @returns {Object} fetch 설정 객체
//    */
//   createRequestConfig(method, options = {}) {
//     const config = {
//       method,
//       headers: {
//         "Content-Type": "application/json",
//         ...options.headers,
//       },
//       timeout: this.timeout,
//       ...options,
//     };

//     // 인증 토큰 추가
//     const token = TokenManager.getAccessToken();
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }

//     // FormData인 경우 Content-Type 제거 (브라우저가 자동 설정)
//     if (options.body instanceof FormData) {
//       delete config.headers["Content-Type"];
//     }

//     return config;
//   }

//   /**
//    * URL 생성
//    * @param {string} endpoint - API 엔드포인트
//    * @param {Object} queryParams - 쿼리 파라미터
//    * @returns {string} 완전한 URL
//    */
//   createURL(endpoint, queryParams = {}) {
//     const url = new URL(endpoint, this.baseURL);

//     Object.keys(queryParams).forEach((key) => {
//       if (queryParams[key] !== undefined && queryParams[key] !== null) {
//         url.searchParams.append(key, queryParams[key]);
//       }
//     });

//     return url.toString();
//   }

//   /**
//    * HTTP 요청 실행
//    * @param {string} endpoint - API 엔드포인트
//    * @param {Object} options - 요청 옵션
//    * @returns {Promise<any>} 응답 데이터
//    */
//   async request(endpoint, options = {}) {
//     const url = this.createURL(endpoint, options.params);
//     const config = this.createRequestConfig(options.method || "GET", options);

//     try {
//       console.log(`🚀 API Request: ${config.method} ${url}`);

//       const response = await fetch(url, config);

//       // 401 Unauthorized - 토큰 갱신 시도
//       if (response.status === HTTP_STATUS.UNAUTHORIZED) {
//         const refreshedResponse = await this.handleTokenRefresh(url, config);
//         if (refreshedResponse) {
//           return await this.processResponse(refreshedResponse);
//         }
//       }

//       return await this.processResponse(response);
//     } catch (error) {
//       console.error(`❌ API Request failed: ${config.method} ${url}`, error);

//       if (error.name === "AbortError") {
//         throw new ApiError("요청 시간이 초과되었습니다.", 408);
//       }

//       throw new ApiError("네트워크 오류가 발생했습니다.", 0, error);
//     }
//   }

//   /**
//    * 응답 처리
//    * @param {Response} response - fetch 응답 객체
//    * @returns {Promise<any>} 처리된 응답 데이터
//    */
//   async processResponse(response) {
//     const contentType = response.headers.get("content-type");

//     let data;
//     if (contentType && contentType.includes("application/json")) {
//       data = await response.json();
//     } else {
//       data = await response.text();
//     }

//     if (!response.ok) {
//       console.error(`❌ API Error: ${response.status}`, data);

//       throw new ApiError(
//         data.message || data.error || `HTTP ${response.status}`,
//         response.status,
//         data
//       );
//     }

//     console.log(`✅ API Success: ${response.status}`);
//     return data;
//   }

//   /**
//    * 토큰 갱신 처리
//    * @param {string} originalUrl - 원래 요청 URL
//    * @param {Object} originalConfig - 원래 요청 설정
//    * @returns {Promise<Response|null>} 갱신된 토큰으로 재요청한 응답
//    */
//   async handleTokenRefresh(originalUrl, originalConfig) {
//     if (this.isRefreshing) {
//       // 이미 갱신 중이면 대기
//       return new Promise((resolve) => {
//         this.refreshSubscribers.push(() => {
//           originalConfig.headers.Authorization = `Bearer ${TokenManager.getAccessToken()}`;
//           resolve(fetch(originalUrl, originalConfig));
//         });
//       });
//     }

//     this.isRefreshing = true;

//     try {
//       const refreshToken = TokenManager.getRefreshToken();

//       if (!refreshToken) {
//         throw new Error("No refresh token available");
//       }

//       const refreshResponse = await fetch("/api/auth/refresh", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ refreshToken }),
//       });

//       if (!refreshResponse.ok) {
//         throw new Error("Token refresh failed");
//       }

//       const refreshData = await refreshResponse.json();

//       // 새 토큰 저장
//       TokenManager.setAccessToken(refreshData.accessToken);
//       TokenManager.setRefreshToken(refreshData.refreshToken);
//       TokenManager.setUserInfo(refreshData.user);

//       // 대기 중인 요청들 재실행
//       this.refreshSubscribers.forEach((callback) => callback());
//       this.refreshSubscribers = [];

//       // 원래 요청 재실행
//       originalConfig.headers.Authorization = `Bearer ${refreshData.accessToken}`;
//       return await fetch(originalUrl, originalConfig);
//     } catch (error) {
//       console.error("❌ Token refresh failed:", error);

//       // 토큰 갱신 실패 시 로그아웃 처리
//       TokenManager.clearTokens();

//       if (typeof window !== "undefined") {
//         window.location.href = "/login";
//       }

//       return null;
//     } finally {
//       this.isRefreshing = false;
//     }
//   }

//   // HTTP 메서드별 편의 함수들

//   /**
//    * GET 요청
//    * @param {string} endpoint - API 엔드포인트
//    * @param {Object} params - 쿼리 파라미터
//    * @param {Object} options - 추가 옵션
//    * @returns {Promise<any>} 응답 데이터
//    */
//   async get(endpoint, params = {}, options = {}) {
//     return this.request(endpoint, {
//       method: "GET",
//       params,
//       ...options,
//     });
//   }

//   /**
//    * POST 요청
//    * @param {string} endpoint - API 엔드포인트
//    * @param {any} data - 요청 데이터
//    * @param {Object} options - 추가 옵션
//    * @returns {Promise<any>} 응답 데이터
//    */
//   async post(endpoint, data = null, options = {}) {
//     return this.request(endpoint, {
//       method: "POST",
//       body: data instanceof FormData ? data : JSON.stringify(data),
//       ...options,
//     });
//   }

//   /**
//    * PUT 요청
//    * @param {string} endpoint - API 엔드포인트
//    * @param {any} data - 요청 데이터
//    * @param {Object} options - 추가 옵션
//    * @returns {Promise<any>} 응답 데이터
//    */
//   async put(endpoint, data = null, options = {}) {
//     return this.request(endpoint, {
//       method: "PUT",
//       body: data instanceof FormData ? data : JSON.stringify(data),
//       ...options,
//     });
//   }

//   /**
//    * PATCH 요청
//    * @param {string} endpoint - API 엔드포인트
//    * @param {any} data - 요청 데이터
//    * @param {Object} options - 추가 옵션
//    * @returns {Promise<any>} 응답 데이터
//    */
//   async patch(endpoint, data = null, options = {}) {
//     return this.request(endpoint, {
//       method: "PATCH",
//       body: data instanceof FormData ? data : JSON.stringify(data),
//       ...options,
//     });
//   }

//   /**
//    * DELETE 요청
//    * @param {string} endpoint - API 엔드포인트
//    * @param {Object} options - 추가 옵션
//    * @returns {Promise<any>} 응답 데이터
//    */
//   async delete(endpoint, options = {}) {
//     return this.request(endpoint, {
//       method: "DELETE",
//       ...options,
//     });
//   }
// }

// // API 클라이언트 인스턴스 생성
// const apiClient = new ApiClient();

// /**
//  * 도메인별 API 클라이언트
//  */

// // 인증 관련 API
// export const authApi = {
//   login: (credentials) => apiClient.post("/api/auth/login", credentials),
//   logout: () => apiClient.post("/api/auth/logout"),
//   register: (userData) => apiClient.post("/api/auth/register", userData),
//   refresh: (refreshToken) => apiClient.post("/api/auth/refresh", { refreshToken }),
//   forgotPassword: (email) => apiClient.post("/api/auth/forgot-password", { email }),
//   resetPassword: (token, password) =>
//     apiClient.post("/api/auth/reset-password", { token, password }),
// };

// // 일용직 관련 API
// export const dailyWorkerApi = {
//   getContinuousPeriods: (workerId) =>
//     apiClient.get(`/api/daily-workers/continuous-periods`, { workerId }),
//   updateContinuousPeriod: (workerId, workDate) =>
//     apiClient.post("/api/daily-workers/continuous-periods", { workerId, workDate }),
//   getRollingJudgment: (workerId, date) =>
//     apiClient.get("/api/daily-workers/rolling-judgment", { workerId, date }),
//   processRollingJudgment: (workerId, evaluationDate) =>
//     apiClient.post("/api/daily-workers/rolling-judgment", { workerId, evaluationDate }),
//   getAttendanceTracking: (workerId, startDate, endDate) =>
//     apiClient.get("/api/daily-workers/attendance-tracking", { workerId, startDate, endDate }),
// };

// // 배치 처리 관련 API
// export const batchApi = {
//   getLogs: (batchType, startDate, endDate) =>
//     apiClient.get("/api/batch/logs", { batchType, startDate, endDate }),
//   runRollingMonthlyBatch: (batchDate) =>
//     apiClient.post("/api/batch/rolling-monthly", { batchDate }),
//   getMonitoring: () => apiClient.get("/api/batch/monitoring"),
//   getBatchStatus: (logId) => apiClient.get(`/api/batch/logs/${logId}`),
// };

// // 4대보험 관련 API
// export const insuranceApi = {
//   getRates: (year, month) => apiClient.get("/api/insurance/rates", { year, month }),
//   getEligibility: (workerId) => apiClient.get("/api/insurance/eligibility", { workerId }),
//   processRollingMonthly: (workerId, evaluationDate) =>
//     apiClient.post("/api/insurance/rolling-monthly", { workerId, evaluationDate }),
//   getPendingActions: (companyId) => apiClient.get("/api/insurance/pending-actions", { companyId }),
//   processAction: (actionId, approve) =>
//     apiClient.post(`/api/insurance/pending-actions/${actionId}`, { approve }),
//   getVoluntaryApplications: (companyId) => apiClient.get("/api/insurance/voluntary", { companyId }),
//   submitVoluntaryApplication: (application) =>
//     apiClient.post("/api/insurance/voluntary", application),
// };

// // 급여 관련 API
// export const payrollApi = {
//   getItems: (companyId) => apiClient.get("/api/payroll/items", { companyId }),
//   createItem: (item) => apiClient.post("/api/payroll/items", item),
//   updateItem: (itemId, item) => apiClient.put(`/api/payroll/items/${itemId}`, item),
//   deleteItem: (itemId) => apiClient.delete(`/api/payroll/items/${itemId}`),
//   calculateDynamic: (workerId, payYear, payMonth, payrollData) =>
//     apiClient.post("/api/payroll/dynamic", { workerId, payYear, payMonth, payrollData }),
//   getNontaxLimits: (companyId) => apiClient.get("/api/payroll/nontax-limits", { companyId }),
//   updateNontaxLimit: (limitId, limit) =>
//     apiClient.put(`/api/payroll/nontax-limits/${limitId}`, limit),
//   generatePayslips: (companyId, payYear, payMonth) =>
//     apiClient.post("/api/payroll/payslips/generate", { companyId, payYear, payMonth }),
// };

// // 노무사 사무실 관련 API
// export const laborOfficeApi = {
//   register: (officeData) => apiClient.post("/api/labor-office/register", officeData),
//   getStaff: () => apiClient.get("/api/labor-office/staff"),
//   addStaff: (staffData) => apiClient.post("/api/labor-office/staff", staffData),
//   getCompanies: (filters) => apiClient.get("/api/labor-office/companies", filters),
//   addCompany: (companyData) => apiClient.post("/api/labor-office/companies", companyData),
//   getCompanyEmployees: (companyId, filters) =>
//     apiClient.get(`/api/labor-office/companies/${companyId}/employees`, filters),
//   addEmployee: (companyId, employeeData) =>
//     apiClient.post(`/api/labor-office/companies/${companyId}/employees`, employeeData),
//   getReports: (filters) => apiClient.get("/api/labor-office/reports", filters),
//   generateReport: (reportData) => apiClient.post("/api/labor-office/reports", reportData),
// };

// // 회사 관련 API
// export const companyApi = {
//   register: (companyData) => apiClient.post("/api/company/register", companyData),
//   getEmployees: (filters) => apiClient.get("/api/company/employees", filters),
//   addEmployee: (employeeData) => apiClient.post("/api/company/employees", employeeData),
//   updateEmployee: (employeeId, employeeData) =>
//     apiClient.put(`/api/company/employees/${employeeId}`, employeeData),
//   getDepartments: () => apiClient.get("/api/company/departments"),
//   addDepartment: (departmentData) => apiClient.post("/api/company/departments", departmentData),
//   getAttendance: (filters) => apiClient.get("/api/company/attendance", filters),
//   submitAttendance: (attendanceData) => apiClient.post("/api/company/attendance", attendanceData),
//   getPayroll: (filters) => apiClient.get("/api/company/payroll", filters),
//   getInsurance: (filters) => apiClient.get("/api/company/insurance", filters),
// };

// // 공통 API
// export const commonApi = {
//   uploadFile: (file, category) => {
//     const formData = new FormData();
//     formData.append("file", file);
//     formData.append("category", category);
//     return apiClient.post("/api/shared/file-upload", formData);
//   },
//   getNotifications: () => apiClient.get("/api/shared/notifications"),
//   markNotificationRead: (notificationId) =>
//     apiClient.patch(`/api/shared/notifications/${notificationId}`, { read: true }),
// };

// // 기본 API 클라이언트 내보내기
// export default apiClient;

// // 토큰 관리자 내보내기
// export { TokenManager };
