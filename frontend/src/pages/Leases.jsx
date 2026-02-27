import React, { useState, useEffect } from 'react';
import { Calendar, FileText, Plus, DollarSign } from 'lucide-react';
import { leasesApi, tenantsApi, unitsApi } from '../api';
import Modal from '../components/Modal';
import { formatDate } from '../utils/dateUtils';

const Leases = () => {
    const [leases, setLeases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        tenant_id: '',
        unit_id: '',
        start_date: '',
        end_date: '',
        rent_amount: '',
        currency: 'USD',
        payment_frequency_months: '1',
        deposit_amount: '0',
    });
    const [submitting, setSubmitting] = useState(false);
    const [tenants, setTenants] = useState([]);
    const [units, setUnits] = useState([]);
    const [optionsLoading, setOptionsLoading] = useState(false);

    const [editingLease, setEditingLease] = useState(null);

    const asArray = (x) => (Array.isArray(x) ? x : []);

    const fetchLeases = async () => {
        setLoading(true);
        try {
            const res = await leasesApi.getAll();
            setLeases(asArray(res?.data));
        } catch (err) {
            console.error('Error fetching leases:', err);
            setLeases([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchOptions = async () => {
        setOptionsLoading(true);
        try {
            const [tenantsRes, unitsRes] = await Promise.all([
                tenantsApi.getAll(),
                unitsApi.getAll(),
            ]);
            setTenants(asArray(tenantsRes?.data));
            setUnits(asArray(unitsRes?.data));
        } catch (err) {
            console.error('Error fetching tenants/units:', err);
            setTenants([]);
            setUnits([]);
        } finally {
            setOptionsLoading(false);
        }
    };

    useEffect(() => {
        fetchLeases();
        fetchOptions();
    }, []);

    const handleEdit = (lease) => {
        setEditingLease(lease);
        setFormData({
            tenant_id: lease.tenant_id.toString(),
            unit_id: lease.unit_id.toString(),
            start_date: lease.start_date,
            end_date: lease.end_date,
            rent_amount: lease.rent_amount.toString(),
            currency: lease.currency || 'USD',
            payment_frequency_months: lease.payment_frequency_months.toString(),
            deposit_amount: (lease.deposit_amount || 0).toString(),
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this lease agreement? This will also remove all associated payment schedules.')) return;
        try {
            await leasesApi.delete(id);
            fetchLeases();
        } catch (err) {
            console.error('Error deleting lease:', err);
            alert('Failed to delete lease.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                tenant_id: Number(formData.tenant_id),
                unit_id: Number(formData.unit_id),
                start_date: formData.start_date,
                end_date: formData.end_date,
                rent_amount: Number(formData.rent_amount),
                currency: formData.currency || 'USD',
                payment_frequency_months: Number(formData.payment_frequency_months),
                deposit_amount: Number(formData.deposit_amount || 0),
            };

            if (editingLease) {
                await leasesApi.update(editingLease.id, payload);
            } else {
                await leasesApi.create(payload);
            }

            setIsModalOpen(false);
            setEditingLease(null);
            setFormData({
                tenant_id: '',
                unit_id: '',
                start_date: '',
                end_date: '',
                rent_amount: '',
                currency: 'USD',
                payment_frequency_months: '1',
                deposit_amount: '0',
            });
            fetchLeases();
        } catch (err) {
            console.error('Error saving lease:', err);
            alert('Failed to save lease. Please check the inputs.');
        } finally {
            setSubmitting(false);
        }
    };

    const getTenantName = (tenantId) => {
        const tenant = tenants.find((t) => t.id === tenantId);
        return tenant ? tenant.full_name : 'Unknown tenant';
    };

    const getUnitLabel = (unitId) => {
        const unit = units.find((u) => u.id === unitId);
        return unit ? `${unit.name} (${unit.unit_code})` : 'Unknown unit';
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1>Lease Agreements</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Manage active leases between tenants and units.</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        setEditingLease(null);
                        setFormData({
                            tenant_id: '',
                            unit_id: '',
                            start_date: '',
                            end_date: '',
                            rent_amount: '',
                            currency: 'USD',
                            payment_frequency_months: '1',
                            deposit_amount: '0',
                        });
                        setIsModalOpen(true);
                    }}
                >
                    <Plus size={20} />
                    New Lease
                </button>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingLease ? "Edit Lease Agreement" : "Create New Lease"}
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Tenant</label>
                            <select
                                required
                                className="glass"
                                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--panel-border)', color: 'white', background: 'rgba(255, 255, 255, 0.05)' }}
                                value={formData.tenant_id}
                                onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
                                disabled={optionsLoading}
                            >
                                <option value="" style={{ color: 'black' }}>
                                    {optionsLoading ? 'Loading tenants...' : 'Select tenant'}
                                </option>
                                {tenants.map((t) => (
                                    <option key={t.id} value={t.id} style={{ color: 'black' }}>
                                        {t.full_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Unit</label>
                            <select
                                required
                                className="glass"
                                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--panel-border)', color: 'white', background: 'rgba(255, 255, 255, 0.05)' }}
                                value={formData.unit_id}
                                onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                                disabled={optionsLoading}
                            >
                                <option value="" style={{ color: 'black' }}>
                                    {optionsLoading ? 'Loading units...' : 'Select unit'}
                                </option>
                                {units.map((u) => (
                                    <option key={u.id} value={u.id} style={{ color: 'black' }}>
                                        {u.name} ({u.unit_code})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Start Date</label>
                            <input
                                type="date"
                                required
                                className="glass"
                                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--panel-border)', color: 'white', background: 'rgba(255, 255, 255, 0.05)' }}
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                            />
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>End Date</label>
                            <input
                                type="date"
                                required
                                className="glass"
                                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--panel-border)', color: 'white', background: 'rgba(255, 255, 255, 0.05)' }}
                                value={formData.end_date}
                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Rent Amount</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{
                                    padding: '0.5rem',
                                    borderRadius: '8px',
                                    background: 'var(--accent-glow)',
                                    color: 'var(--accent-color)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <DollarSign size={18} />
                                </div>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    className="glass"
                                    style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--panel-border)', color: 'white', background: 'rgba(255, 255, 255, 0.05)' }}
                                    value={formData.rent_amount}
                                    onChange={(e) => setFormData({ ...formData, rent_amount: e.target.value })}
                                />
                            </div>
                        </div>
                        <div style={{ width: '140px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Currency</label>
                            <input
                                type="text"
                                className="glass"
                                maxLength={5}
                                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--panel-border)', color: 'white', background: 'rgba(255, 255, 255, 0.05)' }}
                                value={formData.currency}
                                onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Payment Frequency</label>
                            <select
                                className="glass"
                                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--panel-border)', color: 'white', background: 'rgba(255, 255, 255, 0.05)' }}
                                value={formData.payment_frequency_months}
                                onChange={(e) => setFormData({ ...formData, payment_frequency_months: e.target.value })}
                            >
                                <option value="1" style={{ color: 'black' }}>Monthly</option>
                                <option value="3" style={{ color: 'black' }}>Quarterly</option>
                                <option value="6" style={{ color: 'black' }}>Biannually</option>
                                <option value="12" style={{ color: 'black' }}>Yearly</option>
                            </select>
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Deposit Amount</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="glass"
                                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--panel-border)', color: 'white', background: 'rgba(255, 255, 255, 0.05)' }}
                                value={formData.deposit_amount}
                                onChange={(e) => setFormData({ ...formData, deposit_amount: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={submitting}
                        style={{ marginTop: '0.5rem', justifyContent: 'center' }}
                    >
                        {submitting ? 'Saving...' : (editingLease ? 'Update Lease' : 'Create Lease')}
                    </button>
                </form>
            </Modal>

            <div className="glass" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <div style={{
                        padding: '0.5rem',
                        borderRadius: '10px',
                        background: 'var(--accent-glow)',
                        color: 'var(--accent-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <FileText size={20} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0 }}>Active Leases</h3>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            Overview of current agreements and rent schedules.
                        </p>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                        <thead>
                            <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--panel-border)' }}>
                                <th style={{ padding: '1rem' }}>Tenant</th>
                                <th style={{ padding: '1rem' }}>Unit</th>
                                <th style={{ padding: '1rem' }}>Period</th>
                                <th style={{ padding: '1rem' }}>Rent</th>
                                <th style={{ padding: '1rem' }}>Frequency</th>
                                <th style={{ padding: '1rem' }}>Schedules</th>
                                <th style={{ padding: '1rem' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Loading leases...</td></tr>
                            ) : leases.length === 0 ? (
                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No leases found.</td></tr>
                            ) : leases.map((lease) => (
                                <tr key={lease.id} style={{ borderBottom: '1px solid var(--panel-border)' }}>
                                    <td style={{ padding: '1rem' }}>{getTenantName(lease.tenant_id)}</td>
                                    <td style={{ padding: '1rem' }}>{getUnitLabel(lease.unit_id)}</td>
                                    <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Calendar size={14} />
                                            <span>
                                                {formatDate(lease.start_date)} → {formatDate(lease.end_date)}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', fontWeight: 600 }}>
                                        {lease.rent_amount} {lease.currency}
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                                        Every {lease.payment_frequency_months} month(s)
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                        {lease.payment_schedules ? lease.payment_schedules.length : 0}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                className="btn glass"
                                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                                onClick={() => handleEdit(lease)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="btn glass"
                                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', color: 'var(--error-color)' }}
                                                onClick={() => handleDelete(lease.id)}
                                            >
                                                Delete
                                            </button>
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

export default Leases;

