import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Recommend() {
    const [recipes, setRecipes] = useState([]);
    const [saved, setSaved] = useState([]);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");
    const [openSavedId, setOpenSavedId] = useState(null);

    const loadSaved = async () => {
        const res = await axios.get("http://localhost:3001/saved-recipes");
        setSaved(res.data);
    };

    const loadRecommendations = async () => {
        setLoading(true);
        setMsg("");
        try {
            const res = await axios.get("http://localhost:3001/recommendations");
            setRecipes(res.data.recipes || []);
            if (res.data.message) setMsg(res.data.message);
        } catch (e) {
            console.error(e);
            setMsg("Could not load recommendations.");
        } finally {
            setLoading(false);
        }
    };

    const regenerate = async () => {
        setLoading(true);
        setMsg("");
        try {
            const res = await axios.post("http://localhost:3001/recommendations/regenerate");
            setRecipes(res.data.recipes || []);
            if (res.data.message) setMsg(res.data.message);
        } catch (e) {
            console.error(e);
            setMsg("Could not regenerate.");
        } finally {
            setLoading(false);
        }
    };

    const saveRecipe = async (r) => {
        try {
            await axios.post("http://localhost:3001/saved-recipes", r);
            await loadSaved();
        } catch (e) {
            console.error(e);
            alert("Save failed");
        }
    };

    const deleteSaved = async (id) => {
        try {
            await axios.delete(`http://localhost:3001/saved-recipes/${id}`);
            await loadSaved();
        } catch (e) {
            console.error(e);
            alert("Delete failed");
        }
    };

    // Prevent saving duplicates by title (simple MVP check)
    const isSaved = (title) => saved.some((x) => x.title === title);

    useEffect(() => {
        loadSaved();
        loadRecommendations();
    }, []);

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <h2 style={{ margin: 0 }}>Recommendations</h2>

                <button
                    onClick={regenerate}
                    disabled={loading}
                    style={{ padding: "8px 12px", borderRadius: 8, cursor: "pointer" }}
                >
                    {loading ? "Generating..." : "Regenerate"}
                </button>
            </div>

            {msg && <p>{msg}</p>}

            <h3 style={{ marginTop: 16 }}>Suggested Recipes</h3>
            <div style={{ display: "grid", gap: 14 }}>
                {recipes.map((r, idx) => (
                    <div
                        key={idx}
                        style={{
                            background: "#fff",
                            border: "1px solid #ddd",
                            borderRadius: 12,
                            padding: 14,
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: 18 }}>{r.title}</div>
                                <div style={{ opacity: 0.75 }}>
                                    {r.time_minutes ?? "-"} min • {r.difficulty ?? "-"}
                                </div>
                            </div>

                            <button
                                onClick={() => saveRecipe(r)}
                                disabled={isSaved(r.title)}
                                style={{
                                    padding: "8px 12px",
                                    borderRadius: 8,
                                    cursor: isSaved(r.title) ? "not-allowed" : "pointer",
                                }}
                            >
                                {isSaved(r.title) ? "Saved" : "Save"}
                            </button>
                        </div>

                        <div style={{ marginTop: 10 }}>
                            <strong>Uses:</strong> {(r.ingredients_used || []).join(", ")}
                        </div>

                        {(r.missing_ingredients || []).length > 0 && (
                            <div style={{ marginTop: 6 }}>
                                <strong>Missing:</strong> {r.missing_ingredients.join(", ")}
                            </div>
                        )}

                        <ol style={{ marginTop: 10 }}>
                            {(r.steps || []).map((s, i) => (
                                <li key={i}>{s}</li>
                            ))}
                        </ol>

                        {r.tips && (
                            <div style={{ marginTop: 10 }}>
                                <strong>Tip:</strong> {r.tips}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <h3 style={{ marginTop: 24 }}>Saved Recipes</h3>

            {saved.length === 0 ? (
                <p>No saved recipes yet.</p>
            ) : (
                <div style={{ display: "grid", gap: 12 }}>
                    {saved.map((r) => {
                        const isOpen = openSavedId === r.id;

                        return (
                            <div
                                key={r.id}
                                style={{
                                    background: "#fff",
                                    border: "1px solid #ddd",
                                    borderRadius: 12,
                                    overflow: "hidden",
                                }}
                            >
                                {/* Header row (click to expand) */}
                                <div
                                    onClick={() => setOpenSavedId(isOpen ? null : r.id)}
                                    style={{
                                        padding: 14,
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        gap: 12,
                                        cursor: "pointer",
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 800 }}>{r.title}</div>
                                        <div style={{ opacity: 0.75 }}>
                                            {r.time_minutes ?? "-"} min • {r.difficulty ?? "-"}
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteSaved(r.id);
                                            }}
                                            style={{
                                                padding: "8px 12px",
                                                borderRadius: 8,
                                                cursor: "pointer",
                                            }}
                                        >
                                            Delete
                                        </button>

                                        <div style={{ fontSize: 18 }}>{isOpen ? "▲" : "▼"}</div>
                                    </div>
                                </div>

                                {/* Expanded content */}
                                {isOpen && (
                                    <div style={{ padding: 14, borderTop: "1px solid #eee" }}>
                                        <div style={{ marginTop: 6 }}>
                                            <strong>Uses:</strong>{" "}
                                            {(r.ingredients_used || []).join(", ")}
                                        </div>

                                        {(r.missing_ingredients || []).length > 0 && (
                                            <div style={{ marginTop: 6 }}>
                                                <strong>Missing:</strong>{" "}
                                                {r.missing_ingredients.join(", ")}
                                            </div>
                                        )}

                                        <div style={{ marginTop: 10 }}>
                                            <strong>Steps:</strong>
                                            <ol style={{ marginTop: 8 }}>
                                                {(r.steps || []).map((s, i) => (
                                                    <li key={i} style={{ marginBottom: 6 }}>
                                                        {s}
                                                    </li>
                                                ))}
                                            </ol>
                                        </div>

                                        {r.tips && (
                                            <div style={{ marginTop: 10 }}>
                                                <strong>Tip:</strong> {r.tips}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            
        </div>
    );
}
