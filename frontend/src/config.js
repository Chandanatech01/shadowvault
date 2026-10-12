// Application configuration constants

export const SECRET_CODE = "shadow123";
export const SECRET_PHRASE = SECRET_CODE;

export const API_BASE =
  typeof window !== "undefined" && window.location.port === "5173"
    ? "http://localhost:8080/api"
    : "/api";

