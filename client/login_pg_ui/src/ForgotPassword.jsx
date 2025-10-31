import { useState } from "react";
import toast from "react-hot-toast";

export default function ForgotPassword({ onBackToLogin }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Password reset email sent! Check your inbox 📧");
        setEmail("");
      } else {
        toast.error(data.message || "Email not found");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-200 via-green-100 to-sky-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-3 text-gray-700">Forgot Password?</h2>
        <p className="text-gray-600 text-sm mb-6">
          Enter your email and we'll send you a reset link
        </p>

        <form onSubmit={handleSubmit}>
          <div className="relative mb-6">
            <i className="fas fa-envelope absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"></i>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-green-400 outline-none disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-green-400 to-blue-600 text-white rounded-xl font-semibold shadow-md hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>

          <button
            type="button"
            onClick={onBackToLogin}
            className="text-blue-600 font-semibold hover:underline"
          >
            ← Back to Login
          </button>
        </form>
      </div>
    </div>
  );
}