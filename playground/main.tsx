import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { SignupForm } from "../examples/basic-form/SignupForm";
import { CounterForm } from "../examples/render-optimized/CounterForm";
import { ZodSignupForm } from "../examples/zod-schema/ZodSignupForm";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ border: "1px solid #ccc", borderRadius: 8, margin: 16, padding: 16, maxWidth: 480 }}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      {children}
    </section>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <main style={{ fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ margin: 16 }}>Form engine playground</h1>
      <p style={{ margin: "0 16px", color: "#555" }}>Open the browser console to see submitted values.</p>
      <Section title="Basic form (required rules, onSubmit)"><SignupForm /></Section>
      <Section title="Zod schema resolver"><ZodSignupForm /></Section>
      <Section title="Render optimization (useWatch)"><CounterForm /></Section>
    </main>
  </StrictMode>
);
