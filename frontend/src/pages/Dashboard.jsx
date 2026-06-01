import React, { useState, useEffect } from 'react';
import { TrendingUp, Activity, DollarSign, PieChart, CreditCard, Home } from 'lucide-react';
import { tenantsApi, unitsApi, paymentsApi, leasesApi, expensesApi } from '../api';
import { formatDate } from '../utils/dateUtils';

const fmt = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
const asArray = (x) => (Array.isArray(x) ? x : []);

const MetricCard = ({ label, value, icon: Icon, color }) => (
    <div className="metric-card">
        <div className="metric-label">
            <Icon size={14} style={{ color }} />
            {label}
        </div>
        <div className="metric-value">{value}</div>
    </div>
);

const StatusBadge = ({ status }) => {
    const map = { paid: 'badge-green', overdue: 'badge-red', pending: 'badge-yellow' };
    return <span className={`badge ${map[status] || 'badge-neutral'}`}>{status}</span>;
};

const Dashboard = () => {
    const [stats, setStats] = useState({ tenants: 0, units: 0, grossRevenue: 0, totalExpenses: 0, netIncome: 0, roi: 0, occupancyPercent: 0 });
    const [upcoming, setUpcoming] = useState([]);
    const [loading, setLoading]   = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const [tR, uR, pR, lR, eR] = await Promise.all([
                    tenantsApi.getAll(), unitsApi.getAll(), paymentsApi.getAll(), leasesApi.getAll(), expensesApi.getAll(),
                ]);
                const tenants  = asArray(tR?.data);
                const units    = asArray(uR?.data);
                const payments = asArray(pR?.data);
                const leases   = asArray(lR?.data);
                const expenses = asArray(eR?.data);

                const grossRevenue   = payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount || 0), 0);
                const totalExpenses  = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
                const netIncome      = grossRevenue - totalExpenses;
                const totalInvestment = units.reduce((s, u) => s + Number(u.purchase_price || 0), 0);
                const roi            = totalInvestment > 0 ? ((netIncome / totalInvestment) * 100).toFixed(1) : 0;
                const occupiedIds    = new Set(leases.filter(l => l.status === 'active').map(l => l.unit_id));
                const occupancyPercent = units.length === 0 ? 0 : Math.round((occupiedIds.size / units.length) * 100);

                setStats({ tenants: tenants.length, units: units.length, grossRevenue, totalExpenses, netIncome, roi, occupancyPercent });

                const now = new Date(), oneMonth = new Date();
                oneMonth.setMonth(now.getMonth() + 1);
                setUpcoming(
                    payments
                        .filter(p => { const d = new Date(p.due_date); return d >= now && d <= oneMonth && p.status !== 'paid'; })
                        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
                        .slice(0, 10)
                );
            } catch (err) {
                console.error('Dashboard fetch error:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) return <div className="table-loading">Loading portfolio…</div>;

    const donutBg = `conic-gradient(var(--accent) ${stats.occupancyPercent}%, var(--surface-3) 0)`;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Financial Overview</h1>
                    <p className="page-subtitle">Portfolio performance and operational metrics</p>
                </div>
            </div>

            <div className="grid-4" style={{ marginBottom: 20 }}>
                <MetricCard label="Gross Revenue"   value={fmt(stats.grossRevenue)}  icon={TrendingUp} color="var(--green)" />
                <MetricCard label="Operating Costs" value={fmt(stats.totalExpenses)} icon={Activity}   color="var(--red)" />
                <MetricCard label="Net Income"       value={fmt(stats.netIncome)}     icon={DollarSign} color="var(--accent-hover)" />
                <MetricCard label="Portfolio ROI"    value={`${stats.roi}%`}          icon={PieChart}   color="var(--yellow)" />
            </div>

            <div className="grid-3">
                {/* Upcoming payments */}
                <div className="table-wrap col-span-2">
                    <div className="table-title-row">
                        <h3>Upcoming Payments — Next 30 Days</h3>
                        <span className="badge badge-neutral">{upcoming.length} due</span>
                    </div>
                    {upcoming.length === 0 ? (
                        <div className="table-empty">No pending payments in the next 30 days.</div>
                    ) : (
                        <div style={{ padding: '8px 0' }}>
                            {upcoming.map((p, i) => (
                                <div key={i} className="activity-item" style={{ padding: '10px 20px' }}>
                                    <div className="activity-left">
                                        <div className="activity-icon" style={{ background: 'var(--accent-dim)' }}>
                                            <CreditCard size={17} style={{ color: 'var(--accent-hover)' }} />
                                        </div>
                                        <div>
                                            <div className="activity-name">{p.lease?.tenant?.full_name || 'Tenant'}</div>
                                            <div className="activity-sub">{p.lease?.unit?.name || 'Unit'} · {p.lease?.unit?.unit_code || ''}</div>
                                        </div>
                                    </div>
                                    <div className="activity-right">
                                        <div className="activity-date">{formatDate(p.due_date)}</div>
                                        <div className="fw-600 fs-sm text-accent" style={{ marginTop: 2 }}>{fmt(p.amount)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Occupancy */}
                <div className="card card-body">
                    <h3 style={{ marginBottom: 20 }}>Occupancy</h3>
                    <div className="donut-wrap">
                        <div className="donut" style={{ background: donutBg }}>
                            <div className="donut-inner">
                                <span className="donut-pct">{stats.occupancyPercent}%</span>
                                <span className="donut-sub">Occupied</span>
                            </div>
                        </div>
                        <div className="donut-legend">
                            <div className="donut-legend-row">
                                <span className="donut-legend-label">Total Units</span>
                                <span className="donut-legend-value">{stats.units}</span>
                            </div>
                            <div className="donut-legend-row">
                                <span className="donut-legend-label">Total Tenants</span>
                                <span className="donut-legend-value">{stats.tenants}</span>
                            </div>
                            <div className="donut-legend-row">
                                <span className="donut-legend-label">Occupied Units</span>
                                <span className="donut-legend-value text-green">{Math.round(stats.occupancyPercent * stats.units / 100)}</span>
                            </div>
                            <div className="donut-legend-row">
                                <span className="donut-legend-label">Vacant Units</span>
                                <span className="donut-legend-value text-red">{stats.units - Math.round(stats.occupancyPercent * stats.units / 100)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
