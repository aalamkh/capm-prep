"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const links = [
  { href: "/", label: "Home" },
  { href: "/today", label: "Today" },
  { href: "/learn", label: "Learn" },
  { href: "/practice", label: "Practice" },
  { href: "/mock", label: "Mock" },
  { href: "/stats", label: "Stats" },
  { href: "/question-bank", label: "Bank" },
  { href: "/bookmarks", label: "Saved" },
];

const moreLinks = [
  { href: "/export", label: "Export" },
  { href: "/about", label: "About" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the mobile menu on route change.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center gap-2 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <GraduationCap className="h-6 w-6" />
          <span>CAPM Prep</span>
        </Link>

        {/* Desktop nav */}
        <nav className="ml-auto hidden items-center gap-1 md:flex md:gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-2.5 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground lg:px-3",
                isActive(link.href)
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
          {moreLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "hidden rounded-md px-2.5 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground lg:inline-block lg:px-3",
                isActive(link.href)
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
          <ThemeToggle />
        </nav>

        {/* Mobile controls */}
        <div className="ml-auto flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((m) => !m)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-muted-foreground hover:bg-accent"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <nav className="border-t bg-background md:hidden">
          <div className="container mx-auto flex flex-col px-4 py-2">
            {[...links, ...moreLinks].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                  isActive(link.href)
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
