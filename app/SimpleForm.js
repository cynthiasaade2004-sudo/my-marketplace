"use client";
import { useActionState } from "react";

export default function SimpleForm({ action, fields, submit, hidden }) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} key={state?.ok ? Math.random() : "f"}>
      {Object.entries(hidden ?? {}).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      {fields.map((f) =>
        f.area ? (
          <textarea key={f.name} name={f.name} placeholder={f.label} />
        ) : (
          <input key={f.name} name={f.name} placeholder={f.label}
            type={f.type ?? "text"} step={f.step} min={f.min} required={f.required} />
        ),
      )}
      {state?.error && <p className="error">{state.error}</p>}
      <button disabled={pending}>{submit}</button>
    </form>
  );
}
