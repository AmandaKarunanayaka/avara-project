import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";

interface RegisterFormProps extends React.HTMLAttributes<HTMLFormElement> {
    className?: string;
}

export function RegisterForm({ className, ...props }: RegisterFormProps) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rePassword, setRePassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (password !== rePassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("http://localhost:3001/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess("Registration successful! Please check your email.");
                localStorage.setItem("emailVerified", "false");
                setTimeout(() => navigate("/Login"), 1000);
            } else {
                setError(data.message || "Registration failed");
            }
        } catch (err) {
            console.error("Register error:", err);
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form
            className={cn("flex flex-col gap-6", className)}
            {...props}
            onSubmit={handleSubmit}
        >
            <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Create your Avara account</h1>
                <p className="text-muted-foreground text-sm">
                    Sign up with your email to get started
                </p>
            </div>

            {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                    {error}
                </div>
            )}

            {success && (
                <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
                    {success}
                </div>
            )}

            <div className="grid gap-6">
                <div className="grid gap-3">
                    <Label htmlFor="name">Username</Label>
                    <Input
                        id="name"
                        type="text"
                        placeholder="Your username"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>

                <div className="grid gap-3">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>

                <div className="grid gap-3">
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>

                <div className="grid gap-3">
                    <Label htmlFor="rePassword">Re-enter password</Label>
                    <Input
                        id="rePassword"
                        type="password"
                        value={rePassword}
                        onChange={(e) => setRePassword(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing up..." : "Sign up"}
                </Button>
                <div className="text-sm text-center text-muted-foreground">
                    Already have an account?{" "}
                    <button
                        type="button"
                        className="underline underline-offset-4"
                        onClick={() => navigate("/Login")}
                    >
                        Log in
                    </button>
                </div>

            </div>
        </form>
    );
}
