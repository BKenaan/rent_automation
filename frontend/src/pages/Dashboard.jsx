import React, { useState, useEffect } from 'react';
import {
    Users,
    Home,
    CreditCard,
    ArrowUpRight,
    ArrowDownRight,
    TrendingUp,
    PieChart,
    DollarSign,
    Activity
} from 'lucide-react';
import { tenantsApi, unitsApi, paymentsApi, leasesApi, expensesApi } from '../api';
import { formatDate } from '../utils/dateUtils';

const MetricCard = ({ title, value, subtext, icon: Icon, color, trend }) => {
    return (
        <div className="glass glass-card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.1, color: color }}>
                <Icon size={100} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                    <Icon size={18} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>{value}</h2>
                    {trend && (
                        <span style={{
                            fontSize: '0.75rem',
                            color: trend > 0 ? 'var(--success-color)' : 'var(--error-color)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px'
                        }}>
                            {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            {Math.abs(trend)}%
                        </span>
                    )}
                </div>
                {subtext && <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>{subtext}</p>}
            </div>
        </div>
    );
};

const Dashboard = () => {
    const [stats, setStats] = useState({
        tenants: 0,
        units: 0,
        grossRevenue: 0,
        totalExpenses: 0,
        netIncome: 0,
        roi: 0,
        occupancyPercent: 0,
    });
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [tenantsRes, unitsRes, paymentsRes, leasesRes, expensesRes] = await Promise.all([
                    tenantsApi.getAll(),
                    unitsApi.getAll(),
                    paymentsApi.getAll(),
                    leasesApi.getAll(),
                    expensesApi.getAll(),
                ]);

                // Ensure we always have arrays (API may return non-array on error or unexpected shape)
                const asArray = (x) => (Array.isArray(x) ? x : []);
                const tenants = asArray(tenantsRes?.data);
                const units = asArray(unitsRes?.data);
                const payments = asArray(paymentsRes?.data);
                const leases = asArray(leasesRes?.data);
                const expenses = asArray(expensesRes?.data);

                const grossRevenue = payments
                    .filter(p => p.status === 'paid')
                    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

                const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
                const netIncome = grossRevenue - totalExpenses;

                const totalInvestment = units.reduce((sum, u) => sum + Number(u.purchase_price || 0), 0);
                const roi = totalInvestment > 0 ? ((netIncome / totalInvestment) * 100).toFixed(2) : 0;

                const occupiedUnitIds = new Set(
                    leases
                        .filter(l => l.status === 'active')
                        .map(l => l.unit_id)
                );
                const occupancyPercent =
                    units.length === 0 ? 0 : Math.round((occupiedUnitIds.size / units.length) * 100);

                setStats({
                    tenants: tenants.length,
                    units: units.length,
                    grossRevenue,
                    totalExpenses,
                    netIncome,
                    roi,
                    occupancyPercent,
                });

                // Recent activity logic: Show payments due within 1 month
                const now = new Date();
                const oneMonthLater = new Date();
                oneMonthLater.setMonth(now.getMonth() + 1);

                const events = payments
                    .filter(p => {
                        const dueDate = new Date(p.due_date);
                        return dueDate >= now && dueDate <= oneMonthLater && p.status !== 'paid';
                    })
                    .map(p => ({
                        type: 'payment',
                        at: new Date(p.due_date),
                        title: `Rent Due: ${p.lease?.tenant?.full_name || 'Tenant'}`,
                        subtitle: `${p.lease?.unit?.name || 'Unit'} (${p.lease?.unit?.unit_code || 'N/A'}) • ${p.amount} ${p.currency || 'USD'}`,
                        status: p.status
                    }));

                events.sort((a, b) => a.at - b.at); // Sort by soonest due
                setRecentActivity(events.slice(0, 10)); // Show up to 10 upcoming payments
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Analyzing Portfolio...</div>;

    return (
        <div>
            <div style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ marginBottom: '0.25rem', letterSpacing: '-0.02em' }}>Financial Overview</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Portfolio performance and operational metrics.</p>
            </div>

            <div className="grid grid-cols-4" style={{ gap: '1.5rem' }}>
                <MetricCard title="Gross Revenue" value={formatCurrency(stats.grossRevenue)} icon={TrendingUp} color="#10b981" />
                <MetricCard title="OpEx (Costs)" value={formatCurrency(stats.totalExpenses)} icon={Activity} color="#ef4444" />
                <MetricCard title="Net Operating Income" value={formatCurrency(stats.netIncome)} icon={DollarSign} color="#3b82f6" />
                <MetricCard title="Portfolio ROI" value={`${stats.roi}%`} icon={PieChart} color="#8b5cf6" subtext="Based on purchase prices" trend={+2.4} />
            </div>

            <div className="grid grid-cols-3" style={{ marginTop: '2rem', gap: '1.5rem' }}>
                <div className="glass" style={{ padding: '1.5rem', gridColumn: 'span 2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0 }}>Upcoming Payments (Next 30 Days)</h3>
                        <button className="btn" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', border: '1px solid var(--panel-border)' }}>View All</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--panel-border)' }}>
                        {recentActivity.map((event, idx) => (
                            <div key={idx} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '1rem',
                                background: 'var(--bg-color)'
                            }}>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '8px',
                                        background: event.type === 'payment' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {event.type === 'payment' ? <CreditCard size={20} color="#10b981" /> : <Home size={20} color="#3b82f6" />}
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, fontWeight: 500, fontSize: '0.9rem' }}>{event.title}</p>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{event.subtitle}</p>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 500 }}>{formatDate(event.at)}</p>
                                    {event.status && (
                                        <span style={{
                                            fontSize: '0.7rem',
                                            color: event.status === 'paid' ? 'var(--success-color)' : 'var(--warning-color)',
                                            textTransform: 'capitalize'
                                        }}>
                                            {event.status}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '2rem' }}>Allocation & Occupancy</h3>
                    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                        <div style={{
                            width: '160px',
                            height: '160px',
                            borderRadius: '50%',
                            background: `conic-gradient(var(--accent-color) ${stats.occupancyPercent}%, rgba(255,255,255,0.05) 0)`,
                            margin: '0 auto',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            boxShadow: '0 0 40px rgba(59, 130, 246, 0.15)'
                        }}>
                            <div style={{
                                width: '120px',
                                height: '120px',
                                borderRadius: '50%',
                                background: 'var(--bg-color)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'column',
                                border: '1px solid var(--panel-border)'
                            }}>
                                <span style={{ fontSize: '1.75rem', fontWeight: 700 }}>{stats.occupancyPercent}%</span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Occupied</span>
                            </div>
                        </div>
                    </div>
                    <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Total Units</span>
                            <span style={{ fontWeight: 600 }}>{stats.units}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Total Tenants</span>
                            <span style={{ fontWeight: 600 }}>{stats.tenants}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
