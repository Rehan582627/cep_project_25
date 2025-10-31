import express from "express";
import cors from "cors";
import pg from "pg";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import crypto from "crypto";

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

// Configure email transporter (using Gmail as example)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail
    pass: process.env.EMAIL_PASS, // App Password (not regular password)
  },
});

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

// ---------- GOOGLE LOGIN ----------
app.post("/api/google-login", async (req, res) => {
  const { email, name, googleId, picture } = req.body;
  try {
    const client = await pool.connect();
    
    let result = await client.query(
      "SELECT * FROM users WHERE username=$1 OR google_id=$2",
      [email, googleId]
    );

    let user;
    if (result.rows.length === 0) {
      const insertResult = await client.query(
        "INSERT INTO users(username, password, google_id, full_name, profile_picture) VALUES($1, $2, $3, $4, $5) RETURNING *",
        [email, 'GOOGLE_AUTH', googleId, name, picture]
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

// ---------- FORGOT PASSWORD ----------
app.post("/api/forgot-password", async (req, res) => {
  const { email } = req.body;
  
  try {
    const client = await pool.connect();
    const result = await client.query(
      "SELECT * FROM users WHERE username=$1",
      [email]
    );

    if (result.rows.length === 0) {
      client.release();
      return res.json({ success: false, message: "Email not found" });
    }

    const user = result.rows[0];

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Save token to database
    await client.query(
      "UPDATE users SET reset_token=$1, reset_token_expiry=$2 WHERE id=$3",
      [resetToken, resetTokenExpiry, user.id]
    );
    client.release();

    // Send email
    const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset - Label It Right",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Password Reset Request</h2>
          <p>Hello ${user.full_name || 'User'},</p>
          <p>You requested to reset your password. Click the button below to reset it:</p>
          <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #4ade80, #3b82f6); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">
            Reset Password
          </a>
          <p>Or copy this link: <a href="${resetLink}">${resetLink}</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <p>Best regards,<br>Label It Right Team</p>
        </div>
      `,
    });

    res.json({ success: true, message: "Password reset email sent!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ---------- RESET PASSWORD ----------
app.post("/api/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const client = await pool.connect();
    const result = await client.query(
      "SELECT * FROM users WHERE reset_token=$1 AND reset_token_expiry > NOW()",
      [token]
    );

    if (result.rows.length === 0) {
      client.release();
      return res.json({ success: false, message: "Invalid or expired token" });
    }

    const user = result.rows[0];

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await client.query(
      "UPDATE users SET password=$1, reset_token=NULL, reset_token_expiry=NULL WHERE id=$2",
      [hashedPassword, user.id]
    );
    client.release();

    res.json({ success: true, message: "Password reset successful!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.listen(port, () =>
  console.log(`🚀 Server running on http://localhost:${port}`)
); 