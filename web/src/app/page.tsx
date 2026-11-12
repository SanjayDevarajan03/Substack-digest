"use client";
import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function InputForm() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [email, setEmail] = useState<string>("");
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [handles, setHandles] = useState<string>("");
    const [cadence, setCadence] = useState<string>("");
    const [time, setTime] = useState<string>("");
    const [day, setDay] = useState<string>("");
    const [month, setMonth] = useState<string>("");
    const [dateOfMonth, setDateOfMonth] = useState<string>("");
    // Sync email from the session as soon as it's available, so a
    // first-time signup never has to manually type an email that's
    // already known from the Google account.
    useEffect(() => {
        if (session?.user?.email) {
            setEmail(session.user.email);
        }
    }, [session]);

    // Explicit TypeScript typing for the change event
    useEffect(() => {
        if (status !== "authenticated" || !session?.user?.email) return;
        async function loadExisting() {
            const response = await fetch(
                `/api/signup?email=${encodeURIComponent(session?.user!.email!)}`,
            );

            if (!response.ok) {
                router.push("/");
                return;
            } else {
                router.push("/settings");
                return;
            }
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

    if (status === "loading") {
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
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-xl font-semibold text-white">
                        S
                    </div>
                    <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                        Substack Digest
                    </h1>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Get a scheduled email digest of the Substack
                        newsletters you follow.
                    </p>
                    <button
                        onClick={() => signIn("google")}
                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                        <svg
                            aria-hidden="true"
                            className="h-4 w-4"
                            viewBox="0 0 48 48"
                        >
                            <path
                                fill="#FFC107"
                                d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.5 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"
                            />
                            <path
                                fill="#FF3D00"
                                d="M6.3 14.7l6.6 4.8C14.5 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.5 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
                            />
                            <path
                                fill="#4CAF50"
                                d="M24 44c5.2 0 10.1-2 13.7-5.2l-6.3-5.3C29.4 35.4 26.8 36 24 36c-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.6 39.8 16.2 44 24 44z"
                            />
                            <path
                                fill="#1976D2"
                                d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.5l6.3 5.3C40.9 36.4 44 30.9 44 24c0-1.2-.1-2.4-.4-3.5z"
                            />
                        </svg>
                        Sign in with Google
                    </button>
                </div>
            </main>
        );
    }

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

        const cleanTime = time.trim();
        const timePattern = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;

        if (!timePattern.test(cleanTime)) {
            console.log("Please enter the time in 24 hour format.");
            return;
        } else {
            const checkResponse = await fetch(
                `/api/signup?email=${encodeURIComponent(email)}`,
            );
            const existing = await checkResponse.json();
            const payload = {
                email,
                handles: handleList,
                cadence,
                time,
                day,
                month,
                dateOfMonth,
            };

            let saveResponse;
            if (existing.error) {
                saveResponse = await fetch("/api/signup", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                });
            } else {
                router.push("/settings");
                return;
            }
            const result = await saveResponse.json();
            if (!saveResponse.ok) {
                setErrorMessage(result.error ?? "Failed to save settings");
                return;
            }
            console.log(result);
        }
    };

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
                        Set up your digest
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Tell us which newsletters to follow and when you'd
                        like your digest delivered.
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
                            <input
                                type="email"
                                value={email || ""}
                                readOnly
                                placeholder="Enter email"
                                className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400"
                            />
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
            </div>
        </main>
    );
}
