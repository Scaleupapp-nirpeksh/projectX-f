import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";

const LoginPage = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const { email, password } = form;

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("userId", data.user._id); 
        navigate("/dashboard");
      } else {
        setError(data.message || "Login failed. Please try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Something went wrong. Please try again later.");
    }
    setLoading(false);
  };

  return (
    <Layout>
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700">
        <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
          <h1 className="text-4xl font-bold text-center text-indigo-600 mb-4">
            Welcome Back
          </h1>
          <p className="text-center text-gray-500 mb-8">
            Log in to continue managing your organization.
          </p>
          {error && (
            <p className="text-red-500 text-sm mb-4 bg-red-100 p-3 rounded-lg">
              {error}
            </p>
          )}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <label className="w-full md:w-1/3 text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full md:flex-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 transition"
                placeholder="Enter your email"
              />
            </div>
            <div className="flex flex-col md:flex-row items-center gap-4">
              <label className="w-full md:w-1/3 text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full md:flex-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 transition"
                placeholder="Enter your password"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 text-white bg-indigo-600 rounded-lg shadow-lg font-semibold hover:bg-indigo-700 transition flex justify-center items-center"
              disabled={loading}
            >
              {loading && (
                <svg
                  className="animate-spin h-5 w-5 mr-3 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  ></path>
                </svg>
              )}
              Login
            </button>
          </form>
          <div className="flex justify-between items-center mt-6 text-sm text-gray-600">
            <a href="/register" className="text-indigo-600 hover:underline">
              Create an account
            </a>
            <a href="/forgot-password" className="text-indigo-600 hover:underline">
              Forgot Password?
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LoginPage;
