// app/super-admin/users/page.jsx (퇴사자 표시 개선 버전 - 중복 제거)
"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../store/authStore";
import DBDebugModal from "../../components/admin/DBDebugModal";
// 🆕 Modal 컴포넌트들 import
import { Modal, ConfirmModal, ModalBody, ModalFooter } from "../../components/ui/Modal";

export default function SuperAdminUsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, accessToken, isAuthenticated, logout } = useAuth();

  const [allUsers, setAllUsers] = useState([]); // 🔧 전체 사용자 데이터
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔧 클라이언트사이드 페이지네이션 state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // 🆕 검색 input ref로 포커스 유지
  const searchInputRef = useRef(null);

  // 🔧 상태 변경 관련 state (active ↔ inactive만)
  const [statusChangeModal, setStatusChangeModal] = useState({
    isOpen: false,
    user: null,
    newStatus: null,
    impactAnalysis: null,
    isLoading: false,
    isExecuting: false,
  });

  // 🆕 퇴사 처리 모달 state
  const [terminationModal, setTerminationModal] = useState({
    isOpen: false,
    user: null,
    impactAnalysis: null,
    isLoading: false,
    isExecuting: false,
  });

  // 🆕 퇴사자 복구 모달 state
  const [restoreModal, setRestoreModal] = useState({
    isOpen: false,
    user: null,
    isExecuting: false,
  });

  const [dbDebugModal, setDbDebugModal] = useState({
    isOpen: false,
    data: null,
    userName: "",
  });

  // 🆕 알림 모달 state
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    type: "default",
    title: "",
    message: "",
    onConfirm: null,
  });

  // 🆕 확인 모달 state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: "default",
    title: "",
    message: "",
    confirmText: "확인",
    cancelText: "취소",
    onConfirm: null,
  });

  // 🆕 알림 모달 헬퍼 함수들
  const showAlert = useCallback((message, type = "default", title = "알림") => {
    setAlertModal({
      isOpen: true,
      type: type,
      title: title,
      message: message,
      onConfirm: () => setAlertModal((prev) => ({ ...prev, isOpen: false })),
    });
  }, []);

  const showSuccess = useCallback(
    (message, title = "성공") => {
      showAlert(message, "default", title);
    },
    [showAlert]
  );

  const showError = useCallback(
    (message, title = "오류") => {
      showAlert(message, "danger", title);
    },
    [showAlert]
  );

  const showWarning = useCallback(
    (message, title = "경고") => {
      showAlert(message, "warning", title);
    },
    [showAlert]
  );

  const showConfirm = useCallback((message, onConfirm, title = "확인", type = "default") => {
    setConfirmModal({
      isOpen: true,
      type: type,
      title: title,
      message: message,
      confirmText: type === "danger" ? "삭제" : "확인",
      cancelText: "취소",
      onConfirm: () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        onConfirm();
      },
    });
  }, []);

  // AuthStore 토큰을 사용한 API 호출 함수
  const callSuperAdminAPI = useCallback(
    async (endpoint, options = {}) => {
      try {
        if (!accessToken) {
          throw new Error("No access token available");
        }

        const fullUrl = endpoint;
        const requestOptions = {
          ...options,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            ...options.headers,
          },
        };

        const response = await fetch(fullUrl, requestOptions);

        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
          } catch (parseError) {
            const textResponse = await response.text();
            errorData = { message: textResponse };
          }

          if (response.status === 401) {
            await logout();
            router.push("/login?message=세션이 만료되었습니다. 다시 로그인해주세요.");
            return null;
          }

          throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error(`❌ API Call Failed:`, error);
        throw error;
      }
    },
    [accessToken, logout, router]
  );

  // 🔧 기존 simple API 사용 + terminated 사용자 후처리
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!isAuthenticated || !accessToken) {
        router.push("/login?message=인증이 필요합니다.");
        return;
      }

      console.log("📡 Fetching users with simple API...");
      const response = await callSuperAdminAPI("/api/super-admin/users/simple");

      if (response && response.success && response.users) {
        console.log(`✅ Loaded ${response.users.length} users`);

        // 🔧 terminated 사용자 후처리 (강화된 체크)
        const processedUsers = response.users.map((user) => {
          // 🔍 다양한 방법으로 terminated 상태 체크
          const isTerminated =
            user.entityStatus?.effectiveStatus === "terminated" ||
            user.entityStatus?.entityStatus === "terminated" ||
            user.userStatus === "terminated" ||
            user.user_status === "terminated" ||
            // 추가: analysis 데이터에서도 체크
            user.analysis?.userBasicInfo?.userStatus === "terminated" ||
            user.analysis?.userBasicInfo?.user_status === "terminated";

          if (isTerminated) {
            console.log(`🔧 Post-processing terminated user: ${user.name}`, {
              effectiveStatus: user.entityStatus?.effectiveStatus,
              entityStatus: user.entityStatus?.entityStatus,
              userStatus: user.userStatus,
              user_status: user.user_status,
              analysisStatus: user.analysis?.userBasicInfo?.userStatus,
            });

            return {
              ...user,
              entityStatus: {
                ...user.entityStatus,
                effectiveStatus: "terminated",
                entityStatus: "terminated",
                roleCategory: "terminated",
              },
              affiliation: {
                affiliationType: "terminated",
                affiliationName: "퇴사자",
                affiliationId: null,
                position: null,
                status: "terminated",
                details: "퇴사 처리됨",
              },
            };
          }
          return user;
        });

        setAllUsers(processedUsers);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("❌ Error fetching users:", error);
      setError(error.message);
      setAllUsers([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, accessToken, callSuperAdminAPI, router]);

  // 🔧 클라이언트사이드 필터링 및 페이지네이션
  const { filteredUsers, totalPages, pagination } = useMemo(() => {
    console.log("🔄 Recalculating filtered users...", {
      totalUsers: allUsers.length,
      searchTerm,
      roleFilter,
      statusFilter,
    });

    let filtered = allUsers;

    // 검색 필터
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (user) =>
          user.name?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower) ||
          user.username?.toLowerCase().includes(searchLower) ||
          user.affiliation?.affiliationName?.toLowerCase().includes(searchLower)
      );
    }

    // 역할 필터
    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.roles?.some((role) => role.code === roleFilter));
    }

    // 상태 필터
    if (statusFilter !== "all") {
      if (statusFilter === "active") {
        filtered = filtered.filter((user) => user.entityStatus?.effectiveStatus === "active");
      } else if (statusFilter === "inactive") {
        filtered = filtered.filter((user) => user.entityStatus?.effectiveStatus === "inactive");
      } else if (statusFilter === "terminated") {
        filtered = filtered.filter((user) => user.entityStatus?.effectiveStatus === "terminated");
      } else if (statusFilter === "unverified") {
        filtered = filtered.filter((user) => !user.isEmailVerified);
      }
    }

    // 페이지네이션 계산
    const total = filtered.length;
    const totalPagesCalc = Math.ceil(total / pageSize) || 1;
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedUsers = filtered.slice(startIndex, endIndex);

    const paginationInfo = {
      currentPage,
      pageSize,
      total,
      totalPages: totalPagesCalc,
      hasNextPage: currentPage < totalPagesCalc,
      hasPreviousPage: currentPage > 1,
      startIndex: total > 0 ? startIndex + 1 : 0,
      endIndex: Math.min(endIndex, total),
    };

    console.log("📊 Pagination calculated:", paginationInfo);

    return {
      filteredUsers: paginatedUsers,
      totalPages: totalPagesCalc,
      pagination: paginationInfo,
    };
  }, [allUsers, searchTerm, roleFilter, statusFilter, currentPage, pageSize]);

  // 🔧 검색 핸들러 (포커스 유지)
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    console.log("🔍 Search changed:", value);
    setSearchTerm(value);
    setCurrentPage(1); // 검색시 첫 페이지로
  }, []);

  // 🔧 필터 변경 핸들러
  const handleRoleFilterChange = useCallback((e) => {
    setRoleFilter(e.target.value);
    setCurrentPage(1);
  }, []);

  const handleStatusFilterChange = useCallback((e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  }, []);

  const handlePageSizeChange = useCallback((e) => {
    setPageSize(parseInt(e.target.value));
    setCurrentPage(1);
  }, []);

  // 🔧 페이지 변경 핸들러
  const handlePageChange = useCallback(
    (newPage) => {
      console.log(
        "🔥 Page change requested:",
        newPage,
        "Current:",
        currentPage,
        "Total:",
        totalPages
      );

      if (newPage < 1 || newPage > totalPages || newPage === currentPage) {
        console.log("🔥 Page change ignored - invalid");
        return;
      }

      console.log("🔥 Page change accepted");
      setCurrentPage(newPage);
    },
    [currentPage, totalPages]
  );

  // 🔧 일반 상태 변경 (active ↔ inactive만)
  const analyzeStatusChangeImpact = useCallback(
    async (userId, newStatus) => {
      try {
        setStatusChangeModal((prev) => ({ ...prev, isLoading: true }));

        const response = await callSuperAdminAPI(
          `/api/super-admin/users/${userId}/status?status=${newStatus}`
        );

        if (response && response.success) {
          return response;
        } else {
          throw new Error("영향 분석 실패");
        }
      } catch (error) {
        console.error("❌ Impact analysis failed:", error);
        throw error;
      } finally {
        setStatusChangeModal((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [callSuperAdminAPI]
  );

  const executeStatusChange = useCallback(
    async (userId, newStatus, reason) => {
      try {
        setStatusChangeModal((prev) => ({ ...prev, isExecuting: true }));

        const requestBody = {
          status: newStatus,
          reason: reason,
          confirm: true,
        };

        const response = await callSuperAdminAPI(`/api/super-admin/users/${userId}/status`, {
          method: "POST",
          body: JSON.stringify(requestBody),
        });

        if (response && response.success) {
          return response;
        } else {
          throw new Error(response?.error || "상태 변경 실패");
        }
      } catch (error) {
        console.error("❌ Status change failed:", error);
        throw error;
      }
    },
    [callSuperAdminAPI]
  );

  // 🔧 수정된 상태 변경 모달 (active ↔ inactive만)
  const openStatusChangeModal = useCallback(
    async (user, newStatus) => {
      try {
        // terminated 상태는 일반 상태 변경 모달로 처리하지 않음
        if (user.entityStatus?.effectiveStatus === "terminated" || newStatus === "terminated") {
          showWarning("퇴사 관련 처리는 별도 메뉴를 사용해주세요.");
          return;
        }

        const realTimeStatus = await callSuperAdminAPI(
          `/api/super-admin/users/${user.id}/status?status=${newStatus}`
        );

        if (realTimeStatus && realTimeStatus.entityInfo) {
          const currentRealStatus = realTimeStatus.entityInfo.currentStatus;
          if (currentRealStatus === newStatus) {
            showWarning(`이미 ${newStatus} 상태입니다. (실시간 확인됨)`);
            await fetchUsers();
            return;
          }
        }

        if (user.entityStatus?.roleCategory === "system") {
          showWarning("시스템 관리자의 상태는 변경할 수 없습니다.");
          return;
        }

        const currentStatus =
          user.entityStatus?.effectiveStatus || user.entityStatus?.entityStatus || "unknown";
        if (currentStatus === newStatus) {
          showWarning(`이미 ${newStatus} 상태입니다.`);
          return;
        }

        setStatusChangeModal({
          isOpen: true,
          user: user,
          newStatus: newStatus,
          impactAnalysis: null,
          isLoading: true,
          isExecuting: false,
        });

        const analysis = await analyzeStatusChangeImpact(user.id, newStatus);

        setStatusChangeModal((prev) => ({
          ...prev,
          impactAnalysis: analysis,
          isLoading: false,
        }));
      } catch (error) {
        showError(`영향 분석 실패: ${error.message}`);
        setStatusChangeModal({
          isOpen: false,
          user: null,
          newStatus: null,
          impactAnalysis: null,
          isLoading: false,
          isExecuting: false,
        });
      }
    },
    [callSuperAdminAPI, showWarning, showError, analyzeStatusChangeImpact, fetchUsers]
  );

  const confirmStatusChange = useCallback(
    async (reason) => {
      try {
        const { user, newStatus } = statusChangeModal;

        const result = await executeStatusChange(user.id, newStatus, reason);

        showSuccess("상태 변경이 완료되었습니다.");

        await fetchUsers();

        setStatusChangeModal({
          isOpen: false,
          user: null,
          newStatus: null,
          impactAnalysis: null,
          isLoading: false,
          isExecuting: false,
        });
      } catch (error) {
        showError(`상태 변경 실패: ${error.message}`);
      }
    },
    [statusChangeModal, executeStatusChange, showSuccess, showError, fetchUsers]
  );

  // 🆕 퇴사 처리 모달
  const openTerminationModal = useCallback(
    async (user) => {
      try {
        if (user.entityStatus?.effectiveStatus === "terminated") {
          showWarning("이미 퇴사 처리된 사용자입니다.");
          return;
        }

        if (user.entityStatus?.roleCategory === "system") {
          showWarning("시스템 관리자는 퇴사 처리할 수 없습니다.");
          return;
        }

        setTerminationModal({
          isOpen: true,
          user: user,
          impactAnalysis: null,
          isLoading: true,
          isExecuting: false,
        });

        // terminated 상태로의 영향 분석
        const analysis = await callSuperAdminAPI(
          `/api/super-admin/users/${user.id}/status?status=terminated`
        );

        setTerminationModal((prev) => ({
          ...prev,
          impactAnalysis: analysis,
          isLoading: false,
        }));
      } catch (error) {
        showError(`퇴사 처리 분석 실패: ${error.message}`);
        setTerminationModal({
          isOpen: false,
          user: null,
          impactAnalysis: null,
          isLoading: false,
          isExecuting: false,
        });
      }
    },
    [callSuperAdminAPI, showWarning, showError]
  );

  const confirmTermination = useCallback(
    async (reason, effectiveDate) => {
      try {
        setTerminationModal((prev) => ({ ...prev, isExecuting: true }));

        const requestBody = {
          status: "terminated",
          reason: reason,
          effectiveDate: effectiveDate,
          confirm: true,
        };

        const response = await callSuperAdminAPI(
          `/api/super-admin/users/${terminationModal.user.id}/status`,
          {
            method: "POST",
            body: JSON.stringify(requestBody),
          }
        );

        if (response && response.success) {
          showSuccess("퇴사 처리가 완료되었습니다.");
          await fetchUsers();
          setTerminationModal({
            isOpen: false,
            user: null,
            impactAnalysis: null,
            isLoading: false,
            isExecuting: false,
          });
        } else {
          throw new Error(response?.error || "퇴사 처리 실패");
        }
      } catch (error) {
        showError(`퇴사 처리 실패: ${error.message}`);
      } finally {
        setTerminationModal((prev) => ({ ...prev, isExecuting: false }));
      }
    },
    [terminationModal, callSuperAdminAPI, showSuccess, showError, fetchUsers]
  );

  // 🆕 퇴사자 복구 모달
  const openRestoreModal = useCallback(
    (user) => {
      if (user.entityStatus?.effectiveStatus !== "terminated") {
        showWarning("퇴사 상태가 아닌 사용자입니다.");
        return;
      }

      setRestoreModal({
        isOpen: true,
        user: user,
        isExecuting: false,
      });
    },
    [showWarning]
  );

  const confirmRestore = useCallback(
    async (reason, restoreStatus) => {
      try {
        setRestoreModal((prev) => ({ ...prev, isExecuting: true }));

        const requestBody = {
          status: restoreStatus, // "active" 또는 "inactive"
          reason: reason,
          confirm: true,
          isRestore: true, // 복구임을 명시
        };

        const response = await callSuperAdminAPI(
          `/api/super-admin/users/${restoreModal.user.id}/status`,
          {
            method: "POST",
            body: JSON.stringify(requestBody),
          }
        );

        if (response && response.success) {
          showSuccess(
            `사용자가 ${restoreStatus === "active" ? "활성" : "비활성"} 상태로 복구되었습니다.`
          );
          await fetchUsers();
          setRestoreModal({
            isOpen: false,
            user: null,
            isExecuting: false,
          });
        } else {
          throw new Error(response?.error || "복구 실패");
        }
      } catch (error) {
        showError(`복구 실패: ${error.message}`);
      } finally {
        setRestoreModal((prev) => ({ ...prev, isExecuting: false }));
      }
    },
    [restoreModal, callSuperAdminAPI, showSuccess, showError, fetchUsers]
  );

  const debugUserDBState = useCallback(
    async (userId, userName) => {
      try {
        const response = await callSuperAdminAPI(`/api/super-admin/debug/user-status/${userId}`);

        if (response && response.success) {
          setDbDebugModal({
            isOpen: true,
            data: response,
            userName: userName,
          });
        }
      } catch (error) {
        console.error("❌ DB 디버깅 실패:", error);
      }
    },
    [callSuperAdminAPI]
  );

  const handleUserAction = useCallback(
    async (userId, action, value) => {
      try {
        const user = allUsers.find((u) => u.id === userId);

        switch (action) {
          case "verify_email":
            showConfirm(`사용자 "${user.name}"의 이메일을 인증 처리하시겠습니까?`, async () => {
              await executeUserAction(userId, action, value);
            });
            return;

          case "unlock_account":
            showConfirm(`사용자 "${user.name}"의 계정 잠금을 해제하시겠습니까?`, async () => {
              await executeUserAction(userId, action, value);
            });
            return;

          case "delete_user":
            showConfirm(
              `⚠️ 경고: 사용자 "${user.name}"을 영구적으로 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`,
              () => {
                showDeleteConfirmation(user);
              },
              "사용자 삭제",
              "danger"
            );
            return;

          default:
            throw new Error(`Unknown action: ${action}`);
        }
      } catch (error) {
        console.error("❌ Error in handleUserAction:", error);
        showError(`작업 실패: ${error.message}`);
      }
    },
    [allUsers, showConfirm, showError]
  );

  const showDeleteConfirmation = useCallback((user) => {
    setConfirmModal({
      isOpen: true,
      type: "danger",
      title: "사용자 삭제 확인",
      message: `정말로 삭제하시려면 사용자 이름 "${user.name}"을 정확히 입력해주세요:`,
      confirmText: "삭제",
      cancelText: "취소",
      requireTextInput: true,
      expectedText: user.name,
      onConfirm: async () => {
        await executeUserAction(user.id, "delete_user", null);
      },
    });
  }, []);

  const executeUserAction = useCallback(
    async (userId, action, value) => {
      try {
        const response = await callSuperAdminAPI("/api/super-admin/users", {
          method: action === "delete_user" ? "DELETE" : "PATCH",
          body: JSON.stringify({
            userId,
            action: action === "delete_user" ? undefined : action,
            value: action === "delete_user" ? undefined : value,
            confirm: action === "delete_user" ? "DELETE_USER_PERMANENTLY" : undefined,
          }),
        });

        if (response && response.success) {
          await fetchUsers();

          const actionNames = {
            verify_email: "이메일 인증",
            unlock_account: "계정 잠금 해제",
            delete_user: "사용자 삭제",
          };

          showSuccess(`${actionNames[action]}이 완료되었습니다.`);
        }
      } catch (error) {
        showError(`작업 실패: ${error.message}`);
      }
    },
    [callSuperAdminAPI, fetchUsers, showSuccess, showError]
  );

  const handleRefresh = useCallback(() => {
    fetchUsers();
  }, [fetchUsers]);

  // 🔧 렌더링 최적화된 헬퍼 함수들
  const getRoleBadgeColor = useCallback((roleCode, isActive = true) => {
    const baseColor = (() => {
      switch (roleCode) {
        case "SUPER_ADMIN":
        case "SYSTEM_ADMIN":
          return "bg-red-100 text-red-800";
        case "LABOR_ADMIN":
          return "bg-blue-100 text-blue-800";
        case "LABOR_STAFF":
          return "bg-blue-50 text-blue-600";
        case "COMPANY_ADMIN":
          return "bg-green-100 text-green-800";
        case "COMPANY_HR":
          return "bg-green-50 text-green-600";
        default:
          return "bg-gray-100 text-gray-800";
      }
    })();

    if (!isActive) {
      return "bg-gray-100 text-gray-500 opacity-75";
    }

    return baseColor;
  }, []);

  // 🔧 수정된 상태 뱃지 색상 (terminated 구분)
  const getEntityStatusBadgeColor = useCallback((entityStatus, effectiveStatus) => {
    const status = effectiveStatus || entityStatus;
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-yellow-100 text-yellow-800";
      case "terminated":
        return "bg-red-100 text-red-800"; // 🔧 terminated는 빨간색
      default:
        return "bg-gray-100 text-gray-800";
    }
  }, []);

  // 🔧 수정된 상태 텍스트 (terminated 구분)
  const getStatusText = useCallback((effectiveStatus) => {
    switch (effectiveStatus) {
      case "active":
        return "활성";
      case "inactive":
        return "비활성";
      case "terminated":
        return "퇴사"; // 🔧 terminated는 "퇴사"로 표시
      default:
        return "불명";
    }
  }, []);

  // 🔧 개선된 소속 표시 함수 (terminated case 추가)
  const getAffiliationDisplay = useCallback((affiliation) => {
    if (!affiliation)
      return { name: "소속 없음", type: "없음", icon: "❓", color: "text-gray-500" };

    switch (affiliation.affiliationType) {
      case "terminated": // 🔧 새로 추가
        return {
          name: affiliation.affiliationName, // "퇴사자"
          type: "퇴사 처리됨",
          icon: "🚫",
          color: "text-red-600",
        };
      case "labor_office":
        return {
          name: affiliation.affiliationName,
          type: "노무사 사무실",
          icon: "🏢",
          color: "text-blue-600",
        };
      case "company":
        return {
          name: affiliation.affiliationName,
          type: "회사",
          icon: "🏭",
          color: "text-green-600",
        };
      case "worker":
        return {
          name: affiliation.affiliationName,
          type: "근로자",
          icon: "👤",
          color: "text-purple-600",
        };
      case "none":
        return {
          name: "시스템 사용자",
          type: "독립 계정",
          icon: "⚙️",
          color: "text-gray-600",
        };
      default:
        return {
          name: affiliation.affiliationName || "확인 불가",
          type: "알 수 없음",
          icon: "❓",
          color: "text-gray-500",
        };
    }
  }, []);

  const getRoleName = useCallback((roleCode) => {
    switch (roleCode) {
      case "SUPER_ADMIN":
        return "시스템 최고 관리자";
      case "SYSTEM_ADMIN":
        return "시스템 관리자";
      case "LABOR_ADMIN":
        return "노무사 관리자";
      case "LABOR_STAFF":
        return "노무사 직원";
      case "COMPANY_ADMIN":
        return "회사 관리자";
      case "COMPANY_HR":
        return "인사담당자";
      default:
        return roleCode;
    }
  }, []);

  // 🔧 마운트시에만 데이터 로드
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // 에러 상태
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold">오류 발생</h3>
          <p className="text-red-600 mt-1">{error}</p>
          <button
            onClick={fetchUsers}
            className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // 로딩 상태
  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-12 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">사용자 관리</h1>
          <p className="text-gray-600 mt-1">
            시스템 전체 사용자 계정 관리 (총 {pagination.total.toLocaleString()}명)
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            {loading ? "🔄 새로고침 중..." : "🔄 새로고침"}
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors">
            + 새 사용자 추가
          </button>
        </div>
      </div>

      {/* 🔧 검색 및 필터 */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">검색</label>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="이름, 이메일, 사용자명, 소속으로 검색..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">역할</label>
            <select
              value={roleFilter}
              onChange={handleRoleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">모든 역할</option>
              <option value="SUPER_ADMIN">시스템 최고 관리자</option>
              <option value="LABOR_ADMIN">노무사 관리자</option>
              <option value="LABOR_STAFF">노무사 직원</option>
              <option value="COMPANY_ADMIN">회사 관리자</option>
              <option value="COMPANY_HR">인사담당자</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
            <select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">모든 상태</option>
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
              <option value="terminated">퇴사</option>
              <option value="unverified">이메일 미인증</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">페이지 크기</label>
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="10">10개씩</option>
              <option value="20">20개씩</option>
              <option value="50">50개씩</option>
              <option value="100">100개씩</option>
            </select>
          </div>
        </div>
      </div>

      {/* 🔧 페이지 정보 표시 */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-600">
          {pagination.total > 0 ? (
            <>
              {pagination.startIndex.toLocaleString()}-{pagination.endIndex.toLocaleString()} of{" "}
              {pagination.total.toLocaleString()} 사용자
            </>
          ) : (
            "검색 결과가 없습니다"
          )}
        </div>
        <div className="text-sm text-gray-500">
          페이지 {pagination.currentPage} / {pagination.totalPages}
        </div>
      </div>

      {/* 사용자 테이블 */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  사용자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  소속
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  역할
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  마지막 로그인
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => {
                const affiliationDisplay = getAffiliationDisplay(user.affiliation);
                const currentStatus =
                  user.entityStatus?.effectiveStatus ||
                  user.entityStatus?.entityStatus ||
                  "unknown";

                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                            {user.name.charAt(0)}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          <div className="text-xs text-gray-400">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{affiliationDisplay.icon}</span>
                        <div>
                          <div className={`text-sm font-medium ${affiliationDisplay.color}`}>
                            {affiliationDisplay.name}
                          </div>
                          <div className="text-xs text-gray-500">{affiliationDisplay.type}</div>
                          {user.affiliation?.position && (
                            <div className="text-xs text-gray-400">{user.affiliation.position}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {user.roles?.map((role) => (
                          <div key={role.code} className="flex items-center">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(
                                role.code,
                                role.isActive
                              )}`}
                            >
                              {getRoleName(role.code)}
                              {!role.isActive && (
                                <span className="ml-1 text-xs opacity-75">(비활성)</span>
                              )}
                            </span>
                          </div>
                        )) || []}
                        {(!user.roles || user.roles.length === 0) && (
                          <span className="inline-flex px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-500">
                            역할 없음
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEntityStatusBadgeColor(
                            user.entityStatus?.entityStatus,
                            user.entityStatus?.effectiveStatus
                          )}`}
                        >
                          {getStatusText(user.entityStatus?.effectiveStatus)}
                        </span>
                        {user.entityStatus?.entityStatus !== user.entityStatus?.effectiveStatus && (
                          <span className="inline-flex px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">
                            상위 제약: {user.entityStatus?.entityStatus}
                          </span>
                        )}
                        {!user.isEmailVerified && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            이메일 미인증
                          </span>
                        )}
                        {user.lockedUntil && new Date(user.lockedUntil) > new Date() && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            계정 잠김
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        {user.lastLogin
                          ? new Date(user.lastLogin).toLocaleString("ko-KR")
                          : "로그인 기록 없음"}
                      </div>
                      <div className="text-xs text-gray-400">로그인 {user.loginCount || 0}회</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2 flex-wrap gap-1">
                        <button
                          onClick={() => debugUserDBState(user.id, user.name)}
                          className="text-purple-600 hover:text-purple-900 text-xs border border-purple-300 rounded px-2 py-1 hover:bg-purple-50"
                          title="실제 DB 상태 확인"
                        >
                          🔍 DB
                        </button>

                        {user.entityStatus?.roleCategory !== "system" && (
                          <>
                            {/* 🔧 개선된 terminated 상태별 버튼 분기 */}
                            {currentStatus === "terminated" ? (
                              // terminated 사용자: 복구 버튼만 (스타일링 개선)
                              <button
                                onClick={() => openRestoreModal(user)}
                                className="text-blue-600 hover:text-blue-900 font-medium px-3 py-1 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
                                title="퇴사자 복구 (신중한 절차)"
                              >
                                📋 퇴사자 복구
                              </button>
                            ) : (
                              // 일반 사용자: active ↔ inactive + 퇴사 처리
                              <>
                                {currentStatus === "active" && (
                                  <button
                                    onClick={() => openStatusChangeModal(user, "inactive")}
                                    className="text-yellow-600 hover:text-yellow-900 px-2 py-1 border border-yellow-300 rounded hover:bg-yellow-50 transition-colors"
                                  >
                                    비활성화
                                  </button>
                                )}
                                {currentStatus === "inactive" && (
                                  <button
                                    onClick={() => openStatusChangeModal(user, "active")}
                                    className="text-green-600 hover:text-green-900 px-2 py-1 border border-green-300 rounded hover:bg-green-50 transition-colors"
                                  >
                                    활성화
                                  </button>
                                )}
                                {(currentStatus === "active" || currentStatus === "inactive") && (
                                  <button
                                    onClick={() => openTerminationModal(user)}
                                    className="text-red-600 hover:text-red-900 font-medium px-2 py-1 border border-red-300 rounded hover:bg-red-50 transition-colors"
                                    title="퇴사 처리 (신중한 절차)"
                                  >
                                    ⚠️ 퇴사처리
                                  </button>
                                )}
                                {currentStatus === "unknown" && (
                                  <span className="text-gray-500 text-xs">상태 확인 필요</span>
                                )}
                              </>
                            )}
                          </>
                        )}

                        {!user.isEmailVerified && (
                          <button
                            onClick={() => handleUserAction(user.id, "verify_email")}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            인증 처리
                          </button>
                        )}

                        {user.lockedUntil && new Date(user.lockedUntil) > new Date() && (
                          <button
                            onClick={() => handleUserAction(user.id, "unlock_account")}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            잠금 해제
                          </button>
                        )}

                        <button
                          onClick={() => handleUserAction(user.id, "delete_user")}
                          className="text-red-600 hover:text-red-900"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">검색 조건에 맞는 사용자가 없습니다.</p>
          </div>
        )}
      </div>

      {/* 🔧 클라이언트사이드 페이지네이션 컨트롤 */}
      <PaginationControls pagination={pagination} onPageChange={handlePageChange} />

      {/* 🔧 기존 상태 변경 모달 (active ↔ inactive만) */}
      {statusChangeModal.isOpen && (
        <StatusChangeModal
          modal={statusChangeModal}
          onConfirm={confirmStatusChange}
          onCancel={() =>
            setStatusChangeModal({
              isOpen: false,
              user: null,
              newStatus: null,
              impactAnalysis: null,
              isLoading: false,
              isExecuting: false,
            })
          }
        />
      )}

      {/* 🆕 퇴사 처리 모달 */}
      {terminationModal.isOpen && (
        <TerminationModal
          modal={terminationModal}
          onConfirm={confirmTermination}
          onCancel={() =>
            setTerminationModal({
              isOpen: false,
              user: null,
              impactAnalysis: null,
              isLoading: false,
              isExecuting: false,
            })
          }
        />
      )}

      {/* 🆕 퇴사자 복구 모달 */}
      {restoreModal.isOpen && (
        <RestoreModal
          modal={restoreModal}
          onConfirm={confirmRestore}
          onCancel={() =>
            setRestoreModal({
              isOpen: false,
              user: null,
              isExecuting: false,
            })
          }
        />
      )}

      {/* 🆕 DB 디버그 모달 */}
      <DBDebugModal
        isOpen={dbDebugModal.isOpen}
        onClose={() => setDbDebugModal({ isOpen: false, data: null, userName: "" })}
        debugData={dbDebugModal.data}
        userName={dbDebugModal.userName}
      />

      {/* 🆕 알림 모달 */}
      <ConfirmModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={alertModal.onConfirm}
        title={alertModal.title}
        message={alertModal.message}
        confirmText="확인"
        cancelText=""
        type={alertModal.type}
      />

      {/* 🆕 확인 모달 */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        type={confirmModal.type}
      />

      {/* 🆕 텍스트 입력 확인 모달 (삭제 확인용) */}
      {confirmModal.requireTextInput && (
        <TextInputConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          message={confirmModal.message}
          expectedText={confirmModal.expectedText}
          confirmText={confirmModal.confirmText}
          cancelText={confirmModal.cancelText}
          type={confirmModal.type}
        />
      )}

      {/* 🔧 통계 요약 */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{allUsers.length.toLocaleString()}</div>
          <div className="text-sm text-blue-700">전체 사용자</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {allUsers.filter((u) => u.entityStatus?.effectiveStatus === "active").length}
          </div>
          <div className="text-sm text-green-700">활성 사용자</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {allUsers.filter((u) => u.entityStatus?.effectiveStatus === "inactive").length}
          </div>
          <div className="text-sm text-yellow-700">비활성 사용자</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-600">
            {allUsers.filter((u) => u.entityStatus?.effectiveStatus === "terminated").length}
          </div>
          <div className="text-sm text-red-700">퇴사 사용자</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {allUsers.filter((u) => u.roles?.some((role) => role.code === "SUPER_ADMIN")).length}
          </div>
          <div className="text-sm text-purple-700">시스템 관리자</div>
        </div>
      </div>
    </div>
  );
}

// 🔧 클라이언트사이드 페이지네이션 컨트롤 컴포넌트
function PaginationControls({ pagination, onPageChange }) {
  const { currentPage, totalPages, hasNextPage, hasPreviousPage } = pagination;

  const handlePageClick = useCallback(
    (page) => {
      console.log("🔥 Pagination button clicked:", page);
      onPageChange(page);
    },
    [onPageChange]
  );

  const handlePrevClick = useCallback(() => {
    console.log("🔥 Previous button clicked");
    onPageChange(currentPage - 1);
  }, [onPageChange, currentPage]);

  const handleNextClick = useCallback(() => {
    console.log("🔥 Next button clicked");
    onPageChange(currentPage + 1);
  }, [onPageChange, currentPage]);

  // 표시할 페이지 번호 계산
  const visiblePages = useMemo(() => {
    const delta = 2;
    const range = [];
    const start = Math.max(1, currentPage - delta);
    const end = Math.min(totalPages, currentPage + delta);

    if (start > 1) {
      range.push(1);
      if (start > 2) {
        range.push("...");
      }
    }

    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    if (end < totalPages) {
      if (end < totalPages - 1) {
        range.push("...");
      }
      range.push(totalPages);
    }

    return range;
  }, [currentPage, totalPages]);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-b-lg mt-4">
      <div className="flex-1 flex justify-between sm:hidden">
        <button
          onClick={handlePrevClick}
          disabled={!hasPreviousPage}
          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          이전
        </button>
        <button
          onClick={handleNextClick}
          disabled={!hasNextPage}
          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          다음
        </button>
      </div>
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            총 <span className="font-medium">{totalPages}</span> 페이지 중{" "}
            <span className="font-medium">{currentPage}</span> 페이지
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
            <button
              onClick={handlePrevClick}
              disabled={!hasPreviousPage}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">이전</span>
              <svg
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {visiblePages.map((page, index) => {
              if (page === "...") {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                  >
                    ...
                  </span>
                );
              }

              const isCurrentPage = page === currentPage;
              return (
                <button
                  key={page}
                  onClick={() => handlePageClick(page)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    isCurrentPage
                      ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                      : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              );
            })}

            <button
              onClick={handleNextClick}
              disabled={!hasNextPage}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">다음</span>
              <svg
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}

// 🔧 기존 상태 변경 모달 (active ↔ inactive만)
function StatusChangeModal({ modal, onConfirm, onCancel }) {
  const [reason, setReason] = useState("");

  if (!modal.isOpen) return null;

  const { user, newStatus, impactAnalysis, isLoading, isExecuting } = modal;

  const statusNames = {
    active: "활성화",
    inactive: "비활성화",
  };

  const statusColors = {
    active: "text-green-600",
    inactive: "text-yellow-600",
  };

  return (
    <Modal isOpen={modal.isOpen} onClose={onCancel} size="2xl" title="사용자 상태 변경">
      <ModalBody>
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-3">
              {user?.name?.charAt(0)}
            </div>
            <div>
              <div className="font-medium">{user?.name}</div>
              <div className="text-sm text-gray-500">{user?.email}</div>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            현재 상태: <span className="font-medium">{user?.entityStatus?.entityStatus}</span>
            {user?.entityStatus?.entityStatus !== user?.entityStatus?.effectiveStatus && (
              <span className="text-orange-600 ml-2">
                (효과적 상태: {user?.entityStatus?.effectiveStatus})
              </span>
            )}
            →{" "}
            <span className={`font-medium ${statusColors[newStatus]}`}>
              {statusNames[newStatus]}
            </span>
          </div>
        </div>

        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">영향 분석 중...</p>
          </div>
        )}

        {impactAnalysis && !isLoading && (
          <div className="mb-6">
            {!impactAnalysis.canChange && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">변경 불가</h4>
                <p className="text-yellow-700">{impactAnalysis.reason}</p>
              </div>
            )}

            {impactAnalysis.canChange && impactAnalysis.impact && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">영향 분석 결과</h4>
                {impactAnalysis.impact.totalAffected > 0 ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center mb-2">
                        <svg
                          className="w-5 h-5 text-orange-500 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="font-medium text-orange-800">
                          {impactAnalysis.impact.totalAffected}개 엔터티에 영향
                        </span>
                      </div>
                      <div className="text-sm text-orange-700">
                        사용자 {impactAnalysis.impact.impactSummary.users}명, 회사{" "}
                        {impactAnalysis.impact.impactSummary.companies}개, 근로자{" "}
                        {impactAnalysis.impact.impactSummary.workers}명
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 text-green-500 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="font-medium text-green-800">다른 엔터티에 영향 없음</span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      이 사용자의 상태 변경은 다른 사용자나 시스템에 영향을 주지 않습니다.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {impactAnalysis?.canChange && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">변경 사유 (선택)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="상태 변경 사유를 입력하세요..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        <button
          onClick={onCancel}
          disabled={isExecuting}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50"
        >
          취소
        </button>
        {impactAnalysis?.canChange && (
          <button
            onClick={() => onConfirm(reason)}
            disabled={isExecuting}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50 ${
              newStatus === "active"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-yellow-600 hover:bg-yellow-700"
            }`}
          >
            {isExecuting ? "처리 중..." : `${statusNames[newStatus]} 확인`}
          </button>
        )}
      </ModalFooter>
    </Modal>
  );
}

// 🆕 퇴사 처리 모달
function TerminationModal({ modal, onConfirm, onCancel }) {
  const [reason, setReason] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split("T")[0]);

  if (!modal.isOpen) return null;

  const { user, impactAnalysis, isLoading, isExecuting } = modal;

  return (
    <Modal isOpen={modal.isOpen} onClose={onCancel} size="2xl" title="퇴사 처리">
      <ModalBody>
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center mb-2">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium text-red-800">⚠️ 신중한 절차가 필요한 퇴사 처리</span>
          </div>
          <p className="text-sm text-red-700">
            퇴사 처리는 되돌리기 어려운 작업입니다. 복구는 별도의 신중한 절차를 통해서만 가능합니다.
          </p>
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-3">
              {user?.name?.charAt(0)}
            </div>
            <div>
              <div className="font-medium">{user?.name}</div>
              <div className="text-sm text-gray-500">{user?.email}</div>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            현재 상태: <span className="font-medium">{user?.entityStatus?.effectiveStatus}</span>→{" "}
            <span className="font-medium text-red-600">종료 (퇴사)</span>
          </div>
        </div>

        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            <p className="mt-2 text-gray-600">영향 분석 중...</p>
          </div>
        )}

        {impactAnalysis && !isLoading && (
          <div className="mb-6">
            {!impactAnalysis.canChange && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">퇴사 처리 불가</h4>
                <p className="text-yellow-700">{impactAnalysis.reason}</p>
              </div>
            )}

            {impactAnalysis.canChange && impactAnalysis.impact && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">퇴사 처리 영향 분석</h4>
                {impactAnalysis.impact.totalAffected > 0 ? (
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center mb-2">
                      <svg
                        className="w-5 h-5 text-orange-500 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="font-medium text-orange-800">
                        {impactAnalysis.impact.totalAffected}개 엔터티에 영향
                      </span>
                    </div>
                    <div className="text-sm text-orange-700">
                      퇴사 처리 시 영향받는 사용자: {impactAnalysis.impact.impactSummary.users}명,
                      회사: {impactAnalysis.impact.impactSummary.companies}개, 근로자:{" "}
                      {impactAnalysis.impact.impactSummary.workers}명
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 text-green-500 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="font-medium text-green-800">다른 엔터티에 영향 없음</span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      이 사용자의 퇴사 처리는 다른 사용자나 시스템에 영향을 주지 않습니다.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {impactAnalysis?.canChange && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                퇴사 사유 (필수)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="퇴사 사유를 상세히 입력해주세요..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">퇴사 일자</label>
              <input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
            </div>
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        <button
          onClick={onCancel}
          disabled={isExecuting}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50"
        >
          취소
        </button>
        {impactAnalysis?.canChange && (
          <button
            onClick={() => onConfirm(reason, effectiveDate)}
            disabled={isExecuting || !reason.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50"
          >
            {isExecuting ? "퇴사 처리 중..." : "⚠️ 퇴사 처리 확인"}
          </button>
        )}
      </ModalFooter>
    </Modal>
  );
}

// 🆕 퇴사자 복구 모달
function RestoreModal({ modal, onConfirm, onCancel }) {
  const [reason, setReason] = useState("");
  const [restoreStatus, setRestoreStatus] = useState("active");

  if (!modal.isOpen) return null;

  const { user, isExecuting } = modal;

  return (
    <Modal isOpen={modal.isOpen} onClose={onCancel} size="lg" title="퇴사자 복구">
      <ModalBody>
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center mb-2">
            <svg className="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium text-blue-800">📋 신중한 절차가 필요한 퇴사자 복구</span>
          </div>
          <p className="text-sm text-blue-700">
            퇴사자 복구는 매우 신중하게 처리되어야 합니다. 복구 후에는 해당 사용자가 시스템에 다시
            접근할 수 있게 됩니다.
          </p>
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-3">
              {user?.name?.charAt(0)}
            </div>
            <div>
              <div className="font-medium">{user?.name}</div>
              <div className="text-sm text-gray-500">{user?.email}</div>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            현재 상태: <span className="font-medium text-red-600">종료 (퇴사)</span>→{" "}
            <span
              className={`font-medium ${
                restoreStatus === "active" ? "text-green-600" : "text-yellow-600"
              }`}
            >
              {restoreStatus === "active" ? "활성" : "비활성"}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">복구 후 상태</label>
            <select
              value={restoreStatus}
              onChange={(e) => setRestoreStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">활성 (즉시 시스템 접근 가능)</option>
              <option value="inactive">비활성 (시스템 접근 제한, 추후 활성화 필요)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">복구 사유 (필수)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="퇴사자 복구 사유를 상세히 입력해주세요..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              required
            />
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <button
          onClick={onCancel}
          disabled={isExecuting}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50"
        >
          취소
        </button>
        <button
          onClick={() => onConfirm(reason, restoreStatus)}
          disabled={isExecuting || !reason.trim()}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
        >
          {isExecuting ? "복구 처리 중..." : "📋 복구 확인"}
        </button>
      </ModalFooter>
    </Modal>
  );
}

// 🆕 텍스트 입력 확인 모달 (삭제 확인용)
function TextInputConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  expectedText,
  confirmText,
  cancelText,
  type,
}) {
  const [inputText, setInputText] = useState("");
  const isValid = inputText === expectedText;

  const handleConfirm = () => {
    if (isValid) {
      onConfirm();
      onClose();
      setInputText("");
    }
  };

  const handleClose = () => {
    onClose();
    setInputText("");
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md" title={title}>
      <ModalBody>
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-4">{message}</p>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`"${expectedText}" 입력`}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          {inputText && !isValid && (
            <p className="text-sm text-red-600 mt-1">입력한 텍스트가 일치하지 않습니다.</p>
          )}
        </div>
      </ModalBody>

      <ModalFooter>
        <button
          onClick={handleClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
        >
          {cancelText}
        </button>
        <button
          onClick={handleConfirm}
          disabled={!isValid}
          className={`px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed ${
            type === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {confirmText}
        </button>
      </ModalFooter>
    </Modal>
  );
}
