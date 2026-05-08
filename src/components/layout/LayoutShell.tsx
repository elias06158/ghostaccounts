"use client";

import { usePathname } from "next/navigation";

interface LayoutShellProps {
  footer: React.ReactNode;
  children: React.ReactNode;
  locale: string;
}

export function LayoutShell({ footer, children, locale }: LayoutShellProps) {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith(`/${locale}/dashboard`);

  return (
    <>
      <main className="flex-1">{children}</main>
      {!isDashboard && footer}
    </>
  );
}
