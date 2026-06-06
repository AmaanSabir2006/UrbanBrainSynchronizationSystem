import React, { useState, useEffect } from 'react';

const BudgetAllocation = () => {
    const [activeCrises, setActiveCrises] = useState([]);
    const [treasuryPool, setTreasuryPool] = useState(150000000); // Restored to your original project baseline balance
    const [loadingId, setLoadingId] = useState(null); // Tracks unique compound string keys
    const [systemAlert, setSystemAlert] = useState({ msg: '', error: false });

    const API_ENDPOINT = 'http://127.0.0.1:8000/api/budget_allocation/';

   const syncOperationalMatrix = async () => {
    try {
        const res = await fetch(API_ENDPOINT);
        if (!res.ok) throw new Error('Could not establish link with the central database.');
        
        const data = await res.json();
        
        // FIX: Extract the 'disasters' array from the backend response object
        // and update the treasury pool state as well.
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
        // Form an isolated composite tracking key string
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

            // Runs only if the database updates and inserts successfully (201 Created)
            if (res.status === 201 || res.status === 200) {
                setSystemAlert({ msg: backendFeedback.message, error: false });
                
                // Safely deduct the required asset cost dynamically on the UI
                setTreasuryPool(currentCash => currentCash - node.required_capital);
                
                // Refresh our live table records directly from Postgres
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
        <div style={{ fontFamily: 'sans-serif', padding: '20px', backgroundColor: '#F7FAFC', minHeight: '100vh' }}>
            <h2 style={{ marginBottom: '4px', color: '#01411C', fontWeight: 'bold' }}>Resource Allocation & Dispatch Engine</h2>
            <p style={{ color: '#718096', marginBottom: '25px', fontSize: '14px' }}>Multi-Table PostgreSQL State Machine Synchronization Node</p>

            {/* Central Treasury Ledger Card */}
            <div style={{
                backgroundColor: '#FFFFFF',
                borderLeft: '4px solid #01411C',
                padding: '20px',
                borderRadius: '6px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                marginBottom: '25px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <span style={{ fontSize: '11px', fontWeight: '900', color: '#718096', letterSpacing: '1px' }}>LAHORE URBAN TREASURY POOL</span>
                    <h1 style={{ margin: '4px 0 0 0', color: '#01411C', fontSize: '32px', fontWeight: '800' }}>
                        {treasuryPool.toLocaleString('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 })}
                    </h1>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '13px', color: '#4A5568', fontWeight: '600' }}>Pending Outages Matrix:</span>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: activeCrises.length > 0 ? '#C05621' : '#2F855A' }}>
                        {activeCrises.length} Active System Vulnerabilities
                    </div>
                </div>
            </div>

            {systemAlert.msg && (
                <div style={{
                    marginBottom: '20px',
                    padding: '12px 16px',
                    borderRadius: '4px',
                    backgroundColor: systemAlert.error ? '#FED7D7' : '#C6F6D5',
                    color: systemAlert.error ? '#9B2C2C' : '#22543D',
                    fontWeight: '600',
                    fontSize: '13px'
                }}>
                    {systemAlert.msg}
                </div>
            )}

            {/* Main Operational Table */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                            <th style={{ padding: '16px', color: '#4A5568', fontSize: '12px', fontWeight: '700' }}>EVENT ID</th>
                            <th style={{ padding: '16px', color: '#4A5568', fontSize: '12px', fontWeight: '700' }}>VECTOR TYPE</th>
                            <th style={{ padding: '16px', color: '#4A5568', fontSize: '12px', fontWeight: '700' }}>TARGET SECTOR</th>
                            <th style={{ padding: '16px', color: '#4A5568', fontSize: '12px', fontWeight: '700' }}>COMPROMISED ASSET</th>
                            <th style={{ padding: '16px', color: '#4A5568', fontSize: '12px', fontWeight: '700' }}>REQUIRED AUDIT CAPITAL</th>
                            <th style={{ padding: '16px', color: '#4A5568', fontSize: '12px', fontWeight: '700', textAlign: 'center' }}>COMMAND ACTION</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activeCrises.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#A0AEC0', fontWeight: '600', fontSize: '14px' }}>
                                    ✓ Core operational status uniform. All active variables logged into database history.
                                </td>
                            </tr>
                        ) : (
                            activeCrises.map((incident, index) => {
                                const currentCompositeKey = `${incident.event_id}-${incident.zone_id}`;
                                const isThisRowLoading = loadingId === currentCompositeKey;

                                return (
                                    <tr key={`${currentCompositeKey}-${index}`} style={{ borderBottom: '1px solid #E2E8F0' }}>
                                        <td style={{ padding: '16px', fontWeight: 'bold', color: '#2D3748' }}>#{incident.event_id}</td>
                                        <td style={{ padding: '16px', fontWeight: '700', color: '#E53E3E', fontSize: '13px' }}>
                                            {incident.crisis_type} (LVL {incident.severity_level})
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{ backgroundColor: '#EBF8FF', color: '#2B6CB0', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '700' }}>
                                                {incident.zone_name}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px', color: '#4A5568', fontSize: '13px' }}>
                                            {incident.asset_name === 'General Regional Damage' ? (
                                                <span style={{ color: '#A0AEC0', fontStyle: 'italic' }}>General Regional Damage</span>
                                            ) : (
                                                <strong style={{ color: '#2C5282' }}>{incident.asset_name}</strong>
                                            )}
                                        </td>
                                        <td style={{ padding: '16px', fontWeight: '700', color: '#B7791F', fontSize: '14px' }}>
                                            {incident.required_capital.toLocaleString('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 })}
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'center' }}>
                                            <button
                                                onClick={() => authorizeCapitalDeployment(incident)}
                                                disabled={loadingId !== null}
                                                style={{
                                                    padding: '8px 16px',
                                                    backgroundColor: isThisRowLoading ? '#A0AEC0' : '#01411C',
                                                    color: '#FFFFFF',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    fontWeight: '700',
                                                    fontSize: '11px',
                                                    cursor: loadingId !== null ? 'not-allowed' : 'pointer',
                                                    transition: 'all 0.15s ease-in-out',
                                                    boxShadow: isThisRowLoading ? 'none' : '0 1px 3px rgba(0,0,0,0.1)'
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