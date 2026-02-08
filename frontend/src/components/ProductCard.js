import React from "react";

const ProductCard = ({ product }) => {
    return (
        <div
            style={{
                minWidth: "200px",
                minHeight: "150px",
                flexShrink: 0,
                margin: "10px",
                padding: "10px",
                borderRadius: "10px",
                border: "1px solid #ddd",
                textAlign: "center",
                backgroundColor: "#fff",
            }}
        >
            <div style={{ fontSize: "50px" }}>🛒</div> {/* Placeholder icon */}
            <div>{product.product}</div>
            <div style={{ fontWeight: "bold" }}>${product.price}/{product.unit}</div>
            {product.on_sale && (
                <div style={{ color: "red", fontWeight: "bold" }}>ON SALE</div>
            )}
        </div>
    );
};

export default ProductCard;
