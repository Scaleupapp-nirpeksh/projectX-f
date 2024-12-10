import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { useParams } from 'react-router-dom';

const AdminControlPage = () => {
  const [activeTab, setActiveTab] = useState("components");
  const [components, setComponents] = useState([]);
  const [organizationComponents, setOrganizationComponents] = useState([]);
  const [accessRequests, setAccessRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { orgId } = useParams();
  const token = localStorage.getItem("token");

  const [showEditOrgModal, setShowEditOrgModal] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [orgAddress, setOrgAddress] = useState("");
  const [orgContact, setOrgContact] = useState("");
  const [orgDescription, setOrgDescription] = useState("");
  const [orgEmail, setOrgEmail] = useState("");
  const [orgIndustry, setOrgIndustry] = useState("");
  const [orgWebsite, setOrgWebsite] = useState("");

  useEffect(() => {
    if (!orgId) return;
    fetchComponents();
    fetchOrgComponents();
    fetchAccessRequests();
    fetchOrgUsers();
  }, [orgId]);

  const fetchComponents = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/components`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setComponents(data.components || []);
    } catch (error) {
      setError("Failed to fetch components.");
    }
  };

  const fetchOrgComponents = async () => {
    try {
      const response = await fetch(
        `http://localhost:4000/api/organizations/${orgId}/components`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      setOrganizationComponents(data.components || []);
    } catch (error) {
      setError("Failed to fetch organization components.");
    }
  };

  const fetchAccessRequests = async () => {
    try {
      const response = await fetch(
        `http://localhost:4000/api/organizations/${orgId}/access-requests`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      setAccessRequests(data.requests || []);
    } catch (error) {
      setError("Failed to fetch access requests.");
    }
  };

  const fetchOrgUsers = async () => {
    try {
      const response = await fetch(
        `http://localhost:4000/api/organizations/${orgId}/users`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      setError("Failed to fetch organization users.");
    }
  };

  const handleEnableComponent = async (componentName) => {
    setLoading(true);
    try {
      await fetch(
        `http://localhost:4000/api/organizations/${orgId}/components/${componentName}/enable`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchOrgComponents();
    } catch (error) {
      setError("Failed to enable component.");
    }
    setLoading(false);
  };

  const handleAccessRequest = async (requestId, action) => {
    setLoading(true);
    try {
      await fetch(
        `http://localhost:4000/api/organizations/${orgId}/access-requests/${requestId}/${action}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchAccessRequests();
    } catch (error) {
      setError(`Failed to ${action} access request.`);
    }
    setLoading(false);
  };

  const handleChangeUserRole = async (userId, role) => {
    setLoading(true);
    try {
      await fetch(
        `http://localhost:4000/api/organizations/${orgId}/users/${userId}/role`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role }),
        }
      );
      fetchOrgUsers();
    } catch (error) {
      setError("Failed to change user role.");
    }
    setLoading(false);
  };

  const handleRemoveUser = async (userId) => {
    setLoading(true);
    try {
      await fetch(
        `http://localhost:4000/api/organizations/${orgId}/users/${userId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchOrgUsers();
    } catch (error) {
      setError("Failed to remove user.");
    }
    setLoading(false);
  };

  const isComponentEnabled = (name) => {
    return organizationComponents?.some((c) => c.componentName === name && c.enabled);
  };

  const handleAssignComponentToUser = async (userId, componentName, hasAccess) => {
    setLoading(true);
    try {
      await fetch(
        `http://localhost:4000/api/organizations/${orgId}/components/${componentName}/users/${userId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ hasAccess })
        }
      );
      fetchOrgUsers();
    } catch (error) {
      setError("Failed to update user component access.");
    }
    setLoading(false);
  };

  const handleEditOrganization = async () => {
    setShowEditOrgModal(true);
    // Fetch current org details to prefill
    try {
      const response = await fetch(`http://localhost:4000/api/organizations/${orgId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        const { organization } = data;
        setOrgName(organization.name || "");
        setOrgAddress(organization.address || "");
        setOrgContact(organization.contactNumber || "");
        setOrgDescription(organization.description || "");
        setOrgEmail(organization.email || "");
        setOrgIndustry(organization.industry || "");
        setOrgWebsite(organization.website || "");
      } else {
        setError(data.message || "Failed to fetch organization details.");
      }
    } catch (error) {
      setError("Failed to fetch organization details for editing.");
    }
  };

  const handleUpdateOrganization = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:4000/api/organizations/${orgId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: orgName,
          address: orgAddress,
          contactNumber: orgContact,
          description: orgDescription,
          email: orgEmail,
          industry: orgIndustry,
          website: orgWebsite
        })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Failed to update organization.');
      } else {
        setShowEditOrgModal(false);
      }
    } catch (error) {
      setError("Failed to update organization.");
    }
    setLoading(false);
  };

  return (
    <Layout>
      <div className="p-8 space-y-8 min-h-screen bg-gradient-to-r from-blue-500 to-purple-500 text-white">
        <h1 className="text-4xl font-extrabold text-center mb-6">Admin Controls</h1>

        {error && <p className="text-red-500 bg-red-100 p-3 rounded text-black">{error}</p>}

        <div className="flex justify-center mb-4">
          <button
            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
            onClick={handleEditOrganization}
          >
            Edit Organization
          </button>
        </div>

        {showEditOrgModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded shadow-lg text-gray-800 w-full max-w-md relative">
      <h2 className="text-xl font-bold mb-4 text-center">Edit Organization</h2>
      <form onSubmit={handleUpdateOrganization} className="space-y-4">
        <input
          type="text"
          placeholder="Name"
          className="border p-2 w-full rounded"
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Address"
          className="border p-2 w-full rounded"
          value={orgAddress}
          onChange={(e) => setOrgAddress(e.target.value)}
        />
        <input
          type="text"
          placeholder="Contact Number"
          className="border p-2 w-full rounded"
          value={orgContact}
          onChange={(e) => setOrgContact(e.target.value)}
        />
        <input
          type="text"
          placeholder="Description"
          className="border p-2 w-full rounded"
          value={orgDescription}
          onChange={(e) => setOrgDescription(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          className="border p-2 w-full rounded"
          value={orgEmail}
          onChange={(e) => setOrgEmail(e.target.value)}
        />
        <input
          type="text"
          placeholder="Industry"
          className="border p-2 w-full rounded"
          value={orgIndustry}
          onChange={(e) => setOrgIndustry(e.target.value)}
        />
        <input
          type="text"
          placeholder="Website"
          className="border p-2 w-full rounded"
          value={orgWebsite}
          onChange={(e) => setOrgWebsite(e.target.value)}
        />

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
            onClick={() => setShowEditOrgModal(false)}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  </div>
)}


        <div className="flex justify-center space-x-4 bg-white rounded p-2">
          <button
            className={`px-4 py-2 rounded font-bold ${
              activeTab === "components"
                ? "bg-blue-600 text-white"
                : "text-blue-600 hover:bg-gray-100"
            }`}
            onClick={() => setActiveTab("components")}
          >
            Components
          </button>
          <button
            className={`px-4 py-2 rounded font-bold ${
              activeTab === "accessRequests"
                ? "bg-blue-600 text-white"
                : "text-blue-600 hover:bg-gray-100"
            }`}
            onClick={() => setActiveTab("accessRequests")}
          >
            Access Requests
          </button>
          <button
            className={`px-4 py-2 rounded font-bold ${
              activeTab === "users"
                ? "bg-blue-600 text-white"
                : "text-blue-600 hover:bg-gray-100"
            }`}
            onClick={() => setActiveTab("users")}
          >
            Users
          </button>
        </div>

        {activeTab === "components" && (
          <div className="bg-white p-6 rounded shadow-lg text-gray-800">
            <h2 className="text-2xl font-bold mb-4">Assign Components</h2>
            <p className="mb-4 text-gray-600">
              Enable components for your organization. Once enabled, admins have automatic access.
            </p>
            <div className="grid grid-cols-3 gap-4">
              {components?.map((component) => {
                const enabled = isComponentEnabled(component.name);
                return (
                  <div
                    key={component.name}
                    className="border rounded p-4 shadow flex flex-col justify-between"
                  >
                    <h3 className="text-xl font-semibold mb-2">{component.displayName}</h3>
                    <p className="text-sm text-gray-600 mb-4">{component.description}</p>
                    <button
                      className={`py-2 px-4 rounded font-semibold ${
                        enabled
                          ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                          : "bg-green-600 text-white hover:bg-green-700"
                      }`}
                      onClick={() => !enabled && handleEnableComponent(component.name)}
                      disabled={enabled}
                    >
                      {enabled ? "Enabled" : "Enable"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "accessRequests" && (
          <div className="bg-white p-6 rounded shadow-lg text-gray-800">
            <h2 className="text-2xl font-bold mb-4">Access Requests</h2>
            {accessRequests?.length === 0 ? (
              <p className="text-gray-500">No pending access requests.</p>
            ) : (
              <table className="w-full border">
                <thead>
                  <tr className="bg-gray-100 text-gray-700">
                    <th className="p-2 text-left">User</th>
                    <th className="p-2 text-left">Email</th>
                    <th className="p-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {accessRequests?.map((request) => (
                    <tr key={request._id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        {request.userId?.firstName} {request.userId?.lastName}
                      </td>
                      <td className="p-2">{request.userId?.email}</td>
                      <td className="p-2 space-x-2">
                        <button
                          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                          onClick={() => handleAccessRequest(request._id, "approve")}
                        >
                          Approve
                        </button>
                        <button
                          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                          onClick={() => handleAccessRequest(request._id, "reject")}
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "users" && (
          <div className="bg-white p-6 rounded shadow-lg text-gray-800">
            <h2 className="text-2xl font-bold mb-4">Manage Users</h2>
            <p className="mb-4 text-gray-600">
              View and manage user roles and component access. Admins have full control.
            </p>
            {users?.length === 0 ? (
              <p className="text-gray-500">No users found.</p>
            ) : (
              <table className="w-full border">
                <thead>
                  <tr className="bg-gray-100 text-gray-700">
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2 text-left">Email</th>
                    <th className="p-2 text-left">Role</th>
                    <th className="p-2 text-left">Components</th>
                    <th className="p-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users?.map((user) => {
                    return (
                      <tr key={user._id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          {user.firstName} {user.lastName}
                        </td>
                        <td className="p-2">{user.email}</td>
                        <td className="p-2 capitalize">
                          <select
                            className="border px-2 py-1 rounded"
                            value={user.role}
                            onChange={(e) => handleChangeUserRole(user._id, e.target.value)}
                          >
                            <option value="admin">Admin</option>
                            <option value="member">Member</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <div className="flex flex-wrap gap-2">
                            {organizationComponents?.filter(c => c.enabled).map((comp) => {
                              const userHasAccess = user.componentAccess?.some(
                                (uc) => uc.componentName === comp.componentName && uc.hasAccess
                              );
                              return (
                                <label key={comp.componentName} className="flex items-center space-x-1">
                                  <input
                                    type="checkbox"
                                    checked={userHasAccess}
                                    onChange={(e) => handleAssignComponentToUser(user._id, comp.componentName, e.target.checked)}
                                  />
                                  <span
                                    className={`px-2 py-1 rounded text-sm ${
                                      userHasAccess
                                        ? "bg-green-200 text-green-800"
                                        : "bg-gray-200 text-gray-600"
                                    }`}
                                  >
                                    {comp.componentName}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </td>
                        <td className="p-2 space-x-2">
                          <button
                            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                            onClick={() => handleRemoveUser(user._id)}
                            title="Remove User"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminControlPage;
