// File: lib/database.js
import { createClient } from "@supabase/supabase-js";

/**
 * Supabase 데이터베이스 연결 및 쿼리 빌더
 * 4대보험 취득상실 통합 관리 시스템용
 */

// Supabase 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// 클라이언트용 Supabase 인스턴스
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 관리자용 Supabase 인스턴스 (서버 사이드에서만 사용)
export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

/**
 * Supabase 에러 클래스
 */
export class SupabaseError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.name = "SupabaseError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * 쿼리 빌더 클래스
 * Supabase 클라이언트를 래핑하여 일관된 인터페이스 제공
 */
class QueryBuilder {
  constructor(supabaseClient, adminClient) {
    this.client = supabaseClient;
    this.adminClient = adminClient;
  }

  /**
   * SELECT 쿼리
   * @param {string} table - 테이블명
   * @param {string} columns - 선택할 컬럼들
   * @param {Object} options - 옵션
   */
  select(table, columns = "*", options = {}) {
    const client = options.useAdmin && this.adminClient ? this.adminClient : this.client;
    return client.from(table).select(columns);
  }

  /**
   * INSERT 쿼리
   * @param {string} table - 테이블명
   * @param {Object|Array} data - 삽입할 데이터
   * @param {Object} options - 옵션
   */
  async insert(table, data, options = {}) {
    const client = options.useAdmin && this.adminClient ? this.adminClient : this.client;

    try {
      const query = client.from(table).insert(data);

      if (options.returning !== false) {
        query.select();
      }

      const result = await query;

      if (result.error) {
        throw new SupabaseError(
          `Insert failed: ${result.error.message}`,
          result.status || 500,
          result.error.code
        );
      }

      return result;
    } catch (error) {
      if (error instanceof SupabaseError) {
        throw error;
      }
      throw new SupabaseError(`Database insert error: ${error.message}`);
    }
  }

  /**
   * UPDATE 쿼리
   * @param {string} table - 테이블명
   * @param {Object} data - 업데이트할 데이터
   * @param {Object} options - 옵션
   */
  update(table, data, options = {}) {
    const client = options.useAdmin && this.adminClient ? this.adminClient : this.client;
    return client.from(table).update(data);
  }

  /**
   * DELETE 쿼리
   * @param {string} table - 테이블명
   * @param {Object} options - 옵션
   */
  delete(table, options = {}) {
    const client = options.useAdmin && this.adminClient ? this.adminClient : this.client;
    return client.from(table).delete();
  }

  /**
   * UPSERT 쿼리
   * @param {string} table - 테이블명
   * @param {Object|Array} data - 삽입/업데이트할 데이터
   * @param {Object} options - 옵션
   */
  async upsert(table, data, options = {}) {
    const client = options.useAdmin && this.adminClient ? this.adminClient : this.client;

    try {
      const query = client.from(table).upsert(data, {
        onConflict: options.onConflict,
        ignoreDuplicates: options.ignoreDuplicates || false,
      });

      if (options.returning !== false) {
        query.select();
      }

      const result = await query;

      if (result.error) {
        throw new SupabaseError(
          `Upsert failed: ${result.error.message}`,
          result.status || 500,
          result.error.code
        );
      }

      return result;
    } catch (error) {
      if (error instanceof SupabaseError) {
        throw error;
      }
      throw new SupabaseError(`Database upsert error: ${error.message}`);
    }
  }

  /**
   * RPC (Remote Procedure Call) 실행
   * @param {string} functionName - 함수명
   * @param {Object} params - 매개변수
   * @param {Object} options - 옵션
   */
  async rpc(functionName, params = {}, options = {}) {
    const client = options.useAdmin && this.adminClient ? this.adminClient : this.client;

    try {
      const result = await client.rpc(functionName, params);

      if (result.error) {
        throw new SupabaseError(
          `RPC failed: ${result.error.message}`,
          result.status || 500,
          result.error.code
        );
      }

      return result;
    } catch (error) {
      if (error instanceof SupabaseError) {
        throw error;
      }
      throw new SupabaseError(`Database RPC error: ${error.message}`);
    }
  }

  /**
   * 트랜잭션 실행 (Supabase에서는 직접 지원하지 않으므로 RPC 사용)
   * @param {Function} callback - 트랜잭션 내에서 실행할 함수
   * @param {Object} options - 옵션
   */
  async transaction(callback, options = {}) {
    // Supabase는 클라이언트 사이드 트랜잭션을 직접 지원하지 않음
    // 복잡한 트랜잭션은 PostgreSQL 함수로 구현해야 함
    console.warn(
      "Client-side transactions not supported. Use PostgreSQL functions for complex transactions."
    );

    // 단순한 경우 순차 실행
    try {
      return await callback(this);
    } catch (error) {
      throw new SupabaseError(`Transaction failed: ${error.message}`);
    }
  }
}

// 쿼리 빌더 인스턴스 생성
export const queryBuilder = new QueryBuilder(supabase, supabaseAdmin);

/**
 * 🔧 수정된 데이터베이스 연결 테스트 - count(*) 문제 해결
 */
export const testConnection = async () => {
  try {
    console.log("🔍 Testing database connection...");

    // 🚨 기존 문제: count(*) 파싱 에러
    // const { data, error } = await supabase.from("users").select("count(*)").limit(1);

    // ✅ 수정: 단순 select 사용
    const { data, error } = await supabase
      .from("users")
      .select("user_id")
      .not("user_id", "is", null)
      .limit(1);
    console.log("DEBUG: Data from testConnection:", data); // 🚨 이 로그를 추가하세요
    console.log("DEBUG: Error from testConnection:", error); // 🚨 이 로그를 추가하세요

    if (error) {
      throw new SupabaseError(`Connection test failed: ${error.message}`);
    }

    console.log("✅ Database connection successful");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
};

/**
 * 사용자 컨텍스트 설정 (RLS 정책용)
 * @param {number} userId - 사용자 ID
 */
export const setUserContext = async (userId) => {
  try {
    await queryBuilder.rpc("set_current_user_context", { p_user_id: userId }, { useAdmin: true });
    console.log(`✅ User context set for user: ${userId}`);
  } catch (error) {
    console.error("❌ Failed to set user context:", error);
    throw error;
  }
};

/**
 * 사용자 컨텍스트 클리어
 */
export const clearUserContext = async () => {
  try {
    await queryBuilder.rpc("clear_user_context", {}, { useAdmin: true });
    console.log("✅ User context cleared");
  } catch (error) {
    console.error("❌ Failed to clear user context:", error);
    throw error;
  }
};

// ===============================
// 🆕 추가: 사용자 인증 관련 함수들
// ===============================

/**
 * 이메일로 사용자 조회
 * @param {string} email - 이메일
 */
export const findUserByEmail = async (email) => {
  try {
    const { data, error } = await queryBuilder
      .select(
        "users",
        `
        *,
        user_roles (
          role_id,
          scope_type,
          scope_company_id,
          is_active,
          roles (
            role_code,
            role_name,
            role_category,
            permissions
          )
        )
      `,
        { useAdmin: true }
      )
      .eq("email", email)
      .eq("is_active", true)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows found
        console.log(`ℹ️ User not found: ${email}`);
        return null;
      }
      throw new SupabaseError(`Failed to find user: ${error.message}`);
    }

    return data;
  } catch (error) {
    if (error instanceof SupabaseError) {
      throw error;
    }
    console.error(`❌ Error finding user ${email}:`, error);
    return null;
  }
};

/**
 * 사용자 권한 정보 조회
 * @param {number} userId - 사용자 ID
 */
export const getUserPermissions = async (userId) => {
  try {
    await setUserContext(userId);

    const { data, error } = await queryBuilder.rpc(
      "get_current_user_permissions",
      {},
      { useAdmin: true }
    );

    if (error) {
      throw new SupabaseError(`Failed to get user permissions: ${error.message}`);
    }

    return data?.[0] || null;
  } catch (error) {
    console.error("❌ Failed to get user permissions:", error);
    throw error;
  }
};

/**
 * 초기 사용자 생성
 * @param {Object} userData - 사용자 데이터
 */
export const createInitialUser = async (userData) => {
  try {
    console.log(`🚀 Creating user: ${userData.email}`);

    // 1. users 테이블에 사용자 생성
    const { data: user, error: userError } = await queryBuilder.insert(
      "users",
      {
        username: userData.username,
        email: userData.email,
        password_hash: userData.password_hash,
        name: userData.name,
        phone_number: userData.phone_number,
      },
      { useAdmin: true }
    );

    if (userError) {
      throw new SupabaseError(`Failed to create user: ${userError.message}`);
    }

    const createdUser = Array.isArray(user.data) ? user.data[0] : user.data;

    // 2. 역할 할당
    if (userData.role_id) {
      const { error: roleError } = await queryBuilder.insert(
        "user_roles",
        {
          user_id: createdUser.user_id,
          role_id: userData.role_id,
          scope_type: userData.scope_type || "global",
          scope_company_id: userData.scope_company_id,
        },
        { useAdmin: true }
      );

      if (roleError) {
        console.error("❌ Failed to assign role:", roleError);
        // 사용자는 생성되었지만 역할 할당 실패
      } else {
        console.log("✅ Role assigned successfully");
      }
    }

    console.log(`✅ User created successfully: ${createdUser.email}`);
    return createdUser;
  } catch (error) {
    console.error("❌ Failed to create user:", error);
    throw error;
  }
};

// ===============================
// 🆕 추가: 초기 데이터 생성 함수들
// ===============================

/**
 * 초기 시스템 데이터 생성
 */
export const createInitialData = async () => {
  try {
    console.log("🚀 Creating initial system data...");

    // 1. 기본 역할 생성
    const roles = [
      {
        role_code: "SYSTEM_ADMIN",
        role_name: "시스템 관리자",
        role_category: "company",
        permissions: { all: true },
      },
      {
        role_code: "LABOR_ADMIN",
        role_name: "노무사 사무실 관리자",
        role_category: "labor_office",
        permissions: { manage_clients: true, manage_staff: true },
      },
      {
        role_code: "LABOR_STAFF",
        role_name: "노무사 사무실 직원",
        role_category: "labor_office",
        permissions: { process_insurance: true, manage_payroll: true },
      },
      {
        role_code: "COMPANY_ADMIN",
        role_name: "회사 관리자",
        role_category: "company",
        permissions: { manage_employees: true, view_payroll: true },
      },
      {
        role_code: "COMPANY_HR",
        role_name: "회사 인사담당자",
        role_category: "company",
        permissions: { manage_employees: true, input_attendance: true },
      },
    ];

    for (const role of roles) {
      const { error } = await queryBuilder.upsert("roles", role, {
        onConflict: "role_code",
        useAdmin: true,
      });

      if (error) {
        console.error(`❌ Failed to create role ${role.role_code}:`, error);
      } else {
        console.log(`✅ Role created/updated: ${role.role_code}`);
      }
    }

    // 2. 고용형태 생성
    const employmentTypes = [
      {
        type_code: "REGULAR",
        type_name: "정규직",
        type_category: "regular",
        judgment_method: "immediate",
        np_criteria: { immediate: true },
        hi_criteria: { immediate: true },
        ei_criteria: { immediate: true },
        wc_criteria: { immediate: true },
      },
      {
        type_code: "CONTRACT",
        type_name: "계약직",
        type_category: "contract",
        judgment_method: "immediate",
        np_criteria: { immediate: true },
        hi_criteria: { immediate: true },
        ei_criteria: { immediate: true },
        wc_criteria: { immediate: true },
      },
      {
        type_code: "PART_TIME",
        type_name: "단시간근로자",
        type_category: "part_time",
        judgment_method: "monthly",
        np_criteria: { monthly_hours: 60 },
        hi_criteria: { monthly_hours: 60 },
        ei_criteria: { monthly_hours: 60 },
        wc_criteria: { immediate: true },
      },
      {
        type_code: "DAILY",
        type_name: "일용직",
        type_category: "daily",
        judgment_method: "rolling_monthly",
        np_criteria: { rolling_monthly_days: 8 },
        hi_criteria: { rolling_monthly_days: 8 },
        ei_criteria: { rolling_monthly_days: 8 },
        wc_criteria: { immediate: true },
      },
    ];

    for (const type of employmentTypes) {
      const { error } = await queryBuilder.upsert("employment_types", type, {
        onConflict: "type_code",
        useAdmin: true,
      });

      if (error) {
        console.error(`❌ Failed to create employment type ${type.type_code}:`, error);
      } else {
        console.log(`✅ Employment type created/updated: ${type.type_code}`);
      }
    }

    // 3. 기본 급여 항목 생성a
    const payrollItems = [
      {
        item_code: "BASE_SALARY",
        default_name: "기본급",
        item_category: "basic_pay",
        tax_type: "taxable",
        insurance_included: true,
      },
      {
        item_code: "OVERTIME_PAY",
        default_name: "연장근로수당",
        item_category: "overtime",
        tax_type: "taxable",
        insurance_included: true,
      },
      {
        item_code: "MEAL_ALLOWANCE",
        default_name: "식대",
        item_category: "allowance",
        tax_type: "nontax",
        insurance_included: false,
      },
      {
        item_code: "TRANSPORT_ALLOWANCE",
        default_name: "교통비",
        item_category: "allowance",
        tax_type: "nontax",
        insurance_included: false,
      },
    ];

    for (const item of payrollItems) {
      const { error } = await queryBuilder.upsert("payroll_item_types", item, {
        onConflict: "item_code",
        useAdmin: true,
      });

      if (error) {
        console.error(`❌ Failed to create payroll item ${item.item_code}:`, error);
      } else {
        console.log(`✅ Payroll item created/updated: ${item.item_code}`);
      }
    }

    // 4. 현재 보험요율 생성
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const insuranceRate = {
      apply_year: currentYear,
      apply_month: currentMonth,
      np_employee_rate: 0.045,
      np_employer_rate: 0.045,
      hi_employee_rate: 0.0354,
      hi_employer_rate: 0.0354,
      ei_employee_rate: 0.009,
      ei_employer_rate: 0.0135,
    };

    const { error: rateError } = await queryBuilder.upsert("insurance_rates", insuranceRate, {
      onConflict: "apply_year,apply_month",
      useAdmin: true,
    });

    if (rateError) {
      console.error("❌ Failed to create insurance rates:", rateError);
    } else {
      console.log("✅ Insurance rates created/updated");
    }

    console.log("✅ Initial data creation completed");
    return true;
  } catch (error) {
    console.error("❌ Failed to create initial data:", error);
    throw error;
  }
};

/**
 * 역할 ID 조회
 * @param {string} roleCode - 역할 코드
 */
export const getRoleIdByCode = async (roleCode) => {
  try {
    const { data, error } = await queryBuilder
      .select("roles", "role_id", { useAdmin: true })
      .eq("role_code", roleCode)
      .single();

    if (error) {
      throw new SupabaseError(`Failed to find role: ${error.message}`);
    }

    return data?.role_id;
  } catch (error) {
    console.error(`❌ Error finding role ${roleCode}:`, error);
    throw error;
  }
};

/**
 * 배치 처리를 위한 헬퍼 함수들
 */
export const batchHelpers = {
  /**
   * 대량 삽입
   * @param {string} table - 테이블명
   * @param {Array} dataArray - 삽입할 데이터 배열
   * @param {number} batchSize - 배치 크기
   */
  async batchInsert(table, dataArray, batchSize = 1000) {
    const results = [];

    for (let i = 0; i < dataArray.length; i += batchSize) {
      const batch = dataArray.slice(i, i + batchSize);

      try {
        const result = await queryBuilder.insert(table, batch, { useAdmin: true });
        results.push(result);

        console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} inserted: ${batch.length} records`);
      } catch (error) {
        console.error(`❌ Batch ${Math.floor(i / batchSize) + 1} failed:`, error);
        throw error;
      }
    }

    return results;
  },

  /**
   * 대량 업데이트
   * @param {string} table - 테이블명
   * @param {Array} updates - 업데이트 배열 [{filter, data}]
   */
  async batchUpdate(table, updates) {
    const results = [];

    for (const update of updates) {
      try {
        let query = queryBuilder.update(table, update.data, { useAdmin: true });

        // 필터 조건 적용
        Object.entries(update.filter).forEach(([key, value]) => {
          query = query.eq(key, value);
        });

        const result = await query;
        results.push(result);
      } catch (error) {
        console.error("❌ Batch update failed:", error);
        throw error;
      }
    }

    return results;
  },
};

/**
 * 데이터베이스 스키마 유틸리티
 */
export const schemaHelpers = {
  /**
   * 테이블 존재 여부 확인
   * @param {string} tableName - 테이블명
   */
  async tableExists(tableName) {
    try {
      const { data, error } = await queryBuilder.rpc(
        "check_table_exists",
        {
          table_name: tableName,
        },
        { useAdmin: true }
      );

      return !error && data;
    } catch (error) {
      console.error("❌ Table existence check failed:", error);
      return false;
    }
  },

  /**
   * 컬럼 존재 여부 확인
   * @param {string} tableName - 테이블명
   * @param {string} columnName - 컬럼명
   */
  async columnExists(tableName, columnName) {
    try {
      const { data, error } = await queryBuilder.rpc(
        "check_column_exists",
        {
          table_name: tableName,
          column_name: columnName,
        },
        { useAdmin: true }
      );

      return !error && data;
    } catch (error) {
      console.error("❌ Column existence check failed:", error);
      return false;
    }
  },
};

// 환경별 설정
export const dbConfig = {
  development: {
    logQueries: true,
    enableRLS: true,
    maxConnections: 10,
  },
  production: {
    logQueries: false,
    enableRLS: true,
    maxConnections: 100,
  },
};

// 현재 환경 설정
export const currentConfig = dbConfig[process.env.NODE_ENV] || dbConfig.development;

// 초기화
// if (typeof window === "undefined") {
//   // 서버 사이드에서만 실행
//   testConnection().catch(console.error);
// }

/**
 * 🆕 사용자 엔터티 상태 확인 (기존 통일된 시스템 활용)
 * @param {number} userId - 사용자 ID
 * @returns {Object} 엔터티 상태 정보
 */
export const getUserEntityStatus = async (userId) => {
  try {
    await setUserContext(userId);

    const { data, error } = await queryBuilder.rpc(
      "get_user_entity_status",
      { p_user_id: userId },
      { useAdmin: true }
    );

    if (error) {
      throw new SupabaseError(`Failed to get entity status: ${error.message}`);
    }

    // 결과가 없으면 기본값 반환
    if (!data || data.length === 0) {
      console.warn(`⚠️ No entity status found for user ${userId}`);
      return {
        entityType: "unknown",
        entityStatus: "inactive",
        entityId: null,
        entityName: "Unknown User",
        message: "사용자 정보를 찾을 수 없습니다.",
        roleCategory: "unknown",
        roleCode: "unknown",
        effectiveStatus: "inactive",
      };
    }

    const result = data[0];

    console.log(`✅ Entity status retrieved for user ${userId}:`, {
      entityType: result.entity_type,
      entityStatus: result.entity_status,
      effectiveStatus: result.effective_status,
      roleCategory: result.role_category,
      roleCode: result.role_code,
    });

    return {
      entityType: result.entity_type,
      entityStatus: result.entity_status,
      entityId: result.entity_id,
      entityName: result.entity_name,
      message: result.message,
      roleCategory: result.role_category,
      roleCode: result.role_code,
      effectiveStatus: result.effective_status, // 🆕 추가: 효과적 상태
    };
  } catch (error) {
    console.error("❌ Failed to get entity status:", error);

    // 에러 시 안전한 기본값 반환
    return {
      entityType: "unknown",
      entityStatus: "inactive",
      entityId: null,
      entityName: "Error",
      message: "상태 확인 중 오류가 발생했습니다.",
      roleCategory: "unknown",
      roleCode: "unknown",
      effectiveStatus: "inactive",
    };
  }
};

/**
 * 🆕 엔터티 상태 상세 정보 조회
 * @param {number} userId - 사용자 ID
 * @returns {Object} 상세 상태 정보
 */
export const getEntityStatusDetails = async (userId) => {
  try {
    await setUserContext(userId);

    const { data, error } = await queryBuilder.rpc(
      "get_entity_status_details",
      {},
      { useAdmin: true }
    );

    if (error) {
      throw new SupabaseError(`Failed to get entity status details: ${error.message}`);
    }

    // 결과가 없으면 기본값 반환
    if (!data || data.length === 0) {
      return {
        entityType: "unknown",
        entityStatus: "inactive",
        entityName: "Unknown User",
        statusMessage: "상태 정보를 확인할 수 없습니다.",
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
      };
    }

    const result = data[0];

    return {
      entityType: result.entity_type,
      entityStatus: result.entity_status,
      entityName: result.entity_name,
      statusMessage: result.status_message,
      canAccess: result.can_access,
      restrictedFeatures: result.restricted_features || [],
      adminContact: result.admin_contact,
      roleCategory: result.role_category,
      roleCode: result.role_code,
    };
  } catch (error) {
    console.error("❌ Failed to get entity status details:", error);
    throw error;
  }
};

/**
 * 🆕 사용자 엔터티 활성 상태 확인 (간단 버전)
 * @param {number} userId - 사용자 ID
 * @returns {boolean} 활성 상태 여부
 */
export const isUserEntityActive = async (userId) => {
  try {
    await setUserContext(userId);

    const { data, error } = await queryBuilder.rpc("is_user_entity_active", {}, { useAdmin: true });

    if (error) {
      console.error("❌ Failed to check entity active status:", error);
      return false;
    }

    return data || false;
  } catch (error) {
    console.error("❌ Failed to check entity active status:", error);
    return false;
  }
};

/**
 * 🆕 특정 기능 접근 가능 여부 확인
 * @param {number} userId - 사용자 ID
 * @param {string} featureName - 기능명
 * @returns {boolean} 접근 가능 여부
 */
export const canAccessFeature = async (userId, featureName) => {
  try {
    await setUserContext(userId);

    const { data, error } = await queryBuilder.rpc(
      "can_access_feature",
      { feature_name: featureName },
      { useAdmin: true }
    );

    if (error) {
      console.error("❌ Failed to check feature access:", error);
      return false;
    }

    return data || false;
  } catch (error) {
    console.error("❌ Failed to check feature access:", error);
    return false;
  }
};

/**
 * 🆕 엔터티 상태별 접근 가능한 기능 목록 (효과적 상태 기준)
 * @param {string} effectiveStatus - 효과적 상태 (계층적 상태 고려)
 * @param {string} roleCategory - 역할 카테고리
 * @param {string} entityType - 엔터티 타입 (선택)
 * @returns {Object} 접근 가능한 기능들
 */
export const getAccessibleFeatures = (effectiveStatus, roleCategory, entityType = null) => {
  const features = {
    active: {
      canViewDashboard: true,
      canManageData: true,
      canAccessReports: true,
      canModifySettings: true,
      canUploadFiles: true,
      canExportData: true,
      message: "모든 기능을 이용하실 수 있습니다.",
    },
    inactive: {
      canViewDashboard: true,
      canManageData: false,
      canAccessReports: false,
      canModifySettings: false,
      canUploadFiles: false,
      canExportData: false,
      message: getInactiveMessage(roleCategory, entityType),
    },
    terminated: {
      canViewDashboard: true, // 대시보드 조회는 허용
      canManageData: false,
      canAccessReports: false,
      canModifySettings: false,
      canUploadFiles: false,
      canExportData: false,
      message: getTerminatedMessage(roleCategory, entityType),
    },
  };

  // system 카테고리 (SUPER_ADMIN)는 항상 모든 기능 접근 가능
  if (roleCategory === "system") {
    return {
      ...features.active,
      message: "시스템 관리자 권한으로 모든 기능에 접근 가능합니다.",
    };
  }

  return features[effectiveStatus] || features.inactive;
};

/**
 * 🆕 비활성 상태 메시지 생성
 * @param {string} roleCategory - 역할 카테고리
 * @param {string} entityType - 엔터티 타입
 * @returns {string} 상태 메시지
 */
function getInactiveMessage(roleCategory, entityType) {
  switch (roleCategory) {
    case "labor_office":
      return "노무사 사무실이 비활성화 상태입니다. 관리자에게 문의하세요.";
    case "company":
      if (entityType === "worker") {
        return "계정이 비활성화 상태입니다. 회사 인사담당자에게 문의하세요.";
      }
      return "회사가 비활성화 상태입니다. 관리자에게 문의하세요.";
    default:
      return "계정이 비활성화 상태입니다. 관리자에게 문의하세요.";
  }
}

/**
 * 🆕 종료 상태 메시지 생성
 * @param {string} roleCategory - 역할 카테고리
 * @param {string} entityType - 엔터티 타입
 * @returns {string} 상태 메시지
 */
function getTerminatedMessage(roleCategory, entityType) {
  switch (roleCategory) {
    case "labor_office":
      return "노무사 사무실이 종료 상태입니다. 관리자에게 문의하세요.";
    case "company":
      if (entityType === "worker") {
        return "퇴사 처리된 계정입니다. 회사 인사담당자에게 문의하세요.";
      }
      return "회사가 서비스 종료 상태입니다. 관리자에게 문의하세요.";
    default:
      return "계정이 종료 상태입니다. 관리자에게 문의하세요.";
  }
}

/**
 * 🆕 상태별 제한 기능 목록 (효과적 상태 기준)
 * @param {string} effectiveStatus - 효과적 상태
 * @param {string} roleCategory - 역할 카테고리
 * @returns {string[]} 제한된 기능 목록
 */
export const getRestrictedFeatures = (effectiveStatus, roleCategory) => {
  // system 카테고리는 제한 없음
  if (roleCategory === "system") {
    return [];
  }

  switch (effectiveStatus) {
    case "active":
      return [];
    case "inactive":
      return ["data_modification", "report_generation", "setting_changes"];
    case "terminated":
      return ["data_modification", "report_generation", "setting_changes", "data_view"];
    default:
      return ["data_modification", "report_generation", "setting_changes", "data_view"];
  }
};

/**
 * 🆕 기존 통일된 상태 시스템의 엔터티 상태 변경 래퍼
 * @param {string} entityType - 엔터티 타입
 * @param {number} entityId - 엔터티 ID
 * @param {string} newStatus - 새 상태
 * @param {string} reason - 변경 사유
 * @returns {Object} 변경 결과
 */
export const setEntityStatus = async (entityType, entityId, newStatus, reason = null) => {
  try {
    const { data, error } = await queryBuilder.rpc(
      "smart_set_entity_status", // 기존 시스템의 스마트 상태 변경 함수 사용
      {
        p_entity_type: entityType,
        p_entity_id: entityId,
        p_new_status: newStatus,
        p_cascade: true, // 하위 엔터티도 함께 변경
        p_reason: reason,
      },
      { useAdmin: true }
    );

    if (error) {
      throw new SupabaseError(`Failed to set entity status: ${error.message}`);
    }

    console.log(`✅ Entity status changed: ${entityType}(${entityId}) → ${newStatus}`);

    return {
      success: true,
      result: data,
      entityType,
      entityId,
      newStatus,
      reason,
    };
  } catch (error) {
    console.error("❌ Failed to set entity status:", error);

    return {
      success: false,
      error: error.message,
      entityType,
      entityId,
      newStatus,
    };
  }
};

/**
 * 🆕 엔터티 활성화 (기존 시스템 활용)
 * @param {string} entityType - 엔터티 타입
 * @param {number} entityId - 엔터티 ID
 * @param {string} reason - 활성화 사유
 */
export const activateEntity = async (entityType, entityId, reason = null) => {
  try {
    const { data, error } = await queryBuilder.rpc(
      "activate_entity",
      {
        p_entity_type: entityType,
        p_entity_id: entityId,
        p_reason: reason,
      },
      { useAdmin: true }
    );

    if (error) {
      throw new SupabaseError(`Failed to activate entity: ${error.message}`);
    }

    return { success: true, result: data };
  } catch (error) {
    console.error("❌ Failed to activate entity:", error);
    return { success: false, error: error.message };
  }
};

/**
 * 🆕 엔터티 비활성화 (기존 시스템 활용)
 * @param {string} entityType - 엔터티 타입
 * @param {number} entityId - 엔터티 ID
 * @param {string} reason - 비활성화 사유
 */
export const deactivateEntity = async (entityType, entityId, reason = null) => {
  try {
    const { data, error } = await queryBuilder.rpc(
      "deactivate_entity",
      {
        p_entity_type: entityType,
        p_entity_id: entityId,
        p_reason: reason,
      },
      { useAdmin: true }
    );

    if (error) {
      throw new SupabaseError(`Failed to deactivate entity: ${error.message}`);
    }

    return { success: true, result: data };
  } catch (error) {
    console.error("❌ Failed to deactivate entity:", error);
    return { success: false, error: error.message };
  }
};

/**
 * 🆕 엔터티 종료 (기존 시스템 활용)
 * @param {string} entityType - 엔터티 타입
 * @param {number} entityId - 엔터티 ID
 * @param {string} reason - 종료 사유
 */
export const terminateEntity = async (entityType, entityId, reason = null) => {
  try {
    const { data, error } = await queryBuilder.rpc(
      "terminate_entity",
      {
        p_entity_type: entityType,
        p_entity_id: entityId,
        p_reason: reason,
      },
      { useAdmin: true }
    );

    if (error) {
      throw new SupabaseError(`Failed to terminate entity: ${error.message}`);
    }

    return { success: true, result: data };
  } catch (error) {
    console.error("❌ Failed to terminate entity:", error);
    return { success: false, error: error.message };
  }
};

/**
 * 🆕 전체 엔터티 상태 현황 조회 (기존 시스템 활용)
 * @returns {Array} 엔터티별 상태 현황
 */
export const getEntityStatusSummary = async () => {
  try {
    const { data, error } = await queryBuilder.rpc(
      "get_entity_status_summary",
      {},
      { useAdmin: true }
    );

    if (error) {
      throw new SupabaseError(`Failed to get entity status summary: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error("❌ Failed to get entity status summary:", error);
    return [];
  }
};

/**
 * 🆕 특정 엔터티 상세 상태 조회 (기존 시스템 활용)
 * @param {string} entityType - 엔터티 타입
 * @param {number} entityId - 엔터티 ID
 * @returns {Object} 상세 상태 정보
 */
export const getEntityDetailedStatus = async (entityType, entityId) => {
  try {
    const { data, error } = await queryBuilder.rpc(
      "get_entity_detailed_status",
      {
        p_entity_type: entityType,
        p_entity_id: entityId,
      },
      { useAdmin: true }
    );

    if (error) {
      throw new SupabaseError(`Failed to get entity detailed status: ${error.message}`);
    }

    return data || {};
  } catch (error) {
    console.error("❌ Failed to get entity detailed status:", error);
    return {};
  }
};

/**
 * 🆕 상태별 관리자 연락처 정보
 * @param {string} roleCategory - 역할 카테고리
 * @param {string} entityType - 엔터티 타입
 * @returns {Object} 연락처 정보
 */
export const getAdminContactInfo = (roleCategory, entityType) => {
  const contacts = {
    labor_office: {
      title: "노무사 사무실 관리자",
      message: "노무사 사무실 관리자에게 문의하세요.",
      action: "사무실 관리자 연락",
    },
    company:
      entityType === "worker"
        ? {
            title: "회사 인사담당자",
            message: "회사 인사담당자에게 문의하세요.",
            action: "인사담당자 연락",
          }
        : {
            title: "회사 관리자",
            message: "회사 관리자에게 문의하세요.",
            action: "회사 관리자 연락",
          },
    system: {
      title: "시스템 관리자",
      message: "시스템이 정상 작동 중입니다.",
      action: "시스템 상태 확인",
    },
    unknown: {
      title: "시스템 관리자",
      message: "시스템 관리자에게 문의하세요.",
      action: "고객지원 센터 연락",
    },
  };

  return contacts[roleCategory] || contacts.unknown;
};

/**
 * 🆕 엔터티 상태 캐시 관리
 */
export const entityStatusCache = {
  cache: new Map(),
  ttl: 5 * 60 * 1000, // 5분 TTL

  /**
   * 캐시에서 상태 조회
   * @param {number} userId - 사용자 ID
   * @returns {Object|null} 캐시된 상태 정보
   */
  get(userId) {
    const cached = this.cache.get(userId);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.ttl) {
      this.cache.delete(userId);
      return null;
    }

    return cached.data;
  },

  /**
   * 캐시에 상태 저장
   * @param {number} userId - 사용자 ID
   * @param {Object} data - 상태 데이터
   */
  set(userId, data) {
    this.cache.set(userId, {
      data,
      timestamp: Date.now(),
    });
  },

  /**
   * 캐시 삭제
   * @param {number} userId - 사용자 ID
   */
  delete(userId) {
    this.cache.delete(userId);
  },

  /**
   * 전체 캐시 초기화
   */
  clear() {
    this.cache.clear();
  },
};

/**
 * 🆕 캐시된 엔터티 상태 조회 (성능 최적화)
 * @param {number} userId - 사용자 ID
 * @param {boolean} forceRefresh - 강제 새로고침 여부
 * @returns {Object} 엔터티 상태 정보
 */
export const getCachedEntityStatus = async (userId, forceRefresh = false) => {
  // 강제 새로고침이 아닌 경우 캐시 확인
  if (!forceRefresh) {
    const cached = entityStatusCache.get(userId);
    if (cached) {
      console.log(`📄 Entity status served from cache for user ${userId}`);
      return cached;
    }
  }

  // 캐시 미스 또는 강제 새로고침 시 DB에서 조회
  try {
    const status = await getUserEntityStatus(userId);
    entityStatusCache.set(userId, status);
    return status;
  } catch (error) {
    console.error("❌ Failed to get cached entity status:", error);
    throw error;
  }
};

// ===============================
// 🆕 추가: 엔터티 상태 관련 유틸리티 함수들
// ===============================

/**
 * 🆕 역할 카테고리별 대시보드 경로 반환
 * @param {string} roleCategory - 역할 카테고리
 * @param {string} roleCode - 역할 코드
 * @returns {string} 대시보드 경로
 */
export const getDefaultDashboardByRole = (roleCategory, roleCode) => {
  switch (roleCategory) {
    case "system":
      return "/super-admin";
    case "labor_office":
      return "/labor-office/dashboard";
    case "company":
      if (roleCode === "WORKER") {
        return "/worker/dashboard";
      }
      return "/company/dashboard";
    default:
      return "/dashboard";
  }
};

/**
 * 🆕 상태별 이용 가능한 네비게이션 메뉴 필터링
 * @param {Object} menus - 전체 메뉴 목록
 * @param {string} entityStatus - 엔터티 상태
 * @param {string} roleCategory - 역할 카테고리
 * @returns {Object} 필터링된 메뉴 목록
 */
export const filterMenusByStatus = (menus, entityStatus, roleCategory) => {
  // system 카테고리는 모든 메뉴 접근 가능
  if (roleCategory === "system") {
    return menus;
  }

  // 비활성/종료 상태인 경우 읽기 전용 메뉴만 허용
  if (entityStatus !== "active") {
    return menus.filter(
      (menu) => menu.type === "view" || menu.category === "account" || menu.key === "dashboard"
    );
  }

  return menus;
};

/**
 * 🆕 엔터티 상태 변경 알림 생성
 * @param {string} oldStatus - 이전 상태
 * @param {string} newStatus - 새 상태
 * @param {string} roleCategory - 역할 카테고리
 * @returns {Object} 알림 정보
 */
export const createStatusChangeNotification = (oldStatus, newStatus, roleCategory) => {
  const notifications = {
    "active->inactive": {
      type: "warning",
      title: "계정 비활성화",
      message: getInactiveMessage(roleCategory),
      action: "관리자 문의",
    },
    "active->terminated": {
      type: "error",
      title: "계정 종료",
      message: getTerminatedMessage(roleCategory),
      action: "관리자 문의",
    },
    "inactive->active": {
      type: "success",
      title: "계정 활성화",
      message: "계정이 활성화되었습니다. 모든 기능을 이용하실 수 있습니다.",
      action: "대시보드 이동",
    },
    "terminated->active": {
      type: "success",
      title: "계정 복구",
      message: "계정이 복구되었습니다. 모든 기능을 이용하실 수 있습니다.",
      action: "대시보드 이동",
    },
  };

  const key = `${oldStatus}->${newStatus}`;
  return (
    notifications[key] || {
      type: "info",
      title: "상태 변경",
      message: "계정 상태가 변경되었습니다.",
      action: "새로고침",
    }
  );
};
