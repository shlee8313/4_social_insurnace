// // 📁 app/api/super-admin/users/optimized/route.js (신규 - 성능 최적화 버전)
// import { NextResponse } from "next/server";
// import { verifyToken } from "@/lib/auth";
// import { queryBuilder } from "@/lib/database";

// /**
//  * 🚀 성능 최적화된 SUPER_ADMIN 사용자 관리 API
//  * - 단일 쿼리로 모든 정보 조회 (N+1 문제 해결)
//  * - 엔터티 상태 일괄 처리
//  * - 로딩 속도 대폭 개선
//  */

// // SUPER_ADMIN 권한 체크 함수 (기존과 동일)
// async function checkSuperAdminAuth(request) {
//   try {
//     const authHeader = request.headers.get("authorization");
//     let token = null;

//     if (authHeader && authHeader.startsWith("Bearer ")) {
//       token = authHeader.substring(7);
//     }

//     if (!token) {
//       const cookies = request.headers.get("cookie");
//       if (cookies) {
//         const tokenMatch = cookies.match(/(?:access_token|accessToken)=([^;]+)/);
//         if (tokenMatch) {
//           token = tokenMatch[1];
//         }
//       }
//     }

//     if (!token) {
//       return { success: false, error: "No token provided" };
//     }

//     const decoded = verifyToken(token);
//     if (!decoded) {
//       return { success: false, error: "Invalid token" };
//     }

//     const roles = decoded.roles || [];
//     const hasSuperAdminRole = roles.some((role) => {
//       const roleCode = typeof role === "string" ? role : role.code;
//       return roleCode === "SUPER_ADMIN" || roleCode === "SYSTEM_ADMIN";
//     });

//     if (!hasSuperAdminRole) {
//       return { success: false, error: "Insufficient permissions - SUPER_ADMIN required" };
//     }

//     return { success: true, userId: decoded.userId, username: decoded.username };
//   } catch (error) {
//     return { success: false, error: error.message };
//   }
// }

// // 🚀 최적화된 사용자 목록 조회 (단일 복합 쿼리)
// export async function GET(request) {
//   try {
//     console.log("🚀 OPTIMIZED SUPER_ADMIN API: Getting all users (single query)");

//     const authResult = await checkSuperAdminAuth(request);
//     if (!authResult.success) {
//       return NextResponse.json({ error: authResult.error }, { status: 401 });
//     }

//     // 🚀 단일 복합 쿼리로 모든 정보 한 번에 조회
//     const { data: usersWithAllInfo, error } = await queryBuilder
//       .select(
//         "users",
//         `
//         user_id, username, email, name, phone_number,
//         is_active, is_email_verified, created_at,
//         last_login, login_count, failed_login_attempts,
//         locked_until, verification_attempts, verification_sent_at,

//         -- 역할 정보 (JSON aggregation)
//         user_roles!left (
//           is_active,
//           roles!inner (
//             role_code,
//             role_name,
//             role_category
//           )
//         ),

//         -- 노무사 사무실 소속 정보
//         labor_office_staff!left (
//           labor_office_id,
//           position,
//           employment_status,
//           labor_offices!inner (
//             office_name,
//             office_status
//           )
//         ),

//         -- 회사 부서 배정 정보
//         user_department_assignments!left (
//           assignment_type,
//           is_active,
//           departments!inner (
//             department_name,
//             companies!inner (
//               company_id,
//               company_name,
//               client_status
//             )
//           )
//         ),

//         -- 회사 직접 배정 정보
//         user_company_assignments!left (
//           assignment_type,
//           is_active,
//           companies!inner (
//             company_id,
//             company_name,
//             client_status
//           )
//         )
//       `,
//         { useAdmin: true }
//       )
//       .order("created_at", { ascending: false });

//     if (error) {
//       throw error;
//     }

//     console.log(`📊 Retrieved ${usersWithAllInfo?.length || 0} users with complete info`);

//     // 🚀 데이터 변환 및 엔터티 상태 계산 (메모리에서 처리)
//     const processedUsers = (usersWithAllInfo || []).map((user) => {
//       try {
//         // 📊 역할 정보 정리
//         const activeRoles = (user.user_roles || [])
//           .filter((ur) => ur.is_active)
//           .map((ur) => ({
//             code: ur.roles.role_code,
//             name: ur.roles.role_name,
//             category: ur.roles.role_category,
//           }));

//         // 📊 소속 정보 결정 (우선순위: 노무사 > 회사부서 > 회사직접)
//         let affiliation = {
//           affiliationType: "none",
//           affiliationName: "소속 없음",
//           affiliationId: null,
//           position: null,
//           status: null,
//           details: "시스템 사용자",
//         };

//         // 1. 노무사 사무실 소속 확인
//         const laborStaff = user.labor_office_staff?.find(
//           (los) => los.employment_status === "active"
//         );
//         if (laborStaff) {
//           affiliation = {
//             affiliationType: "labor_office",
//             affiliationName: laborStaff.labor_offices.office_name,
//             affiliationId: laborStaff.labor_office_id,
//             position: laborStaff.position,
//             status: laborStaff.labor_offices.office_status,
//             details: `${laborStaff.labor_offices.office_name} - ${laborStaff.position}`,
//           };
//         }
//         // 2. 회사 부서 배정 확인
//         else {
//           const deptAssignment = user.user_department_assignments?.find((uda) => uda.is_active);
//           if (deptAssignment) {
//             affiliation = {
//               affiliationType: "company",
//               affiliationName: deptAssignment.departments.companies.company_name,
//               affiliationId: deptAssignment.departments.companies.company_id,
//               position: deptAssignment.assignment_type,
//               status: deptAssignment.departments.companies.client_status,
//               details: `${deptAssignment.departments.companies.company_name} - ${deptAssignment.departments.department_name}`,
//             };
//           }
//           // 3. 회사 직접 배정 확인
//           else {
//             const companyAssignment = user.user_company_assignments?.find((uca) => uca.is_active);
//             if (companyAssignment) {
//               affiliation = {
//                 affiliationType: "company",
//                 affiliationName: companyAssignment.companies.company_name,
//                 affiliationId: companyAssignment.companies.company_id,
//                 position: companyAssignment.assignment_type,
//                 status: companyAssignment.companies.client_status,
//                 details: `${companyAssignment.companies.company_name} - ${companyAssignment.assignment_type}`,
//               };
//             }
//           }
//         }

//         // 📊 엔터티 상태 계산 (계층적 상태 고려)
//         let entityStatus = {
//           entityType: "unknown",
//           entityStatus: "inactive",
//           effectiveStatus: "inactive",
//           entityName: "Unknown",
//           roleCategory: "unknown",
//           roleCode: "unknown",
//           statusMessage: "상태 확인 필요",
//         };

//         // SUPER_ADMIN은 시스템 엔터티로 처리
//         if (activeRoles.some((role) => role.code === "SUPER_ADMIN")) {
//           entityStatus = {
//             entityType: "system",
//             entityStatus: "active",
//             effectiveStatus: "active",
//             entityName: "System Administrator",
//             roleCategory: "system",
//             roleCode: "SUPER_ADMIN",
//             statusMessage: "시스템 관리자 권한으로 모든 기능에 접근 가능합니다.",
//           };
//         }
//         // 노무사 사무실 직원
//         else if (affiliation.affiliationType === "labor_office") {
//           const directStatus = user.is_active ? "active" : "inactive";
//           const parentStatus = affiliation.status; // office_status

//           // 계층적 상태: 부모가 비활성이면 자식도 비활성
//           const effectiveStatus = parentStatus === "active" ? directStatus : parentStatus;

//           entityStatus = {
//             entityType: "labor_office",
//             entityStatus: directStatus,
//             effectiveStatus: effectiveStatus,
//             entityName: affiliation.affiliationName,
//             roleCategory: "labor_office",
//             roleCode: activeRoles[0]?.code || "LABOR_STAFF",
//             statusMessage:
//               effectiveStatus === "active"
//                 ? "모든 기능을 이용하실 수 있습니다."
//                 : parentStatus !== "active"
//                 ? "노무사 사무실이 비활성화 상태입니다."
//                 : "계정이 비활성화 상태입니다.",
//           };
//         }
//         // 회사 직원
//         else if (affiliation.affiliationType === "company") {
//           const directStatus = user.is_active ? "active" : "inactive";
//           const parentStatus = affiliation.status; // client_status

//           // 계층적 상태: 부모가 비활성이면 자식도 비활성
//           const effectiveStatus = parentStatus === "active" ? directStatus : parentStatus;

//           entityStatus = {
//             entityType: "company",
//             entityStatus: directStatus,
//             effectiveStatus: effectiveStatus,
//             entityName: affiliation.affiliationName,
//             roleCategory: "company",
//             roleCode: activeRoles[0]?.code || "COMPANY_HR",
//             statusMessage:
//               effectiveStatus === "active"
//                 ? "모든 기능을 이용하실 수 있습니다."
//                 : parentStatus !== "active"
//                 ? "소속 회사가 비활성화 상태입니다."
//                 : "계정이 비활성화 상태입니다.",
//           };
//         }
//         // 소속 없는 사용자
//         else {
//           entityStatus = {
//             entityType: "user",
//             entityStatus: user.is_active ? "active" : "inactive",
//             effectiveStatus: user.is_active ? "active" : "inactive",
//             entityName: user.name,
//             roleCategory: activeRoles[0]?.category || "unknown",
//             roleCode: activeRoles[0]?.code || "unknown",
//             statusMessage: user.is_active
//               ? "기본 기능을 이용하실 수 있습니다."
//               : "계정이 비활성화 상태입니다.",
//           };
//         }

//         // 🔍 디버깅: 야해마트 사용자 로깅
//         if (user.name === "야해마트") {
//           console.log(`🔍 DEBUG 야해마트 처리 결과:`, {
//             userIsActive: user.is_active,
//             affiliationType: affiliation.affiliationType,
//             affiliationStatus: affiliation.status,
//             entityStatus: entityStatus.entityStatus,
//             effectiveStatus: entityStatus.effectiveStatus,
//             roleCategory: entityStatus.roleCategory,
//             activeRoles: activeRoles.map((r) => r.code),
//           });
//         }

//         return {
//           id: user.user_id,
//           username: user.username,
//           email: user.email,
//           name: user.name,
//           phoneNumber: user.phone_number,
//           isActive: user.is_active,
//           isEmailVerified: user.is_email_verified,
//           createdAt: user.created_at,
//           lastLogin: user.last_login,
//           loginCount: user.login_count || 0,
//           failedLoginAttempts: user.failed_login_attempts || 0,
//           lockedUntil: user.locked_until,
//           verificationAttempts: user.verification_attempts || 0,
//           verificationSentAt: user.verification_sent_at,
//           roles: activeRoles,
//           affiliation: affiliation,
//           entityStatus: entityStatus,
//         };
//       } catch (userError) {
//         console.error(`❌ Error processing user ${user.user_id}:`, userError);
//         return {
//           id: user.user_id,
//           username: user.username,
//           email: user.email,
//           name: user.name,
//           phoneNumber: user.phone_number,
//           isActive: user.is_active,
//           isEmailVerified: user.is_email_verified,
//           createdAt: user.created_at,
//           lastLogin: user.last_login,
//           loginCount: user.login_count || 0,
//           failedLoginAttempts: user.failed_login_attempts || 0,
//           lockedUntil: user.locked_until,
//           verificationAttempts: user.verification_attempts || 0,
//           verificationSentAt: user.verification_sent_at,
//           roles: [],
//           affiliation: {
//             affiliationType: "error",
//             affiliationName: "확인 실패",
//             affiliationId: null,
//             position: null,
//             status: null,
//             details: "정보 로딩 실패",
//           },
//           entityStatus: {
//             entityType: "unknown",
//             entityStatus: "inactive",
//             effectiveStatus: "inactive",
//             entityName: "Error",
//             roleCategory: "unknown",
//             roleCode: "unknown",
//             statusMessage: "상태 확인 실패",
//           },
//         };
//       }
//     });

//     console.log(`✅ OPTIMIZED API: Processed ${processedUsers.length} users successfully`);

//     return NextResponse.json({
//       success: true,
//       users: processedUsers,
//       total: processedUsers.length,
//       optimized: true, // 최적화된 API임을 표시
//       executionTime: Date.now(), // 실행 시간 측정용
//     });
//   } catch (error) {
//     console.error("❌ OPTIMIZED SUPER_ADMIN API Error:", error);
//     return NextResponse.json(
//       { error: "Failed to fetch users (optimized)", details: error.message },
//       { status: 500 }
//     );
//   }
// }

// // 🔧 기존 PATCH, DELETE는 동일하게 유지 (필요시 복사)
// export async function DELETE(request) {
//   try {
//     const authResult = await checkSuperAdminAuth(request);
//     if (!authResult.success) {
//       return NextResponse.json({ error: authResult.error }, { status: 401 });
//     }

//     const { userId, confirm } = await request.json();

//     if (!userId || confirm !== "DELETE_USER_PERMANENTLY") {
//       return NextResponse.json({ error: "Missing userId or confirmation string" }, { status: 400 });
//     }

//     const { data: userToDelete } = await queryBuilder
//       .select("users", "user_id, username, email", { useAdmin: true })
//       .eq("user_id", userId)
//       .single();

//     if (!userToDelete) {
//       return NextResponse.json({ error: "User not found" }, { status: 404 });
//     }

//     const { error } = await queryBuilder.delete("users", { useAdmin: true }).eq("user_id", userId);

//     if (error) {
//       throw error;
//     }

//     return NextResponse.json({
//       success: true,
//       message: `User ${userToDelete.username} deleted permanently`,
//       deletedUser: userToDelete,
//     });
//   } catch (error) {
//     console.error("❌ SUPER_ADMIN API Delete Error:", error);
//     return NextResponse.json(
//       { error: "Failed to delete user", details: error.message },
//       { status: 500 }
//     );
//   }
// }
