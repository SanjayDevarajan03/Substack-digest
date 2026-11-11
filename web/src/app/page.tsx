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

    if (status === "loading") return null;
    if (status === "unauthenticated") {
        return (
            <button onClick={() => signIn("google")}>
                Sign in with Google
            </button>
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
        <div>
            <button onClick={() => signOut()}>Sign Out</button>
            {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    value={email || ""}
                    readOnly
                    placeholder="Enter email"
                />
                <input
                    type="text"
                    value={cadence}
                    onChange={cadenceChange}
                    placeholder="Enter Cadence"
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
        </div>
    );
}
