import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Header = ({ onSearch }) => {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [store, setStore] = useState("");
    const [category, setCategory] = useState("");

    const [stores, setStores] = useState([]);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const [storesRes, categoriesRes] = await Promise.all([
                    axios.get("http://localhost:3001/stores"),
                    axios.get("http://localhost:3001/categories"),
                ]);

                setStores(storesRes.data.map((s) => s.name));
                setCategories(categoriesRes.data.map((c) => c.category));
            } catch (err) {
                console.error("Failed to load filters:", err);
            }
        };

        fetchFilters();
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();

        const params = new URLSearchParams();

        if (search.trim()) params.append("search", search.trim());
        if (store) params.append("store", store);
        if (category) params.append("category", category);

        navigate(`/search?${params.toString()}`);
      };

    const handleClear = () => {
        setSearch("");
        setStore("");
        setCategory("");
        onSearch({}); // reset filters
    };

    return (
        <header style={{ position: "relative" }}>
            {/* Green Banner */}
            <div
                style={{
                    height: "100px",
                    background: "linear-gradient(135deg,rgb(127, 209, 161), #27ae60)",
            
                }}
            />

            {/* Search Card */}
            <div
                style={{
                    position: "relative",
                    marginTop: "-60px",
                    padding: "0 20px 20px 20px",
                }}
            >
                <div
                    style={{
                        background: "#fff",
                        borderRadius: "16px",
                        padding: "20px",
                        boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
                    }}
                >
                    <form
                        onSubmit={handleSubmit}
                        style={{
                            display: "flex",
                            gap: "10px",
                            flexWrap: "wrap",
                            alignItems: "center",
                        }}
                    >
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                padding: "10px",
                                borderRadius: "10px",
                                border: "1px solid #ddd",
                                minWidth: 220,
                                flexGrow: 1,
                            }}
                        />

                        <select
                            value={store}
                            onChange={(e) => setStore(e.target.value)}
                            style={{
                                padding: "10px",
                                borderRadius: "10px",
                                border: "1px solid #ddd",
                                minWidth: 180,
                            }}
                        >
                            <option value="">All Stores</option>
                            {stores.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>

                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            style={{
                                padding: "10px",
                                borderRadius: "10px",
                                border: "1px solid #ddd",
                                minWidth: 160,
                            }}
                        >
                            <option value="">All Categories</option>
                            {categories.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>

                        <button
                            type="submit"
                            style={{
                                padding: "10px 16px",
                                borderRadius: "10px",
                                border: "none",
                                background: "#27ae60",
                                color: "white",
                                fontWeight: 600,
                                cursor: "pointer",
                            }}
                        >
                            Search
                        </button>

                        <button
                            type="button"
                            onClick={handleClear}
                            style={{
                                padding: "10px 16px",
                                borderRadius: "10px",
                                border: "1px solid #ddd",
                                background: "#fff",
                                fontWeight: 500,
                                cursor: "pointer",
                            }}
                        >
                            Clear
                        </button>
                    </form>
                </div>
            </div>
        </header>
    );
      
};

export default Header;
