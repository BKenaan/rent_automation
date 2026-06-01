import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Filter, Calendar, Building2 } from 'lucide-react';
import { expensesApi, unitsApi } from '../api';
import Modal from '../components/Modal';
import { formatDate } from '../utils/dateUtils';

const asArray = (x) => (Array.isArray(x) ? x : []);
const fmt = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

const CATS = ['Maintenance','Repairs','Utilities','Insurance','Taxes','Management Fee','Marketing','Other'];
const BLANK = { unit_id: '', amount: '', category: CATS[0], date: new Date().toISOString().split('T')[0], description: '' };

const Expenses = () => {
    const [expenses, setExpenses]   = useState([]);
    const [units, setUnits]         = useState([]);
    const [loading, setLoading]     = useState(true);
    const [filterUnit, setFilter]   = useState('');
    const [isModalOpen, setModal]   = useState(false);
    const [editingExp, setEditing]  = useState(null);
    const [formData, setFormData]   = useState(BLANK);
    const [submitting, setSubmitting] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [eR, uR] = await Promise.all([expensesApi.getAll(filterUnit || undefined), unitsApi.getAll()]);
            setExpenses(asArray(eR?.data)); setUnits(asArray(uR?.data));
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, [filterUnit]);

    const openCreate = () => { setEditing(null); setFormData(BLANK); setModal(true); };
    const openEdit   = (ex) => {
        setEditing(ex);
        setFormData({ unit_id: ex.unit_id, amount: ex.amount, category: ex.category, date: ex.date, description: ex.description || '' });
        setModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this expense record?')) return;
        try { await expensesApi.delete(id); fetchData(); }
        catch (err) { alert(err.response?.data?.detail || 'Failed to delete expense.'); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = { ...formData, unit_id: Number(formData.unit_id), amount: Number(formData.amount) };
            if (editingExp) await expensesApi.update(editingExp.id, payload);
            else await expensesApi.create(payload);
            setModal(false);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.detail || 'Failed to save expense.');
        } finally { setSubmitting(false); }
    };

    const field = (k) => (e) => setFormData({ ...formData, [k]: e.target.value });
    const unitName = (id) => units.find(u => u.id === id)?.name || `Unit #${id}`;
    const totalShown = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Operational Expenses</h1>
                    <p className="page-subtitle">Track property-related costs and maintenance</p>
                </div>
                <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Record Expense</button>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setModal(false)} title={editingExp ? 'Edit Expense' : 'Record Expense'}>
                <form className="form-stack" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Unit</label>
                        <select required className="form-select" value={formData.unit_id} onChange={field('unit_id')}>
                            <option value="">Select a unit</option>
                            {units.map(u => <option key={u.id} value={u.id}>{u.name} ({u.unit_code})</option>)}
                        </select>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Category</label>
                            <select required className="form-select" value={formData.category} onChange={field('category')}>
                                {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Amount ($)</label>
                            <input type="number" step="0.01" required className="form-input" placeholder="0.00" value={formData.amount} onChange={field('amount')} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Date</label>
                        <input type="date" required className="form-input" value={formData.date} onChange={field('date')} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea className="form-textarea" placeholder="Details about this expense…" value={formData.description} onChange={field('description')} />
                    </div>
                    <button type="submit" className="btn btn-primary btn-lg w-full" disabled={submitting}>
                        {submitting ? 'Saving…' : editingExp ? 'Update Expense' : 'Record Expense'}
                    </button>
                </form>
            </Modal>

            <div className="table-wrap">
                <div className="filter-bar">
                    <Filter size={14} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                    <select
                        className="form-select"
                        style={{ width: 'auto', minWidth: 160, background: 'var(--surface-2)', border: '1px solid var(--border-md)', borderRadius: 'var(--radius)', padding: '5px 10px', fontSize: '0.875rem' }}
                        value={filterUnit}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="">All Units</option>
                        {units.map(u => <option key={u.id} value={u.id}>{u.name} ({u.unit_code})</option>)}
                    </select>
                    <span className="text-muted fs-sm" style={{ marginLeft: 'auto' }}>
                        {expenses.length} records · Total: <strong style={{ color: 'var(--red)' }}>{fmt(totalShown)}</strong>
                    </span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className="table" style={{ minWidth: 600 }}>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Category</th>
                                <th>Unit</th>
                                <th>Description</th>
                                <th style={{ textAlign: 'right' }}>Amount</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="table-loading">Loading expenses…</td></tr>
                            ) : expenses.length === 0 ? (
                                <tr><td colSpan="6" className="table-empty">No expense records found.</td></tr>
                            ) : expenses.map((ex) => (
                                <tr key={ex.id}>
                                    <td>
                                        <div className="flex-center gap-6 fs-sm text-2">
                                            <Calendar size={12} /> {formatDate(ex.date)}
                                        </div>
                                    </td>
                                    <td><span className="badge badge-neutral">{ex.category}</span></td>
                                    <td>
                                        <div className="flex-center gap-6 fs-sm text-2">
                                            <Building2 size={12} /> {unitName(ex.unit_id)}
                                        </div>
                                    </td>
                                    <td className="text-2 fs-sm" style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {ex.description || <span className="text-muted">—</span>}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <span className="fw-600 text-red">{fmt(ex.amount)}</span>
                                    </td>
                                    <td>
                                        <div className="flex-center gap-4">
                                            <button className="btn btn-ghost btn-icon" title="Edit" onClick={() => openEdit(ex)}><Edit2 size={15} /></button>
                                            <button className="btn btn-ghost btn-icon" title="Delete" onClick={() => handleDelete(ex.id)} style={{ color: 'var(--red)' }}><Trash2 size={15} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Expenses;
