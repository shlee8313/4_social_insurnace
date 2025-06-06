// File: lib/auth.js (RLS 컨텍스트 설정 문제 해결)
import crypto from "crypto";

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import {
  supabase,
  supabaseAdmin,
  queryBuilder,
  SupabaseError,
  setUserContext,
} from "./database.js";

/**
 * Supabase Auth 통합 인증 및 권한 관리 시스템
 * 4대보험 취득상실 통합 관리 시스템용 인증 설정
 */

// JWT 설정
const JWT_SECRET = process.env.JWT_SECRET || "insurance-management-secret-key";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "insurance-management-refresh-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

/**
 * 비밀번호 해시화
 */
export const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * 비밀번호 검증
 */
export const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

/**
 * JWT 토큰 생성
 */
export const generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: "insurance-management-system",
    audience: "insurance-management-users",
  });
};

export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    issuer: "insurance-management-system",
    audience: "insurance-management-users",
  });
};

/**
 * 토큰 검증
 */
export const verifyToken = (token, isRefreshToken = false) => {
  try {
    const secret = isRefreshToken ? JWT_REFRESH_SECRET : JWT_SECRET;
    return jwt.verify(token, secret, {
      issuer: "insurance-management-system",
      audience: "insurance-management-users",
    });
  } catch (error) {
    console.error("❌ Token verification failed:", error.message);
    return null;
  }
};

/**
 * 🔧 수정된 사용자 인증 함수 - RLS 문제 해결
 */
export const authenticateUser = async (emailOrUsername, password) => {
  try {
    // 1. 먼저 기존 시스템에서 사용자 조회 (이메일 인증 필드 포함)
    const userQuery = queryBuilder
      .select(
        "users",
        `
        user_id, username, email, password_hash, 
        name, is_active, is_email_verified,
        verification_attempts, verification_sent_at,
        failed_login_attempts, locked_until
      `,
        { useAdmin: true }
      )
      .or(`email.eq.${emailOrUsername},username.eq.${emailOrUsername}`)
      // .eq("is_active", true)
      .single();

    const { data: user, error: userError } = await userQuery;

    if (userError || !user) {
      console.log("❌ User not found:", emailOrUsername);
      return null;
    }

    // 2. 계정 잠금 확인
    if (user.locked_until && new Date() < new Date(user.locked_until)) {
      console.log("🔒 Account locked:", emailOrUsername);
      return { error: "ACCOUNT_LOCKED", lockedUntil: user.locked_until };
    }

    // 3. 비밀번호 검증
    const isValidPassword = await verifyPassword(password, user.password_hash);

    if (!isValidPassword) {
      await incrementFailedLoginAttempts(user.user_id);
      console.log("❌ Invalid password for user:", emailOrUsername);
      return null;
    }

    // ⭐ 4. is_active 상태 확인 (핵심 추가 로직) ⭐
    // users 테이블의 is_active 필드를 직접 확인
    // if (user.is_active === false) {
    //   // 계정이 활성화되지 않은 상태
    //   return {
    //     error: "ACCOUNT_INACTIVE",
    //     message: "계정이 활성화되지 않았습니다. 관리자에게 문의하세요.",
    //     user: { id: user.user_id, email: user.email }, // 최소한의 사용자 정보 반환
    //   };
    // }

    // 📧 5. 이메일 인증 상태가 false인 경우 특별 반환 (로그인 차단)
    if (!user.is_email_verified) {
      console.log("📧 Email not verified for user:", emailOrUsername);

      // 인증 상태 정보와 함께 반환 (로그인은 차단하되 정보는 제공)
      return {
        user: {
          id: user.user_id,
          username: user.username,
          email: user.email,
          name: user.name,
          isEmailVerified: false,
          verificationAttempts: user.verification_attempts || 0,
          lastSentAt: user.verification_sent_at,
        },
        // 토큰은 제공하지 않음 (로그인 차단)
        requiresEmailVerification: true,
      };
    }

    // 5. Supabase Auth에도 등록/로그인 시도 (기존 로직 유지)
    let supabaseAuthResult = null;
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password,
      });

      if (authError && authError.message.includes("Invalid login credentials")) {
        console.log("🔄 Creating Supabase Auth user for existing user:", user.email);
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: user.email,
          password: password,
          options: {
            emailRedirectTo: undefined,
            data: {
              username: user.username,
              name: user.name,
              user_id: user.user_id,
            },
          },
        });

        if (!signUpError) {
          supabaseAuthResult = signUpData;

          if (signUpData.user && supabaseAdmin) {
            try {
              await supabaseAdmin.auth.admin.updateUserById(signUpData.user.id, {
                email_confirm: true,
              });
              console.log("✅ Email verification status updated for new Supabase user");
            } catch (adminError) {
              console.warn("⚠️ Failed to update email verification:", adminError.message);
            }
          }
        }
      } else if (!authError) {
        supabaseAuthResult = authData;
      }
    } catch (authErr) {
      console.warn("⚠️ Supabase Auth error (continuing with custom auth):", authErr.message);
    }

    // 6. 이메일 인증 상태 동기화 (기존 로직 유지)
    if (supabaseAuthResult?.user) {
      const isEmailConfirmed = supabaseAuthResult.user.email_confirmed_at !== null;

      if (isEmailConfirmed && !user.is_email_verified) {
        await queryBuilder
          .update("users", { is_email_verified: true }, { useAdmin: true })
          .eq("user_id", user.user_id);

        console.log("✅ Email verification status synced");
        user.is_email_verified = true;
      }
    }

    // 7. 로그인 성공 처리
    await resetFailedLoginAttempts(user.user_id);
    await updateLastLogin(user.user_id);

    // 8. 사용자 권한 조회
    const permissions = await getUserPermissions(user.user_id);

    // 9. 토큰 생성을 위한 페이로드
    const tokenPayload = {
      userId: user.user_id,
      username: user.username,
      email: user.email,
      name: user.name,
      roles: permissions.roles,
      permissions: permissions.permissions,
      supabaseSession: supabaseAuthResult?.session?.access_token || null,
    };

    // 10. 토큰 생성
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken({ userId: user.user_id });

    console.log("✅ User authenticated successfully:", user.username);

    return {
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        name: user.name,
        isEmailVerified: user.is_email_verified,
        roles: permissions.roles,
        permissions: permissions.permissions,
      },
      accessToken,
      refreshToken,
      supabaseSession: supabaseAuthResult?.session || null,
    };
  } catch (error) {
    console.error("❌ Authentication error:", error);
    throw error;
  }
};

/**
 * 📧 이메일 인증 토큰 생성 및 DB 업데이트 (수정된 버전)
 * @param {number} userId - 사용자 ID
 * @param {string} verificationType - 인증 타입 ('registration', 'resend')
 * @returns {Promise<string>} 생성된 토큰
 */
export const createEmailVerificationToken = async (userId, verificationType = "registration") => {
  try {
    const token = generateEmailVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24시간 후 만료

    console.log("🔍 토큰 업데이트 시작:", {
      userId,
      token: token.substring(0, 8) + "...",
      expiresAt: expiresAt.toISOString(),
    });

    // 🔧 1. 먼저 현재 verification_attempts 값 조회
    const { data: currentUser, error: selectError } = await queryBuilder
      .select("users", "verification_attempts", { useAdmin: true })
      .eq("user_id", userId)
      .single();

    if (selectError) {
      console.error("❌ 사용자 조회 실패:", selectError);
      throw new Error(`사용자 조회 실패: ${selectError.message}`);
    }

    const currentAttempts = currentUser?.verification_attempts || 0;
    console.log("🔍 현재 시도 횟수:", currentAttempts);

    // 🔧 2. 토큰 정보 업데이트 (verification_attempts는 숫자로 계산)
    const { data: updateResult, error: updateError } = await queryBuilder
      .update(
        "users",
        {
          email_verification_token: token,
          email_verification_expires_at: expiresAt.toISOString(),
          verification_sent_at: new Date().toISOString(),
          verification_attempts: currentAttempts + 1, // 🔧 문자열이 아닌 숫자로 계산
        },
        { useAdmin: true }
      )
      .eq("user_id", userId)
      .select(); // 🔧 업데이트 결과 반환

    if (updateError) {
      console.error("❌ 토큰 업데이트 실패:", updateError);
      throw new Error(`토큰 업데이트 실패: ${updateError.message}`);
    }

    if (!updateResult || updateResult.length === 0) {
      console.error("❌ 업데이트된 행이 없음");
      throw new Error("토큰 업데이트가 적용되지 않았습니다.");
    }

    console.log("✅ 토큰 업데이트 성공:", {
      userId,
      updatedRows: updateResult.length,
      newAttempts: currentAttempts + 1,
    });

    // 🔧 3. 업데이트 확인 (선택적)
    const { data: verifyResult, error: verifyError } = await queryBuilder
      .select("users", "email_verification_token, verification_attempts", { useAdmin: true })
      .eq("user_id", userId)
      .single();

    if (verifyError) {
      console.warn("⚠️ 업데이트 확인 실패:", verifyError);
    } else {
      console.log("🔍 업데이트 확인:", {
        tokenSaved: !!verifyResult.email_verification_token,
        tokenMatch: verifyResult.email_verification_token === token,
        attempts: verifyResult.verification_attempts,
      });
    }

    console.log(`✅ Email verification token created for user ${userId}`);
    return token;
  } catch (error) {
    console.error("❌ Error creating verification token:", error);
    throw error;
  }
};

/**
 * 📧 이메일 인증 완료
 * @param {number} userId - 사용자 ID
 * @param {string} token - 인증 토큰
 * @returns {Promise<boolean>} 인증 성공 여부
 */
export const completeEmailVerification = async (userId, token) => {
  try {
    const { data: updateResult, error } = await queryBuilder
      .update(
        "users",
        {
          is_email_verified: true,
          email_verification_token: null,
          email_verification_expires_at: null,
        },
        { useAdmin: true }
      )
      .eq("user_id", userId)
      .eq("email_verification_token", token)
      .gt("email_verification_expires_at", new Date().toISOString())
      .eq("is_email_verified", false);

    if (error) {
      console.error("❌ Email verification update error:", error);
      return false;
    }

    if (updateResult && updateResult.length > 0) {
      console.log(`✅ Email verification completed for user ${userId}`);
      return true;
    } else {
      console.log(`❌ Invalid or expired token for user ${userId}`);
      return false;
    }
  } catch (error) {
    console.error("❌ Error completing email verification:", error);
    return false;
  }
};

/**
 * 📧 인증 메일 재발송 가능 여부 확인
 * @param {Object} user - 사용자 정보
 * @returns {boolean} 재발송 가능 여부
 */
export const checkCanResendVerification = (user) => {
  if (!user.verification_sent_at) {
    return true; // 아직 발송된 적 없음
  }

  const lastSentTime = new Date(user.verification_sent_at);
  const now = new Date();
  const timeDiff = now - lastSentTime;
  const oneMinute = 60 * 1000;

  // 1분 이후 재발송 가능
  return timeDiff > oneMinute;
};

/**
 * 📧 이메일 마스킹
 * @param {string} email - 마스킹할 이메일
 * @returns {string} 마스킹된 이메일
 */
export const maskEmail = (email) => {
  const [username, domain] = email.split("@");
  const maskedUsername =
    username.length > 2 ? username.substring(0, 2) + "*".repeat(username.length - 2) : username;
  return `${maskedUsername}@${domain}`;
};

/**
 * 📧 이메일 인증 토큰 생성 (32바이트 랜덤)
 * @returns {string} 생성된 토큰
 */
const generateEmailVerificationToken = () => {
  const crypto = require("crypto");
  return crypto.randomBytes(32).toString("hex");
};

/**
 * 🔧 인증용 사용자 권한 조회 함수 (RLS 우회)
 */
const getUserPermissionsForAuth = async (userId) => {
  try {
    console.log("🔍 Getting permissions for user:", userId);

    // 🔧 관리자 클라이언트로 직접 조회 (RLS 완전 우회)
    const { data: roleData, error } = await supabaseAdmin
      .from("user_roles")
      .select(
        `
        roles (
          role_code,
          role_name,
          role_category,
          permissions
        ),
        scope_type,
        scope_company_id,
        scope_department_id,
        scope_labor_office_id,
        start_date,
        end_date,
        is_active
      `
      )
      .eq("user_id", userId)
      .eq("is_active", true)
      .filter("roles.is_active", "eq", true)
      .or("start_date.is.null,start_date.lte.now()")
      .or("end_date.is.null,end_date.gte.now()");

    if (error) {
      console.error("❌ Error fetching user permissions:", error);
      return { roles: [], permissions: {} };
    }

    console.log("✅ Raw permissions data:", roleData);

    const roles = (roleData || []).map((row) => ({
      code: row.roles.role_code,
      name: row.roles.role_name,
      category: row.roles.role_category,
      scope: {
        type: row.scope_type,
        companyId: row.scope_company_id,
        departmentId: row.scope_department_id,
        laborOfficeId: row.scope_labor_office_id,
      },
    }));

    // 모든 권한을 병합
    const allPermissions = {};
    (roleData || []).forEach((row) => {
      const permissions = row.roles.permissions || {};
      Object.keys(permissions).forEach((resource) => {
        if (!allPermissions[resource]) {
          allPermissions[resource] = new Set();
        }
        if (Array.isArray(permissions[resource])) {
          permissions[resource].forEach((action) => {
            allPermissions[resource].add(action);
          });
        }
      });
    });

    // Set을 Array로 변환
    const permissions = {};
    Object.keys(allPermissions).forEach((resource) => {
      permissions[resource] = Array.from(allPermissions[resource]);
    });

    console.log("✅ Processed permissions:", { roles, permissions });

    return { roles, permissions };
  } catch (error) {
    console.error("❌ Error fetching user permissions:", error);
    return { roles: [], permissions: {} };
  }
};

/**
 * 로그인 실패 횟수 증가 (RLS 우회)
 */
const incrementFailedLoginAttempts = async (userId) => {
  try {
    // 🔧 1. 현재 failed_login_attempts 값 조회
    const { data: currentUser, error: selectError } = await supabaseAdmin
      .from("users")
      .select("failed_login_attempts")
      .eq("user_id", userId)
      .single();

    if (selectError) {
      console.error("❌ Failed to get current login attempts:", selectError);
      return;
    }

    const currentAttempts = currentUser?.failed_login_attempts || 0;
    const newAttempts = currentAttempts + 1;

    // 🔧 2. 계산된 값으로 업데이트
    const updateData = {
      failed_login_attempts: newAttempts,
    };

    // 5회 이상 실패 시 30분 잠금
    if (newAttempts >= 5) {
      const lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30분 후
      updateData.locked_until = lockUntil.toISOString();
    }

    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update(updateData)
      .eq("user_id", userId);

    if (updateError) {
      console.error("❌ Failed to increment login attempts:", updateError);
    } else {
      console.log(`✅ Login attempts updated: ${currentAttempts} → ${newAttempts}`);
    }
  } catch (error) {
    console.error("❌ Error incrementing login attempts:", error);
  }
};
/**
 * 로그인 실패 횟수 초기화 (RLS 우회)
 */
/**
 * 로그인 실패 횟수 초기화 (RLS 우회)
 */
const resetFailedLoginAttempts = async (userId) => {
  try {
    const { error } = await supabaseAdmin
      .from("users")
      .update({
        failed_login_attempts: 0,
        locked_until: null,
      })
      .eq("user_id", userId);

    if (error) {
      console.error("❌ Failed to reset login attempts:", error);
    } else {
      console.log("✅ Login attempts reset successfully");
    }
  } catch (error) {
    console.error("❌ Error resetting login attempts:", error);
  }
};

/**
 * 마지막 로그인 시간 업데이트 (RLS 우회)
 */
const updateLastLogin = async (userId) => {
  try {
    // 🔧 1. 현재 login_count 값 조회
    const { data: currentUser, error: selectError } = await supabaseAdmin
      .from("users")
      .select("login_count")
      .eq("user_id", userId)
      .single();

    if (selectError) {
      console.error("❌ Failed to get current login count:", selectError);
      return;
    }

    const currentCount = currentUser?.login_count || 0;
    const newCount = currentCount + 1;

    // 🔧 2. 계산된 값으로 업데이트
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        last_login: new Date().toISOString(),
        login_count: newCount, // 🔧 문자열이 아닌 숫자값 사용
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error("❌ Failed to update last login:", updateError);
    } else {
      console.log(`✅ Last login updated: login_count ${currentCount} → ${newCount}`);
    }
  } catch (error) {
    console.error("❌ Error updating last login:", error);
  }
};

// 기존 함수들은 그대로 유지...
export const registerUserWithSupabase = async (userData) => {
  // 기존 코드 유지
};

/**
 * 기존 시스템 사용자 등록 (이메일 인증 상태 설정 가능)
 * @param {Object} userData - 사용자 데이터
 * @returns {Promise<Object>} 생성된 사용자 정보
 */
export const registerUser = async (userData) => {
  const {
    username,
    email,
    password,
    name,
    phoneNumber,
    userType,
    organizationData,
    emailVerified = false, // 📧 기본값을 false로 변경 (이메일 인증 필요)
  } = userData;

  try {
    // 중복 확인
    const { data: existingUser } = await queryBuilder
      .select("users", "user_id", { useAdmin: true })
      .or(`username.eq.${username},email.eq.${email}`)
      .single();

    if (existingUser) {
      throw new Error("이미 존재하는 사용자명 또는 이메일입니다.");
    }

    // 비밀번호 해시화
    const hashedPassword = await hashPassword(password);

    // 📧 사용자 생성 (이메일 인증 상태 설정)
    const { data: newUserData, error } = await queryBuilder.insert(
      "users",
      {
        username,
        email,
        password_hash: hashedPassword,
        name,
        phone_number: phoneNumber,
        is_email_verified: emailVerified, // 📧 동적으로 설정
      },
      { useAdmin: true }
    );

    if (error) {
      throw new SupabaseError(error.message);
    }

    const newUser = newUserData[0];

    // 조직 정보 생성 (노무사 사무실 또는 회사)
    if (organizationData && userType) {
      if (userType === "labor_office") {
        await createLaborOffice(newUser.user_id, organizationData);
      } else if (userType === "company") {
        await createCompany(newUser.user_id, organizationData);
      }
    }

    console.log("✅ User created successfully:", newUser.username);

    return {
      id: newUser.user_id,
      username: newUser.username,
      email: newUser.email,
      name: newUser.name,
      createdAt: newUser.created_at,
      emailVerified: newUser.is_email_verified,
    };
  } catch (error) {
    console.error("❌ User registration error:", error);
    throw error;
  }
};

/**
 * 노무사 사무실 생성 (구현 완료)
 * @param {number} userId - 사용자 ID
 * @param {Object} officeData - 사무실 데이터
 */
const createLaborOffice = async (userId, officeData) => {
  try {
    console.log("🏢 Creating labor office for user:", userId, officeData);

    // 1. 노무사 사무실 정보 생성
    const { data: laborOfficeData, error: officeError } = await queryBuilder.insert(
      "labor_offices",
      {
        office_name: officeData.officeName || officeData.companyName,
        business_registration_number: officeData.businessNumber,
        representative_name: officeData.representative,
        address: officeData.address || "",
        phone_number: officeData.phone || "",
        office_status: "active",
      },
      { useAdmin: true }
    );

    if (officeError) {
      throw new SupabaseError(`노무사 사무실 생성 실패: ${officeError.message}`);
    }

    const laborOffice = laborOfficeData[0];
    console.log("✅ Labor office created:", laborOffice.labor_office_id);

    // 2. 노무사 사무실 직원으로 등록 (관리자)
    const { data: staffData, error: staffError } = await queryBuilder.insert(
      "labor_office_staff",
      {
        labor_office_id: laborOffice.labor_office_id,
        user_id: userId,
        position: "대표",
        license_type: officeData.licenseNumber ? "노무사" : "",
        employment_status: "active",
      },
      { useAdmin: true }
    );

    if (staffError) {
      throw new SupabaseError(`노무사 직원 등록 실패: ${staffError.message}`);
    }

    console.log("✅ Staff record created for user:", userId);

    // 3. 사용자 역할 부여 (LABOR_ADMIN)
    await assignUserRole(userId, "LABOR_ADMIN", "labor_office", laborOffice.labor_office_id);

    return {
      laborOfficeId: laborOffice.labor_office_id,
      staffId: staffData[0].staff_id,
    };
  } catch (error) {
    console.error("❌ Labor office creation error:", error);
    throw error;
  }
};

/**
 * 회사 생성 (구현 완료)
 * @param {number} userId - 사용자 ID
 * @param {Object} companyData - 회사 데이터
 */
const createCompany = async (userId, companyData) => {
  try {
    console.log("🏢 Creating company for user:", userId, companyData);

    // 1. 회사 정보 생성
    const { data: companyInsertData, error: companyError } = await queryBuilder.insert(
      "companies",
      {
        company_name: companyData.companyName || companyData.officeName,
        business_registration_number: companyData.businessNumber,
        representative_name: companyData.representative,
        address: companyData.address || "",
        client_status: "active",
      },
      { useAdmin: true }
    );

    if (companyError) {
      throw new SupabaseError(`회사 생성 실패: ${companyError.message}`);
    }

    const company = companyInsertData[0];
    console.log("✅ Company created:", company.company_id);

    // 2. 기본 부서 생성 (본사)
    const { data: deptData, error: deptError } = await queryBuilder.insert(
      "departments",
      {
        company_id: company.company_id,
        department_code: "HEAD",
        department_name: "본사",
        department_type: "office",
        is_active: true,
      },
      { useAdmin: true }
    );

    if (deptError) {
      throw new SupabaseError(`부서 생성 실패: ${deptError.message}`);
    }

    console.log("✅ Default department created:", deptData[0].department_id);

    // 3. 사용자 역할 부여 (COMPANY_ADMIN)
    await assignUserRole(userId, "COMPANY_ADMIN", "company", company.company_id);

    return {
      companyId: company.company_id,
      departmentId: deptData[0].department_id,
    };
  } catch (error) {
    console.error("❌ Company creation error:", error);
    throw error;
  }
};

/**
 * 사용자 역할 부여
 * @param {number} userId - 사용자 ID
 * @param {string} roleCode - 역할 코드
 * @param {string} scopeType - 권한 범위 타입
 * @param {number} scopeId - 권한 범위 ID
 */
const assignUserRole = async (userId, roleCode, scopeType, scopeId) => {
  try {
    // 역할 ID 조회
    const { data: roleData, error: roleError } = await queryBuilder
      .select("roles", "role_id")
      .eq("role_code", roleCode)
      .eq("is_active", true)
      .single();

    if (roleError || !roleData) {
      throw new Error(`역할을 찾을 수 없습니다: ${roleCode}`);
    }

    // 사용자 역할 매핑 생성
    const roleMapping = {
      user_id: userId,
      role_id: roleData.role_id,
      scope_type: scopeType,
      is_active: true,
    };

    // 범위별 ID 설정
    if (scopeType === "labor_office") {
      roleMapping.scope_labor_office_id = scopeId;
    } else if (scopeType === "company") {
      roleMapping.scope_company_id = scopeId;
    }

    const { error: mappingError } = await queryBuilder.insert("user_roles", roleMapping, {
      useAdmin: true,
    });

    if (mappingError) {
      throw new SupabaseError(`역할 부여 실패: ${mappingError.message}`);
    }

    console.log(`✅ Role ${roleCode} assigned to user ${userId}`);
  } catch (error) {
    console.error("❌ Role assignment error:", error);
    throw error;
  }
};

export const getSupabaseSession = async () => {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("❌ Session verification failed:", error);
      return null;
    }

    return session;
  } catch (error) {
    console.error("❌ Session check error:", error);
    return null;
  }
};

/**
 * 🔧 수정된 사용자 권한 조회 (일반용)
 */
export const getUserPermissions = async (userId) => {
  try {
    // 인증 시에는 getUserPermissionsForAuth 사용
    return await getUserPermissionsForAuth(userId);
  } catch (error) {
    console.error("❌ Error fetching user permissions:", error);
    return { roles: [], permissions: {} };
  }
};

// 권한 확인 헬퍼 함수들
export const hasPermission = (userPermissions, resource, action) => {
  if (!userPermissions || !userPermissions.permissions) {
    return false;
  }

  const resourcePermissions = userPermissions.permissions[resource];
  if (!resourcePermissions) {
    return false;
  }

  return resourcePermissions.includes(action) || resourcePermissions.includes("*");
};

export const hasRole = (userPermissions, roleCode) => {
  if (!userPermissions || !userPermissions.roles) {
    return false;
  }

  return userPermissions.roles.some((role) => role.code === roleCode);
};

export const canAccessCompany = (userPermissions, companyId) => {
  if (!userPermissions || !userPermissions.roles) {
    return false;
  }

  return userPermissions.roles.some((role) => {
    if (role.scope.type === "global") {
      return true;
    }

    if (role.scope.type === "company" && role.scope.companyId === companyId) {
      return true;
    }

    return false;
  });
};

/**
 * 토큰 갱신
 */
export const refreshTokens = async (refreshToken) => {
  try {
    const decoded = verifyToken(refreshToken, true);

    if (!decoded) {
      throw new Error("Invalid refresh token");
    }

    // Supabase Auth 세션 갱신 시도
    const {
      data: { session },
      error,
    } = await supabase.auth.refreshSession();

    // 🔧 관리자 클라이언트로 사용자 정보 조회
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("user_id, username, email, name, is_active")
      .eq("user_id", decoded.userId)
      .eq("is_active", true)
      .single();

    if (userError || !user) {
      throw new Error("User not found or inactive");
    }

    const permissions = await getUserPermissions(user.user_id);

    // 새 토큰 생성
    const tokenPayload = {
      userId: user.user_id,
      username: user.username,
      email: user.email,
      name: user.name,
      roles: permissions.roles,
      permissions: permissions.permissions,
      supabaseSession: session?.access_token || null,
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken({ userId: user.user_id });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        name: user.name,
        roles: permissions.roles,
        permissions: permissions.permissions,
      },
      supabaseSession: session,
    };
  } catch (error) {
    console.error("❌ Token refresh error:", error);
    throw error;
  }
};

/**
 * 로그아웃
 */
export const signOut = async () => {
  try {
    await supabase.auth.signOut();
    console.log("✅ User signed out successfully");
  } catch (error) {
    console.error("❌ Sign out error:", error);
    throw error;
  }
};

/**
 * 🔐 비밀번호 재설정 토큰 생성
 * @param {string} email - 사용자 이메일
 * @returns {Promise<Object>} 생성된 토큰 정보 또는 에러
 */
export async function createPasswordResetToken(email) {
  console.log(`🔐 Creating password reset token for: ${email}`);
  try {
    // 1. 데이터베이스에서 사용자 조회 (queryBuilder 사용)
    const { data: user, error: userError } = await queryBuilder
      .select("users", "user_id, username, email, name", { useAdmin: true }) // useAdmin 옵션 추가
      .eq("email", email)
      .single();

    if (userError || !user) {
      console.log(`❌ User not found for password reset: ${email}`, userError); // userError도 함께 로깅하여 디버깅에 도움
      return { userExists: false, message: "사용자를 찾을 수 없습니다." };
    }

    // ⭐ DB의 is_active 상태가 'false'이므로, 이 부분을 처리해야 합니다.
    // 사용자가 비활성화되어 있다면, 비밀번호 재설정을 허용할지 결정
    // if (!user.is_active) {
    //     console.warn(`⚠️ Attempted password reset for inactive user: ${email}. Returning as not found for security.`);
    //     // 보안상 '사용자를 찾을 수 없음'과 동일한 흐름을 타게 함
    //     return { userExists: false, message: "비활성화된 계정입니다." };
    // }

    // 이메일 인증이 안된 경우 (이전 로그에 이미 처리가 있었으므로 유지)
    // if (!user.is_email_verified) {
    //     console.warn(`⚠️ Attempted password reset for unverified email: ${email}.`);
    //     return { userExists: true, code: "EMAIL_NOT_VERIFIED", message: "이메일 인증이 필요합니다." };
    // }

    // 2. 토큰 생성 및 만료 시간 설정
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // 1시간 유효

    // 3. 사용자 정보 업데이트 (토큰 저장) - queryBuilder 사용
    // Supabase의 update는 'useAdmin: true' 옵션이 필요할 수 있습니다 (RLS 우회).
    const { data: updatedUser, error: updateError } = await queryBuilder
      .update(
        "users",
        {
          password_reset_token: token,
          password_reset_expires: expires.toISOString(), // Supabase는 ISO 문자열 형식 선호
        },
        { useAdmin: true }
      ) // 관리자 권한으로 업데이트가 필요할 수 있습니다.
      .eq("user_id", user.user_id); // 'user_id'는 DB의 기본 키 컬럼명에 따라 변경

    if (updateError) {
      console.error("Error updating user with reset token:", updateError);
      // 토큰 업데이트 실패 시에도 userExists: false를 반환하여 보안 성공 흐름을 타게 할 수 있습니다.
      // 또는 명시적인 에러를 던져 상위에서 처리하게 할 수도 있습니다.
      return { userExists: false, message: "비밀번호 재설정 토큰 저장 실패" };
    }

    console.log(`✅ Token created for ${email}: ${token.substring(0, 8)}...`);
    return {
      userExists: true,
      user: { user_id: user.user_id, email: user.email, name: user.name, username: user.username },
      token,
      expiresAt: expires.toISOString(),
    };
  } catch (error) {
    console.error("Error creating password reset token:", error);
    // 예상치 못한 오류 발생 시
    return { userExists: false, message: "토큰 생성 중 알 수 없는 오류가 발생했습니다." };
  }
}

/**
 * 🔐 비밀번호 재설정 토큰 검증
 * @param {string} token - 재설정 토큰
 * @returns {Promise<Object>} 토큰 유효성 정보
 */
export const verifyPasswordResetToken = async (token) => {
  try {
    console.log("🔍 Verifying password reset token:", token.substring(0, 8) + "...");

    if (!token || token.length !== 64) {
      return {
        valid: false,
        message: "유효하지 않은 토큰 형식입니다.",
      };
    }

    // 토큰으로 사용자 조회
    const { data: user, error: userError } = await queryBuilder
      .select(
        "users",
        "user_id, username, email, name, password_reset_token, password_reset_expires, is_active",
        { useAdmin: true }
      )
      .eq("password_reset_token", token)
      .eq("is_active", true)
      .single();

    if (userError || !user) {
      console.log("❌ Invalid or expired reset token");
      return {
        valid: false,
        message: "유효하지 않거나 만료된 토큰입니다.",
      };
    }

    // 토큰 만료 확인
    const now = new Date();
    const expiresAt = new Date(user.password_reset_expires);

    if (now > expiresAt) {
      console.log("❌ Reset token expired:", expiresAt);

      // 만료된 토큰 정리
      await queryBuilder
        .update(
          "users",
          {
            password_reset_token: null,
            password_reset_expires: null,
          },
          { useAdmin: true }
        )
        .eq("user_id", user.user_id);

      return {
        valid: false,
        message: "토큰이 만료되었습니다. 새로운 비밀번호 재설정을 요청해주세요.",
      };
    }

    console.log("✅ Password reset token is valid");

    return {
      valid: true,
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        name: user.name,
      },
      expiresAt: user.password_reset_expires,
    };
  } catch (error) {
    console.error("❌ Error verifying password reset token:", error);
    return {
      valid: false,
      message: "토큰 검증 중 오류가 발생했습니다.",
    };
  }
};

/**
 * 🔐 비밀번호 재설정 실행
 * @param {string} token - 재설정 토큰
 * @param {string} newPassword - 새 비밀번호
 * @returns {Promise<Object>} 재설정 결과
 */
export const resetUserPassword = async (token, newPassword) => {
  try {
    console.log("🔐 Resetting password with token:", token.substring(0, 8) + "...");

    // 1. 토큰 검증
    const tokenVerification = await verifyPasswordResetToken(token);

    if (!tokenVerification.valid) {
      return {
        success: false,
        message: tokenVerification.message,
      };
    }

    // 2. 비밀번호 강도 검사
    if (!newPassword || newPassword.length < 8) {
      return {
        success: false,
        message: "새 비밀번호는 최소 8자 이상이어야 합니다.",
      };
    }

    // 3. 새 비밀번호 해시화
    const hashedPassword = await hashPassword(newPassword);

    // 4. 데이터베이스 업데이트 (비밀번호 변경 + 토큰 제거)
    const { error: updateError } = await queryBuilder
      .update(
        "users",
        {
          password_hash: hashedPassword,
          password_reset_token: null,
          password_reset_expires: null,
          password_changed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { useAdmin: true }
      )
      .eq("user_id", tokenVerification.user.id);

    if (updateError) {
      console.error("❌ Failed to reset password:", updateError);
      throw new Error(`비밀번호 재설정 실패: ${updateError.message}`);
    }

    console.log(`✅ Password reset successfully for user: ${tokenVerification.user.username}`);

    return {
      success: true,
      message: "비밀번호가 성공적으로 재설정되었습니다.",
      user: tokenVerification.user,
    };
  } catch (error) {
    console.error("❌ Error resetting password:", error);
    return {
      success: false,
      message: "비밀번호 재설정 중 오류가 발생했습니다.",
    };
  }
};

/**
 * 🔐 만료된 비밀번호 재설정 토큰 정리 (배치용)
 * @returns {Promise<number>} 정리된 토큰 개수
 */
export const cleanupExpiredPasswordResetTokens = async () => {
  try {
    const { data: cleanedUsers, error } = await queryBuilder
      .update(
        "users",
        {
          password_reset_token: null,
          password_reset_expires: null,
        },
        { useAdmin: true }
      )
      .lt("password_reset_expires", new Date().toISOString())
      .select();

    if (error) {
      console.error("❌ Failed to cleanup expired tokens:", error);
      return 0;
    }

    const cleanedCount = cleanedUsers ? cleanedUsers.length : 0;
    console.log(`✅ Cleaned up ${cleanedCount} expired password reset tokens`);

    return cleanedCount;
  } catch (error) {
    console.error("❌ Error cleaning up expired tokens:", error);
    return 0;
  }
};
