// utils/constants.js
/**
 * 4대보험 취득상실 통합 관리 시스템 - 상수 정의
 * 시스템 전체에서 사용되는 모든 상수들을 중앙 집중 관리
 */

// ===========================
// 시스템 기본 설정
// ===========================
export const SYSTEM_CONFIG = {
  NAME: "4대보험 취득상실 통합 관리 시스템",
  VERSION: "1.0.0",
  TIMEZONE: "Asia/Seoul",
  CURRENCY: "KRW",
  LOCALE: "ko-KR",
  DATE_FORMAT: "YYYY-MM-DD",
  DATETIME_FORMAT: "YYYY-MM-DD HH:mm:ss",
  TIME_FORMAT: "HH:mm",
};

// ===========================
// 사용자 역할 및 권한
// ===========================
export const USER_ROLES = {
  // 노무사 사무실 역할
  LABOR_ADMIN: "LABOR_ADMIN",
  LABOR_STAFF: "LABOR_STAFF",

  // 회사 역할
  COMPANY_ADMIN: "COMPANY_ADMIN",
  COMPANY_HR: "COMPANY_HR",

  // 시스템 관리자
  SYSTEM_ADMIN: "SYSTEM_ADMIN",
};

export const ROLE_CATEGORIES = {
  LABOR_OFFICE: "labor_office",
  COMPANY: "company",
  SYSTEM: "system",
};

export const PERMISSIONS = {
  USERS: {
    READ: "users:read",
    WRITE: "users:write",
    DELETE: "users:delete",
  },
  COMPANIES: {
    READ: "companies:read",
    WRITE: "companies:write",
    DELETE: "companies:delete",
  },
  WORKERS: {
    READ: "workers:read",
    WRITE: "workers:write",
    DELETE: "workers:delete",
  },
  INSURANCE: {
    READ: "insurance:read",
    WRITE: "insurance:write",
    CALCULATE: "insurance:calculate",
    APPROVE: "insurance:approve",
  },
  PAYROLL: {
    READ: "payroll:read",
    WRITE: "payroll:write",
    CALCULATE: "payroll:calculate",
    APPROVE: "payroll:approve",
  },
  DAILY_WORKERS: {
    READ: "daily_workers:read",
    WRITE: "daily_workers:write",
    MANAGE: "daily_workers:manage",
  },
  BATCH_PROCESSING: {
    READ: "batch_processing:read",
    WRITE: "batch_processing:write",
    EXECUTE: "batch_processing:execute",
  },
  REPORTS: {
    READ: "reports:read",
    WRITE: "reports:write",
    GENERATE: "reports:generate",
  },
  ANALYTICS: {
    READ: "analytics:read",
    EXPORT: "analytics:export",
  },
};

// ===========================
// 고용형태 및 판정 방식
// ===========================
export const EMPLOYMENT_TYPES = {
  REGULAR: {
    CODE: "REGULAR",
    NAME: "정규직",
    CATEGORY: "regular",
    JUDGMENT_METHOD: "immediate",
  },
  CONTRACT: {
    CODE: "CONTRACT",
    NAME: "계약직",
    CATEGORY: "contract",
    JUDGMENT_METHOD: "immediate",
  },
  PART_TIME: {
    CODE: "PART_TIME",
    NAME: "단시간근로자",
    CATEGORY: "part_time",
    JUDGMENT_METHOD: "monthly",
  },
  DAILY: {
    CODE: "DAILY",
    NAME: "일용직",
    CATEGORY: "daily",
    JUDGMENT_METHOD: "rolling_monthly",
  },
};

export const JUDGMENT_METHODS = {
  IMMEDIATE: "immediate",
  MONTHLY: "monthly",
  ROLLING_MONTHLY: "rolling_monthly",
};

// ===========================
// 4대보험 관련 상수
// ===========================
export const INSURANCE_TYPES = {
  NP: {
    CODE: "NP",
    NAME: "국민연금",
    FULL_NAME: "국민연금보험",
  },
  HI: {
    CODE: "HI",
    NAME: "건강보험",
    FULL_NAME: "국민건강보험",
  },
  EI: {
    CODE: "EI",
    NAME: "고용보험",
    FULL_NAME: "고용보험",
  },
  WC: {
    CODE: "WC",
    NAME: "산재보험",
    FULL_NAME: "산업재해보상보험",
  },
  LTC: {
    CODE: "LTC",
    NAME: "장기요양보험",
    FULL_NAME: "장기요양보험",
  },
};

export const TRANSACTION_TYPES = {
  ACQUISITION: "acquisition",
  LOSS: "loss",
};

export const SUBSCRIPTION_TYPES = {
  MANDATORY: "mandatory",
  VOLUNTARY: "voluntary",
};

export const INSURANCE_ACTIONS = {
  NONE: "none",
  ACQUIRE: "acquire",
  LOSE: "lose",
  VOLUNTARY_REVIEW: "voluntary_review",
};

// 4대보험 가입 기준 (2024년 기준)
export const INSURANCE_CRITERIA = {
  NP: {
    MIN_DAYS_MONTHLY: 8,
    MIN_HOURS_MONTHLY: 60,
    MIN_MONTHLY_INCOME: 2200000,
    MAX_INCOME: 5690000,
    MIN_INCOME: 370000,
  },
  HI: {
    MIN_DAYS_MONTHLY: 8,
    MIN_HOURS_MONTHLY: 60,
    MAX_INCOME: 11520000,
    MIN_INCOME: 370000,
  },
  EI: {
    MIN_DAYS: 1,
    MIN_EMPLOYMENT_MONTHS: 3,
    MAX_INCOME: 13670000,
  },
  WC: {
    MIN_DAYS: 1,
  },
};

// 4대보험 요율 (2025년 기준)
export const INSURANCE_RATES = {
  NP: {
    EMPLOYEE_RATE: 0.045,
    EMPLOYER_RATE: 0.045,
  },
  HI: {
    EMPLOYEE_RATE: 0.0354,
    EMPLOYER_RATE: 0.0354,
  },
  LTC: {
    RATE: 0.004681,
  },
  EI: {
    EMPLOYEE_RATE: 0.009,
    EMPLOYER_RATE: 0.0135,
  },
};

// ===========================
// 급여 관련 상수
// ===========================
export const PAYROLL_ITEM_CATEGORIES = {
  BASIC_PAY: "basic_pay",
  ALLOWANCE: "allowance",
  OVERTIME: "overtime",
  DEDUCTION: "deduction",
};

export const TAX_TYPES = {
  TAXABLE: "taxable",
  NONTAX: "nontax",
  MIXED: "mixed",
};

export const CALCULATION_METHODS = {
  FIXED: "fixed",
  HOURLY: "hourly",
  DAILY: "daily",
  PERCENTAGE: "percentage",
};

// 비과세 한도 (2024년 기준)
export const NONTAX_LIMITS = {
  MEAL_ALLOWANCE: {
    TYPE: "meal_allowance",
    NAME: "식대",
    MONTHLY_LIMIT: 200000,
    ANNUAL_LIMIT: 2400000,
  },
  TRANSPORT_ALLOWANCE: {
    TYPE: "transport_allowance",
    NAME: "교통비",
    MONTHLY_LIMIT: 200000,
    ANNUAL_LIMIT: 2400000,
  },
  CAR_MAINTENANCE: {
    TYPE: "car_maintenance",
    NAME: "자가운전보조금",
    MONTHLY_LIMIT: 200000,
    ANNUAL_LIMIT: 2400000,
  },
};

// ===========================
// 근태 관련 상수
// ===========================
export const ATTENDANCE_STATUS = {
  PRESENT: "present",
  ABSENT: "absent",
  LATE: "late",
  EARLY_LEAVE: "early_leave",
  SICK_LEAVE: "sick_leave",
  ANNUAL_LEAVE: "annual_leave",
  SPECIAL_LEAVE: "special_leave",
};

export const WORK_TIME_TYPES = {
  REGULAR: "regular",
  OVERTIME: "overtime",
  NIGHT: "night",
  HOLIDAY: "holiday",
};

// 법정 근무시간 기준
export const WORK_TIME_LIMITS = {
  REGULAR_HOURS_PER_DAY: 8,
  REGULAR_HOURS_PER_WEEK: 40,
  MAX_OVERTIME_PER_DAY: 12,
  MAX_OVERTIME_PER_WEEK: 52,
  NIGHT_WORK_START: "22:00",
  NIGHT_WORK_END: "06:00",
};

// ===========================
// 배치 처리 관련 상수
// ===========================
export const BATCH_TYPES = {
  DAILY_ROLLING_MONTHLY: "daily_rolling_monthly",
  MONTHLY_INSURANCE: "monthly_insurance",
  QUARTERLY_INSURANCE: "quarterly_insurance",
  CONTINUOUS_PERIOD_UPDATE: "continuous_period_update",
  AUTO_ELIGIBILITY_CHECK: "auto_eligibility_check",
};

export const BATCH_STATUS = {
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
  PARTIAL: "partial",
};

export const PROCESSING_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PROCESSED: "processed",
  COMPLETED: "completed",
};

// ===========================
// 신고 관련 상수
// ===========================
export const REPORT_TYPES = {
  MONTHLY_INSURANCE: "monthly_insurance",
  QUARTERLY_INSURANCE: "quarterly_insurance",
  ANNUAL_INSURANCE: "annual_insurance",
  ACQUISITION_LOSS: "acquisition_loss",
  PAYROLL_REPORT: "payroll_report",
  EMPLOYMENT_INSURANCE_REPORT: "employment_insurance_report",
};

export const REPORT_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  OVERDUE: "overdue",
  EXTENDED: "extended",
};

export const REPORT_METHODS = {
  ONLINE: "online",
  VISIT: "visit",
  MAIL: "mail",
  FAX: "fax",
};

// 4대보험 신고 사유코드 (일반적인 코드들)
export const REASON_CODES = {
  NP: {
    ACQUISITION: {
      10: "일반취득",
      15: "선택가입",
      20: "재입사",
    },
    LOSS: {
      20: "일반상실",
      25: "선택탈퇴",
      30: "사망",
    },
  },
  HI: {
    ACQUISITION: {
      10: "일반취득",
      15: "선택가입",
    },
    LOSS: {
      20: "일반상실",
      25: "선택탈퇴",
    },
  },
  EI: {
    ACQUISITION: {
      10: "일반취득",
    },
    LOSS: {
      20: "일반상실",
    },
  },
  WC: {
    ACQUISITION: {
      10: "일반취득",
    },
    LOSS: {
      20: "일반상실",
    },
  },
};

// ===========================
// 파일 관련 상수
// ===========================
export const FILE_TYPES = {
  DOCUMENT: "document",
  IMAGE: "image",
  EXCEL: "excel",
  PDF: "pdf",
  CSV: "csv",
};

export const ALLOWED_FILE_EXTENSIONS = {
  DOCUMENT: [".doc", ".docx", ".hwp"],
  IMAGE: [".jpg", ".jpeg", ".png", ".gif"],
  EXCEL: [".xls", ".xlsx"],
  PDF: [".pdf"],
  CSV: [".csv"],
};

export const MAX_FILE_SIZE = {
  DOCUMENT: 10 * 1024 * 1024, // 10MB
  IMAGE: 5 * 1024 * 1024, // 5MB
  EXCEL: 20 * 1024 * 1024, // 20MB
  PDF: 10 * 1024 * 1024, // 10MB
  CSV: 5 * 1024 * 1024, // 5MB
};

// ===========================
// UI 관련 상수
// ===========================
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_PAGE_SIZE: 200,
};

export const TABLE_ACTIONS = {
  VIEW: "view",
  EDIT: "edit",
  DELETE: "delete",
  DOWNLOAD: "download",
  APPROVE: "approve",
  REJECT: "reject",
};

export const MODAL_TYPES = {
  CONFIRM: "confirm",
  INFO: "info",
  WARNING: "warning",
  ERROR: "error",
  SUCCESS: "success",
};

export const NOTIFICATION_TYPES = {
  SUCCESS: "success",
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
};

// ===========================
// 국가 및 지역 관련 상수
// ===========================
export const COUNTRIES = {
  KR: "대한민국",
  CN: "중국",
  VN: "베트남",
  PH: "필리핀",
  TH: "태국",
  JP: "일본",
  US: "미국",
};

export const VISA_TYPES = {
  "E-9": "비전문취업",
  "E-7": "특정활동",
  "H-2": "방문취업",
  "F-4": "재외동포",
  "F-5": "영주",
  "F-6": "결혼이민",
};

// ===========================
// 업종 관련 상수
// ===========================
export const BUSINESS_TYPES = {
  MANUFACTURING: "제조업",
  CONSTRUCTION: "건설업",
  SERVICE: "서비스업",
  RETAIL: "소매업",
  WHOLESALE: "도매업",
  IT: "정보통신업",
  FINANCE: "금융업",
  HEALTHCARE: "보건업",
  EDUCATION: "교육업",
  TRANSPORTATION: "운수업",
};

// ===========================
// 에러 코드
// ===========================
export const ERROR_CODES = {
  // 인증 관련
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  ACCOUNT_LOCKED: "ACCOUNT_LOCKED",
  PERMISSION_DENIED: "PERMISSION_DENIED",

  // 데이터 관련
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
  DUPLICATE_RESOURCE: "DUPLICATE_RESOURCE",
  INVALID_DATA: "INVALID_DATA",
  DATA_CONFLICT: "DATA_CONFLICT",

  // 시스템 관련
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",

  // 배치 처리 관련
  BATCH_ALREADY_RUNNING: "BATCH_ALREADY_RUNNING",
  BATCH_EXECUTION_FAILED: "BATCH_EXECUTION_FAILED",
};

// ===========================
// 정규식 패턴
// ===========================
export const REGEX_PATTERNS = {
  // 한국 형식
  PHONE_NUMBER: /^01[016789]-?\d{3,4}-?\d{4}$/,
  BUSINESS_REGISTRATION_NUMBER: /^\d{3}-?\d{2}-?\d{5}$/,
  RESIDENT_NUMBER: /^\d{6}-?[1-4]\d{6}$/,

  // 일반 형식
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  USERNAME: /^[a-zA-Z0-9_]{4,20}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,

  // 숫자 형식
  CURRENCY: /^\d{1,3}(,\d{3})*(\.\d{0,2})?$/,
  PERCENTAGE: /^\d{1,3}(\.\d{1,4})?$/,
};

// ===========================
// 메시지
// ===========================
export const MESSAGES = {
  SUCCESS: {
    SAVE: "저장되었습니다.",
    UPDATE: "수정되었습니다.",
    DELETE: "삭제되었습니다.",
    SUBMIT: "제출되었습니다.",
    APPROVE: "승인되었습니다.",
    REJECT: "반려되었습니다.",
  },
  ERROR: {
    SAVE: "저장에 실패했습니다.",
    UPDATE: "수정에 실패했습니다.",
    DELETE: "삭제에 실패했습니다.",
    SUBMIT: "제출에 실패했습니다.",
    NETWORK: "네트워크 오류가 발생했습니다.",
    PERMISSION: "권한이 없습니다.",
    VALIDATION: "입력값을 확인해주세요.",
  },
  CONFIRM: {
    DELETE: "정말 삭제하시겠습니까?",
    SUBMIT: "제출하시겠습니까?",
    APPROVE: "승인하시겠습니까?",
    REJECT: "반려하시겠습니까?",
  },
};

// ===========================
// 기본값
// ===========================
export const DEFAULT_VALUES = {
  PAGE_SIZE: 20,
  TIMEOUT: 30000,
  RETRY_COUNT: 3,
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: 300,
  REFRESH_INTERVAL: 60000, // 1분
  SESSION_TIMEOUT: 3600000, // 1시간
};

// ===========================
// 환경별 설정
// ===========================
export const ENVIRONMENT = {
  DEVELOPMENT: "development",
  STAGING: "staging",
  PRODUCTION: "production",
};

export const getEnvironmentConfig = () => {
  const env = process.env.NODE_ENV || ENVIRONMENT.DEVELOPMENT;

  return {
    isDevelopment: env === ENVIRONMENT.DEVELOPMENT,
    isStaging: env === ENVIRONMENT.STAGING,
    isProduction: env === ENVIRONMENT.PRODUCTION,
    enableLogging: env !== ENVIRONMENT.PRODUCTION,
    enableDebugMode: env === ENVIRONMENT.DEVELOPMENT,
  };
};

// ===========================
// 내보내기 기본값
// ===========================
export default {
  SYSTEM_CONFIG,
  USER_ROLES,
  EMPLOYMENT_TYPES,
  INSURANCE_TYPES,
  PAYROLL_ITEM_CATEGORIES,
  ATTENDANCE_STATUS,
  BATCH_TYPES,
  REPORT_TYPES,
  ERROR_CODES,
  MESSAGES,
  DEFAULT_VALUES,
};
