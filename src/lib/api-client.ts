// ─── API Client ──────────────────────────────────────────
// All frontend calls go through OUR proxy (/api/proxy/*)
// instead of directly to Google Script.
// This gives us: auth, logging, rate limiting, caching.

const BASE_URL = "/api/proxy";

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  count?: number;
  summary?: Record<string, unknown>;
  kpis?: Record<string, unknown>;
}

// ─── Core fetch wrapper ─────────────────────────────────
async function apiCall<T = unknown>(
  action: string,
  params?: Record<string, string>,
  options?: { method?: "GET" | "POST"; body?: unknown }
): Promise<ApiResponse<T>> {
  const searchParams = new URLSearchParams(params || {});
  const url = `${BASE_URL}/${action}?${searchParams.toString()}`;

  try {
    const fetchOptions: RequestInit = {
      method: options?.method || "GET",
      headers: { "Content-Type": "application/json" },
    };

    if (options?.body) {
      fetchOptions.body = JSON.stringify(options.body);
    }

    const response = await fetch(url);

    if (response.status === 401) {
      // Session expired — redirect to login
      window.location.href = "/login";
      throw new Error("Session expired");
    }

    if (response.status === 403) {
      throw new Error("Insufficient permissions");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`[API] ${action} failed:`, error);
    throw error;
  }
}

// ─── Typed API methods ──────────────────────────────────
// These match the 49 actions from the existing Google Script

export const api = {
  // ── Dashboard ────────────────────────────────────────
  getDashboardKPIs: () => apiCall("getDashboardKPIs"),

  getClientKPISummary: (clientId?: string, period?: string) =>
    apiCall("getClientKPISummary", {
      ...(clientId && { clientId }),
      ...(period && { period }),
    }),

  getCEODashboard: () => apiCall("getCEODashboard"),

  getCEOFinancials: () => apiCall("getCEOFinancials"),

  // ── Clients ──────────────────────────────────────────
  getClients: () => apiCall("getClients"),

  getActiveClients: () => apiCall("getActiveClients"),

  getClientById: (clientId: string) =>
    apiCall("getClientById", { clientId }),

  addClient: (data: unknown) =>
    apiCall("addClient", {}, { method: "POST", body: data }),

  // ── Contacts ─────────────────────────────────────────
  getClientContacts: (clientId: string) =>
    apiCall("getClientContacts", { clientId }),

  addClientContact: (data: unknown) =>
    apiCall("addClientContact", {}, { method: "POST", body: data }),

  updateClientContact: (data: unknown) =>
    apiCall("updateClientContact", {}, { method: "POST", body: data }),

  deleteClientContact: (contactId: string) =>
    apiCall("deleteClientContact", { contactId }),

  // ── Data breakdowns ──────────────────────────────────
  getCategoriesBreakdown: (clientId?: string, period?: string) =>
    apiCall("getCategoriesBreakdown", {
      ...(clientId && { clientId }),
      ...(period && { period }),
    }),

  getHospitalsData: (clientId?: string, period?: string) =>
    apiCall("getHospitalsData", {
      ...(clientId && { clientId }),
      ...(period && { period }),
    }),

  getGeographicData: (clientId?: string, period?: string) =>
    apiCall("getGeographicData", {
      ...(clientId && { clientId }),
      ...(period && { period }),
    }),

  // ── Contracts ────────────────────────────────────────
  getContracts: () => apiCall("getContracts"),

  getContractStats: () => apiCall("getContractStats"),

  getExpiringContracts: () => apiCall("getExpiringContracts"),

  // ── Offers ───────────────────────────────────────────
  getOffers: () => apiCall("getOffers"),

  getOfferById: (offerId: string) =>
    apiCall("getOfferById", { offerId }),

  updateOfferStatus: (offerId: string, status: string) =>
    apiCall("updateOfferStatus", { offerId, status }),

  markOfferAsSigned: (offerId: string) =>
    apiCall("markOfferAsSigned", { offerId }),

  getOfferDocuments: (offerId: string) =>
    apiCall("getOfferDocuments", { offerId }),

  getAllOffersDocuments: () => apiCall("getAllOffersDocuments"),

  // ── Documents ────────────────────────────────────────
  createProposalFromOffer: (offerId: string) =>
    apiCall("createProposalFromOffer", { offerId }),

  createASAFromOffer: (offerId: string) =>
    apiCall("createASAFromOffer", { offerId }),

  createDPA: (clientId: string) => apiCall("createDPA", { clientId }),

  createNDA: (clientId: string) => apiCall("createNDA", { clientId }),

  generateComparisonQuoteFromOffer: (offerId: string) =>
    apiCall("generateComparisonQuoteFromOffer", { offerId }),

  getDocumentVersions: (documentId: string) =>
    apiCall("getDocumentVersions", { documentId }),

  // ── Email ────────────────────────────────────────────
  getEmailTemplates: () => apiCall("getEmailTemplates"),

  getEmailTemplateBody: (templateId: string) =>
    apiCall("getEmailTemplateBody", { template_id: templateId }),

  getEmailTemplateContent: (templateId: string) =>
    apiCall("getEmailTemplateContent", { templateId }),

  getEmailTemplatesFromDrive: () => apiCall("getEmailTemplatesFromDrive"),

  previewEmail: (templateId: string, clientId: string) =>
    apiCall("previewEmail", { templateId, clientId }),

  getEmailHistory: () => apiCall("getEmailHistory"),

  sendDocumentsEmail: (data: unknown) =>
    apiCall("sendDocumentsEmail", {}, { method: "POST", body: data }),

  // ── Scheduling ───────────────────────────────────────
  getScheduledEmails: () => apiCall("getScheduledEmails"),

  cancelScheduledEmail: (scheduleId: string) =>
    apiCall("cancelScheduledEmail", { schedule_id: scheduleId }),

  // ── Renewals ─────────────────────────────────────────
  getRenewalEmailTemplates: () => apiCall("getRenewalEmailTemplates"),

  getRenewalEmailTemplateBody: (templateId: string) =>
    apiCall("getRenewalEmailTemplateBody", { template_id: templateId }),

  // ── Reports ──────────────────────────────────────────
  getCBMSReportData: () => apiCall("getCBMSReportData"),

  // ── Follow-ups ───────────────────────────────────────
  getFollowUpNotes: () => apiCall("getFollowUpNotes"),

  // ── Programs ─────────────────────────────────────────
  getPrograms: () => apiCall("getPrograms"),

  createProgram: (data: unknown) =>
    apiCall("createProgram", {}, { method: "POST", body: data }),

  // ── Team & Users ─────────────────────────────────────
  getTeamMembers: () => apiCall("getTeamMembers"),

  getUsers: () => apiCall("getUsers"),

  // ── Client Portal ────────────────────────────────────
  authenticateClient: (username: string, password: string) =>
    apiCall("authenticateClient", { username, password }),

  getClientWithSubsidiaries: (clientId: string) =>
    apiCall("getClientWithSubsidiaries", { clientId }),

  // ── Email drafts ─────────────────────────────────────
  createEmailDraft: (data: unknown) =>
    apiCall("createEmailDraft", {}, { method: "POST", body: data }),
};

export type ApiClient = typeof api;
