import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, FileText, Calendar } from 'lucide-react';
import { leasesApi, tenantsApi, unitsApi } from '../api';
import Modal from '../components/Modal';
import { formatDate } from '../utils/dateUtils';

const asArray = (x) => (Array.isArray(x) ? x : []);
const BLANK = { tenant_id: '', unit_id: '', start_date: '', end_date: '', rent_amount: '', currency: 'USD', payment_frequency_months: '1', deposit_amount: '0', rent_changes: [] };

const freqLabel = { '1': 'Monthly', '3': 'Quarterly', '6': 'Biannually', '12': 'Yearly' };

const Leases = () => {
    const [leases, setLeases]       = useState([]);
    const [tenants, setTenants]     = useState([]);
    const [units, setUnits]         = useState([]);
    const [loading, setLoading]     = useState(true);
    const [optLoading, setOptLoad]  = useState(false);
    const [isModalOpen, setModal]   = useState(false);
    const [editingLease, setEditing] = useState(null);
    const [formData, setFormData]   = useState(BLANK);
    const [submitting, setSubmitting] = useState(false);

    const fetchLeases = async () => {
        setLoading(true);
        try { setLeases(asArray((await leasesApi.getAll())?.data)); }
        catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchOptions = async () => {
        setOptLoad(true);
        try {
            const [tR, uR] = await Promise.all([tenantsApi.getAll(), unitsApi.getAll()]);
            setTenants(asArray(tR?.data)); setUnits(asArray(uR?.data));
        } finally { setOptLoad(false); }
    };

    useEffect(() => { fetchLeases(); fetchOptions(); }, []);

    const openCreate = () => { setEditing(null); setFormData({ ...BLANK, rent_changes: [] }); setModal(true); };
    const openEdit   = (l) => {
        setEditing(l);
        setFormData({
            tenant_id: String(l.tenant_id), unit_id: String(l.unit_id),
            start_date: l.start_date, end_date: l.end_date,
            rent_amount: String(l.rent_amount), currency: l.currency || 'USD',
            payment_frequency_months: String(l.payment_frequency_months),
            deposit_amount: String(l.deposit_amount || 0),
            rent_changes: asArray(l.rent_changes).map(rc => ({ effective_date: rc.effective_date, amount: String(rc.amount) })),
        });
        setModal(true);
    };

    const addRentChange    = () => setFormData(f => ({ ...f, rent_changes: [...asArray(f.rent_changes), { effective_date: '', amount: '' }] }));
    const updateRentChange = (i, key, val) => setFormData(f => { const rc = [...asArray(f.rent_changes)]; rc[i] = { ...rc[i], [key]: val }; return { ...f, rent_changes: rc }; });
    const removeRentChange = (i) => setFormData(f => ({ ...f, rent_changes: asArray(f.rent_changes).filter((_, idx) => idx !== i) }));

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this lease? All associated payment schedules will also be removed.')) return;
        try { await leasesApi.delete(id); fetchLeases(); }
        catch (err) { alert(err.response?.data?.detail || 'Failed to delete lease.'); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                tenant_id: Number(formData.tenant_id), unit_id: Number(formData.unit_id),
                start_date: formData.start_date, end_date: formData.end_date,
                rent_amount: Number(formData.rent_amount), currency: formData.currency || 'USD',
                payment_frequency_months: Number(formData.payment_frequency_months),
                deposit_amount: Number(formData.deposit_amount || 0),
                rent_changes: asArray(formData.rent_changes)
                    .filter(rc => rc.effective_date && rc.amount !== '' && !isNaN(Number(rc.amount)))
                    .map(rc => ({ effective_date: rc.effective_date, amount: Number(rc.amount) })),
            };
            if (editingLease) await leasesApi.update(editingLease.id, payload);
            else await leasesApi.create(payload);
            setModal(false);
            setEditing(null);
            fetchLeases();
        } catch (err) {
            alert(err.response?.data?.detail || 'Failed to save lease.');
        } finally { setSubmitting(false); }
    };

    const field = (k) => (e) => setFormData({ ...formData, [k]: e.target.value });
    const tenantName = (id) => tenants.find(t => t.id === id)?.full_name || '—';
    const unitLabel  = (id) => { const u = units.find(u => u.id === id); return u ? `${u.name} (${u.unit_code})` : '—'; };

    const statusBadge = (l) => {
        const now = new Date();
        const end = new Date(l.end_date);
        const start = new Date(l.start_date);
        if (now < start) return <span className="badge badge-yellow">Upcoming</span>;
        if (now > end)   return <span className="badge badge-red">Expired</span>;
        return <span className="badge badge-green">Active</span>;
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Lease Agreements</h1>
                    <p className="page-subtitle">Manage active leases between tenants and units</p>
                </div>
                <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> New Lease</button>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setModal(false)} title={editingLease ? 'Edit Lease' : 'New Lease'}>
                <form className="form-stack" onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Tenant</label>
                            <select required className="form-select" value={formData.tenant_id} onChange={field('tenant_id')} disabled={optLoading}>
                                <option value="">{optLoading ? 'Loading…' : 'Select tenant'}</option>
                                {tenants.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Unit</label>
                            <select required className="form-select" value={formData.unit_id} onChange={field('unit_id')} disabled={optLoading}>
                                <option value="">{optLoading ? 'Loading…' : 'Select unit'}</option>
                                {units.map(u => <option key={u.id} value={u.id}>{u.name} ({u.unit_code})</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Start Date</label>
                            <input type="date" required className="form-input" value={formData.start_date} onChange={field('start_date')} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">End Date</label>
                            <input type="date" required className="form-input" value={formData.end_date} onChange={field('end_date')} />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Rent Amount</label>
                            <input type="number" required min="0" step="0.01" className="form-input" placeholder="0.00" value={formData.rent_amount} onChange={field('rent_amount')} />
                        </div>
                        <div className="form-group" style={{ maxWidth: 100 }}>
                            <label className="form-label">Currency</label>
                            <input type="text" maxLength={5} className="form-input" value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })} />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Payment Frequency</label>
                            <select className="form-select" value={formData.payment_frequency_months} onChange={field('payment_frequency_months')}>
                                <option value="1">Monthly</option>
                                <option value="3">Quarterly</option>
                                <option value="6">Biannually</option>
                                <option value="12">Yearly</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Deposit Amount</label>
                            <input type="number" min="0" step="0.01" className="form-input" value={formData.deposit_amount} onChange={field('deposit_amount')} />
                        </div>
                    </div>

                    {/* Rent increases (escalation) */}
                    <div className="form-group">
                        <div className="flex-center" style={{ justifyContent: 'space-between' }}>
                            <label className="form-label" style={{ marginBottom: 0 }}>Scheduled Rent Increases (optional)</label>
                            <button type="button" className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={addRentChange}>
                                <Plus size={13} /> Add
                            </button>
                        </div>
                        <p className="text-muted fs-xs" style={{ marginTop: 2 }}>
                            From each date, rent becomes the new amount. Future unpaid schedules update automatically.
                        </p>
                        {asArray(formData.rent_changes).map((rc, i) => (
                            <div key={i} className="form-row" style={{ marginTop: 8, alignItems: 'center' }}>
                                <input type="date" className="form-input" value={rc.effective_date} onChange={(e) => updateRentChange(i, 'effective_date', e.target.value)} />
                                <input type="number" min="0" step="0.01" className="form-input" placeholder="New rent" value={rc.amount} onChange={(e) => updateRentChange(i, 'amount', e.target.value)} />
                                <button type="button" className="btn btn-ghost btn-icon" style={{ flex: '0 0 auto', color: 'var(--red)' }} onClick={() => removeRentChange(i)} title="Remove">
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg w-full" disabled={submitting}>
                        {submitting ? 'Saving…' : editingLease ? 'Update Lease' : 'Create Lease'}
                    </button>
                </form>
            </Modal>

            <div className="table-wrap">
                <div className="table-title-row">
                    <div className="flex-center gap-8">
                        <FileText size={17} style={{ color: 'var(--accent-hover)' }} />
                        <h3>All Leases</h3>
                    </div>
                    <span className="badge badge-neutral">{leases.length} total</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="table" style={{ minWidth: 720 }}>
                        <thead>
                            <tr>
                                <th>Tenant</th>
                                <th>Unit</th>
                                <th>Period</th>
                                <th>Rent</th>
                                <th>Frequency</th>
                                <th>Status</th>
                                <th>Schedules</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="8" className="table-loading">Loading leases…</td></tr>
                            ) : leases.length === 0 ? (
                                <tr><td colSpan="8" className="table-empty">No leases yet. Create your first lease agreement.</td></tr>
                            ) : leases.map((l) => (
                                <tr key={l.id}>
                                    <td><span className="fw-600 fs-sm">{tenantName(l.tenant_id)}</span></td>
                                    <td className="text-2 fs-sm">{unitLabel(l.unit_id)}</td>
                                    <td>
                                        <div className="flex-center gap-6 fs-sm text-2">
                                            <Calendar size={12} />
                                            <span>{formatDate(l.start_date)} → {formatDate(l.end_date)}</span>
                                        </div>
                                    </td>
                                    <td><span className="fw-600">{l.rent_amount}</span> <span className="text-muted fs-xs">{l.currency}</span></td>
                                    <td className="text-2 fs-sm">{freqLabel[String(l.payment_frequency_months)] || `Every ${l.payment_frequency_months}mo`}</td>
                                    <td>{statusBadge(l)}</td>
                                    <td className="text-2 fs-sm">{l.payment_schedules?.length ?? 0}</td>
                                    <td>
                                        <div className="flex-center gap-4">
                                            <button className="btn btn-ghost btn-icon" title="Edit" onClick={() => openEdit(l)}><Edit2 size={15} /></button>
                                            <button className="btn btn-ghost btn-icon" title="Delete" onClick={() => handleDelete(l.id)} style={{ color: 'var(--red)' }}><Trash2 size={15} /></button>
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
