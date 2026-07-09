import React, { useState } from 'react';
import { useOS } from '../store/os';
import { sfx } from '../lib/sound';

export function Launchpad() {
  const balance = useOS((s) => s.balance);
  const launchCoin = useOS((s) => s.launchCoin);
  const closeApp = useOS((s) => s.closeApp);

  const [name, setName] = useState('');
  const [ticker, setTicker] = useState('');
  const [desc, setDesc] = useState('');

  const fee = 1.00;
  const canDeploy = balance >= fee;

  const handleLaunch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canDeploy) {
      sfx.err();
      return;
    }
    const cleanTicker = ticker.trim().toUpperCase().replace(/^\$/, '');
    if (!cleanTicker) {
      sfx.err();
      return;
    }

    const success = launchCoin(name, cleanTicker, desc);
    if (success) {
      closeApp('launchpad');
    }
  };

  return (
    <div className="pad" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', justifyContent: 'space-between', boxSizing: 'border-box', paddingBottom: 24 }}>
      <form onSubmit={handleLaunch} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--muted)', letterSpacing: '.1em', marginBottom: 2 }}>
          // INITIAL COIN OFFERING
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>Coin Name</label>
          <input 
            placeholder="e.g. Chad Rocket" 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            style={{ 
              background: 'var(--ground)', 
              border: '1px solid var(--line)', 
              borderRadius: 10, 
              padding: '11px 14px', 
              color: 'var(--ink)',
              fontSize: 13.5 
            }} 
            required
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>Ticker Symbol</label>
          <input 
            placeholder="e.g. CMR" 
            value={ticker} 
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            maxLength={5}
            style={{ 
              background: 'var(--ground)', 
              border: '1px solid var(--line)', 
              borderRadius: 10, 
              padding: '11px 14px', 
              color: 'var(--ink)',
              fontSize: 13.5,
              fontFamily: 'var(--mono)'
            }} 
            required
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>Description / Narrative</label>
          <textarea 
            placeholder="Why should other degens ape in?" 
            value={desc} 
            onChange={(e) => setDesc(e.target.value)}
            rows={3}
            style={{ 
              background: 'var(--ground)', 
              border: '1px solid var(--line)', 
              borderRadius: 10, 
              padding: '11px 14px', 
              color: 'var(--ink)',
              fontSize: 13.5,
              resize: 'none',
              fontFamily: 'inherit'
            }} 
          />
        </div>
      </form>

      <div style={{ marginTop: 20, borderTop: '1px solid var(--line)', paddingTop: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 12, fontFamily: 'var(--mono)' }}>
          <span style={{ color: 'var(--muted)' }}>Deployment Fee:</span>
          <span style={{ color: canDeploy ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
            ${fee.toFixed(2)}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 16, fontFamily: 'var(--mono)' }}>
          <span style={{ color: 'var(--muted)' }}>Your Balance:</span>
          <span style={{ color: 'var(--ink)' }}>
            ${balance.toFixed(2)}
          </span>
        </div>

        <button 
          className={`btn ${canDeploy ? 'gold' : 'ghost'}`}
          onClick={handleLaunch}
          disabled={!canDeploy}
          style={{ width: '100%', padding: '12px 14px', fontSize: 13, cursor: canDeploy ? 'pointer' : 'not-allowed' }}
        >
          {canDeploy ? 'LAUNCH MEMECOIN 🚀' : 'INSUFFICIENT FUNDS'}
        </button>
      </div>
    </div>
  );
}
