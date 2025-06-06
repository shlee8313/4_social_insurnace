// 파일: add-user-to-auth.js (프로젝트 루트에 저장)
// 실행: node add-user-to-auth.js

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://ugqvsmrxtlidcbszeqdn.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVncXZzbXJ4dGxpZGNic3plcWRuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODY2NzYwNywiZXhwIjoyMDY0MjQzNjA3fQ.kTbOUBwbVi5R1jDi_WzMuVWdX2MgOhtc1KiK1Fal78w";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function addUserToAuth() {
  try {
    console.log("🔧 Adding leesanghoon@empal.com to Supabase Auth...");

    // 1. 먼저 기존 사용자가 있는지 확인
    const { data: existingUser, error: checkError } = await supabaseAdmin.auth.admin.listUsers();

    if (checkError) {
      console.error("❌ Error checking existing users:", checkError);
      return;
    }

    const userExists = existingUser.users.find((user) => user.email === "leesanghoon@empal.com");

    if (userExists) {
      console.log("✅ User already exists in Supabase Auth:", userExists.email);
      console.log("📧 Email confirmed:", userExists.email_confirmed_at !== null);
      return;
    }

    // 2. 관리자 권한으로 사용자 생성
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: "leesanghoon@empal.com",
      password: "password123",
      email_confirm: true, // 🔧 이메일 인증 자동 완료
      user_metadata: {
        username: "admin",
        name: "이상훈 (시스템 관리자)",
      },
    });

    if (error) {
      console.error("❌ Error creating user in Supabase Auth:", error);
      return;
    }

    console.log("✅ User created in Supabase Auth:");
    console.log("- Email:", data.user.email);
    console.log("- ID:", data.user.id);
    console.log("- Email confirmed:", data.user.email_confirmed_at !== null);

    // 3. Database의 auth_user_id 업데이트
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        auth_user_id: data.user.id,
        is_email_verified: true,
      })
      .eq("email", "leesanghoon@empal.com");

    if (updateError) {
      console.error("❌ Failed to update database:", updateError);
    } else {
      console.log("✅ Database updated with auth_user_id");
    }

    // 4. 테스트 로그인 시도
    console.log("\n🧪 Testing login...");
    const { data: loginData, error: loginError } = await supabaseAdmin.auth.signInWithPassword({
      email: "leesanghoon@empal.com",
      password: "password123",
    });

    if (loginError) {
      console.error("❌ Login test failed:", loginError);
    } else {
      console.log("✅ Login test successful!");
      console.log("✅ Session created:", loginData.session !== null);
    }

    console.log("\n🎉 Setup complete! You can now login with:");
    console.log("📧 Email: leesanghoon@empal.com");
    console.log("🔑 Password: password123");
  } catch (error) {
    console.error("❌ Script error:", error.message);
  }
}

addUserToAuth();
