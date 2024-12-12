import React, { useState, useEffect, useRef } from "react";
import Modal from "../components/Modal";

const FieldModal = ({ onClose, onSave, editField, fields }) => {
  const [error, setError] = useState("");
  const formulaTextareaRef = useRef(null);
  const [fieldForm, setFieldForm] = useState({
    name: "",
    label: "",
    type: "string",
    options: [],
    expression: "",
    newOption: "",
    // New properties for applicability and config
    applicableTo: ["both"], // could be ["revenue", "expense", "both"]
    config: {
      isFinalAmount: false,
      isTotalPaymentField: false,
      isAmountPaidField: false,
    }
  });
  const [selectedFieldForFormula, setSelectedFieldForFormula] = useState("");

  useEffect(() => {
    if (editField) {
      // Populate form with existing field data if editing
      setFieldForm({
        name: editField.name,
        label: editField.label || "",
        type: editField.type,
        options: editField.options || [],
        expression: editField.expression || "",
        newOption: "",
        applicableTo: editField.applicableTo || ["both"],
        config: {
          isFinalAmount: editField.config?.isFinalAmount || false,
          isTotalPaymentField: editField.config?.isTotalPaymentField || false,
          isAmountPaidField: editField.config?.isAmountPaidField || false,
        }
      });
    }
  }, [editField]);

  const validateFormulaFields = () => {
    if (fieldForm.type !== "formula" || !fieldForm.expression.trim()) return true;
    
    const referencedWords = fieldForm.expression.match(/\b[a-zA-Z0-9_]+\b/g) || [];
    const fieldNames = (fields || []).map(f => f.name);
    for (let ref of referencedWords) {
      // Ignore numbers/operators
      if (!isNaN(ref) || ["+", "-", "*", "/", "(", ")", "and", "or"].includes(ref.toLowerCase())) continue;
      if (!fieldNames.includes(ref) && ref !== fieldForm.name) {
        setError(`⚠️ The formula references "${ref}", which doesn't exist. Ensure all referenced fields are created first.`);
        return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!fieldForm.name.trim()) {
      setError("Field name (ID) is required.");
      return;
    }

    if (fieldForm.type === "dropdown" && fieldForm.options.length === 0) {
      setError("Please add at least one option for the dropdown field.");
      return;
    }

    if (fieldForm.type === "formula" && !fieldForm.expression.trim()) {
      setError("Please provide a formula expression for the formula field.");
      return;
    }

    if (!validateFormulaFields()) return;

    // Construct the data object for saving
    const data = {
      name: fieldForm.name.trim(),
      label: fieldForm.label.trim(),
      type: fieldForm.type,
      options: fieldForm.options,
      expression: fieldForm.expression.trim() || null,
      // Include applicableTo and config
      applicableTo: fieldForm.applicableTo,
      config: {
        isFinalAmount: fieldForm.config.isFinalAmount,
        isTotalPaymentField: fieldForm.config.isTotalPaymentField,
        isAmountPaidField: fieldForm.config.isAmountPaidField,
      }
    };

    onSave(data, editField);
  };

  const handleAddOption = (e) => {
    e.preventDefault();
    const opt = fieldForm.newOption.trim();
    if (!opt) {
      setError("Please enter a choice before adding.");
      return;
    }
    setFieldForm({ ...fieldForm, options: [...fieldForm.options, opt], newOption: "" });
    setError("");
  };

  const handleRemoveOption = (index) => {
    const updated = [...fieldForm.options];
    updated.splice(index, 1);
    setFieldForm({ ...fieldForm, options: updated });
  };

  const renderTypeHelp = () => {
    switch (fieldForm.type) {
      case "string":
        return "📄 Text: For simple text like names or descriptions.";
      case "number":
        return "🔢 Number: For amounts, prices, or counts.";
      case "date":
        return "📅 Date: For deadlines, due dates, or payment dates.";
      case "dropdown":
        return "⬇️ Dropdown: Users pick from a list of options. Add options below.";
      case "formula":
        return "🧮 Formula: Automatically calculate values. Use other fields' Names (e.g. amount * tax_rate).";
      case "boolean":
        return "✅ Yes/No: A simple true/false field.";
      default:
        return "";
    }
  };

  const insertFieldIntoFormula = () => {
    if (!selectedFieldForFormula) return;

    const textarea = formulaTextareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const before = fieldForm.expression.substring(0, start);
    const after = fieldForm.expression.substring(end);
    const newExpression = before + selectedFieldForFormula + after;

    setFieldForm({ ...fieldForm, expression: newExpression });
    validateFormulaFields();
    setSelectedFieldForFormula("");
  };

  // Handle changes to applicableTo and config flags
  const handleApplicableChange = (value) => {
    // value could be "expense", "revenue", "both"
    // If you want a multi-select, adapt this logic
    // Here we assume a radio button for simplicity
    setFieldForm({...fieldForm, applicableTo: [value] });
  };

  const handleConfigChange = (key, checked) => {
    setFieldForm(prev => ({
      ...prev,
      config: {
        ...prev.config,
        [key]: checked
      }
    }));
  };

  return (
    <Modal onClose={onClose}>
      <div className="p-6 bg-white rounded-lg shadow-lg max-w-lg mx-auto text-black z-50 relative max-h-[80vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">
          {editField ? "Edit Field" : "Create a New Field"}
        </h2>
        {error && <p className="text-red-600 mb-4 text-sm">{error}</p>}

        <form className="space-y-6">
          {/* Field Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Field Name (ID)
            </label>
            <input
              type="text"
              value={fieldForm.name}
              onChange={(e) => setFieldForm({ ...fieldForm, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="e.g. invoiceNumber"
            />
            <p className="text-gray-600 text-sm mt-1">
              A unique system ID (not seen by end-users).
            </p>
          </div>

          {/* Field Label */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Label
            </label>
            <input
              type="text"
              value={fieldForm.label}
              onChange={(e) => setFieldForm({ ...fieldForm, label: e.target.value })}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="e.g. Invoice Number"
            />
            <p className="text-gray-600 text-sm mt-1">
              A friendly name that users see on forms.
            </p>
          </div>

          {/* Field Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Type
            </label>
            <select
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={fieldForm.type}
              onChange={(e) => setFieldForm({
                ...fieldForm,
                type: e.target.value,
                options: [],
                expression: "",
                newOption: ""
              })}
            >
              <option value="string">Text</option>
              <option value="number">Number</option>
              <option value="date">Date</option>
              <option value="dropdown">Dropdown</option>
              <option value="formula">Formula</option>
              <option value="boolean">Yes/No</option>
            </select>
            <p className="text-gray-600 text-sm mt-1">{renderTypeHelp()}</p>
          </div>

          {/* Applicable To */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Applicable To
            </label>
            <div className="space-x-4 text-sm">
              <label>
                <input
                  type="radio"
                  className="mr-1"
                  checked={fieldForm.applicableTo.includes('both')}
                  onChange={() => handleApplicableChange('both')}
                />
                Both
              </label>
              <label>
                <input
                  type="radio"
                  className="mr-1"
                  checked={fieldForm.applicableTo.includes('revenue')}
                  onChange={() => handleApplicableChange('revenue')}
                />
                Revenue Only
              </label>
              <label>
                <input
                  type="radio"
                  className="mr-1"
                  checked={fieldForm.applicableTo.includes('expense')}
                  onChange={() => handleApplicableChange('expense')}
                />
                Expense Only
              </label>
            </div>
            <p className="text-gray-600 text-sm mt-1">
              Choose if this field applies to revenue, expense, or both record types.
            </p>
          </div>

          {/* Config Checkboxes */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Special Configurations
            </label>
            <div className="space-y-2 text-sm">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={fieldForm.config.isFinalAmount}
                  onChange={(e) => handleConfigChange('isFinalAmount', e.target.checked)}
                />
                Final Amount Field (Represents the final computed amount)
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={fieldForm.config.isTotalPaymentField}
                  onChange={(e) => handleConfigChange('isTotalPaymentField', e.target.checked)}
                />
                Total Payment Field (Represents total amount to be received/paid)
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={fieldForm.config.isAmountPaidField}
                  onChange={(e) => handleConfigChange('isAmountPaidField', e.target.checked)}
                />
                Amount Paid Field (Represents amount already paid/received)
              </label>
            </div>
          </div>

          {/* Dropdown Options */}
          {fieldForm.type === "dropdown" && (
            <div className="bg-blue-50 p-4 rounded border border-blue-200">
              <h3 className="text-sm font-semibold mb-2">Dropdown Choices</h3>
              {fieldForm.options.length === 0 && (
                <p className="text-sm text-gray-700 mb-2">
                  Add at least one choice.
                </p>
              )}
              <ul className="mb-2 text-sm">
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
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={fieldForm.newOption}
                  onChange={(e) => setFieldForm({ ...fieldForm, newOption: e.target.value })}
                  placeholder="Add a choice..."
                  className="flex-grow p-2 border rounded focus:ring-2 focus:ring-blue-400"
                />
                <button
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                  onClick={handleAddOption}
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Formula Expression */}
          {fieldForm.type === "formula" && (
            <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
              <h3 className="text-sm font-semibold mb-2">Formula Expression</h3>
              <textarea
                ref={formulaTextareaRef}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={fieldForm.expression}
                onChange={(e) => {
                  setFieldForm({ ...fieldForm, expression: e.target.value });
                  validateFormulaFields();
                }}
                placeholder="e.g. amount * tax_rate"
              ></textarea>
              <p className="text-sm text-gray-600 mt-1">
                Use other field Names. Example: "amount * tax_rate".
              </p>
              {fields && fields.length > 0 && (
                <div className="mt-2 text-sm">
                  <strong>Available Fields:</strong>
                  <div className="flex items-center space-x-2 mt-1">
                    <select
                      className="p-2 border rounded focus:ring-2 focus:ring-blue-400"
                      value={selectedFieldForFormula}
                      onChange={(e) => setSelectedFieldForFormula(e.target.value)}
                    >
                      <option value="">-- Choose a field to insert --</option>
                      {fields.map(f => <option key={f._id} value={f.name}>{f.name}</option>)}
                    </select>
                    <button
                      type="button"
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                      onClick={insertFieldIntoFormula}
                    >
                      Insert Field
                    </button>
                  </div>
                  <ul className="list-disc pl-5 max-h-20 overflow-auto text-gray-800 mt-1">
                    {fields.map(f => <li key={f._id}>{f.name}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </form>

        <div className="flex justify-end mt-6 space-x-3 border-t border-gray-200 pt-4">
          <button
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700 transition"
            onClick={handleSave}
          >
            Save Field
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default FieldModal;
