import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Edit2, Filter, Receipt, Calendar, Home, DollarSign } from 'lucide-react';
import { expensesApi, unitsApi } from '../api';
import Modal from '../components/Modal';
import { formatDate } from '../utils/dateUtils';

const Expenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [filterUnitId, setFilterUnitId] = useState('');

    const [formData, setFormData] = useState({
        unit_id: '',
        amount: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
        description: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const categories = [
        'Maintenance',
        'Repairs',
        'Utilities',
        'Insurance',
        'Taxes',
        'Management Fee',
        'Marketing',
        'Other'
    ];

    const fetchData = async () => {
        setLoading(true);
        try {
            const [expensesRes, unitsRes] = await Promise.all([
                expensesApi.getAll(filterUnitId || undefined),
                unitsApi.getAll()
            ]);
            setExpenses(expensesRes.data);
            setUnits(unitsRes.data);
        } catch (err) {
            console.error("Error fetching expense data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filterUnitId]);

    const openCreateModal = () => {
        setEditingExpense(null);
        setFormData({
            unit_id: '',
            amount: '',
            category: categories[0],
            date: new Date().toISOString().split('T')[0],
            description: ''
        });
        setIsModalOpen(true);
    };

    const openEditModal = (expense) => {
        setEditingExpense(expense);
        setFormData({
            unit_id: expense.unit_id,
            amount: expense.amount,
            category: expense.category,
            date: expense.date,
            description: expense.description || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this expense record?")) return;
        try {
            await expensesApi.delete(id);
            fetchData();
        } catch (err) {
            console.error("Error deleting expense:", err);
            alert("Failed to delete expense.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                unit_id: Number(formData.unit_id),
                amount: Number(formData.amount),
            };

            if (editingExpense) {
                await expensesApi.update(editingExpense.id, payload);
            } else {
                await expensesApi.create(payload);
            }

            setIsModalOpen(false);
            fetchData();
        } catch (err) {
            console.error("Error saving expense:", err);
            alert("Failed to save expense. Please verify all fields.");
        } finally {
            setSubmitting(false);
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    };

    const getUnitName = (id) => {
        return units.find(u => u.id === id)?.name || `Unit #${id}`;
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1>Operational Expenses</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Track and manage property-related costs and maintenance.</p>
                </div>
                <button className="btn btn-primary" onClick={openCreateModal}>
                    <Plus size={20} />
                    Record Expense
                </button>
            </div>

            <div className="glass" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                        <Filter size={18} color="var(--text-secondary)" />
                        <select
                            className="glass"
                            style={{
                                padding: '0.6rem 1rem',
                                borderRadius: '8px',
                                border: '1px solid var(--panel-border)',
                                color: 'white',
                                background: 'rgba(255, 255, 255, 0.05)',
                                width: '100%'
                            }}
                            value={filterUnitId}
                            onChange={(e) => setFilterUnitId(e.target.value)}
                        >
                            <option value="" style={{ color: 'black' }}>All Units</option>
                            {units.map(u => (
                                <option key={u.id} value={u.id} style={{ color: 'black' }}>{u.name} ({u.unit_code})</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ flex: 2 }}>
                        {/* Summary of visible expenses could go here */}
                        <div style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                            Showing {expenses.length} records
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingExpense ? "Edit Expense" : "Record New Expense"}
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Unit</label>
                        <select
                            required
                            className="glass"
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--panel-border)', color: 'white', background: 'rgba(255, 255, 255, 0.05)' }}
                            value={formData.unit_id}
                            onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                        >
                            <option value="" style={{ color: 'black' }}>Select a Unit</option>
                            {units.map((unit) => (
                                <option key={unit.id} value={unit.id} style={{ color: 'black' }}>
                                    {unit.name} ({unit.unit_code})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Category</label>
                            <select
                                required
                                className="glass"
                                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--panel-border)', color: 'white', background: 'rgba(255, 255, 255, 0.05)' }}
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat} style={{ color: 'black' }}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Amount ($)</label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                className="glass"
                                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--panel-border)', color: 'white', background: 'rgba(255, 255, 255, 0.05)' }}
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Date</label>
                        <input
                            type="date"
                            required
                            className="glass"
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--panel-border)', color: 'white', background: 'rgba(255, 255, 255, 0.05)' }}
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Description</label>
                        <textarea
                            className="glass"
                            placeholder="Details about the expense..."
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--panel-border)', color: 'white', background: 'rgba(255, 255, 255, 0.05)', minHeight: '100px', resize: 'vertical' }}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={submitting}
                        style={{ marginTop: '0.5rem', justifyContent: 'center' }}
                    >
                        {submitting ? 'Saving...' : editingExpense ? 'Update Expense' : 'Record Expense'}
                    </button>
                </form>
            </Modal>

            <div className="glass" style={{ padding: '1rem', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--panel-border)' }}>
                            <th style={{ padding: '1rem' }}>Date</th>
                            <th style={{ padding: '1rem' }}>Category</th>
                            <th style={{ padding: '1rem' }}>Unit</th>
                            <th style={{ padding: '1rem' }}>Description</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Amount</th>
                            <th style={{ padding: '1rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading expenses...</td></tr>
                        ) : expenses.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No expense records found.</td></tr>
                        ) : expenses.map((expense) => (
                            <tr key={expense.id} style={{ borderBottom: '1px solid var(--panel-border)' }} className="table-row-hover">
                                <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Calendar size={14} color="var(--text-secondary)" />
                                        <span>{formatDate(expense.date)}</span>
                                    </div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '0.2rem 0.6rem',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid var(--panel-border)'
                                    }}>
                                        {expense.category}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Home size={14} color="var(--text-secondary)" />
                                        <span>{getUnitName(expense.unit_id)}</span>
                                    </div>
                                </td>
                                <td style={{ padding: '1rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{expense.description || '-'}</span>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, color: 'var(--accent-ruby)' }}>
                                    {formatCurrency(expense.amount)}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => openEditModal(expense)}
                                            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(expense.id)}
                                            style={{ background: 'transparent', border: 'none', color: 'var(--error-color)', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Expenses;
