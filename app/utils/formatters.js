// File: utils/formatters.js

/**
 * 전화번호 포맷팅 함수
 * 다양한 형식을 지원: 010-1234-5678, 02-123-456, 042-525-5558, 042-5255-5789, 02-4567-7894
 */
export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return "";

  // 숫자만 추출
  const numbers = phoneNumber.replace(/[^\d]/g, "");

  // 길이에 따른 포맷팅
  if (numbers.length === 0) return "";

  // 010으로 시작하는 휴대폰 번호
  if (numbers.startsWith("010")) {
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  }

  // 02로 시작하는 서울 지역번호
  if (numbers.startsWith("02")) {
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 5) return `${numbers.slice(0, 2)}-${numbers.slice(2)}`;
    if (numbers.length <= 9)
      return `${numbers.slice(0, 2)}-${numbers.slice(2, 5)}-${numbers.slice(5)}`;
    return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`;
  }

  // 3자리 지역번호 (031, 032, 033, 041, 042, 043, 044, 051, 052, 053, 054, 055, 061, 062, 063, 064)
  const threeDigitAreaCodes = [
    "031",
    "032",
    "033",
    "041",
    "042",
    "043",
    "044",
    "051",
    "052",
    "053",
    "054",
    "055",
    "061",
    "062",
    "063",
    "064",
  ];
  const areaCode = numbers.slice(0, 3);

  if (threeDigitAreaCodes.includes(areaCode)) {
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    if (numbers.length <= 10)
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  }

  // 기타 번호는 그대로 반환 (포맷팅 없이)
  return numbers;
};

/**
 * 사업자등록번호 포맷팅 함수
 * 10자리 숫자를 123-45-67890 형식으로 변환
 */
export const formatBusinessNumber = (businessNumber) => {
  if (!businessNumber) return "";

  // 숫자만 추출
  const numbers = businessNumber.replace(/[^\d]/g, "");

  // 길이 제한 (10자리)
  const limitedNumbers = numbers.slice(0, 10);

  if (limitedNumbers.length === 0) return "";
  if (limitedNumbers.length <= 3) return limitedNumbers;
  if (limitedNumbers.length <= 5) return `${limitedNumbers.slice(0, 3)}-${limitedNumbers.slice(3)}`;
  return `${limitedNumbers.slice(0, 3)}-${limitedNumbers.slice(3, 5)}-${limitedNumbers.slice(5)}`;
};

/**
 * 사업자등록번호 유효성 검증
 */
export const validateBusinessNumber = (businessNumber) => {
  if (!businessNumber) return false;

  const numbers = businessNumber.replace(/[^\d]/g, "");
  if (numbers.length !== 10) return false;

  // 체크섬 검증 (사업자등록번호 검증 알고리즘)
  const checkDigits = [1, 3, 7, 1, 3, 7, 1, 3, 5, 1];
  let sum = 0;

  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers[i]) * checkDigits[i];
  }

  sum += Math.floor((parseInt(numbers[8]) * 5) / 10);
  const checkDigit = (10 - (sum % 10)) % 10;

  return parseInt(numbers[9]) === checkDigit;
};

/**
 * 전화번호 유효성 검증
 */
export const validatePhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return true; // 선택사항이므로 빈 값은 유효

  const numbers = phoneNumber.replace(/[^\d]/g, "");

  // 최소 9자리, 최대 11자리
  if (numbers.length < 9 || numbers.length > 11) return false;

  // 유효한 시작 번호 패턴
  const validPatterns = [
    /^010\d{8}$/, // 010-XXXX-XXXX
    /^02\d{7,8}$/, // 02-XXX-XXXX 또는 02-XXXX-XXXX
    /^0(3[1-3]|4[1-4]|5[1-5]|6[1-4])\d{7,8}$/, // 지역번호
  ];

  return validPatterns.some((pattern) => pattern.test(numbers));
};

/**
 * 포맷팅된 값에서 순수 숫자만 추출
 */
export const extractNumbers = (formattedValue) => {
  return formattedValue ? formattedValue.replace(/[^\d]/g, "") : "";
};

/**
 * 입력 중 실시간 포맷팅을 위한 핸들러
 */
export const createPhoneFormatter = (onChange) => {
  return (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    onChange({
      ...e,
      target: {
        ...e.target,
        value: formatted,
      },
    });
  };
};

export const createBusinessNumberFormatter = (onChange) => {
  return (e) => {
    const formatted = formatBusinessNumber(e.target.value);
    onChange({
      ...e,
      target: {
        ...e.target,
        value: formatted,
      },
    });
  };
};
