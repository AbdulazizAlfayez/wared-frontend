"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
  Menu, X, Heart, User, LogOut,
  ChevronDown, Shield, Store, LayoutDashboard, Bookmark, MessageSquare, Package, Plus, Calculator,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import LanguageSwitcher from "./LanguageSwitcher";
import NotificationBell from "./NotificationBell";

// ---------------------------------------------------------------------------
// NavLink helpers
// ---------------------------------------------------------------------------

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={`nav-link relative text-sm font-medium transition-colors duration-200 pb-1 ${
        isActive
          ? "text-ink-900 font-semibold"
          : "text-slate-500 hover:text-ink-900"
      }`}
    >
      {children}
      <span
        className={`absolute inset-x-0 -bottom-0.5 h-[2px] bg-accent rounded-full transition-all duration-250 origin-left ${
          isActive ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0 group-hover:scale-x-100"
        }`}
      />
    </Link>
  );
}

function MobileNavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={`block px-4 py-2 rounded-lg transition-colors ${
        isActive
          ? "text-accent font-semibold bg-accent/10"
          : "text-slate-700 hover:text-accent hover:bg-slate-50"
      }`}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Avatar — shows photo if available, otherwise initials
// ---------------------------------------------------------------------------

function UserAvatar({
  name,
  avatarUrl,
  size = "sm",
}: {
  name: string;
  avatarUrl: string | null;
  size?: "sm" | "md";
}) {
  const dim = size === "md" ? "w-9 h-9 text-sm" : "w-7 h-7 text-xs";
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name}
        className={`${dim} rounded-full object-cover ring-2 ring-accent/20`}
      />
    );
  }

  return (
    <span
      className={`${dim} rounded-full bg-accent/10 text-accent font-semibold flex items-center justify-center`}
    >
      {initials || <User className="w-4 h-4" />}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function MessagesIcon() {
  const { t } = useTranslation();
  const [unread, setUnread] = useState(0);

  const fetchUnread = useCallback(async () => {
    try {
      const data = await api.get<{ unread_total: number }>("/api/conversations/unread-total/");
      setUnread(data.unread_total ?? 0);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30_000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  return (
    <Link
      href="/messages"
      className="relative p-2 text-slate-600 hover:text-accent hover:bg-slate-100 rounded-lg transition-colors"
      aria-label={t("nav.messages")}
    >
      <MessageSquare className="w-5 h-5" />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}

export default function Header() {
  const { isAuthenticated, isLoading, role, user, logout } = useAuth();
  const { t, dir, locale } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12);

      // Detect if nav overlaps a dark section
      const header = document.querySelector(".site-header");
      if (!header) return;
      const navBottom = header.getBoundingClientRect().bottom;
      const darkSections = document.querySelectorAll(
        ".section.dark, .mk-bigstats, .hero-section, [style*=\"background: var(--mk-ink)\"], [style*=\"background:var(--mk-ink)\"]"
      );
      let overDark = false;
      darkSections.forEach((s) => {
        const r = s.getBoundingClientRect();
        if (r.top < navBottom && r.bottom > navBottom) overDark = true;
      });
      setIsDark(overDark);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // run once on mount
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isAdmin = role === "admin";
  const isImporter = role === "importer";
  const isDashboardUser = isImporter || isAdmin;

  return (
    <header
      className={`site-header fixed top-0 left-0 right-0 z-[9999] transition-all duration-300
        ${isDark ? "is-dark" : ""}
        ${scrolled && !isDark
          ? "bg-white/96 backdrop-blur-xl border-b border-slate-100 shadow-[0_1px_24px_rgba(0,0,0,0.06)]"
          : !isDark ? "bg-white/90 backdrop-blur-md border-b border-transparent shadow-none" : ""
        }`}
      style={{ direction: dir, zIndex: 9999 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center gap-6 transition-all duration-300 ${scrolled ? "h-16" : "h-20"}`}>
          {/* Logo — scroll-aware white/black swap */}
          <Link href="/" aria-label="Wared" className="relative flex-shrink-0 block h-8">
            <Image
              src="/wared-logo-white.png"
              alt="Wared"
              width={831}
              height={480}
              priority
              className={`h-8 w-auto transition-opacity duration-300 ${isDark ? "opacity-100" : "opacity-0"}`}
            />
            <Image
              src="/wared-logo-black.png"
              alt="Wared"
              width={831}
              height={480}
              className={`absolute inset-0 h-8 w-auto transition-opacity duration-300 ${isDark ? "opacity-0" : "opacity-100"}`}
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="nav hidden md:flex items-center gap-6 flex-shrink-0">
            <NavLink href="/browse">{t("nav.browse")}</NavLink>
            <NavLink href="/browse/map">{t("nav.worldMap")}</NavLink>
            <NavLink href="/importers">{t("nav.importers")}</NavLink>
            <NavLink href="/calculator">{t("nav.calculator")}</NavLink>
            <NavLink href="/how-it-works">{t("nav.howItWorks")}</NavLink>
            {isDashboardUser && <NavLink href="/dashboard">{t("nav.dashboard")}</NavLink>}
            {isImporter && <NavLink href="/dashboard/importer/list-car">{t("nav.listCar")}</NavLink>}
            {isAdmin && <NavLink href="/admin">{t("nav.admin")}</NavLink>}
          </nav>

          {/* Header Actions */}
          <div
            className="header-actions flex items-center gap-3"
            style={{ marginInlineStart: "auto" }}
          >
            <LanguageSwitcher />

            {/* Desktop Auth/User Actions */}
            <div className="hidden md:flex items-center gap-3">
              {isLoading ? (
                <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
              ) : isAuthenticated && user ? (
                <>
                  {isImporter ? (
                    <>
                      <Link
                        href="/dashboard/importer/list-car"
                        className="p-2 text-slate-600 hover:text-accent hover:bg-slate-100 rounded-lg transition-colors"
                        title={t("nav.listNewCar")}
                      >
                        <Plus className="w-5 h-5" />
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/orders"
                        className="p-2 text-slate-600 hover:text-accent hover:bg-slate-100 rounded-lg transition-colors"
                        title={t("nav.myOrders")}
                      >
                        <Package className="w-5 h-5" />
                      </Link>
                      <Link
                        href="/favorites"
                        className="p-2 text-slate-600 hover:text-accent hover:bg-slate-100 rounded-lg transition-colors"
                        title={t("nav.favorites")}
                      >
                        <Heart className="w-5 h-5" />
                      </Link>
                    </>
                  )}
                  <MessagesIcon />
                  <NotificationBell />

                  {/* User Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <UserAvatar name={user.name} avatarUrl={user.avatar_url} />
                      <span className="hidden lg:block text-sm font-medium text-slate-700 max-w-[120px] truncate">
                        {user.name.split(" ")[0]}
                      </span>
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    </button>

                    {isUserMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0"
                          onClick={() => setIsUserMenuOpen(false)}
                        />
                        <div
                          className="absolute mt-2 w-60 bg-white rounded-2xl shadow-card-elevated border border-slate-100/80 overflow-hidden animate-scale-in"
                          style={{ insetInlineEnd: 0, direction: dir, zIndex: 9999 }}
                        >
                          {/* User info header */}
                          <div className="px-4 py-3.5 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
                            <p className="text-sm font-semibold text-ink-900 truncate font-display">
                              {user.name}
                            </p>
                            <p className="text-xs text-slate-400 truncate mt-0.5">{user.email}</p>
                          </div>

                          <Link
                            href="/profile"
                            className="flex items-center gap-2 px-4 py-3 text-slate-700 hover:text-accent hover:bg-slate-50 transition-colors"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <User className="w-4 h-4" />
                            <span>{t("nav.profile")}</span>
                          </Link>

                          {isImporter ? (
                            <>
                              <Link
                                href="/dashboard/importer"
                                className="flex items-center gap-2 px-4 py-3 text-accent hover:text-accent-600 hover:bg-accent/5 transition-colors"
                                onClick={() => setIsUserMenuOpen(false)}
                              >
                                <LayoutDashboard className="w-4 h-4" />
                                <span>{t("nav.importerDashboard")}</span>
                              </Link>
                              <Link
                                href="/dashboard/importer/list-car"
                                className="flex items-center gap-2 px-4 py-3 text-slate-700 hover:text-accent hover:bg-slate-50 transition-colors"
                                onClick={() => setIsUserMenuOpen(false)}
                              >
                                <Plus className="w-4 h-4" />
                                <span>{t("nav.listNewCar")}</span>
                              </Link>
                              <Link
                                href="/dashboard/importer/orders"
                                className="flex items-center gap-2 px-4 py-3 text-slate-700 hover:text-accent hover:bg-slate-50 transition-colors"
                                onClick={() => setIsUserMenuOpen(false)}
                              >
                                <Package className="w-4 h-4" />
                                <span>{t("nav.manageOrders")}</span>
                              </Link>
                            </>
                          ) : (
                            <>
                              <Link
                                href="/orders"
                                className="flex items-center gap-2 px-4 py-3 text-slate-700 hover:text-accent hover:bg-slate-50 transition-colors"
                                onClick={() => setIsUserMenuOpen(false)}
                              >
                                <Package className="w-4 h-4" />
                                <span>{t("nav.myOrders")}</span>
                              </Link>
                              <Link
                                href="/saved-searches"
                                className="flex items-center gap-2 px-4 py-3 text-slate-700 hover:text-accent hover:bg-slate-50 transition-colors"
                                onClick={() => setIsUserMenuOpen(false)}
                              >
                                <Bookmark className="w-4 h-4" />
                                <span>{t("nav.savedSearches")}</span>
                              </Link>
                              {isImporter && (
                                <Link
                                  href="/dashboard"
                                  className="flex items-center gap-2 px-4 py-3 text-accent hover:text-accent-600 hover:bg-accent/5 transition-colors"
                                  onClick={() => setIsUserMenuOpen(false)}
                                >
                                  <LayoutDashboard className="w-4 h-4" />
                                  <span>{t("nav.dashboard")}</span>
                                </Link>
                              )}
                              {role === "user" && (
                                <Link
                                  href="/become-importer"
                                  className="flex items-center gap-2 px-4 py-3 text-amber-700 hover:text-amber-800 hover:bg-amber-50 transition-colors"
                                  onClick={() => setIsUserMenuOpen(false)}
                                >
                                  <Store className="w-4 h-4" />
                                  <span>{t("nav.becomeAnImporter")}</span>
                                </Link>
                              )}
                            </>
                          )}

                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              logout();
                            }}
                            className="flex items-center gap-2 px-4 py-3 text-slate-700 hover:text-accent hover:bg-slate-50 transition-colors w-full border-t border-slate-100"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>{t("nav.signOut")}</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Link
                    href="/auth/signin"
                    className="px-4 py-2 text-sm text-slate-600 hover:text-ink-900 font-medium transition-colors rounded-lg hover:bg-slate-50"
                  >
                    {t("nav.signIn")}
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="auth-btn px-4 py-2 text-sm bg-accent hover:bg-accent-600 text-white rounded-xl font-semibold shadow-accent-sm hover:shadow-accent transition-all hover:-translate-y-0.5"
                  >
                    {t("nav.signUp") || "Sign Up"}
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-accent hover:bg-slate-100 rounded-lg"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div
            className="md:hidden py-4 border-t border-slate-200"
            style={{ direction: dir }}
          >
            {/* User info strip (mobile) */}
            {isAuthenticated && user && (
              <div className="flex items-center gap-3 px-4 py-3 mb-2 bg-slate-50 rounded-xl">
                <UserAvatar name={user.name} avatarUrl={user.avatar_url} size="md" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                </div>
              </div>
            )}

            <nav className="flex flex-col space-y-1">
              {/* Public links */}
              <MobileNavLink href="/browse" onClick={() => setIsMobileMenuOpen(false)}>
                {t("nav.browse")}
              </MobileNavLink>
              <MobileNavLink href="/importers" onClick={() => setIsMobileMenuOpen(false)}>
                {t("nav.importers")}
              </MobileNavLink>
              <MobileNavLink href="/calculator" onClick={() => setIsMobileMenuOpen(false)}>
                <span className="flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  {t("nav.calculator")}
                </span>
              </MobileNavLink>
              <MobileNavLink href="/how-it-works" onClick={() => setIsMobileMenuOpen(false)}>
                {t("nav.howItWorks")}
              </MobileNavLink>

              {/* Dashboard (importer/dealer/admin) */}
              {isDashboardUser && (
                <MobileNavLink href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                  <span className="flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    {t("nav.dashboard")}
                  </span>
                </MobileNavLink>
              )}
              {isImporter && (
                <MobileNavLink href="/dashboard/importer/list-car" onClick={() => setIsMobileMenuOpen(false)}>
                  <span className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    {t("nav.listNewCar")}
                  </span>
                </MobileNavLink>
              )}
              {isAdmin && (
                <MobileNavLink href="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                  <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    {t("nav.admin")}
                  </span>
                </MobileNavLink>
              )}

              <div className="pt-2 border-t border-slate-100">
                {isAuthenticated ? (
                  <>
                    {isImporter ? (
                      <MobileNavLink href="/dashboard/importer/orders" onClick={() => setIsMobileMenuOpen(false)}>
                        <span className="flex items-center gap-2">
                          <Package className="w-5 h-5" />
                          {t("nav.manageOrders")}
                        </span>
                      </MobileNavLink>
                    ) : (
                      <>
                        <MobileNavLink href="/orders" onClick={() => setIsMobileMenuOpen(false)}>
                          <span className="flex items-center gap-2">
                            <Package className="w-5 h-5" />
                            {t("nav.myOrders")}
                          </span>
                        </MobileNavLink>
                        <MobileNavLink href="/favorites" onClick={() => setIsMobileMenuOpen(false)}>
                          <span className="flex items-center gap-2">
                            <Heart className="w-5 h-5" />
                            {t("nav.favorites")}
                          </span>
                        </MobileNavLink>
                      </>
                    )}
                    <MobileNavLink href="/messages" onClick={() => setIsMobileMenuOpen(false)}>
                      <span className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        {t("nav.messages")}
                      </span>
                    </MobileNavLink>
                    <MobileNavLink href="/profile" onClick={() => setIsMobileMenuOpen(false)}>
                      <span className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        {t("nav.profile")}
                      </span>
                    </MobileNavLink>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        logout();
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:text-accent hover:bg-slate-50 rounded-lg w-full transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>{t("nav.signOut")}</span>
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2 px-2">
                    <Link
                      href="/auth/signin"
                      className="py-2.5 text-center text-slate-700 hover:text-accent font-medium rounded-lg hover:bg-slate-50 transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {t("nav.signIn")}
                    </Link>
                    <Link
                      href="/auth/signup"
                      className="py-2.5 bg-accent hover:bg-accent-600 text-white rounded-xl font-semibold text-center transition-all shadow-accent-sm"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {t("nav.signUp") || "Sign Up"}
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
