import type { NextConfig } from "next";

// 백엔드 오리진 (기본: 로컬 Spring Boot 8080). 배포 시 BACKEND_ORIGIN 환경변수로 교체.
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  // 브라우저는 동일 오리진(/api/route)으로 호출하고, Next가 백엔드로 프록시 → CORS 불필요
  async rewrites() {
    return [
      {
        source: "/api/route",
        destination: `${BACKEND_ORIGIN}/api/route`,
      },
    ];
  },
};

export default nextConfig;
