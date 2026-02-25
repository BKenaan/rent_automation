import React, { useState, useEffect } from 'react';
import { CreditCard, Download, Filter, CheckCircle, Clock, PlusCircle } from 'lucide-react';
import { paymentsApi } from '../api';
import Modal from '../components/Modal';
import { formatDate } from '../utils/dateUtils';

const Payments = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterTenant, setFilterTenant] = useState('');

    // Recording Modal State
    const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
    const [recordingPayment, setRecordingPayment] = useState(null);
    const [recordData, setRecordData] = useState({
        payment_method: 'Bank Transfer',
        reference: '',
        notes: '',
        paid_at: new Date().toISOString().split('T')[0]
    });
    const [submitting, setSubmitting] = useState(false);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const res = await paymentsApi.getAll();
            setPayments(res.data);
        } catch (err) {
            console.error("Error fetching payments:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    const openRecordModal = (payment) => {
        setRecordingPayment(payment);
        setRecordData({
            payment_method: 'Bank Transfer',
            reference: '',
            notes: '',
            paid_at: new Date().toISOString().split('T')[0]
        });
        setIsRecordModalOpen(true);
    };

    const handleRecordSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await paymentsApi.record(recordingPayment.id, recordData);
            setIsRecordModalOpen(false);
            fetchPayments();
        } catch (err) {
            console.error("Error recording payment:", err);
            alert("Failed to record payment. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const filteredPayments = filterTenant
        ? payments.filter(p => p.lease?.tenant?.full_name === filterTenant)
        : payments;

    const tenants = [...new Set(payments.map(p => p.lease?.tenant?.full_name).filter(Boolean))];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1>Payment Tracking</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Monitor and record transactions across all leases.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn" style={{ background: 'var(--panel-bg)', color: 'white', border: '1px solid var(--panel-border)' }}>
                        <Download size={20} />
                        Export
                    </button>
                    <button className="btn btn-primary" onClick={() => alert("Please use 'Record' button next to a pending payment below.")}>
                        <CreditCard size={20} />
                        Bulk Record
                    </button>
                </div>
            </div>

            <div className="glass" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3>Transaction History</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
                            <Filter size={16} color="var(--text-secondary)" />
                            <select
                                value={filterTenant}
                                onChange={(e) => setFilterTenant(e.target.value)}
                                style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', cursor: 'pointer' }}
                            >
                                <option value="" style={{ color: 'black' }}>All Tenants</option>
                                {tenants.map(name => (
                                    <option key={name} value={name} style={{ color: 'black' }}>{name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--panel-border)' }}>
                            <th style={{ padding: '1rem' }}>Tenant</th>
                            <th style={{ padding: '1rem' }}>Unit</th>
                            <th style={{ padding: '1rem' }}>Date</th>
                            <th style={{ padding: '1rem' }}>Amount</th>
                            <th style={{ padding: '1rem' }}>Status</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading payments...</td></tr>
                        ) : filteredPayments.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No payment records found.</td></tr>
                        ) : filteredPayments.map((payment) => (
                            <tr key={payment.id} style={{ borderBottom: '1px solid var(--panel-border)' }} className="table-row-hover">
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ fontWeight: 500 }}>{payment.lease?.tenant?.full_name || 'Unknown'}</div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ fontSize: '0.9rem' }}>{payment.lease?.unit?.name || '-'}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{payment.lease?.unit?.unit_code}</div>
                                </td>
                                <td style={{ padding: '1rem' }}>{formatDate(payment.paid_at || payment.due_date)}</td>
                                <td style={{ padding: '1rem', fontWeight: 600 }}>
                                    {payment.amount} {payment.currency || 'USD'}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        color: payment.status === 'paid' ? 'var(--success-color)' :
                                            payment.status === 'overdue' ? 'var(--error-color)' : 'var(--warning-color)',
                                        fontSize: '0.85rem'
                                    }}>
                                        {payment.status === 'paid' ? <CheckCircle size={14} /> : <Clock size={14} />}
                                        <span style={{ textTransform: 'capitalize' }}>{payment.status}</span>
                                    </div>
                                    {payment.status === 'paid' && (
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                                            via {payment.payment_method}
                                        </div>
                                    )}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    {payment.status !== 'paid' && (
                                        <button
                                            className="btn btn-primary"
                                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                                            onClick={() => openRecordModal(payment)}
                                        >
                                            <PlusCircle size={14} />
                                            Record
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal
                isOpen={isRecordModalOpen}
                onClose={() => setIsRecordModalOpen(false)}
                title="Record Received Payment"
            >
                {recordingPayment && (
                    <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Tenant</span>
                            <span style={{ fontWeight: 600 }}>{recordingPayment.lease?.tenant?.full_name}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Amount Due</span>
                            <span style={{ fontWeight: 600, color: 'var(--accent-color)' }}>{recordingPayment.amount} {recordingPayment.currency || 'USD'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Due Date</span>
                            <span>{formatDate(recordingPayment.due_date)}</span>
                        </div>
                    </div>
                )}

                <form onSubmit={handleRecordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Payment Method</label>
                        <select
                            required
                            className="glass"
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--panel-border)', color: 'white', background: 'rgba(255, 255, 255, 0.05)' }}
                            value={recordData.payment_method}
                            onChange={(e) => setRecordData({ ...recordData, payment_method: e.target.value })}
                        >
                            <option value="Bank Transfer" style={{ color: 'black' }}>Bank Transfer</option>
                            <option value="Cash" style={{ color: 'black' }}>Cash</option>
                            <option value="Check" style={{ color: 'black' }}>Check</option>
                            <option value="Credit Card" style={{ color: 'black' }}>Credit Card</option>
                            <option value="Other" style={{ color: 'black' }}>Other</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Payment Date</label>
                        <input
                            type="date"
                            required
                            className="glass"
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--panel-border)', color: 'white', background: 'rgba(255, 255, 255, 0.05)' }}
                            value={recordData.paid_at}
                            onChange={(e) => setRecordData({ ...recordData, paid_at: e.target.value })}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Reference # (Optional)</label>
                        <input
                            type="text"
                            placeholder="Transaction ID, Receipt #, etc."
                            className="glass"
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--panel-border)', color: 'white', background: 'rgba(255, 255, 255, 0.05)' }}
                            value={recordData.reference}
                            onChange={(e) => setRecordData({ ...recordData, reference: e.target.value })}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Notes</label>
                        <textarea
                            className="glass"
                            placeholder="Add internal notes..."
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--panel-border)', color: 'white', background: 'rgba(255, 255, 255, 0.05)', minHeight: '80px', resize: 'vertical' }}
                            value={recordData.notes}
                            onChange={(e) => setRecordData({ ...recordData, notes: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={submitting}
                        style={{ marginTop: '0.5rem', justifyContent: 'center' }}
                    >
                        {submitting ? 'Recording...' : 'Record Payment'}
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default Payments;
