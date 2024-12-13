// src/pages/FinanceManagement.jsx

import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import FieldModal from "./FieldModal"; // Adjust path as needed
import RecordModal from "./RecordModal"; 
import PartnersModal from "./PartnersModal"; // Ensure the path is correct
import { useNavigate } from "react-router-dom";

const FinanceManagement = () => {
  // Set default active tab to "records"
  const [activeTab, setActiveTab] = useState("records");

  // General States
  const [categories, setCategories] = useState([]);
  const [records, setRecords] = useState([]);
  const [fieldDefinitions, setFieldDefinitions] = useState([]);
  const [partners, setPartners] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // State Variables for Totals
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);

  // State Variables for Date Filtering
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all"); // "all" or category ID

  // Category Modal States
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: "", subCategories: [""] });
  const [editCategory, setEditCategory] = useState(null);

  // Fields Modal States
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [editField, setEditField] = useState(null);
  const [fieldForm, setFieldForm] = useState({
    name: "",
    label: "",
    type: "string",
    options: [],
    expression: ""
  });

  // Partners Modal States
  const [showPartnersModal, setShowPartnersModal] = useState(false);
  const [editPartner, setEditPartner] = useState(null); // Partner being edited

  // Records Modal States
  const [recordTypeFilter, setRecordTypeFilter] = useState("all"); 
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [editRecord, setEditRecord] = useState(null); // Record being edited
  const [showEditRecordModal, setShowEditRecordModal] = useState(false);

  const token = localStorage.getItem("token");
  const orgId = localStorage.getItem("currentOrgId");
  const navigate = useNavigate();

  // Filtered records based on filters
  const filteredRecords = records.filter((record) => {
    // Filter by Record Type
    if (recordTypeFilter !== "all" && record.type !== recordTypeFilter) return false;

    // Filter by Category
    if (selectedCategory !== "all" && record.categoryId !== selectedCategory) return false;

    // Filter by Date Range
    if (fromDate) {
      const recordDate = new Date(record.fields.Date);
      const startDate = new Date(fromDate);
      if (recordDate < startDate) return false;
    }

    if (toDate) {
      const recordDate = new Date(record.fields.Date);
      const endDate = new Date(toDate);
      endDate.setHours(23, 59, 59, 999);
      if (recordDate > endDate) return false;
    }

    return true;
  });

  // Compute Profit/Loss
  const profitLoss = totalRevenue - totalExpense;

  // Fetch Data Based on Active Tab
  useEffect(() => {
    if (!orgId) {
      setError("Organization ID is missing. Redirecting to organization selection...");
      setTimeout(() => navigate("/dashboard"), 3000);
    } else {
      switch(activeTab) {
        case "categories":
          fetchCategories();
          break;
        case "records":
          // Fetch Field Definitions and Records Concurrently
          Promise.all([fetchFieldDefinitions(), fetchRecords()])
            .catch(err => setError("Error fetching data for records."));
          break;
        case "fields":
          fetchFieldDefinitions();
          break;
        case "partners":
          fetchPartners();
          break;
        default:
          break;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Fetch Categories
  const fetchCategories = async () => {
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

  // Fetch Records
  const fetchRecords = async () => {
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

  // Fetch Field Definitions
  const fetchFieldDefinitions = async () => {
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

  // Fetch Partners
  const fetchPartners = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:4000/api/finance/${orgId}/components/finance/partners`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (response.ok) setPartners(data.partners || []);
      else setError(data.message || "Failed to fetch partners.");
    } catch (err) {
      setError("Error fetching partners.");
    } finally {
      setLoading(false);
    }
  };

  // Compute Totals based on filtered records
  useEffect(() => {
    if (activeTab === "records") {
      computeTotals(filteredRecords);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredRecords, fieldDefinitions, activeTab]);

  const computeTotals = (recordsToCompute) => {
    if (fieldDefinitions.length === 0 || recordsToCompute.length === 0) {
      setTotalRevenue(0);
      setTotalExpense(0);
      return;
    }

    // Identify Final Amount Fields for Revenue and Expense
    const finalRevenueField = fieldDefinitions.find(
      f => f.config && f.config.isFinalAmount && (f.applicableTo.includes('revenue') || f.applicableTo.includes('both'))
    );

    const finalExpenseField = fieldDefinitions.find(
      f => f.config && f.config.isFinalAmount && (f.applicableTo.includes('expense') || f.applicableTo.includes('both'))
    );

    let totalRev = 0;
    let totalExp = 0;

    // Aggregate Total Revenue
    if (finalRevenueField) {
      recordsToCompute.filter(r => r.type === 'revenue').forEach(r => {
        const amount = r.fields[finalRevenueField.name];
        if (typeof amount === 'number') {
          totalRev += amount;
        }
      });
    }

    // Aggregate Total Expenses
    if (finalExpenseField) {
      recordsToCompute.filter(r => r.type === 'expense').forEach(r => {
        const amount = r.fields[finalExpenseField.name];
        if (typeof amount === 'number') {
          totalExp += amount;
        }
      });
    }

    setTotalRevenue(totalRev);
    setTotalExpense(totalExp);
  };

  // Handle Edit Record
  const handleEditRecord = (record) => {
    setEditRecord(record);
    setShowEditRecordModal(true);
  };

  // Handle Update Record
  const handleUpdateRecord = async (updatedData) => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:4000/api/finance/${orgId}/components/finance/records/${updatedData.recordId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatedData),
        }
      );

      const data = await response.json();
      if (response.ok) {
        // Update the record in the state
        setRecords(records.map(r => r._id === data.record._id ? data.record : r));
        // Recompute totals based on updated records
        computeTotals(filteredRecords);
        // Close the modal
        setShowEditRecordModal(false);
        // Optionally, display a success message
        alert("Record updated successfully.");
      } else {
        setError(data.message || "Failed to update the record.");
      }
    } catch (err) {
      setError("Error updating the record.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete Record
  const handleDeleteRecord = async (recordId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this record?");
    if (!confirmDelete) return;

    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:4000/api/finance/${orgId}/components/finance/records/${recordId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (response.ok) {
        // Remove the deleted record from the state
        setRecords(records.filter((record) => record._id !== recordId));
        // Recompute totals based on updated records
        computeTotals(filteredRecords);
        // Optionally, display a success message
        alert("Record deleted successfully.");
      } else {
        setError(data.message || "Failed to delete the record.");
      }
    } catch (err) {
      setError("Error deleting the record.");
    } finally {
      setLoading(false);
    }
  };

  // Category Modal Handlers
  const handleCategoryModalClose = () => {
    setShowCategoryModal(false);
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

      handleCategoryModalClose();
      // Optionally, display a success message
      alert("Category saved successfully.");
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
      // Optionally, display a success message
      alert("Category deleted successfully.");
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
    setShowCategoryModal(true);
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
      // Optionally, display a success message
      alert("Field definition deleted successfully.");
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

  // onSave callback for FieldModal
  const handleFieldSave = (data, editFieldData) => {
    const method = editFieldData ? "PUT" : "POST";
    const url = editFieldData
      ? `http://localhost:4000/api/finance/${orgId}/components/finance/fields/${editFieldData._id}`
      : `http://localhost:4000/api/finance/${orgId}/components/finance/fields`;

    fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(responseData => {
      if (responseData.field) {
        if (editFieldData) {
          setFieldDefinitions(fieldDefinitions.map(f => f._id === editFieldData._id ? responseData.field : f));
        } else {
          setFieldDefinitions([...fieldDefinitions, responseData.field]);
        }
        handleFieldModalClose();
        // Optionally, display a success message
        alert("Field definition saved successfully.");
      } else {
        setError(responseData.message || "Failed to save field.");
      }
    })
    .catch((err) => {
      setError("Error saving field definition.");
    });
  };

  // Partners Modal Handlers
  const handlePartnersModalClose = () => {
    setShowPartnersModal(false);
    setEditPartner(null);
  };

  const handleAddOrUpdatePartner = async (partnerData) => {
    try {
      setLoading(true);
      const method = partnerData.partnerId ? "PUT" : "POST";
      const url = partnerData.partnerId
        ? `http://localhost:4000/api/finance/${orgId}/components/finance/partners/${partnerData.partnerId}`
        : `http://localhost:4000/api/finance/${orgId}/components/finance/partners`;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(partnerData),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || "Failed to save partner.");
        alert(data.message || "Failed to save partner.");
        return;
      }

      const data = await response.json();
      if (data.partner) {
        if (partnerData.partnerId) {
          // Update existing partner
          setPartners(partners.map(p => p._id === data.partner._id ? data.partner : p));
          alert("Partner updated successfully.");
        } else {
          // Add new partner
          setPartners([...partners, data.partner]);
          alert("Partner added successfully.");
        }
        handlePartnersModalClose();
      } else {
        setError(data.message || "Failed to save partner.");
      }
    } catch (err) {
      setError("Error saving partner.");
      alert("Error saving partner.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePartner = async (partnerId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this partner?");
    if (!confirmDelete) return;

    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:4000/api/finance/${orgId}/components/finance/partners/${partnerId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (response.ok) {
        // Remove the deleted partner from the state
        setPartners(partners.filter((partner) => partner._id !== partnerId));
        // Optionally, display a success message
        alert("Partner deleted successfully.");
      } else {
        setError(data.message || "Failed to delete the partner.");
        alert(data.message || "Failed to delete the partner.");
      }
    } catch (err) {
      setError("Error deleting the partner.");
      alert("Error deleting the partner.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Add Record
  const handleAddRecord = (data) => {
    // data contains { type, categoryId, fields, recurrence, status, ... }

    // Make an API call to create the record
    const url = `http://localhost:4000/api/finance/${orgId}/components/finance/records`;

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(responseData => {
      if (responseData.record) {
        // Successfully saved, now update records state
        setRecords([...records, responseData.record]);
        setShowRecordModal(false);
        // Update Totals based on new record
        computeTotals(filteredRecords);
        // Optionally, display a success message
        alert("Record added successfully.");
      } else {
        setError(responseData.message || "Failed to save record.");
      }
    })
    .catch((err) => {
      console.error(err);
      setError("Error saving record.");
    });
  };

  // Handle Record Modal Close
  const handleRecordModalClose = () => {
    setShowRecordModal(false);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-r from-blue-500 to-purple-500 text-white p-8">
        <h1 className="text-4xl font-extrabold text-center mb-2">Finance Management</h1>
        <p className="text-center mb-8 text-lg">
          Manage your finance categories, records, fields, and partners efficiently.
        </p>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {loading && (
          <div className="flex justify-center items-center mb-4">
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            <span className="ml-2">Loading...</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex justify-center space-x-6 mb-8">
          <button
            className={`px-6 py-2 rounded font-semibold transition ${
              activeTab === "categories"
                ? "bg-blue-700 text-white"
                : "bg-white text-blue-700 hover:bg-gray-100"
            }`}
            onClick={() => setActiveTab("categories")}
            aria-label="Categories Tab"
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
            aria-label="Records Tab"
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
            aria-label="Fields Tab"
          >
            Fields
          </button>
          <button
            className={`px-6 py-2 rounded font-semibold transition ${
              activeTab === "partners"
                ? "bg-blue-700 text-white"
                : "bg-white text-blue-700 hover:bg-gray-100"
            }`}
            onClick={() => setActiveTab("partners")}
            aria-label="Partners Tab"
          >
            Partners
          </button>
        </div>

        {/* Categories Tab */}
        {activeTab === "categories" && (
          <div className="bg-white text-black p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Categories</h2>
              <button
                className="bg-green-600 px-4 py-2 rounded text-white font-semibold hover:bg-green-700 transition"
                onClick={() => {
                  setShowCategoryModal(true);
                  setEditCategory(null);
                  setCategoryForm({ name: "", subCategories: [""] });
                }}
                aria-label="Add Category"
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
                            aria-label={`Edit Category ${category.name}`}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="text-red-600 hover:text-red-800 font-semibold"
                            onClick={() => handleDeleteCategory(category._id)}
                            aria-label={`Delete Category ${category.name}`}
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

        {/* Records Tab */}
        {activeTab === "records" && (
          <div className="bg-white text-black p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Records</h2>
              <div className="flex space-x-4">
                <button
                  className="bg-green-600 px-4 py-2 rounded text-white font-semibold hover:bg-green-700 transition"
                  onClick={() => setShowRecordModal(true)}
                  aria-label="Add Record"
                >
                  Add Record
                </button>
                <button
                  className="bg-purple-600 px-4 py-2 rounded text-white font-semibold hover:bg-purple-700 transition"
                  onClick={() => setShowPartnersModal(true)}
                  aria-label="Add Partner"
                >
                  Add Partner
                </button>
              </div>
            </div>

            {/* Display Total Revenue, Total Expenses, and Profit/Loss */}
            <div className="flex flex-wrap justify-between mb-6">
              {/* Total Revenue */}
              <div className="bg-blue-100 p-4 rounded-lg shadow w-full md:w-1/3 mb-4 md:mb-0">
                <h3 className="text-lg font-semibold">Total Revenue</h3>
                <p className="text-2xl font-bold">{formatRupee(totalRevenue)}</p>
              </div>

              {/* Total Expenses */}
              <div className="bg-orange-100 p-4 rounded-lg shadow w-full md:w-1/3 mb-4 md:mb-0">
                <h3 className="text-lg font-semibold">Total Expenses</h3>
                <p className="text-2xl font-bold text-orange-600">{formatRupee(totalExpense)}</p>
              </div>

              {/* Profit/Loss */}
              <div
                className={`p-4 rounded-lg shadow w-full md:w-1/3 ${
                  profitLoss >= 0 ? "bg-green-100" : "bg-red-100"
                }`}
              >
                <h3 className="text-lg font-semibold">Profit/Loss</h3>
                <p
                  className={`text-2xl font-bold ${
                    profitLoss >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {profitLoss >= 0 ? "+" : "-"}
                  {formatRupee(Math.abs(profitLoss))}
                </p>
              </div>
            </div>

            {/* Combined Filter Section */}
            <div className="flex flex-col md:flex-row md:space-x-4 mb-4">
              {/* Date Filters */}
              <div className="flex flex-col mb-4 md:mb-0">
                <label className="block text-sm font-semibold mb-1">From Date</label>
                <input
                  type="date"
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  aria-label="From Date Filter"
                />
              </div>
              <div className="flex flex-col mb-4 md:mb-0">
                <label className="block text-sm font-semibold mb-1">To Date</label>
                <input
                  type="date"
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  aria-label="To Date Filter"
                />
              </div>
              {/* Category Filter */}
              <div className="flex flex-col mb-4 md:mb-0">
                <label className="block text-sm font-semibold mb-1">Filter by Category</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  aria-label="Category Filter"
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Clear Filters Button */}
            <div className="flex space-x-4 mb-4">
              <button
                className="px-3 py-1 rounded bg-gray-200 text-black hover:bg-gray-300"
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                  setRecordTypeFilter("all");
                  setSelectedCategory("all");
                }}
                aria-label="Clear All Filters"
              >
                Clear All Filters
              </button>
            </div>

            {/* Record Filters: All | Revenue | Expense */}
            <div className="flex flex-col md:flex-row md:space-x-4 mb-4">
              <div className="flex space-x-4 mb-4 md:mb-0">
                <button
                  className={`px-3 py-1 rounded ${
                    recordTypeFilter === "all" ? "bg-blue-600 text-white" : "bg-gray-200 text-black"
                  }`}
                  onClick={() => setRecordTypeFilter("all")}
                  aria-label="Filter All Records"
                >
                  All
                </button>
                <button
                  className={`px-3 py-1 rounded ${
                    recordTypeFilter === "revenue" ? "bg-blue-600 text-white" : "bg-gray-200 text-black"
                  }`}
                  onClick={() => setRecordTypeFilter("revenue")}
                  aria-label="Filter Revenue Records"
                >
                  Revenue
                </button>
                <button
                  className={`px-3 py-1 rounded ${
                    recordTypeFilter === "expense" ? "bg-blue-600 text-white" : "bg-gray-200 text-black"
                  }`}
                  onClick={() => setRecordTypeFilter("expense")}
                  aria-label="Filter Expense Records"
                >
                  Expense
                </button>
              </div>
            </div>

            {filteredRecords.length === 0 ? (
              <p className="text-gray-700">No records found for this filter.</p>
            ) : (
              <table className="table-auto w-full bg-white text-black rounded-lg">
                <thead>
                  <tr className="bg-gray-200 text-left">
                    <th className="px-4 py-2 border font-semibold">Type</th>
                    <th className="px-4 py-2 border font-semibold">Category</th>
                    <th className="px-4 py-2 border font-semibold">Status</th>
                    <th className="px-4 py-2 border font-semibold">Date</th>
                    <th className="px-4 py-2 border font-semibold">Amount</th>
                    <th className="px-4 py-2 border font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => {
                    // Identify the Final Amount Field for Each Record
                    const finalAmountField = fieldDefinitions.find(
                      f => f.config && f.config.isFinalAmount && (f.applicableTo.includes(record.type) || f.applicableTo.includes('both'))
                    );
                    const amount = finalAmountField ? record.fields[finalAmountField.name] : 0;

                    // Find Category Name
                    const categoryName = categories.find(cat => cat._id === record.categoryId)?.name || "-";

                    return (
                      <tr key={record._id} className="border-t hover:bg-gray-100 transition">
                        <td className="px-4 py-2 border align-top capitalize">{record.type}</td>
                        <td className="px-4 py-2 border align-top">{categoryName}</td>
                        <td className="px-4 py-2 border align-top capitalize">{record.status}</td>
                        <td className="px-4 py-2 border align-top">
                          {formatDate(record.fields.Date)}
                        </td>
                        <td className="px-4 py-2 border align-top">
                          {typeof amount === 'number' ? formatRupee(amount) : "-"}
                        </td>
                        <td className="px-4 py-2 border align-top">
                          <div className="flex space-x-4">
                            <button
                              className="text-blue-600 hover:text-blue-800 font-semibold"
                              onClick={() => handleEditRecord(record)}
                              aria-label={`Edit Record ${record._id}`}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              className="text-red-600 hover:text-red-800 font-semibold"
                              onClick={() => handleDeleteRecord(record._id)}
                              aria-label={`Delete Record ${record._id}`}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Fields Tab */}
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
                aria-label="Add Field Definition"
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
                      <td className="px-4 py-2 border align-top">{capitalize(field.type)}</td>
                      <td className="px-4 py-2 border align-top">
                        {field.type === "dropdown" && field.options.length > 0 ? (
                          <ul className="list-disc pl-5">
                            {field.options.map((opt, i) => (
                              <li key={i}>{opt}</li>
                            ))}
                          </ul>
                        ) : field.type === "formula" && field.expression ? (
                          <p className="text-sm italic">Expr: {field.expression}</p>
                        ) : (
                          <span className="text-sm text-gray-700">No extra details</span>
                        )}
                        {/* Display if Field is Final Amount */}
                        {field.config && field.config.isFinalAmount && (
                          <p className="text-sm text-green-600 mt-1">Final Amount Field</p>
                        )}
                      </td>
                      <td className="px-4 py-2 border align-top">
                        <div className="flex space-x-4">
                          <button
                            className="text-blue-600 hover:text-blue-800 font-semibold"
                            onClick={() => handleEditField(field)}
                            aria-label={`Edit Field ${field.name}`}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="text-red-600 hover:text-red-800 font-semibold"
                            onClick={() => handleDeleteField(field._id)}
                            aria-label={`Delete Field ${field.name}`}
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

        {/* Partners Tab */}
        {activeTab === "partners" && (
          <div className="bg-white text-black p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Partners</h2>
              <button
                className="bg-green-600 px-4 py-2 rounded text-white font-semibold hover:bg-green-700 transition"
                onClick={() => {
                  setShowPartnersModal(true);
                  setEditPartner(null);
                }}
                aria-label="Add Partner"
              >
                Add Partner
              </button>
            </div>

            {partners.length === 0 ? (
              <p className="text-gray-700">No partners found. Add a new partner to get started.</p>
            ) : (
              <table className="table-auto w-full bg-white text-black rounded-lg">
                <thead>
                  <tr className="bg-gray-200 text-left">
                    <th className="px-4 py-2 border font-semibold">Name</th>
                    <th className="px-4 py-2 border font-semibold">Type</th>
                    <th className="px-4 py-2 border font-semibold">Contact Info</th>
                    <th className="px-4 py-2 border font-semibold">Category</th>
                    <th className="px-4 py-2 border font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {partners.map((partner) => (
                    <tr key={partner._id} className="border-t hover:bg-gray-100 transition">
                      <td className="px-4 py-2 border align-top">{partner.name}</td>
                      <td className="px-4 py-2 border align-top capitalize">{partner.type}</td>
                      <td className="px-4 py-2 border align-top">
                        {partner.contactInfo.email && <p>Email: {partner.contactInfo.email}</p>}
                        {partner.contactInfo.phone && <p>Phone: {partner.contactInfo.phone}</p>}
                        {partner.contactInfo.address && <p>Address: {partner.contactInfo.address}</p>}
                      </td>
                      <td className="px-4 py-2 border align-top">
                        {partner.categoryId ? (
                          <span>{partner.categoryId.name}</span> // Assuming category is populated
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-2 border align-top">
                        <div className="flex space-x-4">
                          <button
                            className="text-blue-600 hover:text-blue-800 font-semibold"
                            onClick={() => {
                              setEditPartner(partner);
                              setShowPartnersModal(true);
                            }}
                            aria-label={`Edit Partner ${partner.name}`}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="text-red-600 hover:text-red-800 font-semibold"
                            onClick={() => handleDeletePartner(partner._id)}
                            aria-label={`Delete Partner ${partner.name}`}
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

        {/* Category Modal */}
        {showCategoryModal && (
          <Modal onClose={handleCategoryModalClose}>
            <div className="p-6 bg-white rounded-lg shadow-lg max-w-lg mx-auto text-black z-50 relative">
              <h2 className="text-xl font-bold mb-4">
                {editCategory ? "Edit Category" : "Add Category"}
              </h2>
              <div>
                <label className="block text-sm font-semibold mb-2">Category Name</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  aria-label="Category Name Input"
                />

                <label className="block text-sm font-semibold mb-2">Sub-Categories</label>
                {categoryForm.subCategories.map((sub, index) => (
                  <div key={index} className="flex items-center mb-2 space-x-2">
                    <input
                      type="text"
                      className="flex-grow p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                      value={sub}
                      onChange={(e) => handleSubCategoryChange(index, e.target.value)}
                      aria-label={`Sub-Category ${index + 1} Input`}
                    />
                    {categoryForm.subCategories.length > 1 && (
                      <button
                        className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition"
                        onClick={() => removeSubCategoryField(index)}
                        aria-label={`Remove Sub-Category ${index + 1}`}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition font-semibold"
                  onClick={addSubCategoryField}
                  aria-label="Add Sub-Category"
                >
                  Add Sub-Category
                </button>
              </div>

              <div className="flex justify-end mt-4 space-x-3 border-t border-gray-200 pt-4">
                <button
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition"
                  onClick={handleCategoryModalClose}
                  aria-label="Cancel Add/Edit Category"
                >
                  Cancel
                </button>
                <button
                  className="bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700 transition"
                  onClick={handleAddOrUpdateCategory}
                  aria-label="Save Category"
                >
                  Save
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Fields Modal */}
        {showFieldModal && (
          <FieldModal
            onClose={handleFieldModalClose}
            onSave={handleFieldSave}
            editField={editField}
            fields={fieldDefinitions}
          />
        )}

        {/* Partners Modal */}
        {showPartnersModal && (
          <PartnersModal
            onClose={handlePartnersModalClose}
            onSave={handleAddOrUpdatePartner}
            categories={categories} // Pass categories for category selection
            existingPartner={editPartner} // Pass existing partner data if editing
          />
        )}

        {/* Record Modal */}
        {showRecordModal && (
          <RecordModal
            onClose={handleRecordModalClose}
            onSave={handleAddRecord}
            categories={categories} // Pass categories if needed
            fields={fieldDefinitions} // Pass fields if needed
          />
        )}

        {/* Edit Record Modal */}
        {showEditRecordModal && (
          <RecordModal
            onClose={() => {
              setShowEditRecordModal(false);
              setEditRecord(null);
            }}
            onSave={handleUpdateRecord}
            categories={categories}
            fields={fieldDefinitions}
            existingRecord={editRecord}
          />
        )}
      </div>
    </Layout>
  );
};

// Helper Function to Format Currency in Rupees
const formatRupee = (amount) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
};

// Helper Function to Format Date
const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date)) return "-";
  return new Intl.DateTimeFormat('en-IN', { year: 'numeric', month: 'short', day: '2-digit' }).format(date);
};

// Utility Function to Capitalize First Letter
const capitalize = (s) => {
  if (typeof s !== 'string') return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export default FinanceManagement;
