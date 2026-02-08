import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setErr("");
        setLoading(true);

        try {
            const res = await axios.post("http://localhost:3001/auth/login", {
                email,
                password,
            });

            localStorage.setItem("token", res.data.token);
            axios.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;

            navigate("/");
        } catch (error) {
            console.log("Full error:", error);
            console.log("Error response:", error.response);
            console.log("Error data:", error.response?.data);

            setErr(error.response?.data?.error || error.response?.data || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 420, margin: "60px auto", padding: 20 }}>
            <h2>Log in</h2>

            <form onSubmit={handleLogin} style={{ display: "grid", gap: 12 }}>
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
                    {loading ? "Logging in..." : "Log in"}
                </button>
            </form>

            <p style={{ marginTop: 14 }}>
                No account? <Link to="/signup">Sign up</Link>
            </p>
        </div>
    );
}
