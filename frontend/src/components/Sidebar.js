import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const navItemStyle = (active) => ({
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 12px",
    borderRadius: "10px",
    cursor: "pointer",
    background: active ? "#f2f2f2" : "transparent",
    fontWeight: active ? 600 : 400,
});

export default function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <aside
            style={{
                width: "320px",
                flexShrink: 0,
                borderRight: "1px solid #eee",
                minHeight: "100vh",      // ✅ change
                position: "sticky",
                top: 0,
                background: "#79c78e",
                overflowY: "auto",
            }}
        >
            <div style={{ padding: "16px" }}>
                <img
                    src="/fridgefullogo.png"
                    alt="Logo"
                    style={{
                        width: "120px",
                        height: "120px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        display: "block",
                        margin: "0 auto 20px auto",
                        border: "5px solid white",
                    }}
                />

                <div
                    style={navItemStyle(location.pathname === "/")}
                    onClick={() => navigate("/")}
                >
                    🛍️ Shop
                </div>

                <div
                    style={navItemStyle(location.pathname === "/list")}
                    onClick={() => navigate("/list")}
                >
                    📝 Shopping List
                </div>

                <div
                    style={navItemStyle(location.pathname === "/recommend")}
                    onClick={() => navigate("/recommend")}
                >
                    ⭐ Recommend
                </div>
            </div>
        </aside>
    );
}
  