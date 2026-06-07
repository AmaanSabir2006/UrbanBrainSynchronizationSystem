import React, { useState, useEffect } from 'react';

const BudgetAllocation = () => {
    const [activeCrises, setActiveCrises] = useState([]);
    const [treasuryPool, setTreasuryPool] = useState(150000000); // Original project baseline balance
    const [loadingId, setLoadingId] = useState(null); // Tracks unique compound string keys
    const [systemAlert, setSystemAlert] = useState({ msg: '', error: false });

    const API_ENDPOINT = 'http://127.0.0.1:8000/api/budget_allocation/';

    const syncOperationalMatrix = async () => {
        try {
            const res = await fetch(API_ENDPOINT);
            if (!res.ok) throw new Error('Could not establish link with the central database.');
            
            const data = await res.json();
            
            if (data.disasters) {
                setActiveCrises(data.disasters);
            }
            if (data.available_balance !== undefined) {
                setTreasuryPool(data.available_balance);
            }
            
        } catch (err) {
            setSystemAlert({ msg: err.message, error: true });
        }
    };

    useEffect(() => {
        syncOperationalMatrix();
    }, []);

    const authorizeCapitalDeployment = async (node) => {
        const currentCompositeKey = `${node.event_id}-${node.zone_id}`;
        setLoadingId(currentCompositeKey);
        setSystemAlert({ msg: '', error: false });

        if (treasuryPool < node.required_capital) {
            setSystemAlert({ msg: 'Operational Halt: Total municipal emergency pool holds insufficient funding.', error: true });
            setLoadingId(null);
            return;
        }

        try {
            const res = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event_id: node.event_id,
                    zone_id: node.zone_id,
                    allocated_amount: node.required_capital
                })
            });

            const backendFeedback = await res.json();

            if (res.status === 201 || res.status === 200) {
                setSystemAlert({ msg: backendFeedback.message, error: false });
                
                // Deduct the required asset cost dynamically on the UI
                setTreasuryPool(currentCash => currentCash - node.required_capital);
                
                // Refresh records directly from Postgres
                await syncOperationalMatrix(); 
            } else {
                setSystemAlert({ msg: backendFeedback.error || 'Authorization handshake rejected.', error: true });
            }
        } catch (fail) {
            setSystemAlert({ msg: 'Network link timeout with central server.', error: true });
        } finally {
            setLoadingId(null); // Clear interface lock state
        }
    };

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
            
            {/* Header Block */}
            <div style={{ marginBottom: '35px', borderBottom: '1px solid rgba(1, 65, 28, 0.12)', paddingBottom: '24px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#01411C', margin: 0, letterSpacing: '-0.8px' }}>
                    Resource Allocation & Dispatch Engine
                </h1>
                <p style={{ color: '#64748B', fontSize: '14px', marginTop: '6px' }}>
                    Multi-Table PostgreSQL State Machine Synchronization Node
                </p>
            </div>

            {/* Central Treasury Ledger Card */}
            <div style={{
                backgroundColor: '#FFFFFF',
                borderLeft: '4px solid #01411C',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid rgba(1, 65, 28, 0.08)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)',
                marginBottom: '30px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: '#64748B', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        LAHORE URBAN TREASURY POOL
                    </span>
                    <h1 style={{ margin: '6px 0 0 0', color: '#01411C', fontSize: '36px', fontWeight: '850', letterSpacing: '-0.5px' }}>
                        {treasuryPool.toLocaleString('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 })}
                    </h1>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '750', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Pending Outages Matrix
                    </span>
                    <div style={{ 
                        fontSize: '18px', 
                        fontWeight: '800', 
                        marginTop: '6px',
                        color: activeCrises.length > 0 ? '#D97706' : '#10B981',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        justifyContent: 'flex-end'
                    }}>
                        <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: activeCrises.length > 0 ? '#D97706' : '#10B981',
                            display: 'inline-block'
                        }}></span>
                        {activeCrises.length} Active System Vulnerabilities
                    </div>
                </div>
            </div>

            {/* Notification Alert Toast Banner */}
            {systemAlert.msg && (
                <div style={{
                    marginBottom: '25px',
                    padding: '14px 18px',
                    borderRadius: '8px',
                    backgroundColor: systemAlert.error ? 'rgba(239, 68, 68, 0.06)' : 'rgba(16, 185, 129, 0.06)',
                    color: systemAlert.error ? '#B91C1C' : '#065F46',
                    border: `1px solid ${systemAlert.error ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)'}`,
                    fontWeight: '600',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <span>{systemAlert.error ? '⚠️' : '✓'}</span>
                    <div>{systemAlert.msg}</div>
                </div>
            )}

            {/* Main Operational Table */}
            <div style={{ 
                backgroundColor: '#FFFFFF', 
                borderRadius: '12px', 
                boxShadow: '0 4px 20px rgba(0,0,0,0.01)', 
                border: '1px solid rgba(1, 65, 28, 0.08)', 
                overflow: 'hidden' 
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid rgba(1, 65, 28, 0.08)' }}>
                            <th style={{ padding: '16px 20px', color: '#64748B', fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Event ID</th>
                            <th style={{ padding: '16px 20px', color: '#64748B', fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Vector Type</th>
                            <th style={{ padding: '16px 20px', color: '#64748B', fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Target Sector</th>
                            <th style={{ padding: '16px 20px', color: '#64748B', fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Compromised Asset</th>
                            <th style={{ padding: '16px 20px', color: '#64748B', fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Required Audit Capital</th>
                            <th style={{ padding: '16px 20px', color: '#64748B', fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase', textAlign: 'center' }}>Command Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activeCrises.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ padding: '50px 20px', textAlign: 'center', color: '#64748B', fontWeight: '600', fontSize: '13.5px' }}>
                                    ✓ Core operational status uniform. All active variables logged into database history.
                                </td>
                            </tr>
                        ) : (
                            activeCrises.map((incident, index) => {
                                const currentCompositeKey = `${incident.event_id}-${incident.zone_id}`;
                                const isThisRowLoading = loadingId === currentCompositeKey;

                                return (
                                    <tr key={`${currentCompositeKey}-${index}`} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                        <td style={{ padding: '18px 20px' }}>
                                            <span style={{ 
                                                fontFamily: 'monospace', 
                                                fontWeight: '700', 
                                                color: '#475569', 
                                                backgroundColor: '#F1F5F9', 
                                                padding: '3px 7px', 
                                                borderRadius: '5px' 
                                            }}>
                                                #{incident.event_id}
                                            </span>
                                        </td>
                                        <td style={{ padding: '18px 20px' }}>
                                            <span style={{ 
                                                backgroundColor: 'rgba(239, 68, 68, 0.06)', 
                                                color: '#EF4444', 
                                                padding: '3px 8px', 
                                                borderRadius: '6px', 
                                                fontSize: '11px', 
                                                fontWeight: '800', 
                                                border: '1px solid rgba(239, 68, 68, 0.15)',
                                                textTransform: 'uppercase'
                                            }}>
                                                {incident.crisis_type} (LVL {incident.severity_level})
                                            </span>
                                        </td>
                                        <td style={{ padding: '18px 20px' }}>
                                            <span style={{ 
                                                backgroundColor: 'rgba(2, 132, 199, 0.06)', 
                                                color: '#0284C7', 
                                                padding: '3px 8px', 
                                                borderRadius: '6px', 
                                                fontSize: '11px', 
                                                fontWeight: '800', 
                                                border: '1px solid rgba(2, 132, 199, 0.12)' 
                                            }}>
                                                {incident.zone_name}
                                            </span>
                                        </td>
                                        <td style={{ padding: '18px 20px', color: '#334155', fontSize: '13px' }}>
                                            {incident.asset_name === 'General Regional Damage' ? (
                                                <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>General Regional Damage</span>
                                            ) : (
                                                <strong style={{ color: '#0F172A', fontWeight: '700' }}>{incident.asset_name}</strong>
                                            )}
                                        </td>
                                        <td style={{ padding: '18px 20px', fontWeight: '800', color: '#D97706', fontSize: '13.5px' }}>
                                            {incident.required_capital.toLocaleString('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 })}
                                        </td>
                                        <td style={{ padding: '18px 20px', textAlign: 'center' }}>
                                            <button
                                                onClick={() => authorizeCapitalDeployment(incident)}
                                                disabled={loadingId !== null}
                                                style={{
                                                    padding: '10px 18px',
                                                    backgroundColor: isThisRowLoading ? '#94A3B8' : '#01411C',
                                                    color: '#FFFFFF',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    fontWeight: '750',
                                                    fontSize: '10.5px',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.04em',
                                                    cursor: loadingId !== null ? 'not-allowed' : 'pointer',
                                                    transition: 'all 0.15s ease-in-out',
                                                    boxShadow: isThisRowLoading ? 'none' : '0 2px 6px rgba(1, 65, 28, 0.15)'
                                                }}
                                            >
                                                {isThisRowLoading ? 'PROCESSING...' : 'AUTHORIZE & DEPLOY'}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BudgetAllocation;