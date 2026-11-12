"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Settings() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [email, setEmail] = useState<string>("");
    const [handles, setHandles] = useState<string>("");
    const [cadence, setCadence] = useState<string>("");
    const [time, setTime] = useState<string>("");
    const [day, setDay] = useState<string>("");
    const [month, setMonth] = useState<string>("");
    const [dateOfMonth, setDateOfMonth] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string>("");

    // Fetch-on mount: this is the main new piece vs page.tsx
    useEffect(() => {
        if (status !== "authenticated" || !session?.user?.email) return;

        async function loadExisting() {
            const response = await fetch(
                `/api/signup?email=${encodeURIComponent(session?.user!.email!)}`,
            );

            if (!response.ok) {
                router.push("/");
                return;
            }

            const result = await response.json();

            if (result.error) {
                router.push("/");
                return;
            }

            setEmail(result.email);
            setHandles((result.handles ?? []).join(", "));
            setCadence(result.cadence ?? "");
            setTime(result.time ?? "");
            setDay(result.day ?? "");
            setMonth(result.month ?? "");
            setDateOfMonth(result.dateOfMonth ?? "");
            setLoading(false);
        }
        loadExisting();
    }, [status, session, router]);

    const cadenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCadence(e.target.value); // e.target.value is securely typed as a string
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setHandles(e.target.value);
    };

    const timeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTime(e.target.value);
    };

    const dayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDay(e.target.value);
    };

    const monthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMonth(e.target.value);
    };

    const dateOfMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDateOfMonth(e.target.value);
    };

    const handleList = handles
        .split(",")
        .map((h) => h.trim())
        .filter(Boolean);

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMessage("");
        if (!email || !handles || !cadence || !time) {
            console.log("Please enter the missing fields");
            return;
        }

        const response = await fetch("/api/signup", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email,
                handles: handleList,
                cadence,
                time,
                day,
                month,
                dateOfMonth,
            }),
        });

        const result = await response.json();
        if (!response.ok) {
            setErrorMessage(result.error ?? "Failed to save settings");
            return;
        }
        console.log(result);
    };

    const handleDelete = async () => {
        const confirmed = window.confirm(
            "Delete your account and stop all digests?",
        );
        if (!confirmed) return;

        const response = await fetch("/api/signup", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });

        if (response.ok) signOut({ callbackUrl: "/" });
    };

    if (status === "loading" || loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
                <div
                    className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600 dark:border-slate-700 dark:border-t-indigo-400"
                    role="status"
                    aria-label="Loading"
                />
            </main>
        );
    }

    if (status === "unauthenticated") {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
                <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <button
                        onClick={() => signIn("google")}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                        Sign in with Google
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-10 dark:bg-slate-950">
            <div className="mx-auto w-full max-w-lg">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-semibold text-white">
                            S
                        </div>
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            Substack Digest
                        </span>
                    </div>
                    <button
                        onClick={() => signOut()}
                        className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                        Sign Out
                    </button>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
                    <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        Settings
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Update your newsletters or delivery schedule.
                    </p>

                    {errorMessage && (
                        <div
                            role="alert"
                            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400"
                        >
                            {errorMessage}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Email
                            </label>
                            {/* read-only not an editable input */}
                            <p className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400">
                                {email}
                            </p>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Substack handles
                            </label>
                            <input
                                type="text"
                                value={handles}
                                onChange={handleChange}
                                placeholder="e.g. stratechery, platformer"
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                            />
                            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                                Comma-separated Substack handles.
                            </p>
                        </div>

                        <div className="border-t border-slate-100 pt-5 dark:border-slate-800">
                            <h2 className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                                Delivery schedule
                            </h2>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
                                        Cadence
                                    </label>
                                    <input
                                        type="text"
                                        value={cadence}
                                        onChange={cadenceChange}
                                        placeholder="daily / weekly / monthly"
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
                                        Delivery time
                                    </label>
                                    <input
                                        type="text"
                                        value={time}
                                        onChange={timeChange}
                                        placeholder="14:00"
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                                    />
                                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                                        24-hour clock, e.g. 14:00 for
                                        afternoon, 09:00 for morning.
                                    </p>
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
                                        Day of week{" "}
                                        <span className="text-slate-400 dark:text-slate-500">
                                            (weekly only)
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        value={day}
                                        onChange={dayChange}
                                        placeholder="Monday"
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
                                        Month{" "}
                                        <span className="text-slate-400 dark:text-slate-500">
                                            (monthly only)
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        value={month}
                                        onChange={monthChange}
                                        placeholder="January"
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
                                        Date of month{" "}
                                        <span className="text-slate-400 dark:text-slate-500">
                                            (monthly only)
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        value={dateOfMonth}
                                        onChange={dateOfMonthChange}
                                        placeholder="15"
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                        >
                            Save Settings
                        </button>
                    </form>
                </div>

                <div className="mt-6 rounded-2xl border border-red-200 bg-white p-6 shadow-sm dark:border-red-900/40 dark:bg-slate-900">
                    <h2 className="text-sm font-semibold text-red-700 dark:text-red-400">
                        Danger zone
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Permanently delete your account and stop all
                        digests. This can't be undone.
                    </p>
                    <button
                        onClick={handleDelete}
                        className="mt-4 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40 dark:focus:ring-offset-slate-900"
                    >
                        Delete Account
                    </button>
                </div>
            </div>
        </main>
    );
}
