import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import Layout from '../components/Layout';

const FieldManagement = () => {
  const [fields, setFields] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
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

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:4000/api/finance/${orgId}/components/finance/fields`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setFields(data.fields || []);
      } else {
        setError(data.message || "Failed to fetch fields.");
      }
    } catch (err) {
      setError("Error fetching fields.");
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
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
    // Basic validation
    if (!fieldForm.name.trim() || !fieldForm.type) {
      alert("Name and Type are required.");
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
        setFields(fields.map(f => f._id === editField._id ? data.field : f));
      } else {
        setFields([...fields, data.field]);
      }

      handleModalClose();
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
      setFields(fields.filter(f => f._id !== fieldId));
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
    setShowModal(true);
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
        <h1 className="text-4xl font-extrabold text-center mb-2">Field Definitions</h1>
        <p className="text-center mb-8 text-lg">
          Create and manage custom fields for your finance records.
        </p>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {loading && <p className="text-white text-center mb-4">Loading...</p>}

        <div className="bg-white text-black p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Field Definitions</h2>
            <button
              className="bg-green-600 px-4 py-2 rounded text-white font-semibold hover:bg-green-700 transition"
              onClick={() => {
                setShowModal(true);
                setEditField(null);
                setFieldForm({ name: "", label: "", type: "string", options: [], expression: "" });
              }}
            >
              Add Field Definition
            </button>
          </div>

          {fields.length === 0 ? (
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
                {fields.map((field) => (
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

        {showModal && (
          <Modal onClose={handleModalClose}>
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
                onClick={handleModalClose}
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

export default FieldManagement;
