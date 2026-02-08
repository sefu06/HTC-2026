import React, { useState } from "react";

export default function ProductCard({ product, onAddToList }) {
    const [hovered, setHovered] = useState(false);
    const [added, setAdded] = useState(false);

    const handleAdd = async (e) => {
        e.stopPropagation();

        if (added) return;

        await onAddToList?.(product);

        setAdded(true);

        // Reset after animation
        setTimeout(() => {
            setAdded(false);
        }, 1200);
    };

    return (
        <div
            style={{
                minWidth: "160px",
                flexShrink: 0,
                margin: "10px",
                padding: "10px",
                borderRadius: "12px",
                border: "1px solid #ddd",
                backgroundColor: "#fff",
                position: "relative",
                overflow: "hidden",
                cursor: "pointer",
                transition: "transform 0.2s ease",
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Normal card content */}
            <div style={{ fontSize: "50px", textAlign: "center" }}>🛒</div>
            <div style={{ fontWeight: 600, textAlign: "center" }}>
                {product.product}
            </div>
            <div style={{ fontWeight: "bold", textAlign: "center" }}>
                ${product.price}/{product.unit}
            </div>

            {product.on_sale && (
                <div style={{ color: "red", fontWeight: "bold", textAlign: "center" }}>
                    ON SALE
                </div>
            )}

            {/* Overlay */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0, 0, 0, 0.75)",
                    color: "white",
                    padding: "12px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    textAlign: "center",
                    opacity: hovered ? 1 : 0,
                    transition: "opacity 0.2s ease",
                }}
            >
                <div style={{ fontWeight: 700 }}>{product.product}</div>
                <div>Store: {product.store}</div>
                <div>Price: ${product.price}</div>
                <div>Brand: {product.brand || "-"}</div>
                <div>Unit: {product.unit || "-"}</div>

                <button
                    onClick={handleAdd}
                    style={{
                        marginTop: "10px",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "none",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.25s ease",
                        transform: added ? "scale(1.1)" : "scale(1)",
                        background: added ? "#4CAF50" : "#fff",
                        color: added ? "#fff" : "#000",
                    }}
                >
                    {added ? "✓ Added" : "+ Add to List"}
                </button>
            </div>
        </div>
    );
}
