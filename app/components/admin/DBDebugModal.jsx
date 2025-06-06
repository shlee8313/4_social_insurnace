// 📁 components/admin/DBDebugModal.jsx (안전성 개선 버전)
"use client";

import React, { useState } from "react";

/**
 * 🔍 DB 상태 디버깅 모달 컴포넌트 (안전성 개선 버전)
 */
export default function DBDebugModal({ isOpen, onClose, debugData, userName }) {
  const [copied, setCopied] = useState(false);
  const [selectedTab, setSelectedTab] = useState("summary");

  if (!isOpen || !debugData) return null;

  // 📋 클립보드 복사 함수 (에러 처리 강화)
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("복사 실패:", error);
      // fallback: 텍스트 선택
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackError) {
        console.error("Fallback 복사도 실패:", fallbackError);
        alert("복사에 실패했습니다. 텍스트를 직접 선택해서 복사해주세요.");
      }
    }
  };

  // 🛡️ 안전한 데이터 접근 헬퍼 함수들
  const safeGet = (obj, path, defaultValue = "정보 없음") => {
    try {
      return path.split(".").reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : defaultValue;
      }, obj);
    } catch (error) {
      console.warn(`Safe get failed for path: ${path}`, error);
      return defaultValue;
    }
  };

  const safeArray = (arr) => {
    return Array.isArray(arr) ? arr : [];
  };

  // 📊 안전한 요약 정보 생성
  const generateSummary = () => {
    try {
      const analysis = debugData?.analysis || {};
      const userBasicInfo = analysis.userBasicInfo || {};
      const roles = safeArray(analysis.roles);
      const affiliations = analysis.affiliations || {};
      const directResult = analysis.directCalculationResult;

      return `
📊 **${userName || "알 수 없는 사용자"} DB 상태 분석 요약**

🔹 **기본 정보**
- User ID: ${safeGet(userBasicInfo, "id", "알 수 없음")}
- Username: ${safeGet(userBasicInfo, "name", "알 수 없음")}
- users.is_active: ${safeGet(userBasicInfo, "isActive", "false")}
- 이메일 인증: ${safeGet(userBasicInfo, "isEmailVerified", "false")}

🔹 **역할 정보**
${
  roles.length > 0
    ? roles
        .filter((role) => role && role.name && role.code) // null/undefined 필터링
        .map((role) => `- ${role.name} (${role.code}): ✅ 활성`)
        .join("\n") || "❌ 유효한 역할 정보 없음"
    : "❌ 활성화된 역할이 없음"
}

🔹 **소속 정보**
${
  affiliations?.laborOffice?.name
    ? `- 노무사: ${affiliations.laborOffice.name} (${
        affiliations.laborOffice.officeStatus || "unknown"
      })`
    : affiliations?.company?.name
    ? `- 회사: ${affiliations.company.name} (${affiliations.company.clientStatus || "unknown"})`
    : "- 소속 정보 없음"
}

🔹 **엔터티 상태 함수 결과**
${
  directResult
    ? `✅ 함수 실행 성공
- Entity Type: ${safeGet(directResult, "entityType", "unknown")}
- Entity Status: ${safeGet(directResult, "entityStatus", "unknown")}
- Effective Status: ${safeGet(directResult, "effectiveStatus", "unknown")}
- Message: ${safeGet(directResult, "message", "메시지 없음")}`
    : "❌ 함수 실행 실패"
}

🔹 **문제 진단**
${diagnoseProblem(analysis)}

⏰ 분석 시간: ${debugData.timestamp || new Date().toISOString()}
      `.trim();
    } catch (error) {
      console.error("generateSummary 에러:", error);
      return `
📊 **DB 상태 분석 요약**

❌ 요약 생성 중 오류가 발생했습니다.
🔧 원본 데이터를 "Raw JSON" 탭에서 확인해주세요.

⚠️ 오류 정보: ${error.message}
⏰ 분석 시간: ${new Date().toISOString()}
      `.trim();
    }
  };

  // 🔧 안전한 문제 진단 함수
  const diagnoseProblem = (analysis) => {
    try {
      const issues = [];
      const userBasicInfo = analysis?.userBasicInfo || {};
      const roles = safeArray(analysis?.roles);
      const directResult = analysis?.directCalculationResult;

      // 기본 상태 체크
      if (!userBasicInfo.isActive) {
        issues.push("❌ users.is_active = false (계정 비활성)");
      } else {
        issues.push("✅ users.is_active = true (계정 활성)");
      }

      // 역할 상태 체크
      if (roles.length === 0) {
        issues.push("❌ 활성화된 역할이 없음");
      } else {
        const validRoles = roles.filter((role) => role && role.name && role.code);
        if (validRoles.length === 0) {
          issues.push("❌ 유효한 역할 정보가 없음");
        } else {
          issues.push(`✅ 활성화된 역할 있음 (${validRoles.length}개)`);
        }
      }

      // 엔터티 함수 결과 체크
      if (directResult) {
        const entityStatus = safeGet(directResult, "entityStatus", "unknown");
        const effectiveStatus = safeGet(directResult, "effectiveStatus", "unknown");

        if (entityStatus === "active" && effectiveStatus === "active") {
          issues.push("✅ 엔터티 상태 함수 정상 작동");
        } else {
          issues.push(`❌ 엔터티 상태: ${entityStatus}, 효과적 상태: ${effectiveStatus}`);
        }
      } else {
        issues.push("❌ 엔터티 상태 함수 실행 실패");
      }

      // 추가 진단: PostgreSQL 함수 권한 문제 감지
      if (!directResult && roles.some((role) => role?.code === "LABOR_ADMIN")) {
        issues.push("🔧 추정 원인: LABOR_ADMIN 역할은 있지만 PostgreSQL 함수 권한 문제");
        issues.push("💡 해결책: API에서 직접 처리로 변경 권장");
      }

      const errorCount = issues.filter((issue) => issue.startsWith("❌")).length;

      if (errorCount === 0) {
        return "✅ 모든 상태가 정상입니다.";
      } else {
        return issues.join("\n");
      }
    } catch (error) {
      console.error("diagnoseProblem 에러:", error);
      return `❌ 문제 진단 중 오류가 발생했습니다: ${error.message}`;
    }
  };

  // 📋 안전한 JSON 데이터 생성
  const generateJSON = () => {
    try {
      return JSON.stringify(debugData, null, 2);
    } catch (error) {
      console.error("JSON 생성 에러:", error);
      return `{
  "error": "JSON 생성 실패",
  "message": "${error.message}",
  "timestamp": "${new Date().toISOString()}"
}`;
    }
  };

  // 🗂️ 탭 데이터
  const tabs = [
    { id: "summary", name: "요약", icon: "📊" },
    { id: "raw", name: "Raw JSON", icon: "📋" },
    { id: "queries", name: "쿼리 결과", icon: "🔍" },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              🔍 DB 상태 분석: {userName || "알 수 없는 사용자"}
            </h3>
            <p className="text-sm text-gray-500 mt-1">실제 데이터베이스 상태를 확인합니다</p>
          </div>
          <div className="flex items-center space-x-2">
            {/* 복사 버튼 */}
            <button
              onClick={() => {
                const content = selectedTab === "summary" ? generateSummary() : generateJSON();
                copyToClipboard(content);
              }}
              className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                copied
                  ? "bg-green-100 text-green-800 border-green-300"
                  : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
              }`}
            >
              {copied ? "✅ 복사됨" : "📋 복사"}
            </button>

            {/* 닫기 버튼 */}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="px-6 pt-4">
          <div className="flex space-x-4 border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`pb-2 px-1 text-sm font-medium transition-colors ${
                  selectedTab === tab.id
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* 콘텐츠 영역 */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedTab === "summary" && (
            <div className="space-y-4">
              {/* 요약 정보 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono select-text">
                  {generateSummary()}
                </pre>
              </div>

              {/* 액션 버튼들 */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => copyToClipboard(generateSummary())}
                  className="px-3 py-2 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors"
                >
                  📋 요약 복사
                </button>
                <button
                  onClick={() => {
                    try {
                      const analysis = debugData?.analysis || {};
                      console.group("🔍 DB Debug Data");
                      console.table(analysis.userBasicInfo || {});
                      console.table(analysis.roles || []);
                      console.table(analysis.affiliations || {});
                      console.table(analysis.directCalculationResult || {});
                      console.groupEnd();
                    } catch (error) {
                      console.error("콘솔 출력 에러:", error);
                    }
                  }}
                  className="px-3 py-2 text-sm bg-purple-100 text-purple-800 rounded-md hover:bg-purple-200 transition-colors"
                >
                  🔍 콘솔에 표시
                </button>
                <button
                  onClick={() => setSelectedTab("raw")}
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors"
                >
                  📋 Raw 데이터 보기
                </button>

                {/* 권한 문제 감지시 추가 버튼 */}
                {!debugData?.analysis?.directCalculationResult &&
                  safeArray(debugData?.analysis?.roles).some(
                    (role) => role?.code === "LABOR_ADMIN"
                  ) && (
                    <button
                      onClick={() => {
                        const guide = `
🔧 **PostgreSQL 함수 권한 문제 해결 가이드**

**현재 상황:**
- 사용자가 LABOR_ADMIN 역할을 가지고 있음
- PostgreSQL 엔터티 상태 함수 실행 실패
- 함수가 SUPER_ADMIN만 허용하도록 설정되어 있음

**해결 방법:**
1. API Route에서 PostgreSQL 함수 호출 제거
2. 직접 DB 업데이트로 변경
3. 권한 체크를 API 레벨에서 처리

**적용 파일:**
app/api/super-admin/users/[userId]/status/route.js
                      `;
                        copyToClipboard(guide);
                      }}
                      className="px-3 py-2 text-sm bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
                    >
                      🚨 권한 문제 해결 가이드 복사
                    </button>
                  )}
              </div>
            </div>
          )}

          {selectedTab === "raw" && (
            <div className="space-y-4">
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-green-400 font-mono select-text">{generateJSON()}</pre>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(generateJSON())}
                  className="px-3 py-2 text-sm bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors"
                >
                  📋 JSON 복사
                </button>
              </div>
            </div>
          )}

          {selectedTab === "queries" && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 mb-3">🔍 쿼리 실행 결과</h4>
              {safeArray(debugData?.rawQueries).map((query, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h5 className="font-medium text-gray-800">
                      {safeGet(query, "query", `쿼리 #${index + 1}`)}
                    </h5>
                    <button
                      onClick={() => {
                        try {
                          const result = JSON.stringify(query?.result || {}, null, 2);
                          copyToClipboard(result);
                        } catch (error) {
                          copyToClipboard(`쿼리 결과 복사 실패: ${error.message}`);
                        }
                      }}
                      className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
                    >
                      복사
                    </button>
                  </div>

                  {query?.error ? (
                    <div className="bg-red-50 border border-red-200 rounded p-3">
                      <p className="text-red-800 text-sm">❌ {query.error}</p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded p-3 overflow-x-auto">
                      <pre className="text-sm text-gray-800 select-text">
                        {JSON.stringify(query?.result || {}, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}

              {safeArray(debugData?.rawQueries).length === 0 && (
                <div className="text-center text-gray-500 py-8">📋 쿼리 결과가 없습니다.</div>
              )}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            💡 Tip: 모든 텍스트는 마우스로 선택하여 복사할 수 있습니다
          </p>
        </div>
      </div>
    </div>
  );
}
