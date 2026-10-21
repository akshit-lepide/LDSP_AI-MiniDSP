"use client";

import { FormEvent, useState } from "react";
import { useSession } from "@/app/providers";
import { LepideMark } from "@/components/lepide-logo";

type Mode = "sign-in" | "sign-up" | "recovery";

export function SignInPanel() {
  const { configured, signIn, signUp, sendRecovery } = useSession();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
    setNotice("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    try {
      if (mode === "recovery") setNotice(await sendRecovery(email));
      else if (mode === "sign-up") setNotice(await signUp(email, password));
      else setNotice(await signIn(email, password));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Authentication request failed.");
    } finally {
      setBusy(false);
    }
  }

  const heading =
    mode === "sign-in" ? "Sign in to MiniDSP" : mode === "sign-up" ? "Create your account" : "Reset your password";

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="auth-brand">
          <LepideMark size={44} />
          <span className="auth-brand__text">
            Lepide <strong>MiniDSP</strong>
          </span>
        </div>
        <p className="eyebrow">DATA DISCOVERY &amp; CLASSIFICATION</p>
        <h1 id="auth-title">{heading}</h1>
        <p className="auth-copy">
          Scan synthetic files for sensitive data. Findings are stored masked, never as raw values.
        </p>

        {!configured && (
          <div className="lp-message lp-message--warning" role="status">
            <div className="lp-message__content">
              <div className="lp-message__text">
                <div className="lp-message__title">Supabase is not configured</div>
                <div className="lp-message__body">
                  Add your project URL and publishable key to <code>.env.local</code>, then restart the server.
                </div>
              </div>
            </div>
          </div>
        )}

        <form className="auth-form" onSubmit={submit}>
          <div className="lp-input lp-input--full-width">
            <div className="lp-input__row lp-input__row--label-top">
              <label className="lp-input__label" htmlFor="email">
                Email address
              </label>
              <div className="lp-input__field">
                <input
                  className="lp-input__input"
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
            </div>
          </div>

          {mode !== "recovery" && (
            <div className="lp-input lp-input--full-width">
              <div className="lp-input__row lp-input__row--label-top">
                <label className="lp-input__label" htmlFor="password">
                  Password
                </label>
                <div className="lp-input__field">
                  <input
                    className="lp-input__input"
                    id="password"
                    type="password"
                    autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                    minLength={8}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>
              </div>
              <div className="lp-input__message">Use at least 8 characters.</div>
            </div>
          )}

          <button className="lp-button lp-button--primary lp-button--md lp-button--full-width" disabled={busy || !configured}>
            {busy ? "Working…" : mode === "sign-in" ? "Sign in" : mode === "sign-up" ? "Create account" : "Send recovery email"}
          </button>
        </form>

        {notice && (
          <div className="lp-message lp-message--success" role="status">
            <div className="lp-message__content">
              <div className="lp-message__text">
                <div className="lp-message__body">{notice}</div>
              </div>
            </div>
          </div>
        )}
        {error && (
          <div className="lp-message lp-message--error" role="alert">
            <div className="lp-message__content">
              <div className="lp-message__text">
                <div className="lp-message__body">{error}</div>
              </div>
            </div>
          </div>
        )}

        <p className="auth-switch">
          {mode === "sign-in" ? "New to MiniDSP?" : "Already registered?"}{" "}
          <button type="button" className="lp-link lp-link--standalone" onClick={() => switchMode(mode === "sign-in" ? "sign-up" : "sign-in")}>
            {mode === "sign-in" ? "Create an account" : "Sign in"}
          </button>
        </p>
        {mode === "sign-in" && (
          <p className="auth-switch">
            <button type="button" className="lp-link lp-link--standalone" onClick={() => switchMode("recovery")}>
              Forgot password?
            </button>
          </p>
        )}

        <p className="synthetic-note">
          <span className="lp-badge lp-badge--success">
            <span className="lp-badge__dot" />
            Training workspace
          </span>
          Synthetic data only
        </p>
      </section>
    </main>
  );
}
