import { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import Login from "./Login";
import Signup from "./Signup";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";

function App() {
  const [currentPage, setCurrentPage] = useState("login");

  // Check for reset token in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('token')) {
      setCurrentPage("reset-password");
    }
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case "signup":
        return <Signup onSwitchToLogin={() => setCurrentPage("login")} />;
      case "forgot-password":
        return <ForgotPassword onBackToLogin={() => setCurrentPage("login")} />;
      case "reset-password":
        return <ResetPassword onBackToLogin={() => setCurrentPage("login")} />;
      default:
        return (
          <Login
            onSwitchToSignup={() => setCurrentPage("signup")}
            onForgotPassword={() => setCurrentPage("forgot-password")}
          />
        );
    }
  };

  return (
    <div>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
            padding: '16px',
            borderRadius: '10px',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      {renderPage()}
    </div>
  );
}

export default App;