"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import { useAuth, parseApiError } from "@/lib/auth-context";
import { api } from "@/lib/api";
import Link from "next/link";
import {
  User, Loader2, ArrowRight, Mail, Phone, Save, CheckCircle,
  Camera, Lock, Eye, EyeOff, Globe, EyeOff as EyeOffIcon,
  Bookmark,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : "";
}

export default function ProfilePage() {
  const { t, dir } = useTranslation();
  const { isAuthenticated, isLoading: authLoading, user, refreshUser } = useAuth();

  // Profile fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [showPhone, setShowPhone] = useState(true);
  const [showEmail, setShowEmail] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [initialized, setInitialized] = useState(false);

  // Avatar
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Change password
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [isChangingPw, setIsChangingPw] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState("");

  // Active tab
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "saved">("profile");

  useEffect(() => {
    if (user && !initialized) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setBio((user as { bio?: string }).bio || "");
      setShowPhone((user as { show_phone?: boolean }).show_phone ?? true);
      setShowEmail((user as { show_email?: boolean }).show_email ?? false);
      setInitialized(true);
    }
  }, [user, initialized]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setProfileError("");
    try {
      await api.patch("/api/me/", {
        name,
        phone,
        bio,
        show_phone: showPhone,
        show_email: showEmail,
      });
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setProfileError(parseApiError(err, "Failed to save profile. Please try again."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    // Upload
    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const csrf = getCookie("csrftoken");
      const res = await fetch(`${BASE_URL}/api/me/`, {
        method: "PATCH",
        credentials: "include",
        headers: { ...(csrf ? { "X-CSRFToken": csrf } : {}) },
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      await refreshUser();
    } catch {
      setAvatarPreview(null);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    if (newPassword !== confirmPassword) {
      setPwError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setPwError("Password must be at least 8 characters.");
      return;
    }
    setIsChangingPw(true);
    try {
      await api.post("/api/auth/change-password/", {
        current_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setPwSaved(true);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPwSaved(false), 4000);
    } catch (err) {
      setPwError(parseApiError(err, "Failed to change password. Check your current password."));
    } finally {
      setIsChangingPw(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 text-center py-20">
          <User className="w-16 h-16 text-slate-300 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-slate-900 mb-4">{t("profile.signInRequired")}</h1>
          <p className="text-slate-500 mb-8">{t("profile.signInMessage")}</p>
          <Link
            href="/auth/signin"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-600 text-white rounded-xl font-medium transition-colors"
          >
            {t("nav.signIn")} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const currentAvatar = avatarPreview || user.avatar_url;

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`mb-8 ${dir === "rtl" ? "text-right" : ""}`}>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">{t("profile.title")}</h1>
          <p className="text-slate-500">{t("profile.subtitle")}</p>
        </div>

        {/* Avatar card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
          <div className={`flex items-center gap-4 ${dir === "rtl" ? "flex-row-reverse" : ""}`}>
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center ring-4 ring-white shadow-md">
                {currentAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={currentAvatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-slate-400" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute bottom-0 right-0 w-7 h-7 bg-accent hover:bg-accent-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                aria-label="Change avatar"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <div className={dir === "rtl" ? "text-right" : ""}>
              <h2 className="text-xl font-semibold text-slate-900">{user.name || "User"}</h2>
              <p className="text-slate-500 text-sm" dir="ltr">{user.email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 bg-accent/10 text-accent text-xs font-medium rounded-full capitalize">
                {user.role}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white rounded-2xl border border-slate-100 p-1 mb-6 gap-1">
          {(["profile", "security", "saved"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-colors capitalize ${
                activeTab === tab
                  ? "bg-accent text-white"
                  : "text-slate-600 hover:text-accent hover:bg-slate-50"
              }`}
            >
              {tab === "profile" ? "Profile" : tab === "security" ? "Security" : "Saved"}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            {profileError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {profileError}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">{t("profile.fullName")}</label>
                <div className="relative">
                  <User className="absolute top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" style={{ insetInlineStart: "0.75rem" }} />
                  <input
                    type="text" value={name} onChange={(e) => setName(e.target.value)}
                    placeholder={t("profile.namePlaceholder")}
                    className="w-full py-3 border border-slate-200 rounded-xl text-slate-900 bg-white placeholder-slate-400 focus:border-accent focus:ring-1 focus:ring-accent"
                    style={{ paddingInlineStart: "2.5rem", paddingInlineEnd: "1rem" }}
                  />
                </div>
              </div>

              {/* Email (read-only) */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">{t("profile.emailAddress")}</label>
                <div className="relative">
                  <Mail className="absolute top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" style={{ insetInlineStart: "0.75rem" }} />
                  <input
                    type="email" value={user.email} disabled dir="ltr"
                    className="w-full py-3 border border-slate-200 rounded-xl text-slate-500 bg-slate-50 cursor-not-allowed"
                    style={{ paddingInlineStart: "2.5rem", paddingInlineEnd: "1rem" }}
                  />
                </div>
                <p className="text-xs text-slate-400">{t("profile.emailCannotChange")}</p>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">{t("profile.phoneNumber")}</label>
                <div className="relative">
                  <Phone className="absolute top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" style={{ insetInlineStart: "0.75rem" }} />
                  <input
                    type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                    placeholder={t("profile.phonePlaceholder")} dir="ltr"
                    className="w-full py-3 border border-slate-200 rounded-xl text-slate-900 bg-white placeholder-slate-400 focus:border-accent focus:ring-1 focus:ring-accent"
                    style={{ paddingInlineStart: "2.5rem", paddingInlineEnd: "1rem" }}
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell others about yourself..."
                  rows={3}
                  maxLength={300}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 bg-white placeholder-slate-400 focus:border-accent focus:ring-1 focus:ring-accent resize-none"
                />
                <p className="text-xs text-slate-400 text-right">{bio.length}/300</p>
              </div>

              {/* Privacy Toggles */}
              <div className="space-y-3 p-4 bg-slate-50 rounded-xl">
                <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Privacy Settings
                </h4>
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-sm font-medium text-slate-800">Show phone number</p>
                    <p className="text-xs text-slate-500">Visible to other users on your listings</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPhone((v) => !v)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${showPhone ? "bg-accent" : "bg-slate-200"}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${showPhone ? "left-5.5" : "left-0.5"}`}
                      style={{ left: showPhone ? "calc(100% - 1.375rem)" : "0.125rem" }} />
                  </button>
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-sm font-medium text-slate-800">Show email address</p>
                    <p className="text-xs text-slate-500">Visible on your public profile</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowEmail((v) => !v)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${showEmail ? "bg-accent" : "bg-slate-200"}`}
                  >
                    <span className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
                      style={{ left: showEmail ? "calc(100% - 1.375rem)" : "0.125rem" }} />
                  </button>
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit" disabled={isSaving}
                className={`w-full py-3 bg-accent hover:bg-accent-600 disabled:bg-accent/50 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${dir === "rtl" ? "flex-row-reverse" : ""}`}
              >
                {isSaving ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /><span>{t("actions.saving")}</span></>
                ) : saved ? (
                  <><CheckCircle className="w-5 h-5" /><span>{t("actions.saved")}</span></>
                ) : (
                  <><Save className="w-5 h-5" /><span>{t("actions.saveChanges")}</span></>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
              <Lock className="w-5 h-5 text-accent" />
              Change Password
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Choose a strong password with at least 8 characters.
            </p>

            {pwError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {pwError}
              </div>
            )}
            {pwSaved && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Password changed successfully!
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              {/* Current password */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Current Password</label>
                <div className="relative">
                  <Lock className="absolute top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" style={{ insetInlineStart: "0.75rem" }} />
                  <input
                    type={showOldPw ? "text" : "password"} value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)} required
                    placeholder="Enter current password"
                    className="w-full py-3 border border-slate-200 rounded-xl text-slate-900 bg-white placeholder-slate-400 focus:border-accent focus:ring-1 focus:ring-accent"
                    style={{ paddingInlineStart: "2.5rem", paddingInlineEnd: "3rem" }}
                  />
                  <button type="button" onClick={() => setShowOldPw((v) => !v)}
                    className="absolute top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                    style={{ insetInlineEnd: "0.75rem" }}>
                    {showOldPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">New Password</label>
                <div className="relative">
                  <Lock className="absolute top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" style={{ insetInlineStart: "0.75rem" }} />
                  <input
                    type={showNewPw ? "text" : "password"} value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)} required
                    placeholder="At least 8 characters"
                    className="w-full py-3 border border-slate-200 rounded-xl text-slate-900 bg-white placeholder-slate-400 focus:border-accent focus:ring-1 focus:ring-accent"
                    style={{ paddingInlineStart: "2.5rem", paddingInlineEnd: "3rem" }}
                  />
                  <button type="button" onClick={() => setShowNewPw((v) => !v)}
                    className="absolute top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                    style={{ insetInlineEnd: "0.75rem" }}>
                    {showNewPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" style={{ insetInlineStart: "0.75rem" }} />
                  <input
                    type={showNewPw ? "text" : "password"} value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)} required
                    placeholder="Repeat new password"
                    className="w-full py-3 border border-slate-200 rounded-xl text-slate-900 bg-white placeholder-slate-400 focus:border-accent focus:ring-1 focus:ring-accent"
                    style={{ paddingInlineStart: "2.5rem", paddingInlineEnd: "1rem" }}
                  />
                </div>
              </div>

              <button
                type="submit" disabled={isChangingPw}
                className="w-full py-3 bg-accent hover:bg-accent-600 disabled:bg-accent/50 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {isChangingPw ? (
                  <><Loader2 className="w-5 h-5 animate-spin" />Updating...</>
                ) : (
                  <><Lock className="w-5 h-5" />Update Password</>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Saved Tab */}
        {activeTab === "saved" && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center">
            <Bookmark className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Saved Searches</h3>
            <p className="text-slate-500 mb-6 text-sm">
              Browse your saved searches and re-run them with one click.
            </p>
            <Link
              href="/saved-searches"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-600 text-white rounded-xl font-medium transition-colors"
            >
              View Saved Searches <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
