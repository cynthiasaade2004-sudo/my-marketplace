"use client";
import { useActionState } from "react";

export default function AuthForm({ action, signup }) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction}>
      {signup && <input name="name" placeholder="Business / your name" required />}
      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Password" minLength={8} required />
      {state?.error && <p className="error">{state.error}</p>}
      <button disabled={pending}>{signup ? "Sign up" : "Log in"}</button>
    </form>
  );
}
