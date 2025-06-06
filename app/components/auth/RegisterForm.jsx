// File: components/auth/RegisterForm.jsx (실시간 중복체크 + 포맷팅 버전)
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "../ui/Button";
import { Input, EmailInput, PasswordInput, PhoneInput } from "../ui/Input";
import { useAuth } from "../../store/authStore";
import { PublicOnlyGuard } from "./AuthGuard";
import {
  formatPhoneNumber,
  formatBusinessNumber,
  validateBusinessNumber,
  validatePhoneNumber,
  createPhoneFormatter,
  createBusinessNumberFormatter,
} from "../../utils/formatters";

/**
 * 개선된 회원가입 폼 컴포넌트
 * - 실시간 중복체크 (onBlur)
 * - 전화번호/사업자번호 자동 포맷팅
 * - 향상된 UX/UI
 */
export const RegisterForm = ({
  userType = "labor_office", // 'labor_office' 또는 'company'
  className = "",
}) => {
  const router = useRouter();
  const {
    register,
    isLoading,
    error,
    clearError,
    isAuthenticated,
    isInitialized,
    getDefaultDashboard,
    waitForInitialization,
  } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // 개인정보
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    phoneNumber: "",

    // 조직정보
    organizationData: {
      officeName: "", // 노무사 사무실명 또는 회사명
      companyName: "",
      businessNumber: "",
      representative: "",
      address: "",
      phone: "",
      // 노무사 사무실 전용
      licenseNumber: "",
      // 회사 전용
      industry: "",
      employeeCount: "",
    },

    // 약관 동의
    agreements: {
      terms: false,
      privacy: false,
      marketing: false,
    },
  });

  const [formErrors, setFormErrors] = useState({});
  const [checkResults, setCheckResults] = useState({
    username: null,
    email: null,
    businessNumber: null,
  });
  const [checkingStatus, setCheckingStatus] = useState({
    username: false,
    email: false,
    businessNumber: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🔧 초기화 완료 후 인증 상태 확인
  useEffect(() => {
    const checkAuthStatus = async () => {
      await waitForInitialization();
      if (isAuthenticated) {
        const destination = getDefaultDashboard();
        console.log("🔄 Already authenticated, redirecting to:", destination);
        router.push(destination);
      }
    };
    checkAuthStatus();
  }, [isAuthenticated, isInitialized, router, getDefaultDashboard, waitForInitialization]);

  // 에러 메시지 자동 클리어
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // 🔧 중복 확인 함수 (디바운싱 적용)
  const checkDuplicate = useCallback(
    async (type, value) => {
      if (!value || !value.trim()) {
        setCheckResults((prev) => ({
          ...prev,
          [type]: null,
        }));
        return;
      }

      // 최소 길이 체크
      if (type === "username" && value.length < 5) return;
      if (type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return;
      if (type === "businessNumber" && value.replace(/[^\d]/g, "").length !== 10) return;

      setCheckingStatus((prev) => ({ ...prev, [type]: true }));

      try {
        const response = await fetch(
          `/api/auth/register?check=${type}&value=${encodeURIComponent(value)}&userType=${userType}`
        );
        const data = await response.json();

        setCheckResults((prev) => ({
          ...prev,
          [type]: {
            available: data.available,
            message: data.message,
            checked: true,
          },
        }));
      } catch (error) {
        console.error(`${type} 중복 확인 오류:`, error);
        setCheckResults((prev) => ({
          ...prev,
          [type]: {
            available: false,
            message: "중복 확인 중 오류가 발생했습니다.",
            checked: false,
          },
        }));
      } finally {
        setCheckingStatus((prev) => ({ ...prev, [type]: false }));
      }
    },
    [userType]
  );

  // 🔧 포맷팅된 입력 핸들러들
  const handlePhoneChange = createPhoneFormatter((e) => {
    setFormData((prev) => ({
      ...prev,
      phoneNumber: e.target.value,
    }));

    // 에러 클리어
    if (formErrors.phoneNumber) {
      setFormErrors((prev) => ({ ...prev, phoneNumber: null }));
    }
  });

  const handleOrgPhoneChange = createPhoneFormatter((e) => {
    setFormData((prev) => ({
      ...prev,
      organizationData: {
        ...prev.organizationData,
        phone: e.target.value,
      },
    }));

    // 에러 클리어
    if (formErrors["organizationData.phone"]) {
      setFormErrors((prev) => ({ ...prev, ["organizationData.phone"]: null }));
    }
  });

  const handleBusinessNumberChange = createBusinessNumberFormatter((e) => {
    setFormData((prev) => ({
      ...prev,
      organizationData: {
        ...prev.organizationData,
        businessNumber: e.target.value,
      },
    }));

    // 에러 클리어
    if (formErrors["organizationData.businessNumber"]) {
      setFormErrors((prev) => ({ ...prev, ["organizationData.businessNumber"]: null }));
    }

    // 중복체크 결과 클리어
    if (checkResults.businessNumber) {
      setCheckResults((prev) => ({ ...prev, businessNumber: null }));
    }
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith("organizationData.")) {
      const field = name.replace("organizationData.", "");
      setFormData((prev) => ({
        ...prev,
        organizationData: {
          ...prev.organizationData,
          [field]: value,
        },
      }));
    } else if (name.startsWith("agreements.")) {
      const field = name.replace("agreements.", "");
      setFormData((prev) => ({
        ...prev,
        agreements: {
          ...prev.agreements,
          [field]: checked,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }

    // 입력시 해당 필드 에러 클리어
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }

    // 중복체크 결과 클리어 (값이 변경되면)
    if (["username", "email"].includes(name) && checkResults[name]) {
      setCheckResults((prev) => ({
        ...prev,
        [name]: null,
      }));
    }

    // 전역 에러도 클리어
    if (error) {
      clearError();
    }
  };

  // 🔧 onBlur 핸들러들 (중복체크 트리거)
  const handleUsernameBlur = () => {
    checkDuplicate("username", formData.username);
  };

  const handleEmailBlur = () => {
    checkDuplicate("email", formData.email);
  };

  const handleBusinessNumberBlur = () => {
    const businessNumber = formData.organizationData.businessNumber;
    if (businessNumber && !validateBusinessNumber(businessNumber)) {
      setFormErrors((prev) => ({
        ...prev,
        ["organizationData.businessNumber"]: "올바르지 않은 사업자등록번호입니다.",
      }));
    } else {
      checkDuplicate("businessNumber", businessNumber);
    }
  };

  const handleConfirmPasswordBlur = () => {
    if (
      formData.password &&
      formData.confirmPassword &&
      formData.password !== formData.confirmPassword
    ) {
      setFormErrors((prev) => ({
        ...prev,
        confirmPassword: "비밀번호가 일치하지 않습니다.",
      }));
    } else if (formErrors.confirmPassword) {
      // 일치하면 에러 메시지 제거
      setFormErrors((prev) => ({ ...prev, confirmPassword: null }));
    }
  };

  // 🔧 1단계 검증 (개인정보)
  const validateStep1 = () => {
    const errors = {};

    if (!formData.username.trim()) {
      errors.username = "사용자명을 입력해주세요.";
    } else if (formData.username.length < 5) {
      errors.username = "사용자명은 5자 이상이어야 합니다.";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      errors.username = "사용자명은 영문, 숫자, 언더스코어만 사용할 수 있습니다.";
    } else if (checkResults.username && !checkResults.username.available) {
      errors.username = "이미 사용 중인 사용자명입니다.";
    }

    if (!formData.email.trim()) {
      errors.email = "이메일을 입력해주세요.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "올바른 이메일 형식을 입력해주세요.";
    } else if (checkResults.email && !checkResults.email.available) {
      errors.email = "이미 사용 중인 이메일입니다.";
    }

    if (!formData.password.trim()) {
      errors.password = "비밀번호를 입력해주세요.";
    } else if (formData.password.length < 8) {
      errors.password = "비밀번호는 8자 이상이어야 합니다.";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = "비밀번호는 대문자, 소문자, 숫자를 각각 1개 이상 포함해야 합니다.";
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "비밀번호와 비밀번호 확인이 일치하지 않습니다.";
    }

    if (!formData.name.trim()) {
      errors.name = "이름을 입력해주세요.";
    } else if (formData.name.length < 2) {
      errors.name = "이름은 2자 이상이어야 합니다.";
    }

    if (formData.phoneNumber && !validatePhoneNumber(formData.phoneNumber)) {
      errors.phoneNumber = "올바른 전화번호 형식을 입력해주세요.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 🔧 2단계 검증 (조직정보)
  const validateStep2 = () => {
    const errors = {};
    const { organizationData } = formData;

    if (userType === "labor_office") {
      if (!organizationData.officeName.trim()) {
        errors["organizationData.officeName"] = "노무사 사무실명을 입력해주세요.";
      }
      if (!organizationData.licenseNumber.trim()) {
        errors["organizationData.licenseNumber"] = "노무사 자격번호를 입력해주세요.";
      }
    } else if (userType === "company") {
      if (!organizationData.companyName.trim()) {
        errors["organizationData.companyName"] = "회사명을 입력해주세요.";
      }
      if (!organizationData.industry.trim()) {
        errors["organizationData.industry"] = "업종을 입력해주세요.";
      }
    }

    if (!organizationData.businessNumber.trim()) {
      errors["organizationData.businessNumber"] = "사업자등록번호를 입력해주세요.";
    } else if (!validateBusinessNumber(organizationData.businessNumber)) {
      errors["organizationData.businessNumber"] = "올바르지 않은 사업자등록번호입니다.";
    } else if (checkResults.businessNumber && !checkResults.businessNumber.available) {
      errors["organizationData.businessNumber"] = "이미 등록된 사업자등록번호입니다.";
    }

    if (!organizationData.representative.trim()) {
      errors["organizationData.representative"] = "대표자명을 입력해주세요.";
    }

    if (!organizationData.address.trim()) {
      errors["organizationData.address"] = "주소를 입력해주세요.";
    }

    if (organizationData.phone && !validatePhoneNumber(organizationData.phone)) {
      errors["organizationData.phone"] = "올바른 전화번호 형식을 입력해주세요.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 3단계 검증 (약관 동의)
  const validateStep3 = () => {
    const errors = {};

    if (!formData.agreements.terms) {
      errors["agreements.terms"] = "서비스 이용약관에 동의해주세요.";
    }

    if (!formData.agreements.privacy) {
      errors["agreements.privacy"] = "개인정보 처리방침에 동의해주세요.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    let isValid = false;

    switch (currentStep) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
        isValid = validateStep3();
        break;
    }

    if (isValid) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep3() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const registrationData = {
        ...formData,
        userType,
        organizationData: {
          ...formData.organizationData,
          [userType === "labor_office" ? "officeName" : "companyName"]:
            formData.organizationData[userType === "labor_office" ? "officeName" : "companyName"],
        },
      };

      const result = await register(registrationData);

      if (result.success) {
        console.log(`✅ ${userType} registration completed:`, result.data);
        router.push("/login?message=registration_success");
      } else {
        console.error("❌ Registration failed:", result.error);
      }
    } catch (error) {
      console.error("❌ Registration error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🔧 중복체크 상태 표시 함수
  const getCheckStatusIcon = (type) => {
    if (checkingStatus[type]) {
      return <span className="text-gray-400 text-sm ml-2">확인 중...</span>;
    }

    if (checkResults[type]?.checked) {
      return checkResults[type].available ? (
        <span className="text-green-500 text-sm ml-2">✓ 사용 가능</span>
      ) : (
        <span className="text-red-500 text-sm ml-2">✗ 사용 불가</span>
      );
    }

    return null;
  };

  // 🚨 초기화되지 않았으면 로딩 표시
  if (!isInitialized) {
    return (
      <div className={`w-full max-w-2xl mx-auto ${className}`}>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-6"></div>
            <div className="space-y-4">
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 🔧 1단계 렌더링 (개선된 중복체크 UI)
  const renderStep1 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">개인정보 입력</h3>

      {/* 브라우저 자동완성 방지용 더미 필드 */}
      <div style={{ position: "absolute", left: "-9999px", opacity: 0, pointerEvents: "none" }}>
        <input type="text" name="fake_username" autoComplete="username" tabIndex="-1" />
        <input type="email" name="fake_email" autoComplete="email" tabIndex="-1" />
        <input type="password" name="fake_password" autoComplete="current-password" tabIndex="-1" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Input
            name="username"
            label="사용자명"
            placeholder="사용자명 (5자 이상)"
            value={formData.username}
            onChange={handleInputChange}
            onBlur={handleUsernameBlur}
            error={formErrors.username}
            autoComplete="off"
            disabled={isLoading || isSubmitting}
            required
          />
          {getCheckStatusIcon("username")}
        </div>

        <Input
          name="name"
          label="이름"
          placeholder="실명"
          value={formData.name}
          onChange={handleInputChange}
          error={formErrors.name}
          autoComplete="off"
          disabled={isLoading || isSubmitting}
          required
        />
      </div>

      <div>
        <EmailInput
          name="email"
          label="이메일"
          placeholder="이메일 주소"
          value={formData.email}
          onChange={handleInputChange}
          onBlur={handleEmailBlur}
          error={formErrors.email}
          autoComplete="email"
          disabled={isLoading || isSubmitting}
          required
        />
        {getCheckStatusIcon("email")}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PasswordInput
          name="password"
          label="비밀번호"
          placeholder="비밀번호 (8자 이상)"
          value={formData.password}
          onChange={handleInputChange}
          error={formErrors.password}
          helpText="대문자, 소문자, 숫자 각각 1개 이상 포함"
          autoComplete="new-password"
          disabled={isLoading || isSubmitting}
          required
        />

        <PasswordInput
          name="confirmPassword"
          label="비밀번호 확인"
          placeholder="비밀번호 재입력"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          onBlur={handleConfirmPasswordBlur} // 여기를 추가합니다
          error={formErrors.confirmPassword}
          autoComplete="new-password"
          disabled={isLoading || isSubmitting}
          required
        />
      </div>

      <Input
        name="phoneNumber"
        label="전화번호"
        placeholder="전화번호 (선택사항)"
        value={formData.phoneNumber}
        onChange={handlePhoneChange}
        error={formErrors.phoneNumber}
        autoComplete="tel"
        disabled={isLoading || isSubmitting}
        helpText="입력시 자동으로 하이픈이 추가됩니다"
      />
    </div>
  );

  // 🔧 2단계 렌더링 (사업자번호 중복체크 + 포맷팅)
  const renderStep2 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {userType === "labor_office" ? "노무사 사무실 정보" : "회사 정보"}
      </h3>

      {userType === "labor_office" ? (
        <>
          <Input
            name="organizationData.officeName"
            label="노무사 사무실명"
            placeholder="노무사 사무실명"
            value={formData.organizationData.officeName}
            onChange={handleInputChange}
            error={formErrors["organizationData.officeName"]}
            disabled={isLoading || isSubmitting}
            required
          />

          <Input
            name="organizationData.licenseNumber"
            label="노무사 자격번호"
            placeholder="노무사 자격번호"
            value={formData.organizationData.licenseNumber}
            onChange={handleInputChange}
            error={formErrors["organizationData.licenseNumber"]}
            disabled={isLoading || isSubmitting}
            required
          />
        </>
      ) : (
        <>
          <Input
            name="organizationData.companyName"
            label="회사명"
            placeholder="회사명"
            value={formData.organizationData.companyName}
            onChange={handleInputChange}
            error={formErrors["organizationData.companyName"]}
            disabled={isLoading || isSubmitting}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              name="organizationData.industry"
              label="업종"
              placeholder="업종"
              value={formData.organizationData.industry}
              onChange={handleInputChange}
              error={formErrors["organizationData.industry"]}
              disabled={isLoading || isSubmitting}
              required
            />

            <Input
              name="organizationData.employeeCount"
              label="직원 수"
              placeholder="직원 수 (선택사항)"
              type="number"
              value={formData.organizationData.employeeCount}
              onChange={handleInputChange}
              error={formErrors["organizationData.employeeCount"]}
              disabled={isLoading || isSubmitting}
            />
          </div>
        </>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Input
            name="organizationData.businessNumber"
            label="사업자등록번호"
            placeholder="123-45-67890"
            value={formData.organizationData.businessNumber}
            onChange={handleBusinessNumberChange}
            onBlur={handleBusinessNumberBlur}
            error={formErrors["organizationData.businessNumber"]}
            disabled={isLoading || isSubmitting}
            helpText="10자리 숫자 입력시 자동 포맷팅됩니다"
            required
          />
          {getCheckStatusIcon("businessNumber")}
        </div>

        <Input
          name="organizationData.representative"
          label="대표자명"
          placeholder="대표자명"
          value={formData.organizationData.representative}
          onChange={handleInputChange}
          error={formErrors["organizationData.representative"]}
          disabled={isLoading || isSubmitting}
          required
        />
      </div>

      <Input
        name="organizationData.address"
        label="주소"
        placeholder="주소"
        value={formData.organizationData.address}
        onChange={handleInputChange}
        error={formErrors["organizationData.address"]}
        disabled={isLoading || isSubmitting}
        required
      />

      <Input
        name="organizationData.phone"
        label="대표 전화번호"
        placeholder="대표 전화번호 (선택사항)"
        value={formData.organizationData.phone}
        onChange={handleOrgPhoneChange}
        error={formErrors["organizationData.phone"]}
        disabled={isLoading || isSubmitting}
        helpText="입력시 자동으로 하이픈이 추가됩니다"
      />
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">약관 동의</h3>

      <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            name="agreements.terms"
            checked={formData.agreements.terms}
            onChange={handleInputChange}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
            disabled={isLoading || isSubmitting}
          />
          <div className="flex-1 select-none">
            <span className="text-sm font-medium text-gray-900">
              서비스 이용약관 동의 <span className="text-red-500">*</span>
            </span>
            <Link href="/terms" className="text-primary-600 hover:text-primary-500 ml-2 text-sm">
              전문 보기
            </Link>
          </div>
        </label>
        {formErrors["agreements.terms"] && (
          <p className="text-sm text-red-600 ml-7">{formErrors["agreements.terms"]}</p>
        )}

        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            name="agreements.privacy"
            checked={formData.agreements.privacy}
            onChange={handleInputChange}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
            disabled={isLoading || isSubmitting}
          />
          <div className="flex-1 select-none">
            <span className="text-sm font-medium text-gray-900">
              개인정보 처리방침 동의 <span className="text-red-500">*</span>
            </span>
            <Link href="/privacy" className="text-primary-600 hover:text-primary-500 ml-2 text-sm">
              전문 보기
            </Link>
          </div>
        </label>
        {formErrors["agreements.privacy"] && (
          <p className="text-sm text-red-600 ml-7">{formErrors["agreements.privacy"]}</p>
        )}

        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            name="agreements.marketing"
            checked={formData.agreements.marketing}
            onChange={handleInputChange}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
            disabled={isLoading || isSubmitting}
          />
          <div className="flex-1 select-none">
            <span className="text-sm font-medium text-gray-900">마케팅 정보 수신 동의 (선택)</span>
            <p className="text-xs text-gray-500 mt-1">
              서비스 개선사항, 이벤트 정보 등을 이메일로 받아보실 수 있습니다.
            </p>
          </div>
        </label>
      </div>

      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
        <h4 className="font-medium text-primary-900 mb-2">회원가입 완료 후</h4>
        <ul className="text-sm text-primary-800 space-y-1">
          <li>• 이메일 인증이 필요합니다.</li>
          <li>• 관리자 승인 후 서비스를 이용하실 수 있습니다.</li>
          <li>• 승인까지 1-2 영업일이 소요될 수 있습니다.</li>
        </ul>
      </div>
    </div>
  );

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* 헤더 */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {userType === "labor_office" ? "노무사 사무실 가입" : "회사 가입"}
          </h2>
          <p className="text-gray-600">4대보험 통합 관리 시스템</p>
        </div>

        {/* 진행 단계 */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((step) => (
            <React.Fragment key={step}>
              <div
                className={`
                flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors
                ${currentStep >= step ? "bg-primary-600 text-white" : "bg-gray-200 text-gray-600"}
              `}
              >
                {step}
              </div>
              {step < 3 && (
                <div
                  className={`
                  w-12 h-1 mx-2 transition-colors
                  ${currentStep > step ? "bg-primary-600" : "bg-gray-200"}
                `}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg animate-slide-down">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-red-400 mt-0.5 mr-2 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* 폼 내용 */}
        <form onSubmit={handleSubmit}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          {/* 버튼 */}
          <div className="flex justify-between mt-8">
            <Button
              type="button"
              variant="secondary"
              onClick={handlePrevStep}
              disabled={currentStep === 1 || isLoading || isSubmitting}
            >
              이전
            </Button>

            {currentStep < 3 ? (
              <Button type="button" onClick={handleNextStep} disabled={isLoading || isSubmitting}>
                다음
              </Button>
            ) : (
              <Button
                type="submit"
                loading={isLoading || isSubmitting}
                disabled={isLoading || isSubmitting}
              >
                {isSubmitting ? "가입 중..." : "회원가입 완료"}
              </Button>
            )}
          </div>
        </form>

        {/* 로그인 링크 */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            이미 계정이 있으신가요?{" "}
            <Link
              href="/login"
              className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
            >
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * 래핑된 회원가입 폼 (AuthGuard 포함)
 */
export default function WrappedRegisterForm(props) {
  return (
    <PublicOnlyGuard>
      <RegisterForm {...props} />
    </PublicOnlyGuard>
  );
}
