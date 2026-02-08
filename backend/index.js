const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

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

require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateRecipesFromShoppingList() {
    const list = await pool.query(`
      SELECT product_name, brand
      FROM shopping_list_items
      ORDER BY added_at DESC;
    `);

    const items = list.rows;
    if (items.length === 0) return { recipes: [], message: "Shopping list is empty." };

    const ingredients = items
        .map((x) => `${x.product_name}${x.brand ? ` (${x.brand})` : ""}`)
        .join(", ");

    const prompt = `
  Return exactly JSON (no markdown) with shape:
  {
    "recipes": [
      {
        "title": "...",
        "time_minutes": 0,
        "difficulty": "easy|medium|hard",
        "ingredients_used": ["..."],
        "missing_ingredients": ["..."],
        "steps": ["..."],
        "tips": "..."
      }
    ]
  }
  Give 3 recipes using: ${ingredients}
  `;

    const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const text = result.text;
    let data;
    try {
        data = JSON.parse(text);
    } catch {
        const start = text.indexOf("{");
        const end = text.lastIndexOf("}");
        data = JSON.parse(text.slice(start, end + 1));
    }
    return data;
}
  



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
        p.image_url,
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
        [req.userId]
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
          (user_id, product_id, store_id, product_name, brand, unit, category, store_name, price, on_sale, quantity)
        VALUES
          ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        RETURNING *;
        `,
            [   
                req.userId,
                req.body.product_id ?? null,
                req.body.store_id ?? null,
                req.body.product_name,
                req.body.brand ?? null,
                req.body.unit ?? null,
                req.body.category ?? null,
                req.body.store_name ?? null,
                req.body.price ?? null,
                req.body.on_sale ?? false,
                req.body.quantity ?? 1,
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


app.get("/saved-recipes", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM saved_recipes ORDER BY created_at DESC;"
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching saved recipes");
    }
});

app.post("/saved-recipes", async (req, res) => {
    try {
        const {
            title,
            time_minutes,
            difficulty,
            ingredients_used,
            missing_ingredients,
            steps,
            tips,
        } = req.body;

        if (!title) return res.status(400).send("title required");

        const result = await pool.query(
            `
        INSERT INTO saved_recipes
          (title, time_minutes, difficulty, ingredients_used, missing_ingredients, steps, tips)
        VALUES
          ($1,$2,$3,$4,$5,$6,$7)
        RETURNING *;
        `,
            [
                title,
                time_minutes ?? null,
                difficulty ?? null,
                JSON.stringify(ingredients_used ?? []),
                JSON.stringify(missing_ingredients ?? []),
                JSON.stringify(steps ?? []),
                tips ?? null,
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error saving recipe");
    }
});

app.delete("/saved-recipes/:id", async (req, res) => {
    try {
        await pool.query("DELETE FROM saved_recipes WHERE id = $1;", [req.params.id]);
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting recipe");
    }
});


app.get("/recommendations", async (req, res) => {
    try {
        const data = await generateRecipesFromShoppingList();
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error generating recommendations");
    }
});

app.post("/recommendations/regenerate", async (req, res) => {
    try {
        const data = await generateRecipesFromShoppingList();
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error regenerating recommendations");
    }
});

app.post("/auth/signup", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).send("Missing email/password");

        const password_hash = await bcrypt.hash(password, 12);

        const result = await pool.query(
            `INSERT INTO users (email, password_hash)
         VALUES ($1, $2)
         RETURNING id, email;`,
            [email.toLowerCase(), password_hash]
        );

        const user = result.rows[0];
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

        res.json({ token, user });
    } catch (err) {
        if (String(err).includes("unique")) return res.status(409).send("Email already exists");
        console.error(err);
        res.status(500).send("Signup failed");
    }
});

app.post("/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).send("Missing email/password");

        const result = await pool.query(`SELECT * FROM users WHERE email = $1;`, [
            email.toLowerCase(),
        ]);

        const user = result.rows[0];
        if (!user) return res.status(401).send("Invalid credentials");

        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) return res.status(401).send("Invalid credentials");

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

        res.json({ token, user: { id: user.id, email: user.email } });
    } catch (err) {
        console.error(err);
        res.status(500).send("Login failed");
    }
});

function requireAuth(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).send("Missing token");

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.userId = payload.userId;
        next();
    } catch {
        return res.status(401).send("Invalid token");
    }
}
  
  
  
  
  