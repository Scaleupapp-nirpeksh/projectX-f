import React, { useState } from "react";
import Modal from "../components/Modal";

const CategoryModal = ({ onClose, onSave }) => {
  const [categoryName, setCategoryName] = useState("");
  const [subCategories, setSubCategories] = useState([{ name: "" }]);
  const [error, setError] = useState("");

  const handleSubCategoryChange = (index, value) => {
    const updatedSubCategories = [...subCategories];
    updatedSubCategories[index].name = value;
    setSubCategories(updatedSubCategories);
  };

  const addSubCategory = () => {
    setSubCategories([...subCategories, { name: "" }]);
  };

  const removeSubCategory = (index) => {
    const updatedSubCategories = subCategories.filter((_, i) => i !== index);
    setSubCategories(updatedSubCategories);
  };

  const handleSave = async () => {
    if (!categoryName.trim()) {
      setError("Category name is required.");
      return;
    }

    const trimmedSubCategories = subCategories
      .map((sub) => sub.name.trim())
      .filter((name) => name);

    const data = {
      name: categoryName.trim(),
      subCategories: trimmedSubCategories,
    };

    try {
      const token = localStorage.getItem("token");
      const orgId = localStorage.getItem("currentOrgId");
      const response = await fetch(
        `http://localhost:4000/api/finance/${orgId}/components/finance/categories`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const responseData = await response.json();
        setError(responseData.message || "Failed to save category.");
      } else {
        const responseData = await response.json();
        onSave(responseData.category);
        onClose();
      }
    } catch (err) {
      setError("An error occurred while saving the category.");
    }
  };

  return (
    <Modal onClose={onClose}>
      {/* Ensure high contrast with text-black */}
      <div className="p-6 bg-white rounded-lg shadow-lg max-w-lg mx-auto text-black z-50 relative">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">
          Add Category and Sub-Categories
        </h2>
        {error && <p className="text-red-600 mb-4 text-sm">{error}</p>}
        <form className="space-y-6">
          {/* Category Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Category Name
            </label>
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Enter category name"
            />
          </div>

          {/* Sub-Categories */}
          <div>
            <label className="block text-sm font-semibold text-blue-900 mb-2">
              Sub-Categories
            </label>
            {subCategories.map((subCategory, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={subCategory.name}
                  onChange={(e) => handleSubCategoryChange(index, e.target.value)}
                  className="flex-grow px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder={`Sub-Category ${index + 1}`}
                />
                {subCategories.length > 1 && (
                  <button
                    type="button"
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                    onClick={() => removeSubCategory(index)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="bg-blue-500 text-white px-4 py-2 rounded mt-2 hover:bg-blue-600 transition"
              onClick={addSubCategory}
            >
              Add Sub-Category
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700 transition"
              onClick={handleSave}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default CategoryModal;
