"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useSession } from "@/app/providers";
import { LepideMark } from "@/components/lepide-logo";
import { SignInPanel } from "@/components/sign-in-panel";

export type PageKey = "dashboard" | "upload" | "findings";

const navItems: { key: PageKey; label: string; href: string; icon: ReactNode }[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
        <path d="M4 4h6v7H4zM14 4h6v4h-6zM14 12h6v8h-6zM4 15h6v5H4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    key: "upload",
    label: "Upload",
    href: "/upload",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
        <path d="M12 16V4m0 0L8 8m4-4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 14v3.5A2.5 2.5 0 0 0 6.5 20h11a2.5 2.5 0 0 0 2.5-2.5V14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    key: "findings",
    label: "Findings",
    href: "/findings",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
        <path d="M5 5h14M5 10h14M5 15h9M5 20h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
];

export function AppShell({
  page,
  title,
  description,
  actions,
  children,
}: {
  page: PageKey;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { ready, userEmail, signOut } = useSession();

  if (!ready) {
    return (
      <main className="boot-screen">
        <span className="lp-spinner lp-spinner--lg" role="status" aria-label="Loading workspace" />
      </main>
    );
  }

  if (!userEmail) return <SignInPanel />;

  const current = navItems.find((item) => item.key === page);

  return (
    <div className="app-shell">
      <nav className="lp-sidebar app-rail" aria-label="Primary">
        <div className="lp-sidebar__header">
          <Link href="/" aria-label="Lepide MiniDSP dashboard">
            <LepideMark size={40} tone="white" />
          </Link>
        </div>
        <ul className="lp-sidebar__items">
          {navItems.map((item) => (
            <li key={item.key}>
              <Link
                href={item.href}
                className={`lp-sidebar__item${item.key === page ? " lp-sidebar__item--active" : ""}`}
                {...(item.key === page ? { "aria-current": "page" as const } : {})}
              >
                <span className="lp-sidebar__icon-box">{item.icon}</span>
                <span className="lp-sidebar__label">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="lp-sidebar__footer">
          <button type="button" className="lp-sidebar__item" onClick={() => void signOut()}>
            <span className="lp-sidebar__icon-box">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
                <path d="M15 17v1.5A2.5 2.5 0 0 1 12.5 21h-6A2.5 2.5 0 0 1 4 18.5v-13A2.5 2.5 0 0 1 6.5 3h6A2.5 2.5 0 0 1 15 5.5V7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10 12h10m0 0-3-3m3 3-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="lp-sidebar__label">Sign out</span>
          </button>
        </div>
      </nav>

      <main className="app-main">
        <div className="app-topline">
          <nav className="lp-breadcrumb" aria-label="Breadcrumb">
            <ol className="lp-breadcrumb__list">
              <li className="lp-breadcrumb__item">
                <Link className="lp-breadcrumb__link" href="/">
                  Lepide MiniDSP
                </Link>
                <span className="lp-breadcrumb__separator" aria-hidden="true">
                  /
                </span>
              </li>
              <li className="lp-breadcrumb__item">
                <span className="lp-breadcrumb__current" aria-current="page">
                  {current?.label ?? title}
                </span>
              </li>
            </ol>
          </nav>
          <span className="app-account" title={userEmail}>
            {userEmail}
          </span>
        </div>

        <header className="page-head">
          <div>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          {actions}
        </header>

        {children}

        <footer className="page-footer">
          <span>Lepide MiniDSP · Training workspace</span>
          <span>Synthetic data only · Findings stored masked</span>
        </footer>
      </main>
    </div>
  );
}
