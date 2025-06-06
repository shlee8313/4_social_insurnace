// File: next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tailwind CSS 지원을 위한 설정
  experimental: {
    // 필요시 실험적 기능 활성화
  },

  // CSS 설정
  cssModules: false,

  // Webpack 설정 (Tailwind CSS 호환성)
  webpack: (config, { isServer }) => {
    // Tailwind CSS 관련 설정
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }

    return config;
  },

  // 이미지 최적화 설정
  images: {
    domains: ["localhost"],
    formats: ["image/webp", "image/avif"],
  },

  // 성능 최적화
  swcMinify: true,

  // 환경 변수 설정
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // 보안 헤더
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
