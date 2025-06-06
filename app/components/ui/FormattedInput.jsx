// File: components/ui/FormattedInput.jsx
"use client";

import React from "react";
import { Input } from "./Input";
import {
  formatPhoneNumber,
  formatBusinessNumber,
  validatePhoneNumber,
  validateBusinessNumber,
} from "../../utils/formatters";

/**
 * 전화번호 입력 컴포넌트 (자동 포맷팅)
 */
export const PhoneFormattedInput = React.forwardRef(
  (
    {
      value = "",
      onChange,
      onBlur,
      error,
      helpText,
      label = "전화번호",
      placeholder = "전화번호를 입력하세요",
      required = false,
      disabled = false,
      className = "",
      ...props
    },
    ref
  ) => {
    const handleChange = (e) => {
      const formatted = formatPhoneNumber(e.target.value);

      // onChange 이벤트를 포맷팅된 값으로 전달
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: formatted,
        },
      };

      onChange?.(syntheticEvent);
    };

    const handleBlur = (e) => {
      // 유효성 검증
      if (value && !validatePhoneNumber(value)) {
        // 유효하지 않으면 에러를 상위 컴포넌트에 알림
        console.warn("Invalid phone number:", value);
      }

      onBlur?.(e);
    };

    const defaultHelpText = helpText || "입력시 자동으로 하이픈이 추가됩니다";

    return (
      <Input
        ref={ref}
        type="tel"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        error={error}
        helpText={defaultHelpText}
        label={label}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={className}
        autoComplete="tel"
        {...props}
      />
    );
  }
);

PhoneFormattedInput.displayName = "PhoneFormattedInput";

/**
 * 사업자등록번호 입력 컴포넌트 (자동 포맷팅 + 유효성 검사)
 */
export const BusinessNumberInput = React.forwardRef(
  (
    {
      value = "",
      onChange,
      onBlur,
      error,
      helpText,
      label = "사업자등록번호",
      placeholder = "123-45-67890",
      required = false,
      disabled = false,
      className = "",
      showValidation = true,
      ...props
    },
    ref
  ) => {
    const handleChange = (e) => {
      const formatted = formatBusinessNumber(e.target.value);

      // onChange 이벤트를 포맷팅된 값으로 전달
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: formatted,
        },
      };

      onChange?.(syntheticEvent);
    };

    const handleBlur = (e) => {
      // 유효성 검증
      if (value && showValidation && !validateBusinessNumber(value)) {
        console.warn("Invalid business number:", value);
      }

      onBlur?.(e);
    };

    const defaultHelpText = helpText || "10자리 숫자 입력시 자동 포맷팅됩니다";

    return (
      <Input
        ref={ref}
        type="text"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        error={error}
        helpText={defaultHelpText}
        label={label}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={className}
        maxLength={12} // 123-45-67890 (12자)
        {...props}
      />
    );
  }
);

BusinessNumberInput.displayName = "BusinessNumberInput";

/**
 * 실시간 중복체크가 포함된 입력 컴포넌트
 */
export const DuplicateCheckInput = React.forwardRef(
  (
    {
      value = "",
      onChange,
      onBlur,
      error,
      helpText,
      checkType, // 'username', 'email', 'businessNumber'
      userType, // 사업자번호의 경우 필요
      checkFunction, // 중복체크 함수
      label,
      placeholder,
      required = false,
      disabled = false,
      className = "",
      showCheckStatus = true,
      ...props
    },
    ref
  ) => {
    const [checkResult, setCheckResult] = React.useState(null);
    const [isChecking, setIsChecking] = React.useState(false);

    const handleBlur = async (e) => {
      onBlur?.(e);

      // 중복체크 실행
      if (value && value.trim() && checkFunction) {
        setIsChecking(true);
        try {
          const result = await checkFunction(checkType, value, userType);
          setCheckResult(result);
        } catch (error) {
          console.error("Duplicate check error:", error);
          setCheckResult({
            available: false,
            message: "중복 확인 중 오류가 발생했습니다.",
          });
        } finally {
          setIsChecking(false);
        }
      }
    };

    const handleChange = (e) => {
      onChange?.(e);

      // 값이 변경되면 이전 체크 결과 클리어
      if (checkResult) {
        setCheckResult(null);
      }
    };

    // 체크 상태 표시
    const getCheckStatusElement = () => {
      if (!showCheckStatus) return null;

      if (isChecking) {
        return <span className="text-gray-400 text-sm ml-2">확인 중...</span>;
      }

      if (checkResult) {
        return checkResult.available ? (
          <span className="text-green-500 text-sm ml-2">✓ 사용 가능</span>
        ) : (
          <span className="text-red-500 text-sm ml-2">✗ 사용 불가</span>
        );
      }

      return null;
    };

    return (
      <div className="relative">
        <Input
          ref={ref}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          error={error || (checkResult && !checkResult.available ? checkResult.message : null)}
          helpText={helpText}
          label={label}
          placeholder={placeholder}
          required={required}
          disabled={disabled || isChecking}
          className={className}
          {...props}
        />
        {getCheckStatusElement()}
      </div>
    );
  }
);

DuplicateCheckInput.displayName = "DuplicateCheckInput";

/**
 * 전화번호 + 중복체크 컴포넌트 (만약 전화번호도 중복체크가 필요하다면)
 */
export const PhoneWithDuplicateCheck = React.forwardRef(
  ({ checkFunction, userType, ...props }, ref) => {
    return (
      <DuplicateCheckInput
        ref={ref}
        checkType="phone"
        checkFunction={checkFunction}
        userType={userType}
        {...props}
      />
    );
  }
);

PhoneWithDuplicateCheck.displayName = "PhoneWithDuplicateCheck";

/**
 * 사업자번호 + 중복체크 컴포넌트
 */
export const BusinessNumberWithDuplicateCheck = React.forwardRef(
  ({ checkFunction, userType, ...props }, ref) => {
    const handleChange = (e) => {
      const formatted = formatBusinessNumber(e.target.value);
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: formatted,
        },
      };
      props.onChange?.(syntheticEvent);
    };

    return (
      <DuplicateCheckInput
        ref={ref}
        checkType="businessNumber"
        checkFunction={checkFunction}
        userType={userType}
        onChange={handleChange}
        maxLength={12}
        {...props}
      />
    );
  }
);

BusinessNumberWithDuplicateCheck.displayName = "BusinessNumberWithDuplicateCheck";
