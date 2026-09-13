import axios from "axios";
import Cookies from "js-cookie";
import { API_BASE } from "./config";
import { PORTAL_TOKEN_KEY } from "./portal-config";
import { publishAppError } from "./error-bus";
import type { Invoice, Project, ClientPaymentSummary, TimelineItem } from "./api";

/**
 * Separate axios instance for the Client Portal — a distinct auth surface from the
 * internal company app (lib/api.ts). Uses its own cookie so a staff session and a
 * client session never collide in the same browser, and its own 401 redirect target.
 */
export const portalApi = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

portalApi.interceptors.request.use((config) => {
  const token = Cookies.get(PORTAL_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

portalApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      Cookies.remove(PORTAL_TOKEN_KEY);
      window.location.href = "/portal/login";
    } else {
      publishAppError(err);
    }
    return Promise.reject(err);
  },
);

// ---- Types ----
export interface PortalUser {
  id: string;
  name: string;
  email: string;
  client_id: string;
  client_name: string;
}

export type PortalProject = Pick<Project, "id" | "title" | "status" | "start_date" | "due_date">;

export interface PortalPhase {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  amount: number;
  client_approved_at: string | null;
}

export interface PortalProjectDetail extends PortalProject {
  phases: PortalPhase[];
  timeline: { items: TimelineItem[] };
}

// ---- Auth ----
export const portalAuthApi = {
  login: (email: string, password: string) =>
    portalApi.post<{ portalUser: PortalUser; token: string }>("/api/portal/auth/login", { email, password }),
  acceptInvite: (token: string, password: string) =>
    portalApi.post("/api/portal/auth/accept-invite", { token, password }),
  me: () => portalApi.get<PortalUser>("/api/portal/auth/me"),
  logout: () => portalApi.post("/api/portal/auth/logout"),
};

// ---- Data (read-only, scoped to the logged-in client on the backend) ----
export const portalDataApi = {
  projects: () => portalApi.get<{ projects: PortalProject[] }>("/api/portal/projects"),
  project: (id: string) => portalApi.get<PortalProjectDetail>(`/api/portal/projects/${id}`),
  invoices: () => portalApi.get<{ invoices: Invoice[] }>("/api/portal/invoices"),
  invoice: (id: string) => portalApi.get<Invoice>(`/api/portal/invoices/${id}`),
  paymentSummary: () => portalApi.get<ClientPaymentSummary>("/api/portal/payment-summary"),
  approvePhase: (phaseId: string) => portalApi.post(`/api/portal/phases/${phaseId}/approve`),
};
