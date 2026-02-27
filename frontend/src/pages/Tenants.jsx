import React, { useState, useEffect } from 'react';
import { Search, UserPlus, MoreVertical, Mail, Phone, Edit2, Trash2, FileText, Download } from 'lucide-react';
import { tenantsApi, unitsApi, statementsApi } from '../api';
import Modal from '../components/Modal';
import { formatDate } from '../utils/dateUtils';

const Tenants = () => {
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTenant, setEditingTenant] = useState(null);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        notes: '',
        preferred_unit_id: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [units, setUnits] = useState([]);
    const [unitsLoading, setUnitsLoading] = useState(false);

    // Statement Modal State
    const [isStatementOpen, setIsStatementOpen] = useState(false);
    const [statementData, setStatementData] = useState(null);
    const [statementLoading, setStatementLoading] = useState(false);

    const asArray = (x) => (Array.isArray(x) ? x : []);

    const fetchTenants = async () => {
        setLoading(true);
        try {
            const res = await tenantsApi.getAll();
            setTenants(asArray(res?.data));
        } catch (err) {
            console.error("Error fetching tenants:", err);
            setTenants([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchUnits = async () => {
        setUnitsLoading(true);
        try {
            const res = await unitsApi.getAll();
            setUnits(asArray(res?.data));
        } catch (err) {
            console.error("Error fetching units:", err);
            setUnits([]);
        } finally {
            setUnitsLoading(false);
        }
    };

    useEffect(() => {
        fetchTenants();
        fetchUnits();
    }, []);

    const openStatement = async (tenantId) => {
        setStatementLoading(true);
        setIsStatementOpen(true);
        try {
            const res = await statementsApi.getStatement(tenantId);
            const data = res?.data;
            setStatementData(data ? { ...data, transactions: asArray(data.transactions) } : null);
        } catch (err) {
            console.error("Error fetching statement:", err);
            alert("Failed to load account statement.");
            setIsStatementOpen(false);
        } finally {
            setStatementLoading(false);
        }
    };

    const downloadPdf = async (tenantId, tenantName) => {
        try {
            const res = await statementsApi.downloadPdf(tenantId);
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Statement_${tenantName.replace(/\s+/g, '_')}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Error downloading PDF:", err);
            alert("Failed to generate PDF statement.");
        }
    };

    const openCreateModal = () => {
        setEditingTenant(null);
        setFormData({
            full_name: '',
            email: '',
            phone: '',
            notes: '',
            preferred_unit_id: ''
        });
        setIsModalOpen(true);
    };

    const openEditModal = (tenant) => {
        setEditingTenant(tenant);
        setFormData({
            full_name: tenant.full_name,
            email: tenant.email,
            phone: tenant.phone,
            notes: tenant.notes || '',
            preferred_unit_id: tenant.preferred_unit_id || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this tenant? This action cannot be undone.")) return;
        try {
            await tenantsApi.delete(id);
            fetchTenants();
        } catch (err) {
            console.error("Error deleting tenant:", err);
            alert("Failed to delete tenant.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                preferred_unit_id: formData.preferred_unit_id
                    ? Number(formData.preferred_unit_id)
                    : null,
            };

            if (editingTenant) {
                await tenantsApi.update(editingTenant.id, payload);
            } else {
                await tenantsApi.create(payload);
            }

            setIsModalOpen(false);
            fetchTenants();
        } catch (err) {
            console.error("Error saving tenant:", err);
            alert("Failed to save tenant. Please check the inputs.");
        } finally {
            setSubmitting(false);
        }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1>Tenants</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Manage and monitor your community members.</p>
                </div>
                <button className="btn btn-primary" onClick={openCreateModal}>
                    <UserPlus size={20} />
                    Add Tenant
                </button>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingTenant ? "Edit Tenant" : "Add New Tenant"}
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Full Name</label>
                        <input
                            type="text"
                            required
                            className="glass"
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--panel-border)', color: 'white', background: 'rgba(255, 255, 255, 0.05)' }}
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Email</label>
                        <input
                            type="email"
                            required
                            className="glass"
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--panel-border)', color: 'white', background: 'rgba(255, 255, 255, 0.05)' }}
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Link to Unit (optional)</label>
                        <select
                            className="glass"
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--panel-border)', color: 'white', background: 'rgba(255, 255, 255, 0.05)' }}
                            value={formData.preferred_unit_id}
                            onChange={(e) => setFormData({ ...formData, preferred_unit_id: e.target.value })}
                            disabled={unitsLoading}
                        >
                            <option value="" style={{ color: 'black' }}>
                                {unitsLoading ? 'Loading units...' : 'No unit (assign later)'}
                            </option>
                            {units.map((unit) => (
                                <option key={unit.id} value={unit.id} style={{ color: 'black' }}>
                                    {unit.name} ({unit.unit_code})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Phone Number</label>
                        <input
                            type="text"
                            required
                            className="glass"
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--panel-border)', color: 'white', background: 'rgba(255, 255, 255, 0.05)' }}
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Notes</label>
                        <textarea
                            className="glass"
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--panel-border)', color: 'white', background: 'rgba(255, 255, 255, 0.05)', minHeight: '100px', resize: 'vertical' }}
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={submitting}
                        style={{ marginTop: '0.5rem', justifyContent: 'center' }}
                    >
                        {submitting ? 'Saving...' : editingTenant ? 'Update Tenant' : 'Create Tenant'}
                    </button>
                </form>
            </Modal>

            <Modal
                isOpen={isStatementOpen}
                onClose={() => setIsStatementOpen(false)}
                title="Statement of Account"
            >
                {statementLoading ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>Loading statement...</div>
                ) : statementData ? (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                            <div>
                                <h2 style={{ margin: 0 }}>{statementData.tenant_name}</h2>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{statementData.unit_name}</p>
                            </div>
                            <button
                                className="btn btn-primary"
                                style={{ padding: '0.5rem 1rem' }}
                                onClick={() => downloadPdf(statementData.tenant_id || tenants.find(t => t.full_name === statementData.tenant_name)?.id, statementData.tenant_name)}
                            >
                                <Download size={18} />
                                Export PDF
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                            <div className="glass" style={{ padding: '1rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Due</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{formatCurrency(statementData.total_due)}</div>
                            </div>
                            <div className="glass" style={{ padding: '1rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Paid</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success-color)' }}>{formatCurrency(statementData.total_paid)}</div>
                            </div>
                            <div className="glass" style={{ padding: '1rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Outstanding</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: statementData.balance > 0 ? 'var(--error-color)' : 'var(--success-color)' }}>
                                    {formatCurrency(statementData.balance)}
                                </div>
                            </div>
                        </div>

                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                                <thead style={{ position: 'sticky', top: 0, background: 'var(--panel-bg)', zIndex: 1 }}>
                                    <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--panel-border)' }}>
                                        <th style={{ padding: '0.75rem' }}>Date</th>
                                        <th style={{ padding: '0.75rem' }}>Description</th>
                                        <th style={{ padding: '0.75rem' }}>Amount</th>
                                        <th style={{ padding: '0.75rem' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(Array.isArray(statementData.transactions) ? statementData.transactions : []).map((t, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid var(--panel-border)' }}>
                                            <td style={{ padding: '0.75rem' }}>{formatDate(t.date)}</td>
                                            <td style={{ padding: '0.75rem' }}>{t.description}</td>
                                            <td style={{ padding: '0.75rem', fontWeight: 600 }}>{formatCurrency(t.amount)}</td>
                                            <td style={{ padding: '0.75rem' }}>
                                                <span style={{
                                                    padding: '0.2rem 0.5rem',
                                                    borderRadius: '4px',
                                                    fontSize: '0.7rem',
                                                    background: t.status === 'paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                                    color: t.status === 'paid' ? 'var(--success-color)' : 'var(--text-secondary)'
                                                }}>
                                                    {t.status.toUpperCase()}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : null}
            </Modal>

            <div className="glass" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', padding: '0.5rem' }}>
                    <div className="glass" style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.5rem 1rem',
                        gap: '0.75rem',
                        borderRadius: '10px'
                    }}>
                        <Search size={18} color="var(--text-secondary)" />
                        <input
                            type="text"
                            placeholder="Search tenants..."
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'white',
                                outline: 'none',
                                width: '100%'
                            }}
                        />
                    </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--panel-border)' }}>
                            <th style={{ padding: '1rem' }}>Name</th>
                            <th style={{ padding: '1rem' }}>Contact</th>
                            <th style={{ padding: '1rem' }}>Unit</th>
                            <th style={{ padding: '1rem' }}>Status</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Loading tenants...</td></tr>
                        ) : tenants.length === 0 ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No tenants found.</td></tr>
                        ) : tenants.map((tenant) => (
                            <tr key={tenant.id} style={{ borderBottom: '1px solid var(--panel-border)', transition: 'background 0.2s' }} className="table-row-hover">
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '8px',
                                            background: 'var(--accent-glow)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'var(--accent-color)',
                                            fontWeight: 600
                                        }}>
                                            {tenant.full_name.charAt(0)}
                                        </div>
                                        <span>{tenant.full_name}</span>
                                    </div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Mail size={14} color="var(--text-secondary)" />
                                            <span>{tenant.email}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Phone size={14} color="var(--text-secondary)" />
                                            <span>{tenant.phone}</span>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    {tenant.preferred_unit_id
                                        ? units.find(u => u.id === tenant.preferred_unit_id)?.name || 'Unknown Unit'
                                        : 'Not Assigned'}
                                </td>

                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '20px',
                                        fontSize: '0.75rem',
                                        background: 'rgba(16, 185, 129, 0.1)',
                                        color: 'var(--success-color)'
                                    }}>
                                        Active
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                        <button
                                            onClick={() => openStatement(tenant.id)}
                                            style={{ background: 'transparent', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
                                        >
                                            <FileText size={16} />
                                            Statement
                                        </button>
                                        <button
                                            onClick={() => openEditModal(tenant)}
                                            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(tenant.id)}
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

export default Tenants;
