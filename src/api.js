// Talks to the MarketHub backend. Point VITE_API_URL at your API in a .env file
// (see .env.example). Defaults to http://localhost:4000 for local development.
const configuredApiUrl = import.meta.env.VITE_API_URL;
const BASE = (configuredApiUrl || (import.meta.env.DEV ? "http://localhost:4000" : "")).replace(/\/$/, "");
const TOKEN_KEY = "mh_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  const tok = getToken();
  if (auth && tok) headers.Authorization = `Bearer ${tok}`;

  let res;
  try {
    res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new Error(`Can't reach the API${BASE ? ` at ${BASE}` : ""}. Is the backend running and CORS set?`);
  }

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const err = new Error((data && data.error) || `Request failed (${res.status})`);
    err.status = res.status;
    err.details = data && data.details;
    throw err;
  }
  return data;
}

export const api = {
  base: BASE,
  // auth
  login: (email, password) => request("/auth/login", { method: "POST", body: { email, password }, auth: false }),
  register: (payload) => request("/auth/register", { method: "POST", body: payload, auth: false }),
  me: () => request("/auth/me"),
  forgot: (email) => request("/auth/forgot", { method: "POST", body: { email }, auth: false }),
  reset: (token, newPassword) => request("/auth/reset", { method: "POST", body: { token, newPassword }, auth: false }),
  changePassword: (currentPassword, newPassword) =>
    request("/auth/change-password", { method: "POST", body: { currentPassword, newPassword } }),
  // org / members
  getOrg: () => request("/org"),
  addMember: (payload) => request("/org/members", { method: "POST", body: payload }),
  setMemberRole: (id, role) => request(`/org/members/${id}`, { method: "PATCH", body: { role } }),
  removeMember: (id) => request(`/org/members/${id}`, { method: "DELETE" }),
  // integrations
  getIntegrations: () => request("/settings/integrations"),
  saveIntegration: (provider, body) => request(`/settings/integrations/${provider}`, { method: "PUT", body }),
  testIntegration: (provider) => request(`/settings/integrations/${provider}/test`, { method: "POST" }),
  deleteIntegration: (provider) => request(`/settings/integrations/${provider}`, { method: "DELETE" }),
  // markets (persisted)
  getMarkets: () => request("/markets"),
  createMarket: (body) => request("/markets", { method: "POST", body }),
  updateMarket: (id, body) => request(`/markets/${id}`, { method: "PATCH", body }),
  deleteMarket: (id) => request(`/markets/${id}`, { method: "DELETE" }),
  // vendors (persisted)
  getVendors: () => request("/vendors"),
  createVendor: (body) => request("/vendors", { method: "POST", body }),
  updateVendor: (id, body) => request(`/vendors/${id}`, { method: "PATCH", body }),
  deleteVendor: (id) => request(`/vendors/${id}`, { method: "DELETE" }),
  // shared market operations
  getMarketDates: (marketId) => request(`/operations/market-dates${marketId ? `?market_id=${marketId}` : ""}`),
  createMarketDate: (body) => request("/operations/market-dates", { method: "POST", body }),
  updateMarketDate: (id, body) => request(`/operations/market-dates/${id}`, { method: "PATCH", body }),
  getVendorMarkets: (params = {}) => {
    const q = new URLSearchParams(Object.entries(params).filter(([, value]) => value != null && value !== "")).toString();
    return request(`/operations/vendor-markets${q ? `?${q}` : ""}`);
  },
  saveVendorMarket: (vendorId, marketId, body = {}) => request(`/operations/vendor-markets/${vendorId}/${marketId}`, { method: "PUT", body }),
  deleteVendorMarket: (vendorId, marketId) => request(`/operations/vendor-markets/${vendorId}/${marketId}`, { method: "DELETE" }),
  getApprovals: (params = {}) => {
    const q = new URLSearchParams(Object.entries(params).filter(([, value]) => value != null && value !== "")).toString();
    return request(`/operations/approvals${q ? `?${q}` : ""}`);
  },
  createApproval: (body) => request("/operations/approvals", { method: "POST", body }),
  updateApproval: (id, body) => request(`/operations/approvals/${id}`, { method: "PATCH", body }),
  approveApplication: (id) => request(`/operations/approvals/${id}/approve`, { method: "POST" }),
  sendPaymentReminder: (id) => request(`/operations/approvals/${id}/reminder`, { method: "POST" }),
  recordPayment: (id, payment_method) => request(`/operations/approvals/${id}/record-payment`, { method: "POST", body: { payment_method } }),
  getLayouts: (marketDateId) => request(`/operations/layouts?market_date_id=${marketDateId}`),
  createLayout: (body) => request("/operations/layouts", { method: "POST", body }),
  updateLayout: (id, body) => request(`/operations/layouts/${id}`, { method: "PUT", body }),
  // billing
  getBilling: () => request("/billing"),
  checkout: (plan_code) => request("/billing/checkout", { method: "POST", body: { plan_code } }),
  activatePlan: (plan_code) => request("/billing/activate", { method: "POST", body: { plan_code } }),
  cancelPlan: () => request("/billing/cancel", { method: "POST" }),
};
