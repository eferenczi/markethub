// Talks to the MarketHub backend. Point VITE_API_URL at your API in a .env file
// (see .env.example). Defaults to http://localhost:4000 for local development.
const configuredApiUrl = import.meta.env.VITE_API_URL;
const BASE = (
  configuredApiUrl || (import.meta.env.DEV ? "http://localhost:4000" : "")
).replace(/\/$/, "");
const TOKEN_KEY = "mh_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) =>
  t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  const tok = getToken();
  if (auth && tok) headers.Authorization = `Bearer ${tok}`;

  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(
      `Can't reach the API${BASE ? ` at ${BASE}` : ""}. Is the backend running and CORS set?`,
    );
  }

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const err = new Error(
      (data && data.error) || `Request failed (${res.status})`,
    );
    err.status = res.status;
    err.details = data && data.details;
    throw err;
  }
  return data;
}

async function requestFile(path) {
  const headers = {};
  const tok = getToken();
  if (tok) headers.Authorization = `Bearer ${tok}`;
  const res = await fetch(BASE + path, { headers });
  if (!res.ok) throw new Error("Could not open the uploaded file");
  return res.blob();
}

export const api = {
  base: BASE,
  // auth
  login: (email, password) =>
    request("/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    }),
  register: (payload) =>
    request("/auth/register", { method: "POST", body: payload, auth: false }),
  me: () => request("/auth/me"),
  forgot: (email) =>
    request("/auth/forgot", { method: "POST", body: { email }, auth: false }),
  reset: (token, newPassword) =>
    request("/auth/reset", {
      method: "POST",
      body: { token, newPassword },
      auth: false,
    }),
  changePassword: (currentPassword, newPassword) =>
    request("/auth/change-password", {
      method: "POST",
      body: { currentPassword, newPassword },
    }),
  // org / members
  getOrg: () => request("/org"),
  addMember: (payload) =>
    request("/org/members", { method: "POST", body: payload }),
  setMemberRole: (id, role) =>
    request(`/org/members/${id}`, { method: "PATCH", body: { role } }),
  removeMember: (id) => request(`/org/members/${id}`, { method: "DELETE" }),
  // integrations
  getIntegrations: () => request("/settings/integrations"),
  saveIntegration: (provider, body) =>
    request(`/settings/integrations/${provider}`, { method: "PUT", body }),
  testIntegration: (provider) =>
    request(`/settings/integrations/${provider}/test`, { method: "POST" }),
  deleteIntegration: (provider) =>
    request(`/settings/integrations/${provider}`, { method: "DELETE" }),
  // markets (persisted)
  getMarkets: () => request("/markets"),
  createMarket: (body) => request("/markets", { method: "POST", body }),
  updateMarket: (id, body) =>
    request(`/markets/${id}`, { method: "PATCH", body }),
  deleteMarket: (id) => request(`/markets/${id}`, { method: "DELETE" }),
  // vendors (persisted)
  getVendors: () => request("/vendors"),
  getVendorProfile: (id) => request(`/vendors/${id}/profile`),
  createVendor: (body) => request("/vendors", { method: "POST", body }),
  updateVendor: (id, body) =>
    request(`/vendors/${id}`, { method: "PATCH", body }),
  deleteVendor: (id) => request(`/vendors/${id}`, { method: "DELETE" }),
  // shared market operations
  getMarketDates: (marketId) =>
    request(
      `/operations/market-dates${marketId ? `?market_id=${marketId}` : ""}`,
    ),
  createMarketDate: (body) =>
    request("/operations/market-dates", { method: "POST", body }),
  updateMarketDate: (id, body) =>
    request(`/operations/market-dates/${id}`, { method: "PATCH", body }),
  getEventBoardLink: (id) =>
    request(`/operations/market-dates/${id}/board-link`, { method: "POST" }),
  getVendorMarkets: (params = {}) => {
    const q = new URLSearchParams(
      Object.entries(params).filter(
        ([, value]) => value != null && value !== "",
      ),
    ).toString();
    return request(`/operations/vendor-markets${q ? `?${q}` : ""}`);
  },
  saveVendorMarket: (vendorId, marketId, body = {}) =>
    request(`/operations/vendor-markets/${vendorId}/${marketId}`, {
      method: "PUT",
      body,
    }),
  deleteVendorMarket: (vendorId, marketId) =>
    request(`/operations/vendor-markets/${vendorId}/${marketId}`, {
      method: "DELETE",
    }),
  getApprovals: (params = {}) => {
    const q = new URLSearchParams(
      Object.entries(params).filter(
        ([, value]) => value != null && value !== "",
      ),
    ).toString();
    return request(`/operations/approvals${q ? `?${q}` : ""}`);
  },
  createApproval: (body) =>
    request("/operations/approvals", { method: "POST", body }),
  updateApproval: (id, body) =>
    request(`/operations/approvals/${id}`, { method: "PATCH", body }),
  approveApplication: (id) =>
    request(`/operations/approvals/${id}/approve`, { method: "POST" }),
  sendPaymentReminder: (id) =>
    request(`/operations/approvals/${id}/reminder`, { method: "POST" }),
  recordPayment: (id, payment_method) =>
    request(`/operations/approvals/${id}/record-payment`, {
      method: "POST",
      body: { payment_method },
    }),
  getFinancialReport: (params = {}) => {
    const q = new URLSearchParams(
      Object.entries(params).filter(
        ([, value]) => value != null && value !== "",
      ),
    ).toString();
    return request(`/operations/financial-report${q ? `?${q}` : ""}`);
  },
  getExpenses: (marketId) =>
    request(`/operations/expenses${marketId ? `?market_id=${marketId}` : ""}`),
  createExpense: (body) =>
    request("/operations/expenses", { method: "POST", body }),
  deleteExpense: (id) =>
    request(`/operations/expenses/${id}`, { method: "DELETE" }),
  getLayouts: (marketDateId) =>
    request(`/operations/layouts?market_date_id=${marketDateId}`),
  createLayout: (body) =>
    request("/operations/layouts", { method: "POST", body }),
  updateLayout: (id, body) =>
    request(`/operations/layouts/${id}`, { method: "PUT", body }),
  getLayoutTemplates: (marketId) =>
    request(`/operations/layout-templates?market_id=${marketId}`),
  createLayoutTemplate: (body) =>
    request("/operations/layout-templates", { method: "POST", body }),
  updateLayoutTemplate: (id, body) =>
    request(`/operations/layout-templates/${id}`, { method: "PUT", body }),
  applyLayoutTemplate: (id, market_date_id) =>
    request(`/operations/layout-templates/${id}/apply`, {
      method: "POST",
      body: { market_date_id },
    }),
  // organizer templates and vendor event questions
  getTemplates: (type) =>
    request(`/templates${type ? `?type=${encodeURIComponent(type)}` : ""}`),
  createTemplate: (body) => request("/templates", { method: "POST", body }),
  updateTemplate: (id, body) =>
    request(`/templates/${id}`, { method: "PUT", body }),
  assignTemplate: (id, body) =>
    request(`/templates/${id}/assign`, { method: "PUT", body }),
  getEventQuestions: (marketDateId) =>
    request(`/templates/event-questions?market_date_id=${marketDateId}`),
  createAcknowledgmentLink: (approvalId) =>
    request(`/templates/event-questions/${approvalId}/link`, {
      method: "POST",
    }),
  getPublicQuestions: (key) =>
    request(`/templates/public/questions/${key}`, { auth: false }),
  submitPublicQuestions: (key, answers) =>
    request(`/templates/public/questions/${key}`, {
      method: "POST",
      body: { answers },
      auth: false,
    }),
  getPublicEventBoard: (key) =>
    request(`/public/event-board/${key}`, { auth: false }),
  getPublicPayment: (key) => request(`/public/payment/${key}`, { auth: false }),
  createPublicCheckout: (key) =>
    request(`/public/payment/${key}/checkout`, { method: "POST", auth: false }),
  getPublicSubscribe: (key) =>
    request(`/public/subscribe/${key}`, { auth: false }),
  submitPublicSubscribe: (key, body) =>
    request(`/public/subscribe/${key}`, { method: "POST", body, auth: false }),
  // public vendor applications + organizer review CRM
  getPublicApplication: (key) =>
    request(`/applications/public/${key}`, { auth: false }),
  submitPublicApplication: (key, body) =>
    request(`/applications/public/${key}`, {
      method: "POST",
      body,
      auth: false,
    }),
  getApplications: (status) =>
    request(
      `/applications${status ? `?status=${encodeURIComponent(status)}` : ""}`,
    ),
  updateApplication: (id, body) =>
    request(`/applications/${id}`, { method: "PATCH", body }),
  approveVendorApplication: (id, body = {}) =>
    request(`/applications/${id}/approve`, { method: "POST", body }),
  getApplicationAsset: (applicationId, assetId) =>
    requestFile(`/applications/${applicationId}/assets/${assetId}`),
  rotateApplicationLink: () =>
    request("/applications/application-link/rotate", { method: "POST" }),
  // campaigns and newsletters
  getCampaigns: () => request("/campaigns"),
  createCampaign: (body) => request("/campaigns", { method: "POST", body }),
  launchCampaign: (id, marketId) =>
    request(
      `/campaigns/${id}/launch${marketId ? `?market_id=${marketId}` : ""}`,
      { method: "POST" },
    ),
  getSubscribers: () => request("/campaigns/subscribers"),
  getCampaignPublicLinks: () => request("/campaigns/public-links"),
  createSubscriber: (body) =>
    request("/campaigns/subscribers", { method: "POST", body }),
  deleteSubscriber: (id) =>
    request(`/campaigns/subscribers/${id}`, { method: "DELETE" }),
  // billing
  getBilling: () => request("/billing"),
  checkout: (plan_code) =>
    request("/billing/checkout", { method: "POST", body: { plan_code } }),
  activatePlan: (plan_code) =>
    request("/billing/activate", { method: "POST", body: { plan_code } }),
  cancelPlan: () => request("/billing/cancel", { method: "POST" }),
};
