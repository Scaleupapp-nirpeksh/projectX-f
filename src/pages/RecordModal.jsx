// src/pages/RecordModal.jsx
import React, { useState, useEffect } from "react";
import Modal from "../components/Modal";

const RecordModal = ({ onClose, onSave, categories = [], fields = [], existingRecord = null }) => {
  // Existing state variables
  const [error, setError] = useState("");
  const [type, setType] = useState("revenue");
  const [categoryId, setCategoryId] = useState("");
  const [fieldValues, setFieldValues] = useState({});
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState("monthly");
  const [isPartialPayment, setIsPartialPayment] = useState(false);
  const [totalAmount, setTotalAmount] = useState("");
  const [amountPaidOrReceived, setAmountPaidOrReceived] = useState("");

  // Determine if the modal is in Edit mode
  const isEditMode = existingRecord !== null;

  // Filter fields based on selected record type
  const applicableFields = fields.filter(field => {
    return field.applicableTo.includes(type) || field.applicableTo.includes('both');
  });

  // Initialize field values when fields or type changes
  useEffect(() => {
    const initialValues = {};
    applicableFields.forEach(field => {
      if (field.type === "dropdown" && field.options.length > 0) {
        initialValues[field.name] = field.options[0];
      } else if (field.type === "boolean") {
        initialValues[field.name] = false;
      } else {
        initialValues[field.name] = "";
      }
    });

    if (isEditMode) {
      // Pre-fill with existing record data
      for (let key in existingRecord.fields) {
        initialValues[key] = existingRecord.fields[key];
      }
      // Handle partial payment fields if they exist
      if (existingRecord.fields.total_amount) {
        setTotalAmount(existingRecord.fields.total_amount);
      }
      if (existingRecord.fields.amount_paid) {
        setAmountPaidOrReceived(existingRecord.fields.amount_paid);
      }
      // Handle recurrence
      if (existingRecord.recurrence && existingRecord.recurrence.frequency !== "none") {
        setIsRecurring(true);
        setRecurrenceFrequency(existingRecord.recurrence.frequency);
      }
      // Handle partial payment
      if (existingRecord.fields.amount_paid || existingRecord.fields.amount_received) {
        setIsPartialPayment(true);
      }
    }

    setFieldValues(initialValues);
  }, [fields, type, existingRecord, isEditMode]);

  // Recalculate formula fields whenever fieldValues change
  useEffect(() => {
    let updatedValues = { ...fieldValues };
    let hasChanges = false;

    for (let field of applicableFields) {
      if (field.type === "formula" && field.expression) {
        const expr = field.expression;
        
        // Replace field names with their numeric values
        const referencedNames = expr.match(/\b[a-zA-Z0-9_]+\b/g) || [];
        let safeExpr = expr;
        
        for (let ref of referencedNames) {
          if (ref in updatedValues) {
            let val = updatedValues[ref];
            let numVal = Number(val);
            if (isNaN(numVal)) {
              numVal = 0;
            }
            // Replace all occurrences of ref with numVal
            safeExpr = safeExpr.replace(new RegExp(`\\b${ref}\\b`, 'g'), numVal);
          } else {
            // If ref doesn't exist or is undefined, treat as 0
            safeExpr = safeExpr.replace(new RegExp(`\\b${ref}\\b`, 'g'), 0);
          }
        }

        let result;
        try {
          result = Function('"use strict";return (' + safeExpr + ')')();
          if (String(result) !== updatedValues[field.name]) {
            updatedValues[field.name] = String(result);
            hasChanges = true;
          }
        } catch (e) {
          console.warn(`Error evaluating formula for field ${field.name}: ${e.message}`);
        }
      }
    }

    if (hasChanges) {
      setFieldValues(updatedValues);
    }

  }, [fieldValues, applicableFields]);

  const handleSave = () => {
    setError("");

    if (!type) {
      setError("Please select a record type.");
      return;
    }
    if (!categoryId) {
      setError("Please select a category.");
      return;
    }

    // Check if a final amount field is defined for the chosen type
    const finalAmountField = applicableFields.find(f => f.config && f.config.isFinalAmount);

    if (!finalAmountField) {
      // If no final amount field for this type, show an error
      setError(`A final amount field is required but not defined for ${type}.`);
      return;
    }

    // Validate final amount field numeric
    const finalAmountValueStr = fieldValues[finalAmountField.name];
    const finalAmountValue = Number(finalAmountValueStr);
    if (isNaN(finalAmountValue)) {
      setError(`The final amount field "${finalAmountField.label || finalAmountField.name}" must be numeric.`);
      return;
    }

    if (isPartialPayment) {
      const t = Number(totalAmount);
      const p = Number(amountPaidOrReceived);
      if (isNaN(t) || t <= 0) {
        setError("Please enter a valid total amount for partial payment.");
        return;
      }
      if (isNaN(p) || p < 0) {
        setError("Please enter a valid amount paid/received so far.");
        return;
      }
      if (p > t) {
        setError("Amount paid/received cannot exceed total amount.");
        return;
      }
    }

    const finalFields = { ...fieldValues };
    for (let field of applicableFields) {
      if (field.type === 'number' || field.type === 'formula') {
        const valStr = finalFields[field.name];
        const valNum = Number(valStr);
        if (isNaN(valNum)) {
          setError(`"${field.label || field.name}" must be numeric.`);
          return;
        }
        finalFields[field.name] = valNum;
      }
    }

    const recordData = {
      type,
      categoryId,
      fields: finalFields,
      recurrence: isRecurring ? { frequency: recurrenceFrequency } : { frequency: "none" },
      status: "draft",
    };

    if (isPartialPayment) {
      recordData.fields["total_amount"] = Number(totalAmount);
      recordData.fields["amount_paid"] = Number(amountPaidOrReceived);
    }

    // Include recordId if editing
    if (isEditMode) {
      recordData.recordId = existingRecord._id;
    }

    onSave(recordData);
  };

  const handleFieldChange = (field, value) => {
    setFieldValues(prev => ({ ...prev, [field.name]: value }));
  };

  const renderFieldInput = (field) => {
    let value = fieldValues[field.name] || "";
    switch (field.type) {
      case "string":
        return (
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400"
            value={value}
            onChange={(e) => handleFieldChange(field, e.target.value)}
          />
        );
      case "number":
        return (
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400"
            value={value}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            placeholder="Enter a number"
          />
        );
      case "date":
        return (
          <input
            type="date"
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400"
            value={value}
            onChange={(e) => handleFieldChange(field, e.target.value)}
          />
        );
      case "dropdown":
        return (
          <select
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400"
            value={value}
            onChange={(e) => handleFieldChange(field, e.target.value)}
          >
            {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        );
      case "formula":
        return (
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded bg-gray-100 text-gray-700"
            value={value}
            readOnly
          />
        );
      case "boolean":
        return (
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => handleFieldChange(field, e.target.checked)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="p-6 bg-white rounded-lg shadow-lg max-w-lg mx-auto text-black z-50 relative max-h-[80vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">{isEditMode ? "Edit Record" : "Add New Record"}</h2>
        {error && <p className="text-red-600 mb-4 text-sm">{error}</p>}

        <div className="space-y-4">
          {/* Record Type */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Record Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400"
              disabled={isEditMode} // Prevent changing type during edit
            >
              <option value="revenue">Revenue</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400"
            >
              <option value="">-- Select a Category --</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Applicable Fields */}
          {applicableFields.length > 0 && (
            <div className="bg-gray-50 p-4 rounded border border-gray-200 space-y-4">
              <h3 className="text-sm font-semibold mb-2">Additional Fields</h3>
              {applicableFields.map(field => (
                <div key={field._id}>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    {field.label || field.name} 
                    {field.type === "formula" && " (Auto-calculated)"}
                    {field.config && field.config.isFinalAmount && " (Final Amount)"}
                  </label>
                  {renderFieldInput(field)}
                </div>
              ))}
            </div>
          )}

          {/* Recurrence Options */}
          <div className="bg-blue-50 p-4 rounded border border-blue-200 space-y-2">
            <label className="block text-sm font-medium text-gray-900">
              <input
                type="checkbox"
                className="mr-2"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
              />
              Is Recurring?
            </label>
            {isRecurring && (
              <div>
                <label className="block text-sm text-gray-900 mb-1">Frequency</label>
                <select
                  value={recurrenceFrequency}
                  onChange={(e) => setRecurrenceFrequency(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            )}
          </div>

          {/* Partial Payment */}
          <div className="bg-yellow-50 p-4 rounded border border-yellow-200 space-y-2">
            <label className="block text-sm font-medium text-gray-900">
              <input
                type="checkbox"
                className="mr-2"
                checked={isPartialPayment}
                onChange={(e) => setIsPartialPayment(e.target.checked)}
              />
              Partial Payment/Receivable?
            </label>
            {isPartialPayment && (
              <div className="space-y-2">
                <div>
                  <label className="block text-sm text-gray-900 mb-1">Total Amount</label>
                  <input
                    type="number"
                    className="w-full p-2 border border-gray-300 rounded"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-900 mb-1">Amount Paid/Received So Far</label>
                  <input
                    type="number"
                    className="w-full p-2 border border-gray-300 rounded"
                    value={amountPaidOrReceived}
                    onChange={(e) => setAmountPaidOrReceived(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

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
            {isEditMode ? "Update Record" : "Save Record"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default RecordModal;
