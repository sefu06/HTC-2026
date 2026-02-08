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
                padding: "16px",
                borderRight: "1px solid #eee",
                height: "100vh",
                position: "sticky",
                top: 0,
                background: "#fff",
            }}
        >
            <div style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px" }}>
                Grocery App
            </div>

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
        </aside>
    );
}
