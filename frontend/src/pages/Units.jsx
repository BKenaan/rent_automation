import React, { useState, useEffect } from 'react';
import { Home, Plus, MapPin, Edit2, Trash2, TrendingUp, DollarSign } from 'lucide-react';
import { unitsApi } from '../api';
import Modal from '../components/Modal';

const Units = () => {
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        unit_code: '',
        type: 'apartment',
        purchase_price: '',
        target_yield: '',
        notes: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const asArray = (x) => (Array.isArray(x) ? x : []);

    const fetchUnits = async () => {
        setLoading(true);
        try {
            const res = await unitsApi.getAll();
            setUnits(asArray(res?.data));
        } catch (err) {
            console.error("Error fetching units:", err);
            setUnits([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUnits();
    }, []);

    const openCreateModal = () => {
        setEditingUnit(null);
        setFormData({
            name: '',
            address: '',
            unit_code: '',
            type: 'apartment',
            purchase_price: '',
            target_yield: '',
            notes: ''
        });
        setIsModalOpen(true);
    };

    const openEditModal = (unit) => {
        setEditingUnit(unit);
        setFormData({
            name: unit.name,
            address: unit.address,
            unit_code: unit.unit_code,
            type: unit.type,
            purchase_price: unit.purchase_price || '',
            target_yield: unit.target_yield || '',
            notes: unit.notes || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this unit? This will also remove all associated leases and payments.")) return;
        try {
            await unitsApi.delete(id);
            fetchUnits();
        } catch (err) {
            console.error("Error deleting unit:", err);
            alert("Failed to delete unit.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                purchase_price: formData.purchase_price ? Number(formData.purchase_price) : null,
                target_yield: formData.target_yield ? Number(formData.target_yield) : null,
            };

            if (editingUnit) {
                await unitsApi.update(editingUnit.id, payload);
            } else {
                await unitsApi.create(payload);
            }

            setIsModalOpen(false);
            fetchUnits();
        } catch (err) {
            console.error("Error saving unit:", err.response?.data || err);
            const detail = err.response?.data?.detail || "Check if Unit Code is unique or data is valid.";
            alert(`Failed to save unit: ${detail}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1>Units & Properties</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Overview of all your managed real estate assets.</p>
                </div>
                <button className="btn btn-primary" onClick={openCreateModal}>
                    <Plus size={20} />
                    Add Unit
                </button>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingUnit ? "Edit Unit" : "Add New Unit"}
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Unit Name</label>
                            <input
                                type="text"
                                required
                                className="glass"
                                placeholder="e.g. Apartment 101"
                                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--panel-border)', color: 'white', background: 'rgba(255, 255, 255, 0.05)' }}
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Unit Code</label>
                            <input
                                type="text"
                                required
                                className="glass"
                                placeholder="e.g. A101"
                                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--panel-border)', color: 'white', background: 'rgba(255, 255, 255, 0.05)' }}
                                value={formData.unit_code}
                                onChange={(e) => setFormData({ ...formData, unit_code: e.target.value })}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Type</label>
                            <select
                                className="glass"
                                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--panel-border)', color: 'white', background: 'rgba(255, 255, 255, 0.05)' }}
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option value="apartment" style={{ color: 'black' }}>Apartment</option>
                                <option value="shop" style={{ color: 'black' }}>Shop</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Purchase Price ($)</label>
                            <input
                                type="number"
                                step="0.01"
                                className="glass"
                                placeholder="0.00"
                                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--panel-border)', color: 'white', background: 'rgba(255, 255, 255, 0.05)' }}
                                value={formData.purchase_price}
                                onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Target Yield (%)</label>
                            <input
                                type="number"
                                step="0.1"
                                className="glass"
                                placeholder="5.0"
                                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--panel-border)', color: 'white', background: 'rgba(255, 255, 255, 0.05)' }}
                                value={formData.target_yield}
                                onChange={(e) => setFormData({ ...formData, target_yield: e.target.value })}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Address</label>
                        <input
                            type="text"
                            required
                            className="glass"
                            placeholder="Full address"
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--panel-border)', color: 'white', background: 'rgba(255, 255, 255, 0.05)' }}
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Notes</label>
                        <textarea
                            className="glass"
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--panel-border)', color: 'white', background: 'rgba(255, 255, 255, 0.05)', minHeight: '80px', resize: 'vertical' }}
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
                        {submitting ? 'Saving...' : editingUnit ? 'Update Unit' : 'Create Unit'}
                    </button>
                </form>
            </Modal>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>Loading portfolio...</div>
            ) : (
                <div className="grid grid-cols-3">
                    {units.length === 0 ? (
                        <div className="glass" style={{ gridColumn: 'span 3', padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            No assets found. Click "Add Unit" to get started.
                        </div>
                    ) : units.map((unit) => (
                        <div key={unit.id} className="glass glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div style={{
                                    padding: '0.75rem',
                                    borderRadius: '12px',
                                    background: 'var(--accent-glow)',
                                    color: 'var(--accent-color)'
                                }}>
                                    <Home size={24} />
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => openEditModal(unit)}
                                        style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(unit.id)}
                                        style={{ background: 'transparent', border: 'none', color: 'var(--error-color)', cursor: 'pointer' }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <h3 style={{ margin: '0.5rem 0' }}>{unit.name}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                                <MapPin size={14} />
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{unit.address}</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: 'auto' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Investment</span>
                                    <span style={{ fontWeight: 600 }}>{unit.purchase_price ? `$${unit.purchase_price.toLocaleString()}` : 'N/A'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Target Yield</span>
                                    <span style={{ fontWeight: 600, color: 'var(--success-color)' }}>{unit.target_yield ? `${unit.target_yield}%` : 'N/A'}</span>
                                </div>

                                <div style={{ borderTop: '1px solid var(--panel-border)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{unit.unit_code}</span>
                                    <span style={{
                                        padding: '0.2rem 0.6rem',
                                        borderRadius: '4px',
                                        fontSize: '0.7rem',
                                        background: 'rgba(16, 185, 129, 0.1)',
                                        color: 'var(--success-color)',
                                        textTransform: 'uppercase'
                                    }}>
                                        {unit.type}
                                    </span>
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
