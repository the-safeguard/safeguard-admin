import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LogoMark } from "@the-safeguard-ai/ui/brand";
import { useAuth } from "../auth/AuthContext";
import { acceptInvite, previewInvite, type InvitePreview } from "../lib/api";

export function AcceptInvite() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";

  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoadError("This invite link is missing its token.");
      return;
    }
    previewInvite(token)
      .then(setPreview)
      .catch(() =>
        setLoadError("This invite is invalid, already used, or has expired. Ask an admin to resend it."),
      );
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords don't match.");
    setBusy(true);
    try {
      await acceptInvite(token, password);
      // Hydrate the session through the normal login path, then enter the app.
      await login(preview!.email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not accept the invite.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <LogoMark size={36} />
          <span className="text-2xl font-bold text-foreground">SafeGuard AI</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8">
          {loadError ? (
            <>
              <h1 className="text-xl font-semibold text-foreground mb-2">Invite unavailable</h1>
              <p className="text-sm text-muted-foreground mb-6">{loadError}</p>
              <button onClick={() => navigate("/login")} className="w-full py-2.5 rounded-lg border border-border text-foreground hover:bg-muted/50">
                Go to sign in
              </button>
            </>
          ) : !preview ? (
            <p className="text-sm text-muted-foreground">Loading invite…</p>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-foreground mb-1">
                Join {preview.orgName}
              </h1>
              <p className="text-sm text-muted-foreground mb-6">
                You've been invited as <span className="text-foreground">{preview.email}</span>. Set a
                password to activate your account.
              </p>

              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" required className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Confirm password</label>
                  <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" required className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50" />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <button type="submit" disabled={busy} className="w-full py-2.5 rounded-lg bg-accent text-accent-foreground font-medium hover:bg-accent/90 transition-colors disabled:opacity-60">
                  {busy ? "Setting up…" : "Activate account"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
