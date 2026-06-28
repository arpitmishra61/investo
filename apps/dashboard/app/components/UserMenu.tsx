"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, UserCircle } from "lucide-react";

type AuthUser = { id: string; name: string | null; email: string };

export function UserMenu() {
    const router = useRouter();
    const [user, setUser] = useState<AuthUser | null>(null);

    useEffect(() => {
        const raw = localStorage.getItem("user");
        if (raw) setUser(JSON.parse(raw));
    }, []);

    function signOut() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/signin");
    }

    if (!user) {
        return (
            <Link
                href="/signin"
                className="rounded-full border border-border bg-muted px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all"
            >
                Sign in
            </Link>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-medium text-foreground">
                <UserCircle size={14} className="text-emerald-500" />
                <span>{user.name ?? user.email}</span>
            </div>
            <button
                onClick={signOut}
                className="flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-red-500 hover:border-red-500/30 transition-all"
            >
                <LogOut size={13} />
                <span className="hidden sm:inline">Sign out</span>
            </button>
        </div>
    );
}
