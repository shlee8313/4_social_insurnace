// File: lib/emailService.js (개선된 버전)
import nodemailer from "nodemailer";

/**
 * 📧 이메일 서비스 모듈 (개선된 버전)
 * 인증 메일 발송 등을 담당
 */

// 🔧 개발 환경 체크
const isDevelopment = process.env.NODE_ENV === "development";
const forceRealEmail = process.env.EMAIL_FORCE_SEND === "true";
const emailDebug = process.env.EMAIL_DEBUG === "true";

// 🔧 SMTP 설정 개선
const createTransporter = () => {
  console.log("📧 Creating email transporter...");
  console.log("📧 Environment:", {
    isDevelopment,
    forceRealEmail,
    hasSmtpHost: !!process.env.SMTP_HOST,
    hasSmtpUser: !!process.env.SMTP_USER,
    hasSmtpPass: !!process.env.SMTP_PASS,
  });

  // 🚀 실제 이메일 발송 조건: 운영환경이거나 강제 발송 플래그가 true
  const shouldSendRealEmail = !isDevelopment || forceRealEmail;

  if (!shouldSendRealEmail) {
    console.log("📧 개발 모드: 실제 메일 발송 대신 콘솔 출력");
    return createMockTransporter();
  }

  // SMTP 설정 검증
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("⚠️ SMTP 환경변수가 설정되지 않았습니다. 개발 모드로 전환합니다.");
    console.warn("필요한 환경변수: SMTP_HOST, SMTP_USER, SMTP_PASS");
    return createMockTransporter();
  }

  // 🏭 실제 SMTP 설정
  const config = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    debug: emailDebug,
    logger: emailDebug,
  };

  console.log("✅ 실제 SMTP transporter 생성:", {
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: config.auth.user,
  });

  return nodemailer.createTransport(config);
};

// 🔧 모의 transporter 생성 함수
const createMockTransporter = () => {
  console.log("📧 Mock transporter 생성");

  return {
    sendMail: async (mailOptions) => {
      console.log("📧 [개발 모드] 이메일 발송 시뮬레이션:");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("📬 받는 사람:", mailOptions.to);
      console.log("📝 제목:", mailOptions.subject);
      console.log("📄 텍스트 내용:");
      console.log(mailOptions.text?.substring(0, 300) + "...");
      console.log("🔗 HTML 내용 (요약):");
      if (mailOptions.html) {
        // HTML에서 링크 추출
        const linkMatch = mailOptions.html.match(/href="([^"]+)"/);
        if (linkMatch) {
          console.log("🔗 인증 링크:", linkMatch[1]);
        }
      }
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━");

      return {
        messageId: `dev-${Date.now()}@localhost`,
        accepted: [mailOptions.to],
        response: "250 Mock email sent",
      };
    },
    verify: async () => {
      console.log("✅ [개발 모드] SMTP 검증 건너뜀");
      return true;
    },
  };
};

// transporter 인스턴스 생성
const transporter = createTransporter();

/**
 * 🔧 이메일 전송 래퍼 함수 (개선된 에러 처리)
 */
const sendEmailSafely = async (mailOptions) => {
  try {
    console.log("📧 이메일 발송 시작:", mailOptions.to);

    // 실제 이메일 발송 (개발 모드 포함)
    const info = await transporter.sendMail(mailOptions);
    console.log("📧 Email sent successfully:", {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    });

    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      developmentMode: isDevelopment && !forceRealEmail,
    };
  } catch (error) {
    console.error("📧 Email send failed:", error);

    // 개발 환경에서는 에러를 던지지 않고 로그만 출력
    if (isDevelopment && !forceRealEmail) {
      console.log("📧 [개발 모드] 이메일 발송 실패하지만 계속 진행합니다.");
      return {
        success: true, // 개발 모드에서는 성공으로 처리
        error: error.message,
        developmentMode: true,
      };
    }

    // 운영 환경이나 강제 발송 모드에서는 실제 에러 반환
    return {
      success: false,
      error: error.message,
      developmentMode: false,
    };
  }
};

/**
 * 📧 이메일 인증 메일 발송 (개선된 버전)
 */
export async function sendVerificationEmail({ email, name, userId, token }) {
  console.log("📧 sendVerificationEmail 호출:", {
    email,
    name,
    userId,
    token: token?.substring(0, 8) + "...",
  });

  // 인증 URL 생성
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verificationUrl = `${baseUrl}/verify-email?token=${token}&userId=${userId}`;

  console.log("🔗 생성된 인증 URL:", verificationUrl);

  const mailOptions = {
    from: `"4대보험 통합 관리 시스템" <${
      process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@insurance-system.com"
    }>`,
    to: email,
    subject: "[4대보험 시스템] 이메일 인증을 완료해주세요",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>이메일 인증</title>
      </head>
      <body style="font-family: 'Noto Sans KR', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

        <div style="text-align: center; margin-bottom: 30px;">
          <div style="background: #3B82F6; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <h1 style="color: #1F2937; margin: 0;">4대보험 통합 관리 시스템</h1>
        </div>

        <div style="background: #F9FAFB; border-radius: 8px; padding: 30px; margin-bottom: 30px;">
          <h2 style="color: #1F2937; margin: 0 0 20px 0;">안녕하세요, ${name}님!</h2>

          <p style="margin: 0 0 20px 0;">
            4대보험 통합 관리 시스템에 가입해주셔서 감사합니다.<br>
            아래 버튼을 클릭하여 이메일 인증을 완료해주세요.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}"
               style="background: #3B82F6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              이메일 인증하기
            </a>
          </div>

          <p style="margin: 20px 0 0 0; font-size: 14px; color: #6B7280;">
            버튼이 작동하지 않는다면 아래 링크를 복사하여 브라우저 주소창에 붙여넣어 주세요:<br>
            <a href="${verificationUrl}" style="color: #3B82F6; word-break: break-all;">${verificationUrl}</a>
          </p>
        </div>

        <div style="border-top: 1px solid #E5E7EB; padding-top: 20px; font-size: 14px; color: #6B7280;">
          <p><strong>유의사항:</strong></p>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>이 인증 링크는 24시간 동안 유효합니다.</li>
            <li>인증을 완료하지 않으면 로그인이 제한됩니다.</li>
            <li>이 메일을 요청하지 않으셨다면 무시하셔도 됩니다.</li>
          </ul>

          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;">

          <p style="margin: 0; text-align: center;">
            문의사항이 있으시면 <a href="mailto:support@insurance-system.co.kr" style="color: #3B82F6;">support@insurance-system.co.kr</a>로 연락해주세요.<br>
            <small style="color: #9CA3AF;">© 2025 4대보험 통합 관리 시스템. All rights reserved.</small>
          </p>
        </div>

      </body>
      </html>
    `,
    text: `
안녕하세요, ${name}님!

4대보험 통합 관리 시스템에 가입해주셔서 감사합니다.
아래 링크를 클릭하여 이메일 인증을 완료해주세요.

인증 링크: ${verificationUrl}

※ 유의사항:
- 이 인증 링크는 24시간 동안 유효합니다.
- 인증을 완료하지 않으면 로그인이 제한됩니다.
- 이 메일을 요청하지 않으셨다면 무시하셔도 됩니다.

문의사항: support@insurance-system.co.kr
    `,
  };

  console.log("📧 메일 옵션 설정 완료, 발송 시작...");
  const result = await sendEmailSafely(mailOptions);
  console.log("📧 메일 발송 완료:", result);

  return result;
}

/**
 * 🔧 비밀번호 재설정 메일 발송
 */
export async function sendPasswordResetEmail({ email, name, token }) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"4대보험 통합 관리 시스템" <${
      process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@insurance-system.com"
    }>`,
    to: email,
    subject: "[4대보험 시스템] 비밀번호 재설정 안내",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>비밀번호 재설정</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>비밀번호 재설정</h2>
        <p>안녕하세요, ${name}님!</p>
        <p>비밀번호 재설정을 요청하셨습니다. 아래 링크를 클릭하여 새로운 비밀번호를 설정해주세요.</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
            비밀번호 재설정
          </a>
        </p>
        <p><small>이 링크는 1시간 동안만 유효합니다.</small></p>
        <p><small>이 요청을 하지 않으셨다면 이 메일을 무시하세요.</small></p>
      </body>
      </html>
    `,
    text: `
안녕하세요, ${name}님!

비밀번호 재설정을 요청하셨습니다.
아래 링크로 접속하여 새로운 비밀번호를 설정해주세요.

${resetUrl}

이 링크는 1시간 동안만 유효합니다.
이 요청을 하지 않으셨다면 이 메일을 무시하세요.
    `,
  };

  return await sendEmailSafely(mailOptions);
}

/**
 * 🔧 이메일 설정 테스트 (개선된 버전)
 */
export async function testEmailConfiguration() {
  try {
    console.log("📧 이메일 설정 테스트 시작...");

    if (isDevelopment && !forceRealEmail) {
      console.log("📧 개발 모드: 이메일 설정 테스트를 건너뜁니다.");
      return { success: true, mode: "development" };
    }

    // verify 메서드가 있는 경우에만 호출
    if (typeof transporter.verify === "function") {
      await transporter.verify();
      console.log("✅ SMTP 서버 연결 성공");
    } else {
      console.log("✅ 개발 모드 transporter 사용 중");
    }

    return { success: true, mode: process.env.NODE_ENV };
  } catch (error) {
    console.error("❌ SMTP 서버 연결 실패:", error);
    return { success: false, error: error.message };
  }
}

// 🔧 디버깅용 이메일 테스트 함수
export async function sendTestEmail(to = "test@example.com") {
  console.log("📧 테스트 이메일 발송...");

  const mailOptions = {
    from: `"4대보험 시스템 테스트" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: to,
    subject: "이메일 설정 테스트",
    html: `
      <h2>이메일 설정 테스트</h2>
      <p>이 메일이 정상적으로 수신되었다면 이메일 설정이 올바르게 구성되었습니다.</p>
      <p>시간: ${new Date().toLocaleString()}</p>
    `,
    text: `
이메일 설정 테스트

이 메일이 정상적으로 수신되었다면 이메일 설정이 올바르게 구성되었습니다.
시간: ${new Date().toLocaleString()}
    `,
  };

  return await sendEmailSafely(mailOptions);
}
