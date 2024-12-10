// src/pages/Dashboard.jsx

import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [userOrganizations, setUserOrganizations] = useState([]);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [newOrg, setNewOrg] = useState({
    name: "",
    address: "",
    contactNumber: "",
    email: "",
    description: "",
    registrationId: "",
    industry: "",
    website: "",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setError("You must be logged in to view the dashboard.");
      return;
    }
    fetchOrganizations();
    fetchUserAccessRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Fetch organizations the user is a part of
  const fetchOrganizations = async () => {
    try {
      const response = await fetch("http://localhost:4000/api/organizations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setUserOrganizations(data.organizations);
        if (data.organizations.length > 0) {
          setSelectedOrganization(data.organizations[0]._id);
        }
      } else {
        setError(data.message || "Failed to fetch organizations.");
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
      setError("Something went wrong. Please try again later.");
    }
  };

  // Fetch user's access requests to determine pending requests
  const fetchUserAccessRequests = async () => {
    try {
      const response = await fetch(
        "http://localhost:4000/api/organizations/access-requests",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      if (response.ok) {
        const pending = data.requests
          .filter((req) => req.status === "pending")
          .map((req) => req.orgId._id); // Assuming orgId is populated with organization details
        setPendingRequests(pending);
      } else {
        setError(data.message || "Failed to fetch access requests.");
      }
    } catch (error) {
      console.error("Error fetching access requests:", error);
      setError("Something went wrong. Please try again later.");
    }
  };

  // Handle searching organizations by name
  const handleSearch = async () => {
    setError("");
    if (!searchTerm.trim()) {
      setError("Please enter a valid organization name to search.");
      return;
    }
    try {
      const response = await fetch(
        `http://localhost:4000/api/organizations/search?name=${encodeURIComponent(
          searchTerm.trim()
        )}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (response.ok) {
        setSearchResults(data.organizations);
      } else {
        setError(data.message || "Failed to search organizations.");
      }
    } catch (error) {
      console.error("Error searching organizations:", error);
      setError("Something went wrong. Please try again later.");
    }
  };

  // Navigate to the selected organization's homepage
  const handleVisitOrg = () => {
    if (selectedOrganization) {
      navigate(`/organization/${selectedOrganization}`);
    }
  };

  // Handle creating a new organization
  const handleCreateOrganization = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    if (!newOrg.name.trim()) {
      setError("Organization name is required.");
      setLoading(false);
      return;
    }
    try {
      const response = await fetch("http://localhost:4000/api/organizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newOrg),
      });
      const data = await response.json();
      if (response.ok) {
        alert("Organization created successfully!");
        setUserOrganizations((prev) => [...prev, data.organization]);
        setNewOrg({
          name: "",
          address: "",
          contactNumber: "",
          email: "",
          description: "",
          registrationId: "",
          industry: "",
          website: "",
        });
        setIsModalOpen(false);
      } else {
        setError(data.message || "Failed to create organization.");
      }
    } catch (error) {
      console.error("Error creating organization:", error);
      setError("Something went wrong. Please try again later.");
    }
    setLoading(false);
  };

  // Handle requesting access to an organization
  const handleRequestAccess = async (orgId) => {
    setError("");
    try {
      const response = await fetch(
        `http://localhost:4000/api/organizations/${orgId}/request-access`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      if (response.ok) {
        alert("Access request submitted successfully!");
        setPendingRequests((prev) => [...prev, orgId]);
      } else {
        setError(data.message || "Failed to request access.");
      }
    } catch (error) {
      console.error("Error requesting access:", error);
      setError("Something went wrong. Please try again later.");
    }
  };

  return (
    <Layout>
      <div className="p-8 space-y-8">
        <h1 className="text-4xl font-extrabold text-center text-indigo-600">
          Dashboard
        </h1>

        {/* Display Error Messages */}
        {error && (
          <p className="text-red-500 text-center bg-red-100 p-3 rounded">
            {error}
          </p>
        )}

        {/* Dropdown for Selecting Organization */}
        {userOrganizations.length > 0 ? (
          <section className="bg-white p-6 rounded shadow-lg">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Select Organization
            </h2>
            <select
              value={selectedOrganization || ""}
              onChange={(e) => setSelectedOrganization(e.target.value)}
              className="w-full px-4 py-2 border rounded shadow-sm text-gray-800"
            >
              <option value="" disabled className="text-gray-500">
                Select an Organization
              </option>
              {userOrganizations.map((org) => (
                <option key={org._id} value={org._id}>
                  {org.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleVisitOrg}
              disabled={!selectedOrganization}
              className={`mt-4 px-4 py-2 rounded transition ${
                selectedOrganization
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "bg-gray-400 text-white cursor-not-allowed"
              }`}
            >
              Visit Organization Homepage
            </button>
          </section>
        ) : (
          <p className="text-gray-500">You are not part of any organization yet.</p>
        )}

        {/* Search for Organizations */}
        <section className="bg-white p-6 rounded shadow-lg">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Search for Organizations
          </h2>
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border rounded shadow-sm text-gray-800"
              placeholder="Enter organization name"
            />
            <button
              onClick={handleSearch}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
            >
              Search
            </button>
          </div>
          <ul className="space-y-4 mt-4">
            {searchResults.length > 0 ? (
              searchResults.map((org) => (
                <li
                  key={org._id}
                  className="p-4 border rounded shadow bg-white hover:shadow-lg transition"
                >
                  <h3 className="text-lg font-bold text-gray-800">
                    {org.name}
                  </h3>
                  <p className="text-gray-700">
                    {org.description || "No description provided."}
                  </p>
                  <p className="text-gray-700">Industry: {org.industry || "N/A"}</p>
                  <p className="text-gray-700">Email: {org.email || "N/A"}</p>
                  <p className="text-gray-700">
                    Website:{" "}
                    {org.website ? (
                      <a
                        href={org.website.startsWith("http") ? org.website : `http://${org.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 underline"
                      >
                        {org.website}
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </p>
                  <button
                    onClick={() => handleRequestAccess(org._id)}
                    className={`mt-2 px-4 py-2 rounded transition ${
                      pendingRequests.includes(org._id)
                        ? "bg-gray-400 text-white cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                    disabled={pendingRequests.includes(org._id)}
                  >
                    {pendingRequests.includes(org._id)
                      ? "Request Pending"
                      : "Request Access"}
                  </button>
                </li>
              ))
            ) : (
              <p className="text-gray-500">No organizations found.</p>
            )}
          </ul>
        </section>

        {/* Create Organization */}
        <section className="bg-white p-6 rounded shadow-lg">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Create New Organization
          </h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
          >
            Create Organization
          </button>
        </section>

        {/* Create Organization Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
              <h2 className="text-2xl font-bold mb-4 text-indigo-600">
                Create Organization
              </h2>
              <form onSubmit={handleCreateOrganization} className="space-y-4">
                <input
                  type="text"
                  value={newOrg.name}
                  onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded shadow-sm"
                  placeholder="Organization Name"
                  required
                />
                <input
                  type="text"
                  value={newOrg.address}
                  onChange={(e) =>
                    setNewOrg({ ...newOrg, address: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded shadow-sm"
                  placeholder="Address"
                />
                <input
                  type="text"
                  value={newOrg.contactNumber}
                  onChange={(e) =>
                    setNewOrg({ ...newOrg, contactNumber: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded shadow-sm"
                  placeholder="Contact Number"
                />
                <input
                  type="email"
                  value={newOrg.email}
                  onChange={(e) =>
                    setNewOrg({ ...newOrg, email: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded shadow-sm"
                  placeholder="Email"
                />
                <textarea
                  value={newOrg.description}
                  onChange={(e) =>
                    setNewOrg({ ...newOrg, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded shadow-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Description"
                />
                <input
                  type="text"
                  value={newOrg.registrationId}
                  onChange={(e) =>
                    setNewOrg({ ...newOrg, registrationId: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded shadow-sm"
                  placeholder="Registration ID"
                />
                <input
                  type="text"
                  value={newOrg.industry}
                  onChange={(e) =>
                    setNewOrg({ ...newOrg, industry: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded shadow-sm"
                  placeholder="Industry"
                />
                <input
                  type="text"
                  value={newOrg.website}
                  onChange={(e) =>
                    setNewOrg({ ...newOrg, website: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded shadow-sm"
                  placeholder="Website"
                />

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                    disabled={loading}
                  >
                    {loading ? "Creating..." : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
