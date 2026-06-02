import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Mail, Phone, Edit2, Trash2, FileText, Download } from 'lucide-react';
import { tenantsApi, unitsApi, statementsApi } from '../api';
import Modal from '../components/Modal';
import { formatDate } from '../utils/dateUtils';

const fmt = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
const asArray = (x) => (Array.isArray(x) ? x : []);

const Tenants = () => {
    const [tenants, setTenants]       = useState([]);
    const [units, setUnits]           = useState([]);
    const [search, setSearch]         = useState('');
    const [loading, setLoading]       = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTenant, setEditingTenant] = useState(null);
    const [formData, setFormData] = useState({ full_name: '', email: '', phone: '', notes: '', preferred_unit_id: '' });

    const [isStatementOpen, setIsStatementOpen] = useState(false);
    const [statementData, setStatementData]     = useState(null);
    const [statementTenantId, setStatementTenantId] = useState(null);
    const [statementLoading, setStatementLoading] = useState(false);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [tR, uR] = await Promise.all([tenantsApi.getAll(), unitsApi.getAll()]);
            setTenants(asArray(tR?.data));
            setUnits(asArray(uR?.data));
        } catch (err) {
            console.error('Error fetching tenants:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    const openCreate = () => {
        setEditingTenant(null);
        setFormData({ full_name: '', email: '', phone: '', notes: '', preferred_unit_id: '' });
        setIsModalOpen(true);
    };

    const openEdit = (t) => {
        setEditingTenant(t);
        setFormData({ full_name: t.full_name, email: t.email, phone: t.phone, notes: t.notes || '', preferred_unit_id: t.preferred_unit_id || '' });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this tenant? This cannot be undone.')) return;
        try { await tenantsApi.delete(id); fetchAll(); }
        catch (err) { alert(err.response?.data?.detail || 'Failed to delete tenant.'); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = { ...formData, preferred_unit_id: formData.preferred_unit_id ? Number(formData.preferred_unit_id) : null };
            if (editingTenant) await tenantsApi.update(editingTenant.id, payload);
            else await tenantsApi.create(payload);
            setIsModalOpen(false);
            fetchAll();
        } catch (err) {
            alert(err.response?.data?.detail || 'Failed to save tenant.');
        } finally {
            setSubmitting(false);
        }
    };

    const openStatement = async (id) => {
        setStatementLoading(true);
        setIsStatementOpen(true);
        setStatementData(null);
        setStatementTenantId(id);
        try {
            const res = await statementsApi.getStatement(id);
            const d = res?.data;
            setStatementData(d ? { ...d, transactions: asArray(d.transactions) } : null);
        } catch { alert('Failed to load statement.'); setIsStatementOpen(false); }
        finally { setStatementLoading(false); }
    };

    const downloadPdf = async (tenantId, name) => {
        try {
            const res = await statementsApi.downloadPdf(tenantId);
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a   = document.createElement('a');
            a.href = url; a.setAttribute('download', `Statement_${name.replace(/\s+/g,'_')}.pdf`);
            document.body.appendChild(a); a.click(); a.remove();
        } catch { alert('Failed to generate PDF.'); }
    };

    const field = (k) => (e) => setFormData({ ...formData, [k]: e.target.value });
    const filtered = tenants.filter(t => t.full_name.toLowerCase().includes(search.toLowerCase()) || t.email.toLowerCase().includes(search.toLowerCase()));
    const unitName = (id) => units.find(u => u.id === id)?.name || '—';

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Tenants</h1>
                    <p className="page-subtitle">Manage and monitor your tenants</p>
                </div>
                <button className="btn btn-primary" onClick={openCreate}>
                    <UserPlus size={16} /> Add Tenant
                </button>
            </div>

            {/* Tenant form modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTenant ? 'Edit Tenant' : 'Add Tenant'}>
                <form className="form-stack" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input type="text" required className="form-input" value={formData.full_name} onChange={field('full_name')} placeholder="Jane Smith" />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input type="email" required className="form-input" value={formData.email} onChange={field('email')} placeholder="jane@example.com" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Phone</label>
                            <input type="text" required className="form-input" value={formData.phone} onChange={field('phone')} placeholder="+1 555 0000" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Link to Unit (optional)</label>
                        <select className="form-select" value={formData.preferred_unit_id} onChange={field('preferred_unit_id')}>
                            <option value="">No unit — assign later</option>
                            {units.map(u => <option key={u.id} value={u.id}>{u.name} ({u.unit_code})</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Notes</label>
                        <textarea className="form-textarea" value={formData.notes} onChange={field('notes')} placeholder="Internal notes…" />
                    </div>
                    <button type="submit" className="btn btn-primary btn-lg w-full" disabled={submitting}>
                        {submitting ? 'Saving…' : editingTenant ? 'Update Tenant' : 'Create Tenant'}
                    </button>
                </form>
            </Modal>

            {/* Statement modal */}
            <Modal isOpen={isStatementOpen} onClose={() => setIsStatementOpen(false)} title="Statement of Account" wide>
                {statementLoading ? (
                    <div className="table-loading">Loading statement…</div>
                ) : statementData ? (
                    <div>
                        <div className="page-header" style={{ marginBottom: 16 }}>
                            <div>
                                <h3 style={{ margin: 0 }}>{statementData.tenant_name}</h3>
                                <p className="text-muted fs-sm mt-4">{statementData.unit_name}</p>
                            </div>
                            <button
                                className="btn btn-secondary"
                                onClick={() => downloadPdf(statementTenantId, statementData.tenant_name)}
                            >
                                <Download size={15} /> Export PDF
                            </button>
                        </div>
                        <div className="statement-summary">
                            <div className="statement-cell">
                                <div className="statement-cell-label">Total Due</div>
                                <div className="statement-cell-value">{fmt(statementData.total_due)}</div>
                            </div>
                            <div className="statement-cell">
                                <div className="statement-cell-label">Total Paid</div>
                                <div className="statement-cell-value text-green">{fmt(statementData.total_paid)}</div>
                            </div>
                            <div className="statement-cell">
                                <div className="statement-cell-label">Outstanding</div>
                                <div className={`statement-cell-value ${statementData.balance > 0 ? 'text-red' : 'text-green'}`}>{fmt(statementData.balance)}</div>
                            </div>
                        </div>
                        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                            <table className="table">
                                <thead>
                                    <tr><th>Date</th><th>Description</th><th>Amount</th><th>Status</th></tr>
                                </thead>
                                <tbody>
                                    {statementData.transactions.map((t, i) => (
                                        <tr key={i}>
                                            <td>{formatDate(t.date)}</td>
                                            <td className="text-2">{t.description}</td>
                                            <td className="fw-600">{fmt(t.amount)}</td>
                                            <td><span className={`badge ${t.status === 'paid' ? 'badge-green' : t.status === 'overdue' ? 'badge-red' : 'badge-yellow'}`}>{t.status}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : null}
            </Modal>

            <div className="table-wrap">
                <div className="filter-bar">
                    <div className="search-wrap">
                        <Search size={14} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                        <input placeholder="Search tenants…" value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <span className="text-muted fs-sm" style={{ marginLeft: 'auto' }}>{filtered.length} tenants</span>
                </div>

                <table className="table">
                    <thead>
                        <tr>
                            <th>Tenant</th>
                            <th>Contact</th>
                            <th>Unit</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" className="table-loading">Loading tenants…</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan="5" className="table-empty">
                                {search ? `No tenants matching "${search}"` : 'No tenants yet. Add your first tenant.'}
                            </td></tr>
                        ) : filtered.map((t) => (
                            <tr key={t.id}>
                                <td>
                                    <div className="user-cell">
                                        <div className="avatar">{t.full_name.charAt(0)}</div>
                                        <div>
                                            <div className="user-cell-name">{t.full_name}</div>
                                            <div className="user-cell-sub">Added {formatDate(t.created_at)}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div className="flex-center gap-6 fs-sm text-2 mt-4">
                                        <Mail size={12} /> {t.email}
                                    </div>
                                    <div className="flex-center gap-6 fs-sm text-muted mt-4">
                                        <Phone size={12} /> {t.phone}
                                    </div>
                                </td>
                                <td className="text-2 fs-sm">{t.preferred_unit_id ? unitName(t.preferred_unit_id) : <span className="text-muted">Not assigned</span>}</td>
                                <td><span className="badge badge-green">Active</span></td>
                                <td>
                                    <div className="flex-center gap-4" style={{ justifyContent: 'flex-end' }}>
                                        <button className="btn btn-ghost btn-icon" title="Statement" onClick={() => openStatement(t.id)}>
                                            <FileText size={15} />
                                        </button>
                                        <button className="btn btn-ghost btn-icon" title="Edit" onClick={() => openEdit(t)}>
                                            <Edit2 size={15} />
                                        </button>
                                        <button className="btn btn-ghost btn-icon" title="Delete" onClick={() => handleDelete(t.id)} style={{ color: 'var(--red)' }}>
                                            <Trash2 size={15} />
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

export default Tenants;
