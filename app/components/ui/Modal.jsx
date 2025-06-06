// File: components/ui/Modal.jsx
"use client";

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

/**
 * 🔧 올바른 props 처리가 된 Modal 컴포넌트
 * maxWidth 같은 custom props가 DOM element에 전달되지 않도록 수정
 */
export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  className = "",
  closeOnOverlayClick = true,
  showCloseButton = true,
  ...otherProps // 🔧 나머지 props는 별도로 처리
}) => {
  const modalRef = useRef(null);

  // 🔧 size별 클래스 정의
  const sizes = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-md",
    lg: "sm:max-w-lg",
    xl: "sm:max-w-xl",
    "2xl": "sm:max-w-2xl",
    "3xl": "sm:max-w-3xl",
    "4xl": "sm:max-w-4xl",
    "5xl": "sm:max-w-5xl",
    "6xl": "sm:max-w-6xl",
    "7xl": "sm:max-w-7xl",
    full: "sm:max-w-full",
  };

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
      // 스크롤 방지
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // 모달 외부 클릭 시 닫기
  const handleOverlayClick = (event) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  // 모달이 열려있지 않으면 렌더링하지 않음
  if (!isOpen) {
    return null;
  }

  // 포털을 사용하여 body에 모달 렌더링
  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 오버레이 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleOverlayClick}
      />

      {/* 모달 컨테이너 */}
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div
          ref={modalRef}
          className={`relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all ${sizes[size]} ${className}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "modal-title" : undefined}
          // 🔧 DOM에 전달할 props만 포함 (custom props 제외)
        >
          {/* 헤더 */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              {title && (
                <h3 id="modal-title" className="text-lg font-semibold text-gray-900">
                  {title}
                </h3>
              )}

              {showCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  className="ml-auto flex-shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                  aria-label="모달 닫기"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* 콘텐츠 */}
          <div className={title || showCloseButton ? "" : "p-4"}>{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
};

/**
 * 🔧 모달 헬퍼 컴포넌트들
 */
export const ModalHeader = ({ children, className = "" }) => (
  <div className={`px-4 py-3 border-b border-gray-200 ${className}`}>{children}</div>
);

export const ModalBody = ({ children, className = "" }) => (
  <div className={`px-4 py-4 ${className}`}>{children}</div>
);

export const ModalFooter = ({ children, className = "" }) => (
  <div
    className={`px-4 py-3 border-t border-gray-200 bg-gray-50 flex justify-end space-x-2 ${className}`}
  >
    {children}
  </div>
);

/**
 * 🔧 확인 다이얼로그 컴포넌트
 */
export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "확인",
  message = "이 작업을 계속하시겠습니까?",
  confirmText = "확인",
  cancelText = "취소",
  type = "default", // "default", "danger", "warning"
}) => {
  const buttonStyles = {
    default: "bg-blue-600 hover:bg-blue-700 text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    warning: "bg-yellow-600 hover:bg-yellow-700 text-white",
  };

  const iconColors = {
    default: "text-blue-600",
    danger: "text-red-600",
    warning: "text-yellow-600",
  };

  const icons = {
    default: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    danger: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z"
        />
      </svg>
    ),
    warning: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z"
        />
      </svg>
    ),
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      showCloseButton={false}
      closeOnOverlayClick={false}
    >
      <div className="p-6">
        <div className="flex items-center mb-4">
          <div
            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${iconColors[type]} bg-gray-100`}
          >
            {icons[type]}
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-6">{message}</p>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${buttonStyles[type]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
