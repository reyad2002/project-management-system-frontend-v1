export const API_BASE =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL || "https://project-management-system-backend-v.vercel.app/")
    : process.env.NEXT_PUBLIC_API_URL || "https://project-management-system-backend-v.vercel.app/";

export const TOKEN_KEY = "pms_token";
