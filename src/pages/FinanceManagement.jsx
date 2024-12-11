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

  // State for Categories
  const [showModal, setShowModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: "", subCategories: [""] });
  const [editCategory, setEditCategory] = useState(null);

  // State for Fields
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [editField, setEditField] = useState(null);
  const [fieldForm, setFieldForm] = useState({
    name: "",
    label: "",
    type: "string",
    options: [],
    expression: ""
  });

  const token = localStorage.getItem("token");
  const orgId = localStorage.getItem("currentOrgId");
  const navigate = useNavigate();

  useEffect(() => {
    if (!orgId) {
      setError("Organization ID is missing. Redirecting to organization selection...");
      setTimeout(() => navigate("/dashboard"), 3000);
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

  // Category Modal Handlers
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
          headers: { Authorization: `Bearer ${token}` },
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

  // Fields Modal Handlers
  const handleFieldModalClose = () => {
    setShowFieldModal(false);
    setEditField(null);
    setFieldForm({
      name: "",
      label: "",
      type: "string",
      options: [],
      expression: ""
    });
  };

  const handleSaveField = async () => {
    if (!fieldForm.name.trim()) {
      alert("Field name is required.");
      return;
    }

    if (fieldForm.type === "dropdown" && fieldForm.options.length === 0) {
      alert("Options are required for dropdown fields.");
      return;
    }
    if (fieldForm.type === "formula" && !fieldForm.expression.trim()) {
      alert("Expression is required for formula fields.");
      return;
    }

    const method = editField ? "PUT" : "POST";
    const url = editField
      ? `http://localhost:4000/api/finance/${orgId}/components/finance/fields/${editField._id}`
      : `http://localhost:4000/api/finance/${orgId}/components/finance/fields`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(fieldForm)
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Failed to save field definition.");
        return;
      }

      if (editField) {
        setFieldDefinitions(
          fieldDefinitions.map(f => f._id === editField._id ? data.field : f)
        );
      } else {
        setFieldDefinitions([...fieldDefinitions, data.field]);
      }

      handleFieldModalClose();
    } catch (err) {
      setError("Error saving field definition.");
    }
  };

  const handleDeleteField = async (fieldId) => {
    if (!window.confirm("Are you sure you want to delete this field definition?")) return;
    try {
      const response = await fetch(
        `http://localhost:4000/api/finance/${orgId}/components/finance/fields/${fieldId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Failed to delete field definition.");
        return;
      }
      setFieldDefinitions(fieldDefinitions.filter(f => f._id !== fieldId));
    } catch (err) {
      setError("Error deleting field definition.");
    }
  };

  const handleEditField = (field) => {
    setEditField(field);
    setFieldForm({
      name: field.name,
      label: field.label || "",
      type: field.type,
      options: field.options || [],
      expression: field.expression || ""
    });
    setShowFieldModal(true);
  };

  const handleAddOption = () => {
    const option = prompt("Enter a new option:");
    if (option && option.trim()) {
      setFieldForm({ ...fieldForm, options: [...fieldForm.options, option.trim()] });
    }
  };

  const handleRemoveOption = (index) => {
    const updated = [...fieldForm.options];
    updated.splice(index, 1);
    setFieldForm({ ...fieldForm, options: updated });
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-r from-blue-500 to-purple-500 text-white p-8">
        <h1 className="text-4xl font-extrabold text-center mb-2">Finance Management</h1>
        <p className="text-center mb-8 text-lg">
          Manage your finance categories, records, and fields efficiently.
        </p>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {loading && <p className="text-white text-center mb-4">Loading...</p>}

        {/* Tabs */}
        <div className="flex justify-center space-x-6 mb-8">
          <button
            className={`px-6 py-2 rounded font-semibold transition ${
              activeTab === "categories"
                ? "bg-blue-700 text-white"
                : "bg-white text-blue-700 hover:bg-gray-100"
            }`}
            onClick={() => setActiveTab("categories")}
          >
            Categories
          </button>
          <button
            className={`px-6 py-2 rounded font-semibold transition ${
              activeTab === "records"
                ? "bg-blue-700 text-white"
                : "bg-white text-blue-700 hover:bg-gray-100"
            }`}
            onClick={() => setActiveTab("records")}
          >
            Records
          </button>
          <button
            className={`px-6 py-2 rounded font-semibold transition ${
              activeTab === "fields"
                ? "bg-blue-700 text-white"
                : "bg-white text-blue-700 hover:bg-gray-100"
            }`}
            onClick={() => setActiveTab("fields")}
          >
            Fields
          </button>
        </div>

        {activeTab === "categories" && (
          <div className="bg-white text-black p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Categories</h2>
              <button
                className="bg-green-600 px-4 py-2 rounded text-white font-semibold hover:bg-green-700 transition"
                onClick={() => {
                  setShowModal(true);
                  setEditCategory(null);
                  setCategoryForm({ name: "", subCategories: [""] });
                }}
              >
                Add Category
              </button>
            </div>

            {categories.length === 0 ? (
              <p className="text-gray-700">No categories found. Add a new category to get started.</p>
            ) : (
              <table className="table-auto w-full bg-white text-black rounded-lg">
                <thead>
                  <tr className="bg-gray-200 text-left">
                    <th className="px-4 py-2 border font-semibold">Category</th>
                    <th className="px-4 py-2 border font-semibold">Sub-Categories</th>
                    <th className="px-4 py-2 border font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr
                      key={category._id}
                      className="border-t hover:bg-gray-100 transition"
                    >
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
                            className="text-blue-600 hover:text-blue-800 font-semibold"
                            onClick={() => handleEditCategory(category)}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="text-red-600 hover:text-red-800 font-semibold"
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
            )}
          </div>
        )}

        {activeTab === "fields" && (
          <div className="bg-white text-black p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Field Definitions</h2>
              <button
                className="bg-green-600 px-4 py-2 rounded text-white font-semibold hover:bg-green-700 transition"
                onClick={() => {
                  setShowFieldModal(true);
                  setEditField(null);
                  setFieldForm({ name: "", label: "", type: "string", options: [], expression: "" });
                }}
              >
                Add Field Definition
              </button>
            </div>

            {fieldDefinitions.length === 0 ? (
              <p className="text-gray-700">No field definitions found. Add one to get started.</p>
            ) : (
              <table className="table-auto w-full bg-white text-black rounded-lg">
                <thead>
                  <tr className="bg-gray-200 text-left">
                    <th className="px-4 py-2 border font-semibold">Name</th>
                    <th className="px-4 py-2 border font-semibold">Label</th>
                    <th className="px-4 py-2 border font-semibold">Type</th>
                    <th className="px-4 py-2 border font-semibold">Details</th>
                    <th className="px-4 py-2 border font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fieldDefinitions.map((field) => (
                    <tr key={field._id} className="border-t hover:bg-gray-100 transition">
                      <td className="px-4 py-2 border align-top">{field.name}</td>
                      <td className="px-4 py-2 border align-top">{field.label || "-"}</td>
                      <td className="px-4 py-2 border align-top">{field.type}</td>
                      <td className="px-4 py-2 border align-top">
                        {field.type === "dropdown" && field.options.length > 0 && (
                          <ul className="list-disc pl-5">
                            {field.options.map((opt, i) => (
                              <li key={i}>{opt}</li>
                            ))}
                          </ul>
                        )}
                        {field.type === "formula" && field.expression && (
                          <p className="text-sm italic">Expr: {field.expression}</p>
                        )}
                        {["string", "number", "date", "boolean"].includes(field.type) && (
                          <span className="text-sm text-gray-700">No extra details</span>
                        )}
                      </td>
                      <td className="px-4 py-2 border align-top">
                        <div className="flex space-x-4">
                          <button
                            className="text-blue-600 hover:text-blue-800 font-semibold"
                            onClick={() => handleEditField(field)}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="text-red-600 hover:text-red-800 font-semibold"
                            onClick={() => handleDeleteField(field._id)}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Modal for Categories */}
        {showModal && (
          <Modal onClose={handleModalClose}>
            <h2 className="text-xl font-bold mb-4 text-black">
              {editCategory ? "Edit Category" : "Add Category"}
            </h2>
            <div className="text-black">
              <label className="block text-sm font-medium mb-2">Category Name</label>
              <input
                type="text"
                className="w-full p-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              />

              <label className="block text-sm font-medium mb-2">Sub-Categories</label>
              {categoryForm.subCategories.map((sub, index) => (
                <div key={index} className="flex items-center mb-2 space-x-2">
                  <input
                    type="text"
                    className="flex-grow p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={sub}
                    onChange={(e) => handleSubCategoryChange(index, e.target.value)}
                  />
                  {categoryForm.subCategories.length > 1 && (
                    <button
                      className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition"
                      onClick={() => removeSubCategoryField(index)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition font-semibold"
                onClick={addSubCategoryField}
              >
                Add Sub-Category
              </button>
            </div>

            <div className="flex justify-end mt-4 space-x-3 border-t border-gray-200 pt-4">
              <button
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition"
                onClick={handleModalClose}
              >
                Cancel
              </button>
              <button
                className="bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700 transition"
                onClick={handleAddOrUpdateCategory}
              >
                Save
              </button>
            </div>
          </Modal>
        )}

        {/* Modal for Fields */}
        {showFieldModal && (
          <Modal onClose={handleFieldModalClose}>
            <h2 className="text-xl font-bold mb-4 text-black">{editField ? "Edit Field Definition" : "Add Field Definition"}</h2>
            <div className="text-black space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name (unique)</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={fieldForm.name}
                  onChange={(e) => setFieldForm({ ...fieldForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Label</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={fieldForm.label}
                  onChange={(e) => setFieldForm({ ...fieldForm, label: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={fieldForm.type}
                  onChange={(e) => setFieldForm({ ...fieldForm, type: e.target.value, options: [], expression: "" })}
                >
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="dropdown">Dropdown</option>
                  <option value="formula">Formula</option>
                  <option value="boolean">Boolean</option>
                </select>
              </div>

              {fieldForm.type === "dropdown" && (
                <div>
                  <label className="block text-sm font-medium mb-1">Options</label>
                  {fieldForm.options.length === 0 && <p className="text-sm text-gray-700 mb-2">No options added yet.</p>}
                  <ul className="mb-2">
                    {fieldForm.options.map((opt, i) => (
                      <li key={i} className="flex items-center justify-between mb-1">
                        <span className="text-gray-800">{opt}</span>
                        <button
                          className="text-red-500 hover:text-red-700 text-sm"
                          onClick={() => handleRemoveOption(i)}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition text-sm"
                    onClick={handleAddOption}
                  >
                    Add Option
                  </button>
                </div>
              )}

              {fieldForm.type === "formula" && (
                <div>
                  <label className="block text-sm font-medium mb-1">Expression</label>
                  <textarea
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={fieldForm.expression}
                    onChange={(e) => setFieldForm({ ...fieldForm, expression: e.target.value })}
                    placeholder="e.g. amount * tax_rate"
                  ></textarea>
                  <p className="text-sm text-gray-600 mt-1">Use field names or IDs in the expression as needed.</p>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-4 space-x-3 border-t border-gray-200 pt-4">
              <button
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition"
                onClick={handleFieldModalClose}
              >
                Cancel
              </button>
              <button
                className="bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700 transition"
                onClick={handleSaveField}
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
