import React, { useState, useEffect } from "react";
import Card from "../../components/Card";
import Modal from "../../components/Modal";
import API from "../../utils/api";
import { Trash2, Plus } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const Finance = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: "expense",
    amount: 0,
    category: "",
    description: "",
    source: "",
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await API.get("/finance");
      setTransactions(data.data || data);
    } catch (error) {
      setError("Unable to load transactions right now.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      await API.post("/finance", formData);
      setFormData({
        type: "expense",
        amount: 0,
        category: "",
        description: "",
        source: "",
      });
      setIsModalOpen(false);
      fetchTransactions();
    } catch (error) {
      console.error("Error creating transaction:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/finance/${id}`);
      fetchTransactions();
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  const expenses = transactions.filter((t) => t.type === "expense");
  const income = transactions.filter((t) => t.type === "income");

  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpenses;

  const expenseByCategory = expenses.reduce((acc, t) => {
    const existing = acc.find((x) => x.name === t.category);
    if (existing) {
      existing.value += t.amount;
    } else {
      acc.push({ name: t.category || "Other", value: t.amount });
    }
    return acc;
  }, []);

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Finance Tracker
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <Plus size={20} /> Add Transaction
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">Total Income</p>
            <p className="text-3xl font-bold text-green-500">
              ${totalIncome.toFixed(2)}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">Total Expenses</p>
            <p className="text-3xl font-bold text-red-500">
              ${totalExpenses.toFixed(2)}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">Balance</p>
            <p
              className={`text-3xl font-bold ${
                balance >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              ${balance.toFixed(2)}
            </p>
          </div>
        </Card>
      </div>

      {expenseByCategory.length > 0 && (
        <Card>
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            Expenses by Category
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={expenseByCategory}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: $${value.toFixed(2)}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {expenseByCategory.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </Card>
      )}

      <Card>
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          Recent Transactions
        </h2>
        {loading ? (
          <div className="text-gray-600 dark:text-gray-400">
            Loading transactions...
          </div>
        ) : error ? (
          <div className="text-red-600 dark:text-red-400">{error}</div>
        ) : transactions.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">
            No transactions yet. Add your first one to see insights.
          </p>
        ) : (
          <div className="space-y-3">
            {transactions.slice(0, 10).map((transaction) => (
              <div
                key={transaction._id}
                className="flex justify-between items-start p-3 bg-gray-50 dark:bg-gray-700 rounded"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {transaction.description || "Transaction"}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {transaction.category && (
                      <span>{transaction.category} • </span>
                    )}
                    {new Date(transaction.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-lg font-bold ${
                      transaction.type === "income"
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : "-"}$
                    {transaction.amount.toFixed(2)}
                  </span>
                  <button
                    onClick={() => handleDelete(transaction._id)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        title="Add Transaction"
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      >
        <div className="space-y-4">
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          <input
            type="number"
            placeholder="Amount"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: parseFloat(e.target.value) })
            }
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          />
          <input
            type="text"
            placeholder="Category"
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          />
          <input
            type="text"
            placeholder="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          />
          {formData.type === "income" && (
            <input
              type="text"
              placeholder="Source"
              value={formData.source}
              onChange={(e) =>
                setFormData({ ...formData, source: e.target.value })
              }
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
            />
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Finance;
