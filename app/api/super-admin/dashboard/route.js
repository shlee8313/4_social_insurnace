// 📁 app/api/super-admin/dashboard/route.js (수정된 버전)
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { queryBuilder } from "@/lib/database";

/**
 * Super Admin 대시보드 통계 API
 * GET: 전체 시스템 통계 및 상태 정보
 */

// 🔧 수정된 SUPER_ADMIN 권한 체크 함수
async function checkSuperAdminAuth(request) {
  try {
    // 1. Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get("authorization");
    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    // 2. 쿠키에서도 토큰 시도
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
      console.log("❌ No token found in request");
      return { success: false, error: "No token provided" };
    }

    console.log("🔍 Token found, verifying...");
    const decoded = verifyToken(token);

    if (!decoded) {
      console.log("❌ Token verification failed");
      return { success: false, error: "Invalid token" };
    }

    console.log("✅ Token verified for user:", decoded.username);
    console.log("🔍 User roles:", decoded.roles);

    // 3. SUPER_ADMIN 역할 확인 (유연한 체크)
    const roles = decoded.roles || [];
    const hasSuperAdminRole = roles.some((role) => {
      // 역할이 문자열인 경우와 객체인 경우 모두 처리
      const roleCode = typeof role === "string" ? role : role.code;
      return roleCode === "SUPER_ADMIN" || roleCode === "SYSTEM_ADMIN";
    });

    if (!hasSuperAdminRole) {
      console.log("❌ Insufficient permissions. User roles:", roles);
      return { success: false, error: "Insufficient permissions - SUPER_ADMIN required" };
    }

    console.log("✅ SUPER_ADMIN access granted for user:", decoded.username);
    return { success: true, userId: decoded.userId, username: decoded.username };
  } catch (error) {
    console.error("❌ Auth check error:", error);
    return { success: false, error: error.message };
  }
}

// GET: 대시보드 통계 데이터
export async function GET(request) {
  try {
    console.log("🔍 SUPER_ADMIN Dashboard API: Getting system statistics");

    // SUPER_ADMIN 권한 체크
    const authResult = await checkSuperAdminAuth(request);
    if (!authResult.success) {
      console.log("❌ Dashboard API: Auth failed -", authResult.error);
      return NextResponse.json(
        {
          error: authResult.error,
          details: "Dashboard access denied",
        },
        { status: 401 }
      );
    }

    console.log("✅ Dashboard API: Auth successful for", authResult.username);

    // 병렬로 각종 통계 데이터 조회
    const [usersStats, companiesStats, laborOfficesStats, workersStats, recentActivities] =
      await Promise.all([
        getUsersStats().catch((err) => {
          console.error("Users stats error:", err);
          return { total: 0, active: 0, growth: 0 };
        }),
        getCompaniesStats().catch((err) => {
          console.error("Companies stats error:", err);
          return { total: 0, growth: 0 };
        }),
        getLaborOfficesStats().catch((err) => {
          console.error("Labor offices stats error:", err);
          return { total: 0, growth: 0 };
        }),
        getWorkersStats().catch((err) => {
          console.error("Workers stats error:", err);
          return { total: 0, growth: 0 };
        }),
        getRecentActivities().catch((err) => {
          console.error("Activities error:", err);
          return [];
        }),
      ]);

    // 시스템 상태 정보
    const systemStatus = await getSystemStatus().catch((err) => {
      console.error("System status error:", err);
      return { health: "unknown", lastBackup: null, alerts: [] };
    });

    const dashboardData = {
      stats: {
        totalUsers: usersStats.total,
        activeUsers: usersStats.active,
        totalCompanies: companiesStats.total,
        totalLaborOffices: laborOfficesStats.total,
        totalWorkers: workersStats.total,
        pendingActions: 0, // 추후 구현
        systemHealth: systemStatus.health,
        lastBackup: systemStatus.lastBackup,
      },
      trends: {
        usersGrowth: usersStats.growth,
        companiesGrowth: companiesStats.growth,
        laborOfficesGrowth: laborOfficesStats.growth,
        workersGrowth: workersStats.growth,
      },
      recentActivities,
      systemAlerts: systemStatus.alerts,
    };

    console.log("✅ SUPER_ADMIN Dashboard: Statistics retrieved successfully");
    console.log("📊 Dashboard stats:", dashboardData.stats);

    return NextResponse.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error("❌ SUPER_ADMIN Dashboard API Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch dashboard data",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// 사용자 통계 조회
async function getUsersStats() {
  try {
    console.log("📊 Getting users stats...");

    // 전체 사용자 수
    const { data: usersData, error: usersError } = await queryBuilder.select(
      "users",
      "user_id, is_active, last_login, created_at",
      { useAdmin: true }
    );

    if (usersError) {
      console.error("Users query error:", usersError);
      throw usersError;
    }

    const totalUsers = usersData?.length || 0;

    // 활성 사용자 수 (최근 30일 내 로그인)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeUsers =
      usersData?.filter(
        (user) => user.is_active && user.last_login && new Date(user.last_login) > thirtyDaysAgo
      ).length || 0;

    // 이번 달 신규 가입자 수
    const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const thisMonthUsers =
      usersData?.filter((user) => user.created_at && new Date(user.created_at) >= thisMonthStart)
        .length || 0;

    // 지난 달 가입자 수
    const lastMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
    const lastMonthEnd = new Date(new Date().getFullYear(), new Date().getMonth(), 0);
    const lastMonthUsers =
      usersData?.filter(
        (user) =>
          user.created_at &&
          new Date(user.created_at) >= lastMonthStart &&
          new Date(user.created_at) <= lastMonthEnd
      ).length || 0;

    // 성장률 계산
    const growth =
      lastMonthUsers > 0 ? ((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100 : 0;

    console.log("✅ Users stats:", { total: totalUsers, active: activeUsers, growth });

    return {
      total: totalUsers,
      active: activeUsers,
      growth: Math.round(growth * 100) / 100,
    };
  } catch (error) {
    console.error("❌ Error getting users stats:", error);
    return { total: 0, active: 0, growth: 0 };
  }
}

// 회사 통계 조회
async function getCompaniesStats() {
  try {
    console.log("📊 Getting companies stats...");

    const { data: companiesData, error } = await queryBuilder.select(
      "companies",
      "company_id, created_at",
      { useAdmin: true }
    );

    if (error) {
      console.error("Companies query error:", error);
      throw error;
    }

    const totalCompanies = companiesData?.length || 0;
    console.log("✅ Companies stats:", { total: totalCompanies });

    return {
      total: totalCompanies,
      growth: 2, // 임시값, 추후 실제 계산
    };
  } catch (error) {
    console.error("❌ Error getting companies stats:", error);
    return { total: 0, growth: 0 };
  }
}

// 노무사 사무실 통계 조회
async function getLaborOfficesStats() {
  try {
    console.log("📊 Getting labor offices stats...");

    const { data: officesData, error } = await queryBuilder.select(
      "labor_offices",
      "labor_office_id",
      { useAdmin: true }
    );

    if (error) {
      console.error("Labor offices query error:", error);
      throw error;
    }

    const totalOffices = officesData?.length || 0;
    console.log("✅ Labor offices stats:", { total: totalOffices });

    return {
      total: totalOffices,
      growth: 1, // 임시값
    };
  } catch (error) {
    console.error("❌ Error getting labor offices stats:", error);
    return { total: 0, growth: 0 };
  }
}

// 근로자 통계 조회
async function getWorkersStats() {
  try {
    console.log("📊 Getting workers stats...");

    // workers 테이블이 없을 수도 있으므로 에러 처리
    const { data: workersData, error } = await queryBuilder
      .select("workers", "worker_id", { useAdmin: true })
      .limit(1000); // 성능을 위해 제한

    if (error) {
      console.warn("Workers query error (table may not exist):", error);
      // workers 테이블이 없을 수 있으므로 기본값 반환
      return { total: 0, growth: 0 };
    }

    const totalWorkers = workersData?.length || 0;
    console.log("✅ Workers stats:", { total: totalWorkers });

    return {
      total: totalWorkers,
      growth: 8, // 임시값
    };
  } catch (error) {
    console.error("❌ Error getting workers stats:", error);
    return { total: 0, growth: 0 };
  }
}

// 최근 활동 조회
async function getRecentActivities() {
  try {
    console.log("📊 Getting recent activities...");

    // 최근 사용자 생성 기록으로 대체
    const { data: recentUsers, error } = await queryBuilder
      .select("users", "username, email, created_at", { useAdmin: true })
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("Recent activities query error:", error);
      throw error;
    }

    const activities = (recentUsers || []).map((user, index) => ({
      id: index + 1,
      type: "user_registration",
      description: `새 사용자 등록: ${user.username} (${user.email})`,
      timestamp: user.created_at,
      severity: "info",
    }));

    console.log("✅ Recent activities:", activities.length);
    return activities;
  } catch (error) {
    console.error("❌ Error getting recent activities:", error);
    return [];
  }
}

// 시스템 상태 조회
async function getSystemStatus() {
  try {
    console.log("📊 Getting system status...");

    // 실제로는 시스템 모니터링 데이터를 가져와야 하지만, 임시로 하드코딩
    return {
      health: "healthy",
      lastBackup: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24시간 전
      alerts: [
        {
          id: 1,
          type: "info",
          title: "시스템 정상 운영 중",
          message: "모든 서비스가 정상적으로 동작하고 있습니다.",
          action: "상세 보기",
        },
      ],
    };
  } catch (error) {
    console.error("❌ Error getting system status:", error);
    return {
      health: "unknown",
      lastBackup: null,
      alerts: [],
    };
  }
}
