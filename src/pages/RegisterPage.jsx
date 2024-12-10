import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";

const RegisterPage = () => {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    const { firstName, lastName, email, password, confirmPassword } = form;

    // Field validation
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:4000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password }),
      });
      const data = await response.json();

      if (response.ok) {
        navigate("/login");
      } else {
        setError(data.message || "Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError("Something went wrong. Please try again later.");
    }
    setLoading(false);
  };

  return (
    <Layout>
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700">
        <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
          <h1 className="text-4xl font-bold text-center text-indigo-600 mb-4">
            Register
          </h1>
          <p className="text-center text-gray-500 mb-8">
            Join us to streamline and manage your organization effortlessly.
          </p>
          {error && (
            <p className="text-red-500 text-sm mb-4 bg-red-100 p-3 rounded-lg">
              {error}
            </p>
          )}
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <label className="w-full md:w-1/3 text-sm font-medium text-gray-700">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                className="w-full md:flex-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 transition"
                placeholder="Enter your first name"
              />
            </div>
            <div className="flex flex-col md:flex-row items-center gap-4">
              <label className="w-full md:w-1/3 text-sm font-medium text-gray-700">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                className="w-full md:flex-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 transition"
                placeholder="Enter your last name"
              />
            </div>
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
                placeholder="Create a password"
              />
            </div>
            <div className="flex flex-col md:flex-row items-center gap-4">
              <label className="w-full md:w-1/3 text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                className="w-full md:flex-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 transition"
                placeholder="Confirm your password"
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
              Register
            </button>
          </form>
          <div className="flex justify-center items-center mt-6 text-sm text-gray-600">
            Already have an account?{" "}
            <a
              href="/login"
              className="ml-2 text-indigo-600 hover:underline font-medium"
            >
              Login
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RegisterPage;
