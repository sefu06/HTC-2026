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


app.get("/shopping-list", async (req, res) => {
    try {
        const result = await pool.query(`
        SELECT *
        FROM shopping_list_items
        ORDER BY added_at DESC;
      `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching shopping list");
    }
});

app.post("/shopping-list", async (req, res) => {
    try {
        const {
            product_id,
            store_id,
            product_name,
            brand,
            unit,
            category,
            store_name,
            price,
            on_sale,
            quantity,
        } = req.body;

        if (!product_name) return res.status(400).send("product_name required");

        const result = await pool.query(
            `
        INSERT INTO shopping_list_items
          (product_id, store_id, product_name, brand, unit, category, store_name, price, on_sale, quantity)
        VALUES
          ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        RETURNING *;
        `,
            [
                product_id ?? null,
                store_id ?? null,
                product_name,
                brand ?? null,
                unit ?? null,
                category ?? null,
                store_name ?? null,
                price ?? null,
                on_sale ?? false,
                quantity ?? 1,
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error adding item");
    }
});

app.delete("/shopping-list/:id", async (req, res) => {
    try {
        const { id } = req.params;

        await pool.query(`DELETE FROM shopping_list_items WHERE id = $1;`, [id]);
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting item");
    }
});
  
  