import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import { useNavigate } from "react-router-dom";

const FinanceManagement = () => {
  const [activeTab, setActiveTab] = useState("categories");
  const [categories, setCategories] = useState([]);
  const [records, setRecords] = useState([]);
  const [fieldDefinitions, setFieldDefinitions] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: "", subCategories: [""] });
  
  const [editCategory, setEditCategory] = useState(null);
  const token = localStorage.getItem("token");
  const orgId = localStorage.getItem("currentOrgId");

  const navigate = useNavigate();

  useEffect(() => {
    if (!orgId) {
      setError("Organization ID is missing. Redirecting to organization selection...");
      setTimeout(() => navigate("/dashboard"), 3000); // Redirect after 3 seconds
    } else {
      if (activeTab === "categories") fetchCategories();
      else if (activeTab === "records") fetchRecords();
      else if (activeTab === "fields") fetchFieldDefinitions();
    }
  }, [activeTab]);

  const fetchCategories = async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:4000/api/finance/${orgId}/components/finance/categories`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (response.ok) setCategories(data.categories || []);
      else setError(data.message || "Failed to fetch categories.");
    } catch (err) {
      setError("Error fetching categories.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRecords = async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:4000/api/finance/${orgId}/components/finance/records`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (response.ok) setRecords(data.records || []);
      else setError(data.message || "Failed to fetch records.");
    } catch (err) {
      setError("Error fetching records.");
    } finally {
      setLoading(false);
    }
  };

  const fetchFieldDefinitions = async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:4000/api/finance/${orgId}/components/finance/fields`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (response.ok) setFieldDefinitions(data.fields || []);
      else setError(data.message || "Failed to fetch field definitions.");
    } catch (err) {
      setError("Error fetching field definitions.");
    } finally {
      setLoading(false);
    }
  };


  const handleModalClose = () => {
    setShowModal(false);
    setEditCategory(null);
    setCategoryForm({ name: "", subCategories: [""] });
  };

  const handleAddOrUpdateCategory = async () => {
    if (!categoryForm.name.trim()) {
      alert("Category name is required.");
      return;
    }

    try {
      const method = editCategory ? "PUT" : "POST";
      const url = editCategory
        ? `http://localhost:4000/api/finance/${orgId}/components/finance/categories/${editCategory._id}`
        : `http://localhost:4000/api/finance/${orgId}/components/finance/categories`;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(categoryForm),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || "Failed to save category.");
        return;
      }

      const data = await response.json();
      if (editCategory) {
        setCategories(
          categories.map((category) =>
            category._id === editCategory._id ? data.category : category
          )
        );
      } else {
        setCategories([...categories, data.category]);
      }

      handleModalClose();
    } catch (err) {
      setError("Error saving category.");
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      const response = await fetch(
        `http://localhost:4000/api/finance/${orgId}/components/finance/categories/${categoryId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || "Failed to delete category.");
        return;
      }

      setCategories(categories.filter((category) => category._id !== categoryId));
    } catch (err) {
      setError("Error deleting category.");
    }
  };

  const handleEditCategory = (category) => {
    setEditCategory(category);
    setCategoryForm({
      name: category.name,
      subCategories: category.subCategories || [""],
    });
    setShowModal(true);
  };

  const handleSubCategoryChange = (index, value) => {
    const updatedSubCategories = [...categoryForm.subCategories];
    updatedSubCategories[index] = value;
    setCategoryForm({ ...categoryForm, subCategories: updatedSubCategories });
  };

  const addSubCategoryField = () => {
    setCategoryForm({ ...categoryForm, subCategories: [...categoryForm.subCategories, ""] });
  };

  const removeSubCategoryField = (index) => {
    const updatedSubCategories = categoryForm.subCategories.filter((_, i) => i !== index);
    setCategoryForm({ ...categoryForm, subCategories: updatedSubCategories });


  };
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-r from-blue-500 to-purple-500 text-white p-8">
        <h1 className="text-4xl font-extrabold text-center mb-8">
          Finance Management
        </h1>
        {error && <p className="text-red-500">{error}</p>}

        {/* Tabs */}
        <div className="flex justify-center space-x-6 mb-6">
          <button
            className={`px-6 py-2 rounded ${
              activeTab === "categories" ? "bg-blue-600 text-white" : "bg-white text-blue-600"
            }`}
            onClick={() => setActiveTab("categories")}
          >
            Categories
          </button>
          <button
            className={`px-6 py-2 rounded ${
              activeTab === "records" ? "bg-blue-600 text-white" : "bg-white text-blue-600"
            }`}
            onClick={() => setActiveTab("records")}
          >
            Records
          </button>
          <button
            className={`px-6 py-2 rounded ${
              activeTab === "fields" ? "bg-blue-600 text-white" : "bg-white text-blue-600"
            }`}
            onClick={() => setActiveTab("fields")}
          >
            Fields
          </button>
        </div>

{/* Categories Table */}
<table className="table-auto w-full bg-white text-black rounded-lg shadow-lg">
  <thead>
    <tr className="bg-gray-200 text-left">
      <th className="px-4 py-2 border">Category</th>
      <th className="px-4 py-2 border">Sub-Categories</th>
      <th className="px-4 py-2 border">Actions</th>
    </tr>
  </thead>
  <tbody>
    {categories.map((category) => (
      <tr key={category._id} className="border-t">
        <td className="px-4 py-2 border align-top">{category.name}</td>
        <td className="px-4 py-2 border">
          <ul className="list-disc pl-5">
            {(category.subCategories || []).map((sub, index) => (
              <li key={index}>{sub}</li>
            ))}
          </ul>
        </td>
        <td className="px-4 py-2 border align-top">
          <div className="flex space-x-4">
            <button
              className="text-blue-500 hover:text-blue-700"
              onClick={() => handleEditCategory(category)}
            >
              ✏️ Edit
            </button>
            <button
              className="text-red-500 hover:text-red-700"
              onClick={() => handleDeleteCategory(category._id)}
            >
              🗑️ Delete
            </button>
          </div>
        </td>
      </tr>
    ))}
  </tbody>
</table>


       {/* Modal */}
       {showModal && (
          <Modal onClose={handleModalClose}>
            <h2 className="text-xl font-bold mb-4">
              {editCategory ? "Edit Category" : "Add Category"}
            </h2>
            <div>
              <label className="block text-sm font-medium mb-2">Category Name</label>
              <input
                type="text"
                className="w-full p-2 border rounded mb-4"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              />

              <label className="block text-sm font-medium mb-2">Sub-Categories</label>
              {categoryForm.subCategories.map((sub, index) => (
                <div key={index} className="flex items-center mb-2">
                  <input
                    type="text"
                    className="flex-grow p-2 border rounded"
                    value={sub}
                    onChange={(e) => handleSubCategoryChange(index, e.target.value)}
                  />
                  {categoryForm.subCategories.length > 1 && (
                    <button
                      className="ml-2 bg-red-500 text-white px-2 py-1 rounded"
                      onClick={() => removeSubCategoryField(index)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
                onClick={addSubCategoryField}
              >
                Add Sub-Category
              </button>
            </div>

            <div className="flex justify-end mt-4">
              <button
                className="mr-2 bg-gray-300 px-4 py-2 rounded"
                onClick={handleModalClose}
              >
                Cancel
              </button>
              <button
                className="bg-green-500 text-white px-4 py-2 rounded"
                onClick={handleAddOrUpdateCategory}
              >
                Save
              </button>
            </div>
          </Modal>
        )}
      </div>
    </Layout>
  );
};

export default FinanceManagement;
