import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogoMark } from "@the-safeguard/ui/brand";
import { useAuth } from "../auth/AuthContext";
import { register as apiRegister } from "../lib/api";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [orgName, setOrgName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "register") {
        await apiRegister(orgName, name, email, password);
        // register sets token; refresh session via login state
        await login(email, password);
      } else {
        await login(email, password);
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-dvh w-full flex items-center justify-center bg-background px-4 py-10 overflow-hidden">
      {/* Full-bleed accent glow so the page reads as intentional, not a flat gray slab. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_40rem_at_50%_-10%,color-mix(in_oklch,var(--accent)_22%,transparent),transparent)]"
      />
      <div className="relative w-full max-w-md">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <LogoMark size={36} />
          <span className="text-2xl font-bold text-foreground">SafeGuard AI</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8">
          <h1 className="text-xl font-semibold text-foreground mb-1">
            {mode === "login" ? "Sign in" : "Create your organization"}
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            {mode === "login"
              ? "Access your governance dashboard"
              : "Set up SafeGuard for your team"}
          </p>

          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <>
                <Field label="Organization" value={orgName} onChange={setOrgName} placeholder="Acme Inc" />
                <Field label="Your name" value={name} onChange={setName} placeholder="Jane Smith" />
              </>
            )}
            <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@company.com" />
            <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-2.5 rounded-lg bg-accent text-accent-foreground font-medium hover:bg-accent/90 transition-colors disabled:opacity-60"
            >
              {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          <button
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground"
          >
            {mode === "login" ? "Need an account? Register" : "Have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
      />
    </div>
  );
}
