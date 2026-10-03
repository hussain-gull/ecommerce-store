"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuthStore } from "@/lib/store/auth.store";
import { AuthRequiredDialog } from "@/components/ui/auth-required-dialog";

type ProfileForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

export function ProfilePanel() {
  const user = useAuthStore((s) => s.user);

  const [form, setForm] = useState<ProfileForm>({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authDialog, setAuthDialog] = useState(false);

  function set(key: keyof ProfileForm) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((p) => ({ ...p, [key]: e.target.value }));
      setSaved(false);
    };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      setAuthDialog(true);
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSaved(true);
    }, 800);
  }

  return (
    <div>
      <h2 className="text-xs font-bold tracking-widest uppercase text-foreground mb-6 pb-3 border-b border-line">
        Personal Information
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label
              htmlFor="profile-first"
              className="text-[11px] font-bold uppercase tracking-widest text-foreground block mb-1.5"
            >
              First Name
            </label>
            <input
              id="profile-first"
              type="text"
              autoComplete="given-name"
              value={form.firstName}
              onChange={set("firstName")}
              className="w-full border border-line bg-white px-3 py-2.5 text-[13px] text-foreground outline-none focus:border-accent transition-colors"
              placeholder="James"
            />
          </div>
          <div>
            <label
              htmlFor="profile-last"
              className="text-[11px] font-bold uppercase tracking-widest text-foreground block mb-1.5"
            >
              Last Name
            </label>
            <input
              id="profile-last"
              type="text"
              autoComplete="family-name"
              value={form.lastName}
              onChange={set("lastName")}
              className="w-full border border-line bg-white px-3 py-2.5 text-[13px] text-foreground outline-none focus:border-accent transition-colors"
              placeholder="Smith"
            />
          </div>
        </div>

        <div className="mb-4">
          <label
            htmlFor="profile-email"
            className="text-[11px] font-bold uppercase tracking-widest text-foreground block mb-1.5"
          >
            Email Address
          </label>
          <input
            id="profile-email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={set("email")}
            className="w-full border border-line bg-white px-3 py-2.5 text-[13px] text-foreground outline-none focus:border-accent transition-colors"
            placeholder="you@example.com"
          />
        </div>

        <div className="mb-6">
          <label
            htmlFor="profile-phone"
            className="text-[11px] font-bold uppercase tracking-widest text-foreground block mb-1.5"
          >
            Phone Number
          </label>
          <input
            id="profile-phone"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={set("phone")}
            className="w-full border border-line bg-white px-3 py-2.5 text-[13px] text-foreground outline-none focus:border-accent transition-colors"
            placeholder="+923XXXXXXXXXX"
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="h-11 px-8 bg-foreground text-white border-none text-[11px] font-bold tracking-[2px] uppercase cursor-pointer hover:bg-accent transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Saving…" : "Save Changes"}
          </button>

          <AnimatePresence>
            {saved && (
              <motion.span
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="text-[12px] text-accent font-semibold"
              >
                Changes saved!
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </form>

      <AuthRequiredDialog
        open={authDialog}
        onClose={() => setAuthDialog(false)}
        message="Sign in or create an account to save your personal information."
      />
    </div>
  );
}
