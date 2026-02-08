import React from "react";

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

export default function Sidebar({ activeTab, setActiveTab }) {
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
                style={navItemStyle(activeTab === "shop")}
                onClick={() => setActiveTab("shop")}
            >
                🛍️ Shop
            </div>

            <div
                style={navItemStyle(activeTab === "list")}
                onClick={() => setActiveTab("list")}
            >
                📝 Shopping List
            </div>

            <div
                style={navItemStyle(activeTab === "recommend")}
                onClick={() => setActiveTab("recommend")}
            >
                ⭐ Recommend
            </div>
        </aside>
    );
}
