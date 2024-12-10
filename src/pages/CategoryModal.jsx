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
      <div className="p-6 bg-white rounded-lg shadow-lg max-w-lg mx-auto">
        <h2 className="text-xl font-bold mb-4">Add Category and Sub-Categories</h2>
        <form className="space-y-4">
          {error && <p className="text-red-500">{error}</p>}
          {/* Category Name */}
          <div>
            <label className="block text-sm font-medium text-white-700 mb-1">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="bg-red-500 text-white px-3 py-1 rounded"
                    onClick={() => removeSubCategory(index)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="bg-blue-500 text-white px-4 py-2 rounded mt-2"
              onClick={addSubCategory}
            >
              Add Sub-Category
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              className="bg-gray-300 px-4 py-2 rounded"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="bg-green-500 text-white px-4 py-2 rounded"
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
