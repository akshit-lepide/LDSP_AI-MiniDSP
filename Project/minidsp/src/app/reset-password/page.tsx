"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirmedPassword, setConfirmedPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) setReady(Boolean(data.session));
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setReady(Boolean(session));
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (password !== confirmedPassword) {
      setError("The passwords do not match.");
      return;
    }
    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }

    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setPassword("");
    setConfirmedPassword("");
    setNotice("Password updated. You can sign in with your new password.");
  }

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="reset-title">
        <Link className="brand-lockup" href="/" aria-label="MiniDSP home">
          <span className="brand-mark" aria-hidden="true">M</span>
          <span>Mini<span className="brand-light">DSP</span></span>
        </Link>
        <p className="eyebrow">ACCOUNT RECOVERY</p>
        <h1 id="reset-title">Choose a new password</h1>
        <p className="auth-copy">Set a new password for your MiniDSP account.</p>
        {!ready && <p className="error-message" role="alert">This recovery link is invalid or expired. Request a new link from the sign-in page.</p>}
        {ready && !notice && <form className="auth-form" onSubmit={submit}>
          <div className="lp-input lp-input--full-width"><div className="lp-input__row lp-input__row--label-top"><label className="lp-input__label" htmlFor="new-password">New password</label><div className="lp-input__field"><input className="lp-input__input" id="new-password" type="password" minLength={8} autoComplete="new-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></div></div><div className="lp-input__message">Use at least 8 characters.</div></div>
          <div className="lp-input lp-input--full-width"><div className="lp-input__row lp-input__row--label-top"><label className="lp-input__label" htmlFor="confirm-password">Confirm new password</label><div className="lp-input__field"><input className="lp-input__input" id="confirm-password" type="password" minLength={8} autoComplete="new-password" required value={confirmedPassword} onChange={(event) => setConfirmedPassword(event.target.value)} /></div></div></div>
          <button className="lp-button lp-button--primary lp-button--md lp-button--full-width" disabled={busy}>{busy ? "Updating..." : "Update password"}</button>
        </form>}
        {notice && <p className="notice" role="status">{notice}</p>}
        {error && ready && <p className="error-message" role="alert">{error}</p>}
        <p className="auth-switch"><Link className="text-action" href="/">Back to sign in</Link></p>
      </section>
    </main>
  );
}