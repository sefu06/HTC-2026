import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from "./components/Header";
import ProductSection from "./components/ProductSection";
import Sidebar from "./components/Sidebar";
import { Routes, Route } from "react-router-dom";
import ShoppingList from "./pages/ShoppingList";
import Recommend from "./pages/Recommend";
import SearchResults from "./pages/SearchResults";

function App() {
    const [activeTab, setActiveTab] = useState("shop");

    const [filters, setFilters] = useState({});
    const [onSaleProducts, setOnSaleProducts] = useState([]);
    const [saveOnFoods, setSaveOnFoods] = useState([]);
    const [safeway, setSafeway] = useState([]);
    const [tnt, setTnt] = useState([]);

    const addToList = async (p) => {
        try {
            await axios.post("http://localhost:3001/shopping-list", {
                // If you don’t currently return ids, leave these null for now
                product_id: p.product_id ?? null,
                store_id: p.store_id ?? null,

                // snapshot fields from your joined /prices response
                product_name: p.product,   // because backend returns p.name AS product
                brand: p.brand,
                unit: p.unit,
                category: p.category,
                store_name: p.store,
                price: p.price,
                on_sale: p.on_sale,
                quantity: 1,
            });
        } catch (err) {
            console.error("Failed to add to list:", err);
        }
    };

    useEffect(() => {
        // Only fetch shop data when you're on the Shop tab
        if (activeTab !== "shop") return;

        
          

        const fetchAll = async () => {
            try {
                const baseURL = "http://localhost:3001/prices";

                const [onSaleRes, saveOnRes, safewayRes, tntRes] = await Promise.all([
                    axios.get(baseURL, { params: { ...filters, on_sale: true } }),
                    axios.get(baseURL, { params: { ...filters, store: "Save on Foods" } }),
                    axios.get(baseURL, { params: { ...filters, store: "Safeway" } }),
                    axios.get(baseURL, { params: { ...filters, store: "T&T" } }), 
                ]);

                setOnSaleProducts(onSaleRes.data);
                setSaveOnFoods(saveOnRes.data);
                setSafeway(safewayRes.data);
                setTnt(tntRes.data);
            } catch (err) {
                console.error("Fetch error:", err);
            }
        };

        fetchAll();
    }, [filters, activeTab]);

    const handleSearch = (newFilters) => setFilters(newFilters);

    return (
        <div style={{ display: "flex", overflowX: "hidden" }}>
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            <main
                style={{
                    flex: 1,
                    minWidth: 0,
                    padding: "20px 24px",
                    background: "#fafafa",
                }}
            >
                <Routes>
                    {/* HOME PAGE */}
                    <Route
                        path="/"
                        element={
                            <>
                                <Header />

                                <ProductSection
                                    title="On Sale"
                                    products={onSaleProducts}
                                    onAddToList={addToList}
                                />

                                <ProductSection
                                    title="Save On Foods"
                                    products={saveOnFoods}
                                    onAddToList={addToList}
                                />

                                <ProductSection
                                    title="Safeway"
                                    products={safeway}
                                    onAddToList={addToList}
                                />

                                <ProductSection
                                    title="T&T"
                                    products={tnt}
                                    onAddToList={addToList}
                                />
                            </>
                        }
                    />


                    
                    <Route path="/search" element={<SearchResults />} />
                    <Route path="/list" element={<ShoppingList />} />
                    <Route path="/recommend" element={<Recommend />} />
                </Routes>
            </main>
        </div>
    );
}

export default App;
