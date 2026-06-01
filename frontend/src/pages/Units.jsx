import React, { useState, useEffect } from 'react';
import { Plus, MapPin, Edit2, Trash2, Building2 } from 'lucide-react';
import { unitsApi } from '../api';
import Modal from '../components/Modal';

const asArray = (x) => (Array.isArray(x) ? x : []);

const BLANK = { name: '', address: '', unit_code: '', type: 'apartment', purchase_price: '', target_yield: '', notes: '' };

const Units = () => {
    const [units, setUnits]         = useState([]);
    const [loading, setLoading]     = useState(true);
    const [isModalOpen, setModal]   = useState(false);
    const [editingUnit, setEditing] = useState(null);
    const [formData, setFormData]   = useState(BLANK);
    const [submitting, setSubmitting] = useState(false);

    const fetchUnits = async () => {
        setLoading(true);
        try { setUnits(asArray((await unitsApi.getAll())?.data)); }
        catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchUnits(); }, []);

    const openCreate = () => { setEditing(null); setFormData(BLANK); setModal(true); };
    const openEdit   = (u) => {
        setEditing(u);
        setFormData({ name: u.name, address: u.address, unit_code: u.unit_code, type: u.type, purchase_price: u.purchase_price || '', target_yield: u.target_yield || '', notes: u.notes || '' });
        setModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this unit? This will also remove all associated leases and payments.')) return;
        try { await unitsApi.delete(id); fetchUnits(); }
        catch (err) { alert(err.response?.data?.detail || 'Failed to delete unit.'); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = { ...formData, purchase_price: formData.purchase_price ? Number(formData.purchase_price) : null, target_yield: formData.target_yield ? Number(formData.target_yield) : null };
            if (editingUnit) await unitsApi.update(editingUnit.id, payload);
            else await unitsApi.create(payload);
            setModal(false);
            fetchUnits();
        } catch (err) {
            alert(err.response?.data?.detail || 'Failed to save unit. Check that Unit Code is unique.');
        } finally {
            setSubmitting(false);
        }
    };

    const field = (k) => (e) => setFormData({ ...formData, [k]: e.target.value });

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Units & Properties</h1>
                    <p className="page-subtitle">Manage your real estate portfolio</p>
                </div>
                <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add Unit</button>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setModal(false)} title={editingUnit ? 'Edit Unit' : 'Add Unit'}>
                <form className="form-stack" onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Unit Name</label>
                            <input type="text" required className="form-input" placeholder="Apartment 101" value={formData.name} onChange={field('name')} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Unit Code</label>
                            <input type="text" required className="form-input" placeholder="A101" value={formData.unit_code} onChange={field('unit_code')} />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Type</label>
                            <select className="form-select" value={formData.type} onChange={field('type')}>
                                <option value="apartment">Apartment</option>
                                <option value="shop">Shop</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Purchase Price ($)</label>
                            <input type="number" step="0.01" className="form-input" placeholder="0.00" value={formData.purchase_price} onChange={field('purchase_price')} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Target Yield (%)</label>
                            <input type="number" step="0.1" className="form-input" placeholder="5.0" value={formData.target_yield} onChange={field('target_yield')} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Address</label>
                        <input type="text" required className="form-input" placeholder="123 Main St, City" value={formData.address} onChange={field('address')} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Notes</label>
                        <textarea className="form-textarea" value={formData.notes} onChange={field('notes')} placeholder="Additional notes…" />
                    </div>
                    <button type="submit" className="btn btn-primary btn-lg w-full" disabled={submitting}>
                        {submitting ? 'Saving…' : editingUnit ? 'Update Unit' : 'Create Unit'}
                    </button>
                </form>
            </Modal>

            {loading ? (
                <div className="table-loading">Loading portfolio…</div>
            ) : units.length === 0 ? (
                <div className="empty-state">
                    <Building2 size={40} />
                    <span>No units yet. Click <strong>Add Unit</strong> to get started.</span>
                </div>
            ) : (
                <div className="grid-3">
                    {units.map((u) => (
                        <div key={u.id} className="unit-card">
                            <div className="unit-card-header">
                                <div className="unit-icon"><Building2 size={20} /></div>
                                <div className="unit-actions">
                                    <button className="btn btn-ghost btn-icon" title="Edit" onClick={() => openEdit(u)}><Edit2 size={15} /></button>
                                    <button className="btn btn-ghost btn-icon" title="Delete" onClick={() => handleDelete(u.id)} style={{ color: 'var(--red)' }}><Trash2 size={15} /></button>
                                </div>
                            </div>

                            <div>
                                <div className="fw-600" style={{ marginBottom: 4 }}>{u.name}</div>
                                <div className="flex-center gap-6 fs-sm text-muted">
                                    <MapPin size={12} style={{ flexShrink: 0 }} />
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.address}</span>
                                </div>
                            </div>

                            <div className="sep" />

                            <div className="unit-stats">
                                <div className="unit-stat">
                                    <span className="unit-stat-label">Investment</span>
                                    <span className="unit-stat-value">{u.purchase_price ? `$${Number(u.purchase_price).toLocaleString()}` : '—'}</span>
                                </div>
                                <div className="unit-stat">
                                    <span className="unit-stat-label">Target Yield</span>
                                    <span className={`unit-stat-value ${u.target_yield ? 'text-green' : ''}`}>{u.target_yield ? `${u.target_yield}%` : '—'}</span>
                                </div>
                                <div className="unit-stat">
                                    <span className="unit-stat-label">Code</span>
                                    <span className="badge badge-neutral">{u.unit_code}</span>
                                </div>
                                <div className="unit-stat">
                                    <span className="unit-stat-label">Type</span>
                                    <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>{u.type}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Units;
