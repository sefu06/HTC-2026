import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";


export default function ShoppingList() {
    const [people, setPeople] = useState(1);
    const [shopsPerWeek, setShopsPerWeek] = useState(1);
    const [audit, setAudit] = useState(null);
    const [auditLoading, setAuditLoading] = useState(false);
    const [auditErr, setAuditErr] = useState("");
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

    // ✅ Group items by store_name
    const groupedByStore = useMemo(() => {
        const grouped = {};
        for (const it of items) {
            const store = it.store_name || "Unknown Store";
            if (!grouped[store]) grouped[store] = [];
            grouped[store].push(it);
        }
        return grouped;
    }, [items]);

    // Optional: total per store
    const storeTotal = (storeItems) =>
        storeItems.reduce((sum, it) => sum + Number(it.price || 0) * Number(it.quantity || 1), 0);

    const runAudit = async () => {
        setAudit(null);
        setAuditErr("");
        setAuditLoading(true);

        try {
            const res = await axios.post("http://localhost:3001/shopping-list/audit", {
                people,
                shops_per_week: shopsPerWeek,
            });
            setAudit(res.data);
        } catch (e) {
            setAuditErr(e.response?.data || "Audit failed");
        } finally {
            setAuditLoading(false);
        }
      };

    return (
        <div>
            <h2>Shopping List</h2>

            {items.length === 0 ? (
                <p>No items yet.</p>
            ) : (
                <div style={{ display: "grid", gap: 18, marginTop: 12 }}>
                    {Object.entries(groupedByStore).map(([store, storeItems]) => (
                        <div key={store}>
                            {/* Store Header */}
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "baseline",
                                    marginBottom: 10,
                                }}
                            >
                                <h3 style={{ margin: 0 }}>{store}</h3>
                                <div style={{ opacity: 0.75 }}>
                                    Est. total: ${storeTotal(storeItems).toFixed(2)}
                                </div>
                            </div>

                            {/* Store Items */}
                            <div style={{ display: "grid", gap: 12 }}>
                                {storeItems.map((it) => (
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
                                                ${it.price ?? "-"} • {it.brand || "-"} • {it.unit || "-"}
                                            </div>
                                        </div>

                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <button onClick={() => changeQty(it.id, Math.max(1, it.quantity - 1))}>
                                                -
                                            </button>
                                            <div style={{ minWidth: 24, textAlign: "center" }}>{it.quantity}</div>
                                            <button onClick={() => changeQty(it.id, it.quantity + 1)}>+</button>

                                            <button onClick={() => removeItem(it.id)} style={{ marginLeft: 8 }}>
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <hr style={{ marginTop: 18, border: "none", borderTop: "1px solid #eee" }} />
                        </div>
                    ))}
                </div>
            )}

<div
                style={{
                    background: "#fff",
                    border: "1px solid #ddd",
                    borderRadius: 12,
                    padding: 12,
                    marginTop: 12,
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    flexWrap: "wrap",
                }}
            >
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span>People:</span>
                    <input
                        type="number"
                        min="1"
                        value={people}
                        onChange={(e) => setPeople(Number(e.target.value))}
                        style={{ width: 80, padding: 6, borderRadius: 8, border: "1px solid #ccc" }}
                    />
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span>Shopping trips / week:</span>
                    <input
                        type="number"
                        min="0.25"
                        step="0.25"
                        value={shopsPerWeek}
                        onChange={(e) => setShopsPerWeek(Number(e.target.value))}
                        style={{ width: 90, padding: 6, borderRadius: 8, border: "1px solid #ccc" }}
                    />
                </div>

                <button
                    onClick={runAudit}
                    disabled={auditLoading}
                    style={{
                        padding: "8px 12px",
                        borderRadius: 10,
                        border: "none",
                        background: "#27ae60",
                        color: "white",
                        fontWeight: 700,
                        cursor: "pointer",
                    }}
                >
                    {auditLoading ? "Checking..." : "Am I buying too much?"}
                </button>

                {auditErr && <div style={{ color: "crimson" }}>{String(auditErr)}</div>}
            </div>

            {audit && (
                <div
                    style={{
                        background: "#fff",
                        border: "1px solid #ddd",
                        borderRadius: 12,
                        padding: 12,
                        marginTop: 12,
                    }}
                >
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>AI Check</div>
                    <div style={{ marginBottom: 10 }}>{audit.summary}</div>

                    {audit.warnings?.length > 0 && (
                        <>
                            <div style={{ fontWeight: 700 }}>Warnings</div>
                            <ul>
                                {audit.warnings.map((w, idx) => (
                                    <li key={idx}>{w}</li>
                                ))}
                            </ul>
                        </>
                    )}

                    {audit.tips?.length > 0 && (
                        <>
                            <div style={{ fontWeight: 700 }}>Tips</div>
                            <ul>
                                {audit.tips.map((t, idx) => (
                                    <li key={idx}>{t}</li>
                                ))}
                            </ul>
                        </>
                    )}

                    {audit.reduce_suggestions?.length > 0 && (
                        <>
                            <div style={{ fontWeight: 700 }}>Consider reducing</div>
                            <ul>
                                {audit.reduce_suggestions.map((r, idx) => (
                                    <li key={idx}>
                                        <b>{r.item}</b>: {r.reason} (suggested qty: {r.suggested_qty})
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </div>
            )}


        </div>
    );
}

