"use client";

import { useFormStatus } from "react-dom";

type Props = {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
};

export function SubmitButton({ children, pendingText = "Carregant...", className = "button" }: Props) {
  const { pending } = useFormStatus();

  return (
    <button className={className} type="submit" disabled={pending}>
      {pending ? <span className="button-spinner" aria-hidden="true" /> : null}
      {pending ? pendingText : children}
    </button>
  );
}
