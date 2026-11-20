"use client";

import React, { useEffect, useMemo, useState } from "react";
import { twMerge } from "tailwind-merge";
import { UniHubError, type Visitor } from "unihub-community-sdk";
import { createUniHubClient } from "@/features/unihub/client";

export default function UniHubLoginButton({
  className,
  unihubKey,
}: {
  className?: string;
  unihubKey?: string;
}) {
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [busy, setBusy] = useState(false);
  const unihub = useMemo(() => createUniHubClient(unihubKey), [unihubKey]);

  useEffect(() => {
    if (!unihub) return;

    setVisitor(unihub.auth.current());
    const unsubscribe = unihub.auth.onChange(setVisitor);
    unihub.auth.handleRedirect().catch(() => undefined);
    return unsubscribe;
  }, [unihub]);

  const signIn = async () => {
    if (!unihub) return;
    setBusy(true);
    try {
      await unihub.auth.signIn();
    } catch (error) {
      if (error instanceof UniHubError && error.code === "POPUP_BLOCKED") {
        await unihub.auth.signIn({ mode: "redirect" });
      }
    } finally {
      setBusy(false);
    }
  };

  if (!unihub) return null;

  if (visitor) {
    return (
      <button
        type="button"
        onClick={() => void unihub?.auth.signOut()}
        className={twMerge(
          "rounded-full border-2 border-[#1a264e] px-4 py-2 text-sm font-semibold text-[#1a264e] transition-transform hover:scale-105 dark:border-white dark:text-white",
          className
        )}
        title="UniHub oturumunu kapat"
      >
        {visitor.displayName}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={signIn}
      disabled={busy}
      className={twMerge(
        "rounded-full bg-[#1a264e] px-5 py-2 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105 disabled:opacity-60 dark:bg-white dark:text-[#1a264e]",
        className
      )}
    >
      {busy ? "Bağlanıyor..." : "UniHub ile giriş yap"}
    </button>
  );
}
