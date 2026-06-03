import React, { useState, useEffect } from 'react';
import { CreditCard, Filter, CheckCircle, Clock, AlertCircle, PlusCircle, RotateCcw } from 'lucide-react';
import { paymentsApi } from '../api';
import Modal from '../components/Modal';
import { formatDate } from '../utils/dateUtils';

const asArray = (x) => (Array.isArray(x) ? x : []);
const fmt = (v, cur) => `${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cur || 'USD'}`;

const StatusBadge = ({ status }) => {
    const map = { paid: ['badge-green', CheckCircle], overdue: ['badge-red', AlertCircle], pending: ['badge-yellow', Clock] };
    const [cls, Icon] = map[status] || ['badge-neutral', Clock];
    return <span className={`badge ${cls}`}><Icon size={11} />{status}</span>;
};

const Payments = () => {
    const [payments, setPayments]     = useState([]);
    const [loading, setLoading]       = useState(true);
    const [filterTenant, setFilter]   = useState('');
    const [isRecordOpen, setRecord]   = useState(false);
    const [recording, setRecording]   = useState(null);
    const [recordData, setRecordData] = useState({ payment_method: 'Bank Transfer', reference: '', notes: '', paid_at: new Date().toISOString().split('T')[0] });
    const [submitting, setSubmitting] = useState(false);

    const fetchPayments = async () => {
        setLoading(true);
        try { setPayments(asArray((await paymentsApi.getAll())?.data)); }
        catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchPayments(); }, []);

    const openRecord = (p) => {
        setRecording(p);
        setRecordData({ payment_method: 'Bank Transfer', reference: '', notes: '', paid_at: new Date().toISOString().split('T')[0] });
        setRecord(true);
    };

    const handleRecord = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await paymentsApi.record(recording.id, recordData);
            setRecord(false);
            fetchPayments();
        } catch (err) {
            alert(err.response?.data?.detail || 'Failed to record payment.');
        } finally { setSubmitting(false); }
    };

    const handleRevert = async (payment) => {
        if (!window.confirm(`Undo this recorded payment for ${payment.lease?.tenant?.full_name || 'this tenant'}? It will be marked unpaid again.`)) return;
        try {
            await paymentsApi.revert(payment.id);
            fetchPayments();
        } catch (err) {
            alert(err.response?.data?.detail || 'Failed to undo payment.');
        }
    };

    const tenantNames = [...new Set(payments.map(p => p.lease?.tenant?.full_name).filter(Boolean))];
    const filtered    = filterTenant ? payments.filter(p => p.lease?.tenant?.full_name === filterTenant) : payments;

    const field = (k) => (e) => setRecordData({ ...recordData, [k]: e.target.value });

    const summary = { paid: 0, pending: 0, overdue: 0 };
    payments.forEach(p => { if (summary[p.status] !== undefined) summary[p.status]++; });

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Payment Tracking</h1>
                    <p className="page-subtitle">Monitor and record rent transactions</p>
                </div>
                <div className="flex-center gap-8">
                    <span className="badge badge-green"><CheckCircle size={11} />{summary.paid} paid</span>
                    <span className="badge badge-yellow"><Clock size={11} />{summary.pending} pending</span>
                    <span className="badge badge-red"><AlertCircle size={11} />{summary.overdue} overdue</span>
                </div>
            </div>

            {/* Record payment modal */}
            <Modal isOpen={isRecordOpen} onClose={() => setRecord(false)} title="Record Payment">
                {recording && (
                    <div className="info-block">
                        <div className="info-row">
                            <span className="info-row-label">Tenant</span>
                            <span className="info-row-value">{recording.lease?.tenant?.full_name}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-row-label">Amount Due</span>
                            <span className="info-row-value text-accent">{fmt(recording.amount, recording.currency)}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-row-label">Due Date</span>
                            <span className="info-row-value">{formatDate(recording.due_date)}</span>
                        </div>
                    </div>
                )}
                <form className="form-stack" onSubmit={handleRecord}>
                    <div className="form-group">
                        <label className="form-label">Payment Method</label>
                        <select required className="form-select" value={recordData.payment_method} onChange={field('payment_method')}>
                            {['Bank Transfer','Cash','Check','Credit Card','Other'].map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Payment Date</label>
                        <input type="date" required className="form-input" value={recordData.paid_at} onChange={field('paid_at')} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Reference # (optional)</label>
                        <input type="text" className="form-input" placeholder="Transaction ID, Receipt #…" value={recordData.reference} onChange={field('reference')} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Notes</label>
                        <textarea className="form-textarea" placeholder="Internal notes…" value={recordData.notes} onChange={field('notes')} style={{ minHeight: 70 }} />
                    </div>
                    <button type="submit" className="btn btn-primary btn-lg w-full" disabled={submitting}>
                        {submitting ? 'Recording…' : 'Confirm Payment'}
                    </button>
                </form>
            </Modal>

            <div className="table-wrap">
                <div className="filter-bar">
                    <Filter size={14} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                    <select
                        className="form-select"
                        style={{ width: 'auto', minWidth: 160, background: 'var(--surface-2)', border: '1px solid var(--border-md)', borderRadius: 'var(--radius)', padding: '5px 10px', fontSize: '0.875rem' }}
                        value={filterTenant}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="">All Tenants</option>
                        {tenantNames.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <span className="text-muted fs-sm" style={{ marginLeft: 'auto' }}>{filtered.length} records</span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className="table" style={{ minWidth: 640 }}>
                        <thead>
                            <tr>
                                <th>Tenant</th>
                                <th>Unit</th>
                                <th>Date</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="table-loading">Loading payments…</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="6" className="table-empty">No payment records found.</td></tr>
                            ) : filtered.map((p) => (
                                <tr key={p.id}>
                                    <td>
                                        <div className="user-cell">
                                            <div className="avatar">{(p.lease?.tenant?.full_name || 'U').charAt(0)}</div>
                                            <div className="user-cell-name">{p.lease?.tenant?.full_name || '—'}</div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="fs-sm">{p.lease?.unit?.name || '—'}</div>
                                        <div className="fs-xs text-muted mt-4">{p.lease?.unit?.unit_code}</div>
                                    </td>
                                    <td className="fs-sm text-2">{formatDate(p.paid_at || p.due_date)}</td>
                                    <td><span className="fw-600">{fmt(p.amount, p.currency)}</span></td>
                                    <td>
                                        <StatusBadge status={p.status} />
                                        {p.status === 'paid' && p.payment_method && (
                                            <div className="fs-xs text-muted mt-4">via {p.payment_method}</div>
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        {p.status !== 'paid' ? (
                                            <button className="btn btn-primary" style={{ padding: '5px 12px', fontSize: '0.8rem' }} onClick={() => openRecord(p)}>
                                                <PlusCircle size={13} /> Record
                                            </button>
                                        ) : (
                                            <button className="btn btn-ghost" style={{ padding: '5px 12px', fontSize: '0.8rem', color: 'var(--text-2)' }} onClick={() => handleRevert(p)} title="Undo this payment">
                                                <RotateCcw size={13} /> Undo
                                            </button>
                                        )}
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

export default Payments;
