import { useRef, useState, useEffect } from 'react';
import { useOS } from '../store/os';
import { WORLD } from '../config/world';
import { fmtPrice } from '../lib/market';
import { sfx } from '../lib/sound';

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
    print(`<span class="p">degen@trench</span><span class="dim">:~$</span> ${raw.replace(/</g, '&lt;')}`);
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
      case 'sudo': print('<span class="r">you have no power here.</span>'); sfx.err(); break;
      case 'rm': print('<span class="r">nice try. grandma would be disappointed.</span>'); sfx.err(); break;
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
