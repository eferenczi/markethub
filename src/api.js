// Talks to the MarketHub backend. Point VITE_API_URL at your API in a .env file
// (see .env.example). Defaults to http://localhost:4000 for local development.
const BASE = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "");
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
    throw new Error(`Can't reach the API at ${BASE}. Is the backend running and CORS set?`);
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
  // billing
  getBilling: () => request("/billing"),
  checkout: (plan_code) => request("/billing/checkout", { method: "POST", body: { plan_code } }),
  activatePlan: (plan_code) => request("/billing/activate", { method: "POST", body: { plan_code } }),
  cancelPlan: () => request("/billing/cancel", { method: "POST" }),
};
