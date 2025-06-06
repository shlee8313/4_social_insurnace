// File: components/ui/LoadingSpinner.jsx
"use client";
import React from "react";

/**
 * LoadingSpinner 컴포넌트 - 4대보험 관리 시스템용 로딩 스피너
 * @param {Object} props - 스피너 속성
 * @param {string} props.size - 스피너 크기 ('xs', 'sm', 'md', 'lg', 'xl')
 * @param {string} props.color - 스피너 색상 ('blue', 'green', 'red', 'yellow', 'purple', 'gray', 'white')
 * @param {string} props.variant - 스피너 스타일 ('spinner', 'dots', 'pulse', 'bars')
 * @param {string} props.text - 로딩 텍스트 (선택사항)
 * @param {boolean} props.overlay - 오버레이 모드 여부
 * @param {string} props.className - 추가 CSS 클래스
 */
export const LoadingSpinner = ({
  size = "md",
  color = "blue",
  variant = "spinner",
  text,
  overlay = false,
  className = "",
  ...props
}) => {
  const sizes = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  const colors = {
    blue: "text-blue-600",
    green: "text-green-600",
    red: "text-red-600",
    yellow: "text-yellow-600",
    purple: "text-purple-600",
    gray: "text-gray-600",
    white: "text-white",
  };

  const textSizes = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
  };

  // 기본 스피너 (회전하는 원)
  const SpinnerIcon = () => (
    <svg
      className={`animate-spin ${sizes[size]} ${colors[color]} ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      {...props}
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  // 점 3개 스피너
  const DotsSpinner = () => (
    <div className={`flex space-x-1 ${className}`} {...props}>
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={`
            ${
              size === "xs"
                ? "w-1 h-1"
                : size === "sm"
                ? "w-1.5 h-1.5"
                : size === "md"
                ? "w-2 h-2"
                : size === "lg"
                ? "w-2.5 h-2.5"
                : "w-3 h-3"
            }
            ${colors[color].replace("text-", "bg-")}
            rounded-full animate-pulse
          `}
          style={{
            animationDelay: `${index * 0.2}s`,
            animationDuration: "1.4s",
          }}
        />
      ))}
    </div>
  );

  // 펄스 스피너
  const PulseSpinner = () => (
    <div
      className={`
        ${sizes[size]}
        ${colors[color].replace("text-", "bg-")}
        rounded-full animate-pulse
        ${className}
      `}
      {...props}
    />
  );

  // 바 스피너
  const BarsSpinner = () => (
    <div className={`flex space-x-1 ${className}`} {...props}>
      {[0, 1, 2, 3].map((index) => (
        <div
          key={index}
          className={`
            ${
              size === "xs"
                ? "w-0.5 h-3"
                : size === "sm"
                ? "w-0.5 h-4"
                : size === "md"
                ? "w-1 h-6"
                : size === "lg"
                ? "w-1 h-8"
                : "w-1.5 h-12"
            }
            ${colors[color].replace("text-", "bg-")}
            rounded-sm animate-pulse
          `}
          style={{
            animationDelay: `${index * 0.15}s`,
            animationDuration: "1.2s",
          }}
        />
      ))}
    </div>
  );

  const renderSpinner = () => {
    switch (variant) {
      case "dots":
        return <DotsSpinner />;
      case "pulse":
        return <PulseSpinner />;
      case "bars":
        return <BarsSpinner />;
      default:
        return <SpinnerIcon />;
    }
  };

  const content = (
    <div className="flex flex-col items-center justify-center space-y-2">
      {renderSpinner()}
      {text && <span className={`${textSizes[size]} ${colors[color]} font-medium`}>{text}</span>}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-75">
        {content}
      </div>
    );
  }

  return content;
};

// 페이지 로딩 스피너
export const PageLoader = ({ text = "페이지를 불러오는 중...", ...props }) => (
  <LoadingSpinner size="lg" variant="spinner" text={text} overlay {...props} />
);

// 버튼 로딩 스피너 (작은 크기)
export const ButtonLoader = ({ ...props }) => (
  <LoadingSpinner size="sm" variant="spinner" color="white" {...props} />
);

// 인라인 로딩 스피너
export const InlineLoader = ({ text = "로딩 중...", ...props }) => (
  <div className="flex items-center justify-center py-4">
    <LoadingSpinner size="md" variant="spinner" text={text} {...props} />
  </div>
);

// 카드 로딩 스피너
export const CardLoader = ({ height = "200px", text = "데이터를 불러오는 중...", ...props }) => (
  <div
    className="flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200"
    style={{ height }}
  >
    <LoadingSpinner size="lg" variant="spinner" text={text} {...props} />
  </div>
);

// 테이블 로딩 스피너
export const TableLoader = ({ rows = 5, columns = 4, ...props }) => (
  <div className="animate-pulse">
    {/* 테이블 헤더 */}
    <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
      <div className="flex space-x-4">
        {Array.from({ length: columns }).map((_, index) => (
          <div key={index} className="h-4 bg-gray-300 rounded flex-1" />
        ))}
      </div>
    </div>

    {/* 테이블 행들 */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="border-b border-gray-200 px-6 py-4">
        <div className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="h-4 bg-gray-200 rounded flex-1" />
          ))}
        </div>
      </div>
    ))}
  </div>
);

// 스켈레톤 로더 (컨텐츠 모양 유지)
export const SkeletonLoader = ({ lines = 3, className = "", ...props }) => (
  <div className={`animate-pulse space-y-3 ${className}`} {...props}>
    {Array.from({ length: lines }).map((_, index) => (
      <div
        key={index}
        className={`h-4 bg-gray-200 rounded ${index === lines - 1 ? "w-3/4" : "w-full"}`}
      />
    ))}
  </div>
);

export default LoadingSpinner;
