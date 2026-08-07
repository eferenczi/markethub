import React, { createContext, useContext, useEffect, useState } from "react";
import { Store, LogOut, Settings, Loader2, ArrowLeft, Database, CreditCard } from "lucide-react";
import { api, setToken, getToken } from "./api";
import { C, FD, FB } from "./theme";

/* ------------------------------------------------------------------ */
/*  Auth context                                                       */
/* ------------------------------------------------------------------ */
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!getToken()) return setLoading(false);
      try {
        const { user } = await api.me();
        setUser(user);
      } catch {
        setToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email, password) => {
    const { token, user } = await api.login(email, password);
    setToken(token);
    setUser(user);
  };
  const register = async (payload) => {
    const { token, user } = await api.register(payload);
    setToken(token);
    setUser(user);
  };
  const logout = () => {
    setToken(null);
    setUser(null);
  };

  // Let the embedded console's own "Log out" button trigger the real logout.
  useEffect(() => {
    window.__mhLogout = logout;
    return () => { delete window.__mhLogout; };
  }, []);

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

/* ------------------------------------------------------------------ */
/*  Shared UI bits                                                     */
/* ------------------------------------------------------------------ */
const inp = { background: C.card, border: `1px solid ${C.line}`, color: C.ink };

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span style={{ color: C.faint }} className="text-[11px] font-bold uppercase tracking-wide">{label}</span>
      <input {...props} style={inp} className="w-full mt-1 px-3.5 py-2.5 rounded-lg text-[14px] outline-none" />
    </label>
  );
}

function PrimaryBtn({ busy, children, ...props }) {
  return (
    <button {...props} disabled={busy || props.disabled} style={{ background: C.pine, color: "#fff", opacity: busy || props.disabled ? 0.6 : 1 }} className="w-full py-2.5 rounded-lg text-[14px] font-bold flex items-center justify-center gap-2">
      {busy && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}

function Wordmark() {
  return (
    <div className="flex items-center gap-2 justify-center mb-1">
      <div style={{ background: C.pine }} className="w-9 h-9 rounded-xl flex items-center justify-center">
        <Store size={18} color={C.honey} />
      </div>
      <span style={{ fontFamily: FD, fontWeight: 600 }} className="text-[22px]">MarketHub</span>
    </div>
  );
}

function Shell({ children }) {
  return (
    <div style={{ background: C.paper, minHeight: "100vh", fontFamily: FB, color: C.ink }} className="flex items-center justify-center p-4">
      <div style={{ background: C.card, border: `1px solid ${C.line}`, width: 400, maxWidth: "100%", borderRadius: 20, boxShadow: "0 24px 60px -30px rgba(0,0,0,.35)" }} className="p-6">
        {children}
      </div>
    </div>
  );
}

function ErrorNote({ children }) {
  if (!children) return null;
  return <p style={{ background: C.dangerSoft, color: C.danger }} className="text-[12.5px] font-medium rounded-lg px-3 py-2 mb-3">{children}</p>;
}

/* ------------------------------------------------------------------ */
/*  Auth screens (login / register / forgot)                           */
/* ------------------------------------------------------------------ */
export function AuthScreens() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login"); // login | register | forgot
  const [f, setF] = useState({ orgName: "", name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    setErr("");
    setBusy(true);
    try {
      if (mode === "login") await login(f.email, f.password);
      else if (mode === "register") await register({ orgName: f.orgName, name: f.name, email: f.email, password: f.password });
      else {
        await api.forgot(f.email);
        setSent(true);
      }
    } catch (e) {
      setErr(e.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const onKey = (e) => e.key === "Enter" && submit();

  return (
    <Shell>
      <Wordmark />
      <p style={{ color: C.sub }} className="text-center text-[13px] mb-5">
        {mode === "login" ? "Sign in to your organizer console" : mode === "register" ? "Create your organization" : "Reset your password"}
      </p>

      <ErrorNote>{err}</ErrorNote>

      {mode === "forgot" && sent ? (
        <div>
          <p style={{ background: C.sageSoft, color: C.pine }} className="text-[13px] rounded-lg px-3 py-2.5 mb-4">
            If that email exists, a reset link is on its way. Check your inbox (or the API server console in dev).
          </p>
          <button onClick={() => { setMode("login"); setSent(false); }} style={{ color: C.pine }} className="text-[13px] font-bold">← Back to sign in</button>
        </div>
      ) : (
        <div className="flex flex-col gap-3" onKeyDown={onKey}>
          {mode === "register" && <Field label="Organization name" value={f.orgName} onChange={(e) => set("orgName", e.target.value)} placeholder="Central Makers Markets" />}
          {mode === "register" && <Field label="Your name" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Jordan Rivera" />}
          <Field label="Email" type="email" value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" />
          {mode !== "forgot" && <Field label="Password" type="password" value={f.password} onChange={(e) => set("password", e.target.value)} placeholder={mode === "register" ? "At least 8 characters" : "••••••••"} />}

          <PrimaryBtn busy={busy} onClick={submit}>
            {mode === "login" ? "Sign in" : mode === "register" ? "Create organization" : "Send reset link"}
          </PrimaryBtn>
        </div>
      )}

      {!sent && (
        <div className="mt-4 text-center text-[12.5px]" style={{ color: C.sub }}>
          {mode === "login" && (
            <>
              <button onClick={() => { setMode("forgot"); setErr(""); }} style={{ color: C.pine }} className="font-semibold">Forgot password?</button>
              <span className="mx-2">·</span>
              <button onClick={() => { setMode("register"); setErr(""); }} style={{ color: C.pine }} className="font-semibold">Create an organization</button>
            </>
          )}
          {mode !== "login" && (
            <button onClick={() => { setMode("login"); setErr(""); }} style={{ color: C.pine }} className="font-semibold">← Back to sign in</button>
          )}
        </div>
      )}
    </Shell>
  );
}

/* ------------------------------------------------------------------ */
/*  Reset password screen (from the emailed link)                      */
/* ------------------------------------------------------------------ */
export function ResetPassword({ token }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  const submit = async () => {
    setErr("");
    if (pw.length < 8) return setErr("Password must be at least 8 characters");
    if (pw !== pw2) return setErr("Passwords don't match");
    setBusy(true);
    try {
      await api.reset(token, pw);
      setDone(true);
    } catch (e) {
      setErr(e.message || "This link is invalid or expired");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell>
      <Wordmark />
      <p style={{ color: C.sub }} className="text-center text-[13px] mb-5">Choose a new password</p>
      <ErrorNote>{err}</ErrorNote>
      {done ? (
        <div>
          <p style={{ background: C.sageSoft, color: C.pine }} className="text-[13px] rounded-lg px-3 py-2.5 mb-4">Password set. You can sign in now.</p>
          <a href="/" style={{ color: C.pine }} className="text-[13px] font-bold">← Go to sign in</a>
        </div>
      ) : !token ? (
        <p style={{ color: C.danger }} className="text-[13px]">Missing reset token. Use the link from your email.</p>
      ) : (
        <div className="flex flex-col gap-3" onKeyDown={(e) => e.key === "Enter" && submit()}>
          <Field label="New password" type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="At least 8 characters" />
          <Field label="Confirm password" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="Re-enter password" />
          <PrimaryBtn busy={busy} onClick={submit}>Set password</PrimaryBtn>
        </div>
      )}
    </Shell>
  );
}

/* ------------------------------------------------------------------ */
/*  Account bar (shown above the app when signed in)                   */
/* ------------------------------------------------------------------ */
export function AccountBar({ user, org, billing, onSettings, onRecords, onBilling, onLogout, showBack, onBack }) {
  const canSettings = user.role === "owner" || user.role === "manager";
  const trialLeft = billing && billing.status === "trialing" ? billing.trial_days_left : null;
  return (
    <div style={{ background: C.card, borderBottom: `1px solid ${C.line}`, fontFamily: FB }} className="w-full flex items-center gap-3 px-4 py-2.5">
      {showBack ? (
        <button onClick={onBack} style={{ color: C.sub }} className="flex items-center gap-1.5 text-[13px] font-semibold"><ArrowLeft size={15} /> Back to console</button>
      ) : (
        <div className="flex items-center gap-2">
          <div style={{ background: C.pine }} className="w-7 h-7 rounded-lg flex items-center justify-center"><Store size={14} color={C.honey} /></div>
          <span style={{ fontFamily: FD, fontWeight: 600 }} className="text-[15px]">MarketHub</span>
          {org && <span style={{ color: C.faint }} className="text-[12.5px] hidden sm:inline">· {org.name}</span>}
        </div>
      )}
      <div className="flex-1" />
      {trialLeft != null && (
        <button onClick={onBilling} style={{ background: C.honeySoft, color: C.honeyDeep }} className="text-[11.5px] font-bold px-2.5 py-1 rounded-full hidden sm:inline">Trial · {trialLeft}d left</button>
      )}
      <span style={{ background: C.paper2, color: C.sub }} className="text-[11px] font-bold px-2 py-1 rounded-full capitalize">{user.role}</span>
      <span style={{ color: C.sub }} className="text-[12.5px] hidden sm:inline">{user.name}</span>
      {!showBack && (
        <button onClick={onRecords} style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3 py-1.5 rounded-lg"><Database size={14} /> Records</button>
      )}
      {canSettings && !showBack && (
        <>
          <button onClick={onBilling} style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3 py-1.5 rounded-lg"><CreditCard size={14} /> Billing</button>
          <button onClick={onSettings} style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3 py-1.5 rounded-lg"><Settings size={14} /> Settings</button>
        </>
      )}
      <button onClick={onLogout} style={{ background: C.card, border: `1px solid ${C.line}`, color: C.danger }} className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3 py-1.5 rounded-lg"><LogOut size={14} /> Log out</button>
    </div>
  );
}
