import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import toast from "react-hot-toast";

export default function Login(props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      console.log("Login Response:", data);

      if (data.success) {
        toast.success(`Welcome back, ${data.user.username}! 🎉`);
        localStorage.setItem("user", JSON.stringify(data.user));
        // Redirect to dashboard here later
      } else {
        toast.error(data.message || "Invalid credentials");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      console.log("Google User:", decoded);

      const res = await fetch("http://localhost:5000/api/google-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: decoded.email,
          name: decoded.name,
          googleId: decoded.sub,
          picture: decoded.picture
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`Welcome, ${data.user.name || data.user.username}! 🎉`);
        localStorage.setItem("user", JSON.stringify(data.user));
      } else {
        toast.error(data.message || "Google login failed");
      }
    } catch (err) {
      console.error("Google Login Error:", err);
      toast.error("Failed to login with Google");
    }
  };

  const handleGoogleError = () => {
    toast.error("Google login failed. Please try again.");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-200 via-green-100 to-sky-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-5 text-gray-700">Label It Right</h2>

        <form onSubmit={handleLogin}>
          <div className="relative mb-4">
            <i className="fas fa-user absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"></i>
            <input
              type="text"
              placeholder="Username or Email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-green-400 outline-none disabled:opacity-50"
            />
          </div>

          <div className="relative mb-3">
            <i className="fas fa-lock absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"></i>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-green-400 outline-none disabled:opacity-50"
            />
          </div>

          <div className="text-right mb-4">

            <a href="#"
              onClick={(e) => {
                e.preventDefault();
                props.onForgotPassword();
              }}
              className="text-sm text-green-600 hover:underline"
            >
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-green-400 to-blue-600 text-white rounded-xl font-semibold shadow-md hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <div className="flex items-center my-4">
            <div className="grow border-t border-gray-300"></div>
            <span className="px-2 text-gray-500 text-sm">or</span>
            <div className="grow border-t border-gray-300"></div>
          </div>

          <div className="w-full">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              size="large"
              width="100%"
              text="continue_with"
              shape="rectangular"
            />
          </div>
        </form>

        <p className="mt-4 text-gray-600 text-sm">
          Don&apos;t have an account?{" "}

          <a href="#"
            onClick={(e) => {
              e.preventDefault();
              props.onSwitchToSignup();
            }}
            className="text-blue-600 font-semibold hover:underline"
          >
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}