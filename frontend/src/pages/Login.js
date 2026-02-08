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
        <div
            style={{
                minHeight: "100vh",        // full screen height
                background: "#f4f6f8",     // your background color
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
            }}
        >

        <div style={{
                width: 420, padding: 20
            }}>
                <img
                    src="/fridgefullogo.png"
                    alt="Logo"
                    style={{
                        width: "200px",
                        height: "200px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        display: "block",
                        margin: "0 auto 20px auto",
                        border: "5px solid white",
                    }}
                />
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
            </div>
    );
}
