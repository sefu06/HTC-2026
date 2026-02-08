require('dotenv').config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { GoogleGenAI } = require("@google/genai");

const app = express();
app.use(cors());
app.use(express.json());

const pool = require("./db");

const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.PORT || 3001;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ==================== MIDDLEWARE ====================

function requireAuth(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({ error: "Missing token" });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.userId = payload.userId;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid token" });
    }
}

// ==================== HELPER FUNCTIONS ====================

async function generateRecipesFromShoppingList(userId) {
    const list = await pool.query(`
        SELECT product_name, brand
        FROM shopping_list_items
        WHERE user_id = $1
        ORDER BY added_at DESC;
    `, [userId]);

    const items = list.rows;
    if (items.length === 0) {
        return { recipes: [], message: "Shopping list is empty." };
    }

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

// ==================== AUTH ROUTES ====================

app.post("/auth/signup", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Missing email/password" });
        }

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
        if (String(err).includes("unique")) {
            return res.status(409).json({ error: "Email already exists" });
        }
        console.error(err);
        res.status(500).json({ error: "Signup failed" });
    }
});

app.post("/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log("Login attempt for:", email);

        if (!email || !password) {
            return res.status(400).json({ error: "Missing email/password" });
        }

        const result = await pool.query(
            `SELECT * FROM users WHERE email = $1;`,
            [email.toLowerCase()]
        );

        const user = result.rows[0];

        if (!user) {
            console.log("User not found");
            return res.status(401).json({ error: "Invalid credentials" });
        }

        console.log("Comparing passwords...");
        const ok = await bcrypt.compare(password, user.password_hash);
        console.log("Password match:", ok);

        if (!ok) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

        console.log("Login successful");
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email
            }
        });

    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Login failed" });
    }
});

app.get("/auth/me", requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, email, created_at FROM users WHERE id = $1;`,
            [req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ user: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// ==================== PRODUCT ROUTES ====================

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
        res.status(500).json({ error: "Error fetching prices" });
    }
});

app.get("/stores", async (req, res) => {
    try {
        const result = await pool.query("SELECT name FROM stores ORDER BY name;");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error fetching stores" });
    }
});

app.get("/categories", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT DISTINCT category FROM products WHERE category IS NOT NULL ORDER BY category;"
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error fetching categories" });
    }
});

// ==================== SHOPPING LIST ROUTES ====================

app.get("/shopping-list", requireAuth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT *
            FROM shopping_list_items
            WHERE user_id = $1
            ORDER BY added_at DESC;
        `, [req.userId]);

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error fetching shopping list" });
    }
});

app.post("/shopping-list", requireAuth, async (req, res) => {
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

        if (!product_name) {
            return res.status(400).json({ error: "product_name required" });
        }

        const result = await pool.query(
            `INSERT INTO shopping_list_items
              (user_id, product_id, store_id, product_name, brand, unit, category, store_name, price, on_sale, quantity)
             VALUES
              ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING *;`,
            [
                req.userId,
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
        res.status(500).json({ error: "Error adding item" });
    }
});

app.delete("/shopping-list/:id", requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        await pool.query(
            `DELETE FROM shopping_list_items 
             WHERE id = $1 AND user_id = $2;`,
            [id, req.userId]
        );

        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error deleting item" });
    }
});

// ==================== SAVED RECIPES ROUTES ====================

app.get("/saved-recipes", requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM saved_recipes 
             WHERE user_id = $1 
             ORDER BY created_at DESC;`,
            [req.userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error fetching saved recipes" });
    }
});

app.post("/saved-recipes", requireAuth, async (req, res) => {
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

        if (!title) {
            return res.status(400).json({ error: "title required" });
        }

        const result = await pool.query(
            `INSERT INTO saved_recipes
              (user_id, title, time_minutes, difficulty, ingredients_used, missing_ingredients, steps, tips)
             VALUES
              ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *;`,
            [
                req.userId,
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
        res.status(500).json({ error: "Error saving recipe" });
    }
});

app.delete("/saved-recipes/:id", requireAuth, async (req, res) => {
    try {
        await pool.query(
            `DELETE FROM saved_recipes 
             WHERE id = $1 AND user_id = $2;`,
            [req.params.id, req.userId]
        );
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error deleting recipe" });
    }
});

// ==================== RECOMMENDATIONS ROUTES ====================

app.get("/recommendations", requireAuth, async (req, res) => {
    try {
        const data = await generateRecipesFromShoppingList(req.userId);
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error generating recommendations" });
    }
});

app.post("/recommendations/regenerate", requireAuth, async (req, res) => {
    try {
        const data = await generateRecipesFromShoppingList(req.userId);
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error regenerating recommendations" });
    }
});

// ==================== TEST ROUTE ====================

app.get("/test", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "DB error" });
    }
});

app.post("/shopping-list/audit", requireAuth, async (req, res) => {
    try {
        const { people, shops_per_week } = req.body;

        const peopleNum = Number(people);
        const freqNum = Number(shops_per_week);

        if (!peopleNum || peopleNum < 1) return res.status(400).send("people must be >= 1");
        if (!freqNum || freqNum <= 0) return res.status(400).send("shops_per_week must be > 0");

        const list = await pool.query(
            `
        SELECT product_name, category, unit, quantity, price
        FROM shopping_list_items
        WHERE user_id = $1
        ORDER BY added_at DESC;
        `,
            [req.userId]
        );

        const items = list.rows;

        if (items.length === 0) {
            return res.json({ ok: true, summary: "Your shopping list is empty.", warnings: [], tips: [] });
        }

        const prompt = `
  You are a practical grocery planning assistant.
  
  User context:
  - People in household: ${peopleNum}
  - Shopping frequency: ${freqNum} times per week
  
  Shopping list items (name, category, unit, quantity):
  ${items.map(i => `- ${i.product_name} | ${i.category || "Unknown"} | ${i.unit || "unit"} | qty: ${i.quantity || 1}`).join("\n")}
  
  Task:
  Assess whether the user is likely buying too much for their household size and shopping frequency.
  
  Return EXACT JSON (no markdown) with shape:
  {
    "ok": true,
    "summary": "1-2 sentences overall judgement",
    "warnings": ["short bullet warnings, max 6"],
    "tips": ["actionable tips, max 6"],
    "reduce_suggestions": [
       {"item":"...", "reason":"...", "suggested_qty": 0}
    ]
  }
  
  Rules:
  - Be reasonable and conservative (don’t assume waste unless quantities look high).
  - If quantity seems unknown, assume quantity=1.
  - Prefer category-based reasoning (produce spoils faster).
  - Keep it short and friendly.
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

        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error auditing shopping list");
    }
});
  

// ==================== START SERVER ====================

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('JWT_SECRET loaded:', JWT_SECRET ? 'YES' : 'NO');
});