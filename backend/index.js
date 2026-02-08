const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const pool = require("./db");

app.get("/test", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("DB error");
    }
});


app.get("/prices", async (req, res) => {
    try {
        const { store, category, on_sale, search } = req.query;

        let query = `
      SELECT
        s.name AS store,
        p.name AS product,
        p.brand,
        p.unit,
        p.category,
        pr.price,
        pr.on_sale
      FROM prices pr
      JOIN stores s ON pr.store_id = s.id
      JOIN products p ON pr.product_id = p.id
    `;
        
        const conditions = [];
        const values = [];

        if (store) {
            values.push(store);
            conditions.push(`s.name = $${values.length}`);
        }
        
        if (category) {
            values.push(category);
            conditions.push(`p.category = $${values.length}`);
        }

        if (on_sale !== undefined) {
            const boolOnSale = on_sale === "true" || on_sale === true;
            values.push(boolOnSale);
            conditions.push(`pr.on_sale = $${values.length}`);
        }

        if (search) {
            values.push(`%${search}%`);
            conditions.push(`p.name ILIKE $${values.length}`);
          }
      
    
        if (conditions.length > 0) {
            query += " WHERE " + conditions.join(" AND ");
        }

        query += " ORDER BY p.name, pr.price";

        const result = await pool.query(query, values);
        res.json(result.rows);
      

    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching prices")

    }

});

app.get("/stores", async (req, res) => {
    const result = await pool.query("SELECT name FROM stores ORDER BY name;");
    res.json(result.rows); // [{name: "Costco"}, ...]
});

app.get("/categories", async (req, res) => {
    const result = await pool.query(
        "SELECT DISTINCT category FROM products WHERE category IS NOT NULL ORDER BY category;"
    );
    res.json(result.rows); // [{category: "Dairy"}, ...]
});

