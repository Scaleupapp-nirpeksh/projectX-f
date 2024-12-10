import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import "react-tooltip/dist/react-tooltip.css";
import { Tooltip } from "react-tooltip";

const OrgHomePage = () => {
  const { orgId } = useParams();
  const [organization, setOrganization] = useState(null);
  const [role, setRole] = useState("");
  const [enabledComponents, setEnabledComponents] = useState([]);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      console.error("User ID is missing in localStorage. Redirecting to login...");
      navigate("/");
      return;
    }

    const fetchOrganizationDetails = async () => {
      try {
        const response = await fetch(
          `http://localhost:4000/api/organizations/${orgId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await response.json();

        if (response.ok) {
          console.log("Fetched organization data:", data);
          console.log("Logged-in user ID:", storedUserId);

          setOrganization(data.organization);
          setRole(data.role);

          const userAccessComponents = data.organization.components.filter(
            (component) =>
              component.enabled &&
              component.userAccess.some(
                (access) =>
                  access.userId._id === storedUserId && access.hasAccess
              )
          );

          setEnabledComponents(userAccessComponents.map((comp) => comp.componentName));
        } else {
          setError(data.message || "Failed to fetch organization details.");
        }
      } catch (error) {
        console.error("Error fetching organization details:", error);
        setError("Something went wrong. Please try again later.");
      }
    };

    fetchOrganizationDetails();
  }, [orgId, token, navigate]);

  if (error) {
    return (
      <Layout>
        <p className="text-red-500 text-center bg-red-100 p-3 rounded">
          {error}
        </p>
      </Layout>
    );
  }

  if (!organization) {
    return (
      <Layout>
        <p className="text-gray-500 text-center">Loading...</p>
      </Layout>
    );
  }

  // Button rendering logic
  const renderButton = (component, label, navigateTo) => {
    const isEnabled = enabledComponents.includes(component);
    return (
      <div className="relative group">
        <button
          className={`px-6 py-3 rounded-lg font-semibold transition ${
            isEnabled
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-400 text-gray-800 cursor-not-allowed"
          }`}
          onClick={() => isEnabled && navigate(navigateTo)}
          disabled={!isEnabled}
          data-tooltip-id={`tooltip-${component}`} // Tooltip ID
        >
          {label}
        </button>
        {!isEnabled && (
          <Tooltip id={`tooltip-${component}`} place="top">
            Contact admin to enable this feature
          </Tooltip>
        )}
      </div>
    );
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-r from-blue-500 to-purple-500 p-10 text-white">
        <div className="max-w-5xl mx-auto bg-white p-8 rounded-lg shadow-lg text-gray-800">
          <h1 className="text-4xl font-bold mb-6 text-center">
            {organization.name}
          </h1>
          <div className="space-y-4 text-lg">
            <p>
              <strong>Address:</strong> {organization.address || "N/A"}
            </p>
            <p>
              <strong>Contact Number:</strong>{" "}
              {organization.contactNumber || "N/A"}
            </p>
            <p>
              <strong>Email:</strong> {organization.email || "N/A"}
            </p>
            <p>
              <strong>Description:</strong>{" "}
              {organization.description || "No description available."}
            </p>
            <p>
              <strong>Industry:</strong> {organization.industry || "N/A"}
            </p>
            <p>
              <strong>Website:</strong>{" "}
              <a
                href={organization.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {organization.website || "N/A"}
              </a>
            </p>
            <p>
              <strong>Registration ID:</strong>{" "}
              {organization.registrationId || "N/A"}
            </p>
          </div>

          {/* Admin Controls */}
          {role === "admin" && (
            <div className="mt-10 mb-8 text-center">
              <button
                className="bg-green-600 text-white px-8 py-3 rounded-lg shadow-lg hover:bg-green-700 transition font-bold text-xl"
                onClick={() => navigate(`/organization/${orgId}/admin`)}
              >
                Admin Controls
              </button>
            </div>
          )}

          {/* Component Buttons */}
          <div className="flex justify-center gap-6 mt-6">
            {renderButton(
              "finance",
              "Go to Finance Management",
              `/organization/${orgId}/finance`
            )}
            {renderButton(
              "tasks",
              "Go to Task Management",
              `/organization/${orgId}/tasks`
            )}
            {renderButton(
              "documentation",
              "Go to Documentation",
              `/organization/${orgId}/documentation`
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OrgHomePage;
