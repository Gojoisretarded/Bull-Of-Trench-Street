import { useRef, useState, useEffect } from 'react';
import { useOS } from '../store/os';
import { WORLD } from '../config/world';
import { fmtPrice } from '../lib/market';
import { sfx } from '../lib/sound';
import { netSend } from '../lib/netBus';

interface Line { html: string; }

export function Terminal() {
  const { coins, chosen, balance } = useOS.getState();
  const trade = useOS((s) => s.trade);
  const toast = useOS((s) => s.toast);
  const closeApp = useOS((s) => s.closeApp);
  const [lines, setLines] = useState<Line[]>([
    { html: `<span class="dim">${WORLD.os} terminal — type <span class="g">help</span></span>` },
  ]);
  const [val, setVal] = useState('');
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { bodyRef.current?.scrollTo(0, bodyRef.current.scrollHeight); }, [lines]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const print = (html: string) => setLines((l) => [...l, { html }]);

  const run = (raw: string) => {
    const parts = raw.split(/\s+/);
    if (parts[0] === 'sudo' && parts[1] === 'auth') {
      const masked = parts[2] ? '*'.repeat(parts[2].length) : '';
      print(`<span class="p">degen@trench</span><span class="dim">:~$</span> sudo auth ${masked}`);
    } else {
      print(`<span class="p">degen@trench</span><span class="dim">:~$</span> ${raw.replace(/</g, '&lt;')}`);
    }
    if (!raw) return;
    sfx.tap();
    const [cmd, ...args] = raw.split(/\s+/);
    const bal = () => useOS.getState().balance;
    switch (cmd) {
      case 'help':
        print('<span class="g">help</span>  <span class="g">neofetch</span>  <span class="g">bal</span>  <span class="g">coins</span>  <span class="g">buy &lt;amt&gt;</span>  <span class="g">larp</span>  <span class="g">whoami</span>  <span class="g">clear</span>  <span class="g">exit</span>');
        break;
      case 'neofetch':
        print(
`<span class="g">   ▄▄▄▄▄▄▄▄▄</span>    <span class="p">degen@bots_os</span>
<span class="g">   █ ▄▄▄▄▄ █</span>    ─────────────────
<span class="g">   █ █▀▀▀█ █</span>    OS: <span class="g">${WORLD.os} v${WORLD.version}</span> (degen/stable)
<span class="g">   █ █▄▄▄█ █</span>    Kernel: 6.9-copium
<span class="g">   █▄▄▄▄▄▄▄█</span>    Uptime: since rock bottom
                 Shell: cope 5.2.1
                 Balance: <span class="g">${bal().toFixed(2)} ${WORLD.sym}</span>
                 Theme: Matte-Blue [dark]`);
        break;
      case 'bal': print(`<span class="g">${bal().toFixed(2)} ${WORLD.sym}</span>`); break;
      case 'coins':
        useOS.getState().coins.forEach((c) =>
          print(`$${c.ticker.padEnd(6)} $${fmtPrice(c.price)}  <span class="${c.change >= 0 ? 'p' : 'r'}">${c.change >= 0 ? '+' : ''}${c.change.toFixed(0)}%</span>`));
        break;
      case 'buy': {
        const a = parseFloat(args[0]);
        if (!a || a <= 0) { print('<span class="r">usage: buy &lt;amount&gt;</span>'); break; }
        trade('buy', a, useOS.getState().coins[1].ticker);
        break;
      }
      case 'larp':
        sfx.coin(); toast('Posted fake PnL. Clout +40 (for now)', 'good');
        print('<span class="g">+2,400% PnL screenshot posted.</span> <span class="dim">it is photoshop. everyone claps.</span>');
        break;
      case 'whoami':
        print(chosen ? `${chosen.name} <span class="dim">— ${chosen.desc}</span>` : 'a degen');
        break;
      case 'clear': setLines([]); break;
      case 'exit': closeApp('terminal'); break;
      case 'sudo': {
        const sub = args[0];
        const val = args[1];
        if (sub === 'auth' && val) {
          if (useOS.getState().online) {
            netSend({ t: 'admin_auth', token: val });
            print(`<span class="dim">Authenticating admin override...</span>`);
          } else {
            print(`<span class="g">Offline mode: admin is always active.</span>`);
          }
        } else if ((sub === 'delete' || sub === 'rm') && val) {
          if (useOS.getState().online) {
            netSend({ t: 'delete_coin', ticker: val });
            print(`<span class="dim">Requesting admin deletion of $${val.toUpperCase()}...</span>`);
          } else {
            // Local/offline delete fallback
            const id = val.toLowerCase().replace(/^\$/, '');
            const s = useOS.getState();
            const coin = s.coins.find(c => c.id === id || c.ticker.toLowerCase() === id);
            if (coin) {
              useOS.setState({ coins: s.coins.filter(c => c.id !== coin.id) });
              print(`<span class="g">Deleted $${coin.ticker} (offline mode).</span>`);
              sfx.coin();
            } else {
              print(`<span class="r">Coin $${val.toUpperCase()} not found.</span>`);
              sfx.err();
            }
          }
        } else {
          print('<span class="r">you have no power here.</span>');
          sfx.err();
        }
        break;
      }
      case 'rm': {
        const val = args[0];
        if (!val) { print('<span class="r">usage: rm &lt;ticker&gt;</span>'); sfx.err(); break; }
        print('<span class="r">permission denied. try: sudo rm &lt;ticker&gt;</span>');
        sfx.err();
        break;
      }
      default: print(`<span class="r">command not found:</span> ${cmd.replace(/</g, '&lt;')} <span class="dim">(try help)</span>`);
    }
  };

  return (
    <div className="term" ref={bodyRef} onPointerUp={() => inputRef.current?.focus()}>
      {lines.map((l, i) => <div key={i} className="ln" dangerouslySetInnerHTML={{ __html: l.html }} />)}
      <div className="ln">
        <span className="p">degen@trench</span><span className="dim">:~$ </span>
        <input ref={inputRef} value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { run(val.trim()); setVal(''); } }} />
      </div>
    </div>
  );
}
