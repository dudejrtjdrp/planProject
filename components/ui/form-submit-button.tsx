"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

type FormSubmitButtonProps = {
  idleText: ReactNode;
  pendingText: ReactNode;
  className: string;
  disabled?: boolean;
};

export function FormSubmitButton({ idleText, pendingText, className, disabled }: FormSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending || disabled} className={className}>
      {pending ? pendingText : idleText}
    </button>
  );
}
