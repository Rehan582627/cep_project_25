import express from "express";
import cors from "cors";
import pg from "pg";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();
const { Pool } = pg;

const app = express();
const port = process.env.PORT || 5000;

// Connect to Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Middlewares
app.use(cors());
app.use(express.json());

// 🟢 Test Route
app.get("/", (req, res) => {
  res.send("Backend is running ✅");
});

// ---------- REGISTER ----------
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const client = await pool.connect();

    const existingUser = await client.query(
      "SELECT * FROM users WHERE username=$1",
      [username]
    );

    if (existingUser.rows.length > 0) {
      client.release();
      return res.json({ success: false, message: "Username already exists" });
    }

    await client.query(
      "INSERT INTO users(username, password) VALUES($1, $2)",
      [username, hashedPassword]
    );
    client.release();

    res.json({ success: true, message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ---------- LOGIN ----------
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const client = await pool.connect();
    const result = await client.query(
      "SELECT * FROM users WHERE username=$1",
      [username]
    );
    client.release();

    if (result.rows.length === 0)
      return res.json({ success: false, message: "Invalid username" });

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid)
      return res.json({ success: false, message: "Incorrect password" });

    res.json({
      success: true,
      message: "Login successful",
      user: { id: user.id, username: user.username },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.listen(port, () =>
  console.log(`🚀 Server running on http://localhost:${port}`)
);
// ---------- GOOGLE LOGIN ----------
app.post("/api/google-login", async (req, res) => {
  const { email, name, googleId, picture } = req.body;
  try {
    const client = await pool.connect();
    
    // Check if user exists
    let result = await client.query(
      "SELECT * FROM users WHERE username=$1 OR google_id=$2",
      [email, googleId]
    );

    let user;
    if (result.rows.length === 0) {
      // Create new user for Google login
      const insertResult = await client.query(
        "INSERT INTO users(username, password, google_id, full_name) VALUES($1, $2, $3, $4) RETURNING *",
        [email, 'GOOGLE_AUTH', googleId, name]
      );
      user = insertResult.rows[0];
    } else {
      user = result.rows[0];
    }
    
    client.release();

    res.json({
      success: true,
      message: "Google login successful",
      user: { id: user.id, username: user.username, name: user.full_name || name },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});