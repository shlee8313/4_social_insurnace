// File: app/super-admin/profile/page.jsx
"use client";

import React, { useState } from "react";
import { useAuth } from "../../store/authStore";
import { createAuthenticatedRequest } from "../../store/authStore";
import { PasswordInput } from "../../components/ui/Input"; // Input 컴포넌트 import
/**
 * SUPER_ADMIN 프로필 관리 페이지
 */
export default function SuperAdminProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">계정 설정</h1>
        <p className="text-gray-600 mt-2">SUPER_ADMIN 계정 정보 및 보안 설정을 관리합니다.</p>
      </div>

      {/* 탭 메뉴 */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("profile")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "profile"
                ? "border-red-500 text-red-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            👤 프로필 정보
          </button>
          <button
            onClick={() => setActiveTab("password")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "password"
                ? "border-red-500 text-red-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            🔒 비밀번호 변경
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "security"
                ? "border-red-500 text-red-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            🛡️ 보안 설정
          </button>
        </nav>
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === "profile" && <ProfileTab user={user} />}
      {activeTab === "password" && <PasswordChangeTab />}
      {activeTab === "security" && <SecurityTab user={user} />}
    </div>
  );
}

/**
 * 프로필 정보 탭
 */
function ProfileTab({ user }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    username: user?.username || "",
  });

  const handleSave = async () => {
    // TODO: 프로필 업데이트 API 호출
    console.log("Profile update:", formData);
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">프로필 정보</h2>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          {isEditing ? "취소" : "편집"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">이름</label>
          {isEditing ? (
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <div className="px-3 py-2 bg-gray-50 rounded-md text-gray-900">{user?.name}</div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">사용자명</label>
          {isEditing ? (
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <div className="px-3 py-2 bg-gray-50 rounded-md text-gray-900">{user?.username}</div>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
          <div className="px-3 py-2 bg-gray-50 rounded-md text-gray-900">
            {user?.email}
            <span className="ml-2 text-xs text-gray-500">(변경 불가)</span>
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">역할</label>
          <div className="flex flex-wrap gap-2">
            {user?.roles?.map((role) => (
              <span
                key={role.code}
                className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium"
              >
                {role.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            저장
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * 비밀번호 변경 탭
 */
function PasswordChangeTab() {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = "현재 비밀번호를 입력해주세요.";
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "새 비밀번호를 입력해주세요.";
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = "새 비밀번호는 최소 8자 이상이어야 합니다.";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "비밀번호 확인을 입력해주세요.";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "새 비밀번호와 확인 비밀번호가 일치하지 않습니다.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const authRequest = createAuthenticatedRequest();
      const response = await authRequest("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: "비밀번호가 성공적으로 변경되었습니다.",
        });
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        setMessage({
          type: "error",
          text: data.message || "비밀번호 변경에 실패했습니다.",
        });
      }
    } catch (error) {
      console.error("Password change error:", error);
      setMessage({
        type: "error",
        text: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: "", color: "" };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) return { strength, label: "약함", color: "bg-red-500" };
    if (strength <= 3) return { strength, label: "보통", color: "bg-yellow-500" };
    if (strength <= 4) return { strength, label: "강함", color: "bg-green-500" };
    return { strength, label: "매우 강함", color: "bg-green-600" };
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">비밀번호 변경</h2>
        <p className="text-sm text-gray-600 mt-1">
          보안을 위해 정기적으로 비밀번호를 변경해주세요.
        </p>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 현재 비밀번호 - 눈 아이콘 포함 */}
        <PasswordInput
          label="현재 비밀번호"
          placeholder="현재 비밀번호를 입력하세요"
          value={formData.currentPassword}
          onChange={(e) => {
            setFormData({ ...formData, currentPassword: e.target.value });
            if (errors.currentPassword) {
              setErrors({ ...errors, currentPassword: null });
            }
          }}
          error={errors.currentPassword}
          disabled={isLoading}
          required
        />

        {/* 새 비밀번호 - 눈 아이콘 포함 */}
        <div>
          <PasswordInput
            label="새 비밀번호"
            placeholder="새 비밀번호를 입력하세요"
            value={formData.newPassword}
            onChange={(e) => {
              setFormData({ ...formData, newPassword: e.target.value });
              if (errors.newPassword) {
                setErrors({ ...errors, newPassword: null });
              }
            }}
            error={errors.newPassword}
            disabled={isLoading}
            required
          />

          {/* 비밀번호 강도 표시 */}
          {formData.newPassword && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>비밀번호 강도</span>
                <span
                  className={passwordStrength.strength >= 3 ? "text-green-600" : "text-red-600"}
                >
                  {passwordStrength.label}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                  style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* 새 비밀번호 확인 - 눈 아이콘 포함 */}
        <PasswordInput
          label="새 비밀번호 확인"
          placeholder="새 비밀번호를 다시 입력하세요"
          value={formData.confirmPassword}
          onChange={(e) => {
            setFormData({ ...formData, confirmPassword: e.target.value });
            if (errors.confirmPassword) {
              setErrors({ ...errors, confirmPassword: null });
            }
          }}
          error={errors.confirmPassword}
          disabled={isLoading}
          required
        />

        <div className="border-t border-gray-200 pt-6">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "변경 중..." : "비밀번호 변경"}
          </button>
        </div>
      </form>

      {/* 비밀번호 보안 가이드 */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-medium text-blue-800 mb-2">🛡️ 강력한 비밀번호 만들기</h3>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• 최소 8자 이상 사용</li>
          <li>• 대문자와 소문자 조합</li>
          <li>• 숫자 포함</li>
          <li>• 특수문자 포함 (!@#$%^&* 등)</li>
          <li>• 개인정보나 일반적인 단어 사용 금지</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * 보안 설정 탭
 */
function SecurityTab({ user }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">보안 설정</h2>
        <p className="text-sm text-gray-600 mt-1">계정 보안을 강화하기 위한 추가 설정들입니다.</p>
      </div>

      <div className="space-y-6">
        {/* 이중 인증 */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">이중 인증 (2FA)</h3>
              <p className="text-xs text-gray-600 mt-1">SMS 또는 인증앱을 통한 추가 보안 인증</p>
            </div>
            <button className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
              설정
            </button>
          </div>
        </div>

        {/* 로그인 알림 */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">로그인 알림</h3>
              <p className="text-xs text-gray-600 mt-1">새로운 기기에서 로그인 시 이메일 알림</p>
            </div>
            <button className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-md">
              활성화됨
            </button>
          </div>
        </div>

        {/* 세션 관리 */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">활성 세션</h3>
              <p className="text-xs text-gray-600 mt-1">현재 로그인된 기기들을 관리합니다</p>
            </div>
            <button className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
              관리
            </button>
          </div>
        </div>

        {/* 계정 잠금 */}
        <div className="border border-red-200 rounded-lg p-4 bg-red-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-red-900">계정 비활성화</h3>
              <p className="text-xs text-red-700 mt-1">⚠️ 위험: 계정을 임시로 비활성화합니다</p>
            </div>
            <button className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
              비활성화
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
