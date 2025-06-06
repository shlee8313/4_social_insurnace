// File: components/ui/Card.jsx
"use client";
import React from "react";

/**
 * Card 컴포넌트 - 4대보험 관리 시스템용 카드 컨테이너
 * @param {Object} props - 카드 속성
 * @param {React.ReactNode} props.children - 카드 내용
 * @param {string} props.variant - 카드 스타일 ('default', 'bordered', 'shadow', 'elevated')
 * @param {string} props.padding - 패딩 크기 ('none', 'sm', 'md', 'lg')
 * @param {boolean} props.hover - 호버 효과 여부
 * @param {boolean} props.clickable - 클릭 가능 여부
 * @param {Function} props.onClick - 클릭 이벤트 핸들러
 * @param {string} props.className - 추가 CSS 클래스
 */
export const Card = ({
  children,
  variant = "default",
  padding = "md",
  hover = false,
  clickable = false,
  onClick,
  className = "",
  ...props
}) => {
  const baseClasses = "bg-white rounded-lg transition-all duration-200";

  const variants = {
    default: "border border-gray-200",
    bordered: "border-2 border-gray-300",
    shadow: "shadow-sm border border-gray-100",
    elevated: "shadow-md border border-gray-100",
  };

  const paddings = {
    none: "",
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  };

  const interactiveClasses = {
    hover: hover ? "hover:shadow-md hover:border-gray-300" : "",
    clickable:
      clickable || onClick
        ? "cursor-pointer hover:shadow-md hover:border-gray-300 active:scale-[0.99]"
        : "",
  };

  const cardClasses = [
    baseClasses,
    variants[variant],
    paddings[padding],
    interactiveClasses.hover,
    interactiveClasses.clickable,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const Component = clickable || onClick ? "button" : "div";

  return (
    <Component className={cardClasses} onClick={onClick} {...props}>
      {children}
    </Component>
  );
};

// 카드 헤더 컴포넌트
export const CardHeader = ({ title, subtitle, action, className = "", ...props }) => {
  return (
    <div className={`flex items-start justify-between mb-4 ${className}`} {...props}>
      <div className="flex-1 min-w-0">
        {title && <h3 className="text-lg font-semibold text-gray-900 leading-6">{title}</h3>}
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {action && <div className="ml-4 flex-shrink-0">{action}</div>}
    </div>
  );
};

// 카드 본문 컴포넌트
export const CardBody = ({ children, className = "", ...props }) => {
  return (
    <div className={`text-gray-700 ${className}`} {...props}>
      {children}
    </div>
  );
};

// 카드 푸터 컴포넌트
export const CardFooter = ({ children, className = "", divided = false, ...props }) => {
  const dividerClass = divided ? "border-t border-gray-200 pt-4 mt-4" : "";

  return (
    <div className={`${dividerClass} ${className}`} {...props}>
      {children}
    </div>
  );
};

// 통계 카드 컴포넌트
export const StatCard = ({
  title,
  value,
  change,
  changeType = "neutral", // 'positive', 'negative', 'neutral'
  icon,
  color = "blue",
  ...props
}) => {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    yellow: "bg-yellow-50 text-yellow-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
    gray: "bg-gray-50 text-gray-600",
  };

  const changeColors = {
    positive: "text-green-600",
    negative: "text-red-600",
    neutral: "text-gray-600",
  };

  return (
    <Card variant="shadow" hover {...props}>
      <div className="flex items-center">
        {icon && <div className={`flex-shrink-0 p-3 rounded-lg ${colors[color]}`}>{icon}</div>}
        <div className={`flex-1 ${icon ? "ml-4" : ""}`}>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="flex items-baseline">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {change && (
              <p className={`ml-2 text-sm font-medium ${changeColors[changeType]}`}>
                {changeType === "positive" && "+"}
                {change}
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

// 정보 카드 컴포넌트
export const InfoCard = ({ title, items = [], action, ...props }) => {
  return (
    <Card variant="shadow" {...props}>
      <CardHeader title={title} action={action} />
      <CardBody>
        <dl className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <dt className="font-medium text-gray-600">{item.label}</dt>
              <dd className="text-gray-900">{item.value}</dd>
            </div>
          ))}
        </dl>
      </CardBody>
    </Card>
  );
};

// 액션 카드 컴포넌트
export const ActionCard = ({ title, description, icon, actions, ...props }) => {
  return (
    <Card variant="bordered" hover clickable {...props}>
      <div className="text-center">
        {icon && (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 mb-4">
            {icon}
          </div>
        )}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        {description && <p className="text-sm text-gray-600 mb-4">{description}</p>}
        {actions && <div className="flex flex-col space-y-2">{actions}</div>}
      </div>
    </Card>
  );
};

// 상태 카드 컴포넌트
export const StatusCard = ({
  title,
  status,
  statusColor = "gray",
  description,
  lastUpdated,
  ...props
}) => {
  const statusColors = {
    green: "bg-green-100 text-green-800",
    yellow: "bg-yellow-100 text-yellow-800",
    red: "bg-red-100 text-red-800",
    blue: "bg-blue-100 text-blue-800",
    gray: "bg-gray-100 text-gray-800",
  };

  return (
    <Card variant="shadow" {...props}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[statusColor]}`}
        >
          {status}
        </span>
      </div>
      {description && <p className="text-sm text-gray-600 mb-3">{description}</p>}
      {lastUpdated && <p className="text-xs text-gray-500">마지막 업데이트: {lastUpdated}</p>}
    </Card>
  );
};

export default Card;
