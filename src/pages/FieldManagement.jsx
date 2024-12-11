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
    expression: "",
    newOption: "" // For easier adding dropdown options inline
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
        setError(data.message || "We couldn't load the fields. Please try again.");
      }
    } catch (err) {
      setError("Error loading fields. Check your connection or contact support.");
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
      expression: "",
      newOption: ""
    });
  };

  const validateFormulaFields = () => {
    if (fieldForm.type !== "formula" || !fieldForm.expression.trim()) return true;
    
    const referencedWords = fieldForm.expression.match(/\b[a-zA-Z0-9_]+\b/g) || [];
    const fieldNames = fields.map(f => f.name);
    for (let ref of referencedWords) {
      // Ignore numbers and basic operators
      if (!isNaN(ref) || ["+", "-", "*", "/", "(", ")", "and", "or"].includes(ref.toLowerCase())) continue;

      // Check if field exists
      if (!fieldNames.includes(ref) && ref !== fieldForm.name) {
        alert(`Your formula mentions "${ref}", but no field by that name exists. Please ensure all fields you reference are created first, or correct the name.`);
        return false;
      }
    }
    return true;
  };

  const handleSaveField = async () => {
    if (!fieldForm.name.trim() || !fieldForm.type) {
      alert("Please provide a Name (ID) and choose a Type for this field.");
      return;
    }

    if (fieldForm.type === "dropdown" && fieldForm.options.length === 0) {
      alert("For a dropdown field, please add at least one choice.");
      return;
    }

    if (fieldForm.type === "formula" && !fieldForm.expression.trim()) {
      alert("For a formula field, please provide a formula expression.");
      return;
    }

    if (!validateFormulaFields()) {
      return; // Formula validation failed
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
        body: JSON.stringify({
          name: fieldForm.name.trim(),
          label: fieldForm.label.trim(),
          type: fieldForm.type,
          options: fieldForm.options,
          expression: fieldForm.expression.trim()
        })
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Failed to save your field. Please try again.");
        return;
      }

      if (editField) {
        setFields(fields.map(f => f._id === editField._id ? data.field : f));
      } else {
        setFields([...fields, data.field]);
      }

      handleModalClose();
    } catch (err) {
      setError("Error saving field. Check your connection or contact support.");
    }
  };

  const handleDeleteField = async (fieldId) => {
    if (!window.confirm("Are you sure you want to delete this field? It will no longer be available for templates or records.")) return;

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
        setError(data.message || "Failed to delete the field. Please try again.");
        return;
      }
      setFields(fields.filter(f => f._id !== fieldId));
    } catch (err) {
      setError("Error deleting the field. Contact support if the issue persists.");
    }
  };

  const handleEditField = (field) => {
    setEditField(field);
    setFieldForm({
      name: field.name,
      label: field.label || "",
      type: field.type,
      options: field.options || [],
      expression: field.expression || "",
      newOption: ""
    });
    setShowModal(true);
  };

  const handleAddOption = (e) => {
    e.preventDefault();
    const opt = fieldForm.newOption.trim();
    if (!opt) return;
    setFieldForm({ ...fieldForm, options: [...fieldForm.options, opt], newOption: "" });
  };

  const handleRemoveOption = (index) => {
    const updated = [...fieldForm.options];
    updated.splice(index, 1);
    setFieldForm({ ...fieldForm, options: updated });
  };

  const renderTypeHelp = () => {
    switch (fieldForm.type) {
      case "string":
        return "Use 'Text' for names, notes, or any simple text input.";
      case "number":
        return "Use 'Number' for amounts, prices, quantities, or any numeric data.";
      case "date":
        return "Use 'Date' to track deadlines, due dates, payment dates, etc.";
      case "dropdown":
        return "Use 'Dropdown' to let users pick from a list of choices (e.g., 'Paid', 'Pending', 'Cancelled'). Add choices below.";
      case "formula":
        return "Use 'Formula' to automatically calculate values. Reference other fields by their 'Name'. For example: amount * tax_rate.";
      case "boolean":
        return "Use 'Yes/No' for true/false questions (e.g., 'Is Paid?').";
      default:
        return "";
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-r from-blue-500 to-purple-500 text-white p-8">
        <h1 className="text-4xl font-extrabold text-center mb-4">Field Definitions</h1>
        <p className="text-center mb-8 text-lg max-w-2xl mx-auto">
          Create the basic fields you'll use for revenue and expense records later.  
          You don't have to assign them now—just think about what kind of data you need:  
          dates for deadlines, text for notes, numbers for amounts, dropdowns for statuses,  
          formulas for automatic calculations, or yes/no fields for simple decisions.
        </p>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {loading && <p className="text-white text-center mb-4">Loading fields... Please wait.</p>}

        <div className="bg-white text-black p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Your Fields</h2>
            <button
              className="bg-green-600 px-4 py-2 rounded text-white font-semibold hover:bg-green-700 transition"
              onClick={() => {
                setShowModal(true);
                setEditField(null);
                setFieldForm({ name: "", label: "", type: "string", options: [], expression: "", newOption: "" });
              }}
            >
              Add Field
            </button>
          </div>

          {fields.length === 0 ? (
            <p className="text-gray-700">
              No fields yet. Try adding "Invoice Number" (Text) or "Payment Status" (Dropdown) to get started.
            </p>
          ) : (
            <table className="table-auto w-full bg-white text-black rounded-lg">
              <thead>
                <tr className="bg-gray-200 text-left">
                  <th className="px-4 py-2 border font-semibold">Name (ID)</th>
                  <th className="px-4 py-2 border font-semibold">Label</th>
                  <th className="px-4 py-2 border font-semibold">Type</th>
                  <th className="px-4 py-2 border font-semibold">Info</th>
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
                        <div>
                          <strong>Choices:</strong>
                          <ul className="list-disc pl-5 mt-1">
                            {field.options.map((opt, i) => (
                              <li key={i}>{opt}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {field.type === "formula" && field.expression && (
                        <div className="text-sm italic">
                          <strong>Formula:</strong> {field.expression}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 border align-top">
                      <div className="flex space-x-4">
                        <button
                          className="text-blue-600 hover:text-blue-800 font-semibold"
                          onClick={() => handleEditField(field)}
                        >
                          Edit
                        </button>
                        <button
                          className="text-red-600 hover:text-red-800 font-semibold"
                          onClick={() => handleDeleteField(field._id)}
                        >
                          Delete
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
            <h2 className="text-xl font-bold mb-4 text-black">{editField ? "Edit Field" : "Add New Field"}</h2>
            <div className="text-black space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name (ID)</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={fieldForm.name}
                  onChange={(e) => setFieldForm({ ...fieldForm, name: e.target.value })}
                  placeholder="Unique ID, e.g. invoiceNumber"
                />
                <p className="text-gray-600 text-sm mt-1">
                  A unique identifier. Users won't see this. It's for the system and referencing in formulas.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Label</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={fieldForm.label}
                  onChange={(e) => setFieldForm({ ...fieldForm, label: e.target.value })}
                  placeholder="Friendly name, e.g. Invoice Number"
                />
                <p className="text-gray-600 text-sm mt-1">
                  A user-friendly name that appears on forms. Example: "Invoice Number" or "Payment Status".
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={fieldForm.type}
                  onChange={(e) => setFieldForm({ ...fieldForm, type: e.target.value, options: [], expression: "", newOption: "" })}
                >
                  <option value="string">Text</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="dropdown">Dropdown (list of choices)</option>
                  <option value="formula">Formula (calculate automatically)</option>
                  <option value="boolean">Yes/No</option>
                </select>
                <p className="text-gray-600 text-sm mt-1">{renderTypeHelp()}</p>
              </div>

              {fieldForm.type === "dropdown" && (
                <div>
                  <label className="block text-sm font-medium mb-1">Dropdown Choices</label>
                  {fieldForm.options.length === 0 && (
                    <p className="text-sm text-gray-700 mb-2">
                      Add a few choices users can pick from. For example: "Paid", "Pending", "Cancelled".
                    </p>
                  )}
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
                  <form className="flex space-x-2" onSubmit={handleAddOption}>
                    <input
                      type="text"
                      className="flex-grow p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                      value={fieldForm.newOption}
                      onChange={(e) => setFieldForm({ ...fieldForm, newOption: e.target.value })}
                      placeholder="Add a new choice"
                    />
                    <button
                      type="submit"
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                    >
                      Add
                    </button>
                  </form>
                </div>
              )}

              {fieldForm.type === "formula" && (
                <div>
                  <label className="block text-sm font-medium mb-1">Formula Expression</label>
                  <textarea
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={fieldForm.expression}
                    onChange={(e) => setFieldForm({ ...fieldForm, expression: e.target.value })}
                    placeholder="e.g. amount * tax_rate"
                  ></textarea>
                  <p className="text-sm text-gray-600 mt-1">
                    Reference other fields by Name. Example: If you have a field named "amount" and another named "tax_rate", you could write "amount * tax_rate".
                    Make sure those fields exist before saving.
                  </p>
                  {fields.length > 0 && (
                    <div className="mt-2">
                      <strong>Available Fields:</strong>
                      <ul className="list-disc pl-5 max-h-20 overflow-auto text-sm mt-1 text-gray-800">
                        {fields.map(f => <li key={f._id}>{f.name}</li>)}
                      </ul>
                    </div>
                  )}
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
