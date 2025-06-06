// File: components/ui/Input.jsx (Hydration 완전 해결 버전)
"use client";

import React, { forwardRef, useState, useId } from "react";

/**
 * Input 컴포넌트 - 4대보험 관리 시스템용 입력 필드
 * Hydration 에러 해결을 위해 useId() 훅 사용
 */
export const Input = forwardRef(
  (
    {
      label,
      placeholder,
      type = "text",
      error,
      helpText,
      required = false,
      disabled = false,
      readOnly = false,
      size = "md",
      leftIcon,
      rightIcon,
      onRightIconClick,
      className = "",
      id,
      autoComplete,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);

    // Hydration 에러 방지: useId() 사용으로 서버/클라이언트 일관성 보장
    const reactId = useId();
    const inputId = id || reactId;

    const baseInputClasses =
      "block w-full rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1";

    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-3 py-2 text-sm",
      lg: "px-4 py-3 text-base",
    };

    const stateClasses = error
      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
      : "border-gray-300 focus:border-blue-500 focus:ring-blue-500";

    const disabledClasses =
      disabled || readOnly
        ? "bg-gray-50 text-gray-500 cursor-not-allowed"
        : "bg-white text-gray-900";

    const iconPadding = {
      left: leftIcon ? (size === "sm" ? "pl-9" : size === "lg" ? "pl-12" : "pl-10") : "",
      right: rightIcon ? (size === "sm" ? "pr-9" : size === "lg" ? "pr-12" : "pr-10") : "",
    };

    const inputClasses = [
      baseInputClasses,
      sizes[size],
      stateClasses,
      disabledClasses,
      iconPadding.left,
      iconPadding.right,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const actualType = type === "password" && showPassword ? "text" : type;

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };

    const renderPasswordToggle = () => {
      if (type !== "password") return null;

      return (
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
          onClick={togglePasswordVisibility}
          tabIndex={-1}
          aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
        >
          {showPassword ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
              />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          )}
        </button>
      );
    };

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span className="text-gray-400">{leftIcon}</span>
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={actualType}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            required={required}
            className={inputClasses}
            autoComplete={autoComplete}
            {...props}
          />

          {type === "password"
            ? renderPasswordToggle()
            : rightIcon && (
                <div
                  className={`absolute inset-y-0 right-0 flex items-center pr-3 ${
                    onRightIconClick ? "cursor-pointer" : "pointer-events-none"
                  }`}
                  onClick={onRightIconClick}
                >
                  <span className="text-gray-400">{rightIcon}</span>
                </div>
              )}
        </div>

        {error && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {helpText && !error && <p className="mt-1 text-sm text-gray-500">{helpText}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

// 특수 입력 필드 변형들 (동일하게 useId 적용됨)
export const EmailInput = (props) => (
  <Input
    type="email"
    leftIcon={
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
        />
      </svg>
    }
    {...props}
  />
);

export const PasswordInput = (props) => (
  <Input
    type="password"
    leftIcon={
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
    }
    {...props}
  />
);

export const PhoneInput = (props) => (
  <Input
    type="tel"
    leftIcon={
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
        />
      </svg>
    }
    {...props}
  />
);

export const SearchInput = ({ onSearch, ...props }) => (
  <Input
    type="search"
    leftIcon={
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    }
    onKeyPress={(e) => {
      if (e.key === "Enter") {
        onSearch?.(e.target.value);
      }
    }}
    {...props}
  />
);

export default Input;
