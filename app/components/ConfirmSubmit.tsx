"use client";

import type { ReactNode } from "react";

export default function ConfirmSubmit({
  children,
  className,
  message = "Are you sure?",
}: {
  children: ReactNode;
  className?: string;
  message?: string;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
