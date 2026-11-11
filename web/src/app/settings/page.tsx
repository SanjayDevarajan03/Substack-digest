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

    if (status === "loading" || loading) return null;
    if (status === "unauthenticated") {
        return (
            <button onClick={() => signIn("google")}>
                Sign in with Google
            </button>
        );
    }

    return (
        <div>
            <button onClick={() => signOut()}>Sign Out</button>
            <p>{email}</p> {/* read-only not an editable input */}
            {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={cadence}
                    onChange={cadenceChange}
                    placeholder="Enter cadence"
                />
                <input
                    type="text"
                    value={handles}
                    onChange={handleChange}
                    placeholder="Enter handles"
                />
                <input
                    type="text"
                    value={time}
                    onChange={timeChange}
                    placeholder="Enter Time in 24 hour clock. Eg: 14:00 for afternoon and 09:00 for the morning"
                />
                <input
                    type="text"
                    value={day}
                    onChange={dayChange}
                    placeholder="Enter the day where you want the digest to appear in."
                />
                <input
                    type="text"
                    value={month}
                    onChange={monthChange}
                    placeholder="Enter the month, you want the monthly digest to start from?"
                />
                <input
                    type="text"
                    value={dateOfMonth}
                    onChange={dateOfMonthChange}
                    placeholder="Enter the date, you want the digest to start from"
                />
                <button type="submit">Save Settings</button>
            </form>
            <button onClick={handleDelete}>Delete Account</button>
        </div>
    );
}
