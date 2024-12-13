// src/pages/PartnersModal.jsx
import React, { useState, useEffect } from "react";
import Modal from "../components/Modal";

const PartnersModal = ({
  onClose,
  onSave,
  categories = [],
  existingPartner = null, // If editing, pass the existing partner data
}) => {
  // Determine if the modal is in Edit mode
  const isEditMode = existingPartner !== null;

  // Initialize state variables
  const [error, setError] = useState("");
  const [name, setName] = useState(isEditMode ? existingPartner.name : "");
  const [type, setType] = useState(isEditMode ? existingPartner.type : "vendor"); // "vendor" or "client"
  const [contactInfo, setContactInfo] = useState({
    email: isEditMode ? existingPartner.contactInfo.email || "" : "",
    phone: isEditMode ? existingPartner.contactInfo.phone || "" : "",
    address: isEditMode ? existingPartner.contactInfo.address || "" : "",
  });
  const [categoryId, setCategoryId] = useState(isEditMode ? existingPartner.categoryId._id : "");

  // Handle form submission
  const handleSave = () => {
    setError("");

    // Basic Validation
    if (!name.trim()) {
      setError("Partner name is required.");
      return;
    }

    if (!["vendor", "client"].includes(type)) {
      setError("Invalid partner type selected.");
      return;
    }

    // Optional: Validate email format if provided
    if (contactInfo.email && !/\S+@\S+\.\S+/.test(contactInfo.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    

    // Construct partner data
    const partnerData = {
      name: name.trim(),
      type,
      contactInfo,
      categoryId: categoryId || null, // Allow null if no category is selected
    };

    // If in edit mode, include the partner ID
    if (isEditMode) {
      partnerData.partnerId = existingPartner._id;
    }

    onSave(partnerData);
  };

  return (
    <Modal onClose={onClose}>
      <div
        className="p-6 bg-white rounded-lg shadow-lg max-w-lg mx-auto text-black z-50 relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="partners-modal-title"
      >
        <h2 id="partners-modal-title" className="text-2xl font-bold mb-4">
          {isEditMode ? "Edit Partner" : "Add New Partner"}
        </h2>
        {error && <p className="text-red-600 mb-4 text-sm">{error}</p>}

        <div className="space-y-4">
          {/* Partner Name */}
          <div>
            <label htmlFor="partner-name" className="block text-sm font-medium mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="partner-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
              aria-required="true"
              aria-label="Partner Name Input"
            />
          </div>

          {/* Partner Type */}
          <div>
            <label htmlFor="partner-type" className="block text-sm font-medium mb-1">
              Type <span className="text-red-500">*</span>
            </label>
            <select
              id="partner-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
              aria-required="true"
              aria-label="Partner Type Select"
            >
              <option value="vendor">Vendor</option>
              <option value="client">Client</option>
            </select>
          </div>

          {/* Contact Information */}
          <div className="bg-gray-50 p-4 rounded border border-gray-200 space-y-2">
            <h3 className="text-md font-semibold mb-2">Contact Information</h3>

            {/* Email */}
            <div>
              <label htmlFor="partner-email" className="block text-sm mb-1">
                Email
              </label>
              <input
                id="partner-email"
                type="email"
                value={contactInfo.email}
                onChange={(e) =>
                  setContactInfo({ ...contactInfo, email: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                aria-label="Partner Email Input"
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="partner-phone" className="block text-sm mb-1">
                Phone
              </label>
              <input
                id="partner-phone"
                type="text"
                value={contactInfo.phone}
                onChange={(e) =>
                  setContactInfo({ ...contactInfo, phone: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                aria-label="Partner Phone Input"
                placeholder="+1234567890"
              />
            </div>

            {/* Address */}
            <div>
              <label htmlFor="partner-address" className="block text-sm mb-1">
                Address
              </label>
              <textarea
                id="partner-address"
                value={contactInfo.address}
                onChange={(e) =>
                  setContactInfo({ ...contactInfo, address: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                rows="2"
                aria-label="Partner Address Input"
              ></textarea>
            </div>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="partner-category" className="block text-sm font-medium mb-1">
              Category
            </label>
            <select
              id="partner-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              aria-label="Partner Category Select"
            >
              <option value="">-- Select Category --</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end mt-6 space-x-3 border-t border-gray-200 pt-4">
          <button
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition"
            onClick={onClose}
            aria-label="Cancel Add/Edit Partner"
          >
            Cancel
          </button>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700 transition"
            onClick={handleSave}
            aria-label="Save Partner"
          >
            {isEditMode ? "Update Partner" : "Add Partner"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PartnersModal;
