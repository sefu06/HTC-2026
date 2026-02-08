import React, { useEffect, useState } from "react";
import axios from "axios";

export default function ShoppingList() {
    const [items, setItems] = useState([]);

    const fetchItems = async () => {
        const res = await axios.get("http://localhost:3001/shopping-list");
        setItems(res.data);
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const removeItem = async (id) => {
        await axios.delete(`http://localhost:3001/shopping-list/${id}`);
        fetchItems();
    };

    const changeQty = async (id, quantity) => {
        await axios.patch(`http://localhost:3001/shopping-list/${id}`, { quantity });
        fetchItems();
    };

    return (
        <div>
            <h2>Shopping List</h2>

            {items.length === 0 ? (
                <p>No items yet.</p>
            ) : (
                <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
                    {items.map((it) => (
                        <div
                            key={it.id}
                            style={{
                                background: "#fff",
                                border: "1px solid #ddd",
                                borderRadius: 12,
                                padding: 12,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: 12,
                            }}
                        >
                            <div>
                                <div style={{ fontWeight: 800 }}>{it.product_name}</div>
                                <div style={{ opacity: 0.8 }}>
                                    {it.store_name || "-"} • ${it.price ?? "-"} • {it.brand || "-"} • {it.unit || "-"}
                                </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <button onClick={() => changeQty(it.id, Math.max(1, it.quantity - 1))}>-</button>
                                <div style={{ minWidth: 24, textAlign: "center" }}>{it.quantity}</div>
                                <button onClick={() => changeQty(it.id, it.quantity + 1)}>+</button>

                                <button onClick={() => removeItem(it.id)} style={{ marginLeft: 8 }}>
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
