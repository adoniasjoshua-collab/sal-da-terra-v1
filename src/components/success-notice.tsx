"use client";

import { useEffect, useRef } from "react";

// Confirmation after a redirecting save; brought into view because the submit
// button often sits at the bottom of a long form.
export function SuccessNotice({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ block: "center" });
    ref.current?.focus({ preventScroll: true });
  }, []);
  return <p ref={ref} tabIndex={-1} role="status" className="mb-5 rounded-xl bg-emerald-50 p-4 font-bold text-emerald-700 outline-none">{children}</p>;
}
