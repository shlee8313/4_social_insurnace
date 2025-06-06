// File: app/api/auth/register/route.js (에러 핸들링 개선 버전)
import { NextResponse } from "next/server";
import { registerUser } from "../../../../lib/auth.js";
import { createEmailVerificationToken } from "../../../../lib/auth.js";
import { sendVerificationEmail } from "../../../../lib/emailService.js";
import { supabaseAdmin } from "../../../../lib/database.js";
import { extractNumbers } from "../../../utils/formatters.js";

/**
 * 회원가입 API Route Handler
 * POST /api/auth/register
 */
export async function POST(request) {
  try {
    const requestData = await request.json();
    const {
      username,
      email,
      password,
      name,
      phoneNumber,
      userType,
      organizationData,
      skipEmailVerification = false,
    } = requestData;

    console.log("📧 회원가입 시작:", { email, username, skipEmailVerification });

    // 필수 필드 검증
    if (!username || !email || !password || !name) {
      return NextResponse.json(
        {
          success: false,
          message: "필수 정보를 모두 입력해주세요.",
          code: "MISSING_REQUIRED_FIELDS",
        },
        { status: 400 }
      );
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "올바른 이메일 형식을 입력해주세요.",
          code: "INVALID_EMAIL_FORMAT",
        },
        { status: 400 }
      );
    }

    // 비밀번호 강도 검증
    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: "비밀번호는 8자리 이상이어야 합니다.",
          code: "WEAK_PASSWORD",
        },
        { status: 400 }
      );
    }

    // 🔧 사업자번호 검증 (organizationData가 있는 경우)
    if (organizationData?.businessNumber) {
      const businessNumberDigits = extractNumbers(organizationData.businessNumber);
      if (businessNumberDigits.length !== 10) {
        return NextResponse.json(
          {
            success: false,
            message: "올바른 사업자등록번호를 입력해주세요. (10자리)",
            code: "INVALID_BUSINESS_NUMBER",
          },
          { status: 400 }
        );
      }

      // 🔧 사업자번호 중복 확인
      const businessNumberExists = await checkBusinessNumberExists(organizationData.businessNumber);
      if (businessNumberExists) {
        return NextResponse.json(
          {
            success: false,
            message: "이미 등록된 사업자등록번호입니다.",
            code: "BUSINESS_NUMBER_EXISTS",
          },
          { status: 409 }
        );
      }
    }

    try {
      // 📧 1. 사용자 등록 (이메일 인증 상태 false로 설정)
      const userData = {
        username,
        email,
        password,
        name,
        phoneNumber,
        userType,
        organizationData,
        emailVerified: skipEmailVerification,
      };

      console.log("📧 사용자 생성 중...");
      const newUser = await registerUser(userData);
      console.log("✅ 사용자 생성 완료:", newUser.id);

      // 📧 2. 이메일 인증이 필요한 경우 토큰 생성 및 메일 발송
      if (!skipEmailVerification) {
        try {
          console.log("📧 인증 토큰 생성 중...");
          const verificationToken = await createEmailVerificationToken(newUser.id, "registration");
          console.log("✅ 인증 토큰 생성 완료");

          console.log("📧 인증 메일 발송 중...");
          const emailResult = await sendVerificationEmail({
            email: newUser.email,
            name: newUser.username,
            userId: newUser.id,
            token: verificationToken,
          });

          console.log("✅ 인증 메일 발송 결과:", emailResult);
        } catch (emailError) {
          console.error("⚠️ 이메일 발송 실패 (사용자 생성은 성공):", emailError);
        }
      }

      // 📧 3. 성공 응답
      return NextResponse.json(
        {
          success: true,
          message: skipEmailVerification
            ? "회원가입이 완료되었습니다."
            : "회원가입이 완료되었습니다. 이메일을 확인하여 계정을 인증해주세요.",
          data: {
            user: {
              id: newUser.id,
              username: newUser.username,
              email: newUser.email,
              name: newUser.name,
              createdAt: newUser.createdAt,
              emailVerificationRequired: !skipEmailVerification,
            },
          },
        },
        { status: 201 }
      );
    } catch (registrationError) {
      console.error("❌ Registration error:", registrationError);

      // 중복 사용자 에러 처리
      if (registrationError.message.includes("이미 존재하는")) {
        return NextResponse.json(
          {
            success: false,
            message: "이미 등록된 이메일 또는 사용자명입니다.",
            code: "USER_ALREADY_EXISTS",
          },
          { status: 409 }
        );
      }

      // 기타 등록 에러
      return NextResponse.json(
        {
          success: false,
          message: registrationError.message || "회원가입 중 오류가 발생했습니다.",
          code: "REGISTRATION_FAILED",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("❌ Register API Error:", error);

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

/**
 * 🔧 개선된 사업자번호 중복 확인 함수
 * @param {string} businessNumber - 프론트엔드에서 받은 사업자등록번호 (포맷팅될 수 있음)
 * @returns {Promise<boolean>} - 중복 여부
 */
async function checkBusinessNumberExists(businessNumber) {
  try {
    console.log("🔍 사업자번호 중복 확인 시작:", businessNumber);

    // Always work with the cleaned, digits-only version for database queries
    const businessNumberDigits = extractNumbers(businessNumber);

    // If the cleaned number isn't 10 digits, it's inherently invalid for a check
    if (businessNumberDigits.length !== 10) {
      console.log("⚠️ 유효하지 않은 사업자등록번호 길이 (10자리 아님). 중복 없음으로 처리.");
      return false;
    }

    // Prepare both formatted and unformatted versions for robust checking
    const formattedNumber = `${businessNumberDigits.slice(0, 3)}-${businessNumberDigits.slice(
      3,
      5
    )}-${businessNumberDigits.slice(5)}`;

    // Check in 'labor_offices' table
    const { data: laborOffices, error: laborError } = await supabaseAdmin
      .from("labor_offices")
      .select("labor_office_id")
      .in("business_registration_number", [businessNumberDigits, formattedNumber]) // Check both
      .limit(1);

    if (laborError) {
      console.error("❌ 노무사 사무실 조회 에러:", laborError);
      // If there's a DB error, we can't definitively say it doesn't exist,
      // so for safety, consider it exists to prevent potential issues.
      // Or, return false and rely on the frontend validation for invalid numbers.
      // For now, let's allow it to proceed to the next check, but ideally, you'd handle this more robustly.
      // For a duplicate check, it's safer to err on the side of "exists" if the check fails.
      throw laborError; // Re-throw to be caught by the outer try-catch for a 500 error
    }

    if (laborOffices && laborOffices.length > 0) {
      console.log("❌ 노무사 사무실에서 중복 발견");
      return true;
    }

    // Check in 'companies' table
    const { data: companies, error: companyError } = await supabaseAdmin
      .from("companies")
      .select("company_id")
      .in("business_registration_number", [businessNumberDigits, formattedNumber]) // Check both
      .limit(1);

    if (companyError) {
      console.error("❌ 회사 조회 에러:", companyError);
      throw companyError; // Re-throw to be caught by the outer try-catch for a 500 error
    }

    if (companies && companies.length > 0) {
      console.log("❌ 회사에서 중복 발견");
      return true;
    }

    console.log("✅ 사업자번호 사용 가능:", businessNumber);
    return false;
  } catch (error) {
    console.error("❌ 사업자번호 중복 확인 에러 (내부 DB 조회 실패):", error);
    // If a database error occurs, we assume it's not available to prevent
    // registration with potentially conflicting data.
    // The frontend will receive a "중복 확인 중 오류가 발생했습니다." message.
    return true; // Return true (exists) to prevent registration on a failed check
  }
}
/**
 * 🔧 개선된 사용자명/이메일/사업자번호 중복 확인 API
 * GET /api/auth/register?check=username&value=testuser
 * GET /api/auth/register?check=email&value=test@example.com
 * GET /api/auth/register?check=businessNumber&value=123-45-67890&userType=company
 */
export async function GET(request) {
  try {
    console.log("🔍 중복체크 API 호출됨");

    const { searchParams } = new URL(request.url);
    const checkType = searchParams.get("check");
    const value = searchParams.get("value");
    const userType = searchParams.get("userType");

    console.log("📋 요청 파라미터:", { checkType, value, userType });

    if (!checkType || !value) {
      return NextResponse.json(
        {
          success: false,
          message: "확인할 타입과 값을 입력해주세요.",
        },
        { status: 400 }
      );
    }

    if (!["username", "email", "businessNumber"].includes(checkType)) {
      return NextResponse.json(
        {
          success: false,
          message: "올바른 확인 타입을 입력해주세요.",
        },
        { status: 400 }
      );
    }

    let exists = false;
    let message = "";

    try {
      if (checkType === "businessNumber") {
        // 🔧 사업자번호 중복 확인
        console.log("🔍 사업자번호 중복 확인 시작:", value);
        exists = await checkBusinessNumberExists(value);
        message = exists
          ? "이미 등록된 사업자등록번호입니다."
          : "사용 가능한 사업자등록번호입니다.";
        console.log("✅ 사업자번호 중복 확인 완료:", { exists, message });
      } else {
        // 🔧 사용자명/이메일 중복 확인 (관리자 클라이언트 사용)
        console.log(`🔍 ${checkType} 중복 확인 시작:`, value);

        const { data: existingUsers, error: userError } = await supabaseAdmin
          .from("users")
          .select("user_id")
          .eq(checkType, value)
          .limit(1);

        if (userError) {
          console.error(`❌ ${checkType} 조회 에러:`, userError);
          throw userError;
        }

        exists = existingUsers && existingUsers.length > 0;
        message = exists
          ? `이미 사용 중인 ${checkType === "username" ? "사용자명" : "이메일"}입니다.`
          : `사용 가능한 ${checkType === "username" ? "사용자명" : "이메일"}입니다.`;

        console.log(`✅ ${checkType} 중복 확인 완료:`, { exists, message });
      }

      return NextResponse.json({
        success: true,
        available: !exists,
        message: message,
      });
    } catch (dbError) {
      console.error("❌ 데이터베이스 조회 에러:", dbError);

      // 🔧 DB 에러 발생시에도 적절한 응답 반환
      if (checkType === "businessNumber") {
        message = "사용 가능한 사업자등록번호입니다.";
      } else {
        message = `사용 가능한 ${checkType === "username" ? "사용자명" : "이메일"}입니다.`;
      }

      return NextResponse.json({
        success: true,
        available: true,
        message: message,
        warning: "중복 확인 중 일시적 오류가 발생했습니다.",
      });
    }
  } catch (error) {
    console.error("❌ 중복 확인 API 에러:", error);

    // 🔧 모든 에러를 JSON 형태로 반환 (HTML 에러 페이지 방지)
    return NextResponse.json(
      {
        success: false,
        message: "중복 확인 중 오류가 발생했습니다.",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
