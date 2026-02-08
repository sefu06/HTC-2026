import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import ProductSection from "../components/ProductSection";
import { useNavigate } from "react-router-dom";
import ProductCard from "../components/ProductCard";

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

const SearchResults = () => {
    const query = useQuery();

    const [results, setResults] = useState([]);

    const search = query.get("search");
    const store = query.get("store");
    const category = query.get("category");

    const navigate = useNavigate();

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const res = await axios.get("http://localhost:3001/prices", {
                    params: {
                        search,
                        store,
                        category,
                    },
                });

                setResults(res.data);
            } catch (err) {
                console.error(err);
            }
        };

        fetchResults();
    }, [search, store, category]);

    return (
        <div>
            <button
                onClick={() => navigate("/")}
                style={{
                    marginBottom: "16px",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                    cursor: "pointer",
                    background: "#fff",
                }}
            >
                ← Back to Shop
            </button>
            

            <h2>
                Search results {search && <>for "{search}"</>}
            </h2>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                    gap: "20px",
                    marginTop: "20px",
                }}
            >
                {results.map((product, index) => (
                    <ProductCard key={index} product={product} />
                ))}
            </div>
        </div>
    );
};

export default SearchResults;
