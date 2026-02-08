import React from "react";
import ProductCard from "./ProductCard";

const ProductSection = ({ title, products, onAddToList }) => {
    return (
        <section style={{ margin: "20px 0" }}>
            <h2>{title}</h2>

            <div
                style={{
                    display: "flex",
                    flexWrap: "nowrap",
                    overflowX: "auto",
                    gap: "12px",
                    paddingBottom: "10px",
                }}
            >
                {products.map((p, i) => (
                    <ProductCard
                        key={i}
                        product={p}
                        onAddToList={onAddToList}
                    />
                ))}
            </div>
        </section>
    );
};

export default ProductSection;
