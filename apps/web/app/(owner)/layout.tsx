import type { ReactNode } from "react";

/** Surface A shell — centered mobile column on paper; screens self-manage padding. */
export default function OwnerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-[440px] bg-paper">
      {children}
    </div>
  );
}
