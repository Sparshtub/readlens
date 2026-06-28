"use client";

import { UserButton, SignInButton } from "@clerk/nextjs";
import { LogOut } from "lucide-react";

interface ClerkControlsProps {
  sidebarOpen: boolean;
  isSignedIn: boolean;
}

export default function ClerkControls({ sidebarOpen, isSignedIn }: ClerkControlsProps) {
  if (isSignedIn) {
    return (
      <>
        <UserButton />
        {sidebarOpen && (
          <div className="flex flex-col truncate">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">Account</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Signed In</span>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="flex items-center gap-2 justify-center w-full">
      {sidebarOpen ? (
        <SignInButton mode="modal">
          <button className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg w-full">
            Sign In
          </button>
        </SignInButton>
      ) : (
        <SignInButton mode="modal">
          <button className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
            <LogOut size={16} />
          </button>
        </SignInButton>
      )}
    </div>
  );
}
