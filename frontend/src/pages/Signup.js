import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

export default function Signup() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSignup = async (e) => {
        e.preventDefault();
        setErr("");

        if (password !== confirm) {
            setErr("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post("http://localhost:3001/auth/signup", {
                email,
                password,
            });

            localStorage.setItem("token", res.data.token);
            axios.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;

            navigate("/");
        } catch (error) {
            setErr(error.response?.data || "Signup failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 420, margin: "60px auto", padding: 20 }}>
            <h2>Sign up</h2>

            <form onSubmit={handleSignup} style={{ display: "grid", gap: 12 }}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
                />

                <input
                    type="password"
                    placeholder="Confirm password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
                />

                {err && <div style={{ color: "crimson" }}>{String(err)}</div>}

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        padding: 12,
                        borderRadius: 10,
                        border: "none",
                        background: "#27ae60",
                        color: "white",
                        fontWeight: 700,
                        cursor: "pointer",
                    }}
                >
                    {loading ? "Creating..." : "Create account"}
                </button>
            </form>

            <p style={{ marginTop: 14 }}>
                Already have an account? <Link to="/login">Log in</Link>
            </p>
        </div>
    );
}
