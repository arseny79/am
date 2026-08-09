export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "Acquisitions.market";

export const APP_LOGO = import.meta.env.VITE_APP_LOGO || "/favicon-512.png";

// Send users to the local login page — no external OAuth dependency.
export const getLoginUrl = () => "/login";
