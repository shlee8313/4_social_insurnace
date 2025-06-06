// File: components/ui/Button.jsx
"use client";
import React from "react";
import { LoadingSpinner } from "./LoadingSpinner";

/**
 * Button 컴포넌트 - 4대보험 관리 시스템용 버튼
 * @param {Object} props - 버튼 속성
 * @param {string} props.variant - 버튼 스타일 ('primary', 'secondary', 'danger', 'ghost')
 * @param {string} props.size - 버튼 크기 ('sm', 'md', 'lg')
 * @param {boolean} props.loading - 로딩 상태
 * @param {boolean} props.disabled - 비활성화 상태
 * @param {boolean} props.fullWidth - 전체 너비 사용
 * @param {string} props.type - 버튼 타입 ('button', 'submit', 'reset')
 * @param {Function} props.onClick - 클릭 이벤트 핸들러
 * @param {React.ReactNode} props.children - 버튼 내용
 * @param {React.ReactNode} props.icon - 아이콘 (선택사항)
 * @param {string} props.className - 추가 CSS 클래스
 */
export const Button = ({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = false,
  type = "button",
  onClick,
  children,
  icon,
  className = "",
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95";

  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-sm focus:ring-blue-500",
    secondary:
      "bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300 focus:ring-gray-500",
    danger: "bg-red-600 hover:bg-red-700 text-white shadow-sm focus:ring-red-500",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-500",
    success: "bg-green-600 hover:bg-green-700 text-white shadow-sm focus:ring-green-500",
    warning: "bg-yellow-600 hover:bg-yellow-700 text-white shadow-sm focus:ring-yellow-500",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2.5",
  };

  const disabledClasses = "opacity-50 cursor-not-allowed hover:transform-none";
  const fullWidthClass = fullWidth ? "w-full" : "";

  const buttonClasses = [
    baseClasses,
    variants[variant],
    sizes[size],
    fullWidthClass,
    (disabled || loading) && disabledClasses,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const handleClick = (e) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={handleClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <LoadingSpinner size="sm" />}
      {icon && !loading && <span className="inline-flex">{icon}</span>}
      {children && <span>{children}</span>}
    </button>
  );
};

// 특수 버튼 변형들
export const PrimaryButton = (props) => <Button variant="primary" {...props} />;
export const SecondaryButton = (props) => <Button variant="secondary" {...props} />;
export const DangerButton = (props) => <Button variant="danger" {...props} />;
export const GhostButton = (props) => <Button variant="ghost" {...props} />;
export const SuccessButton = (props) => <Button variant="success" {...props} />;
export const WarningButton = (props) => <Button variant="warning" {...props} />;

// 아이콘 버튼
export const IconButton = ({ icon, "aria-label": ariaLabel, ...props }) => (
  <Button className="!p-2 aspect-square" aria-label={ariaLabel} {...props}>
    {icon}
  </Button>
);

export default Button;
