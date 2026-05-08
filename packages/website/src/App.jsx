import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import catalog from './catalog.json';
import './styles.css';

const agents = catalog.agents.map(agent => ({
  ...agent,
  group: agent.category.split('/')[0].replace(/^\w/, c => c.toUpperCase()),
  targets: agent.compatible.map(target => target.replace('-code', '').replace('-copilot', ''))
}));

const stacks = [
  ['Solo Founder Stack', 'Build, ship, explain, and grow a small product.', ['product-manager', 'frontend-builder', 'backend-api-architect', 'landing-page-copywriter', 'seo-strategist']],
  ['Code Quality Stack', 'Keep a repo healthy while moving fast.', ['code-reviewer', 'bug-investigator', 'security-auditor', 'test-writer']],
  ['Agent Maker Stack', 'Design and evaluate reusable AI specialists.', ['agent-quality-evaluator', 'product-manager', 'code-reviewer']]
];

function App() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const filtered = useMemo(() => agents.filter(agent => {
    const q = query.toLowerCase();
    return (category === 'All' || agent.group === category) && [
      agent.id,
      agent.name,
      agent.zh_name,
      agent.description,
      agent.tags.join(' ')
    ].join(' ').toLowerCase().includes(q);
  }), [query, category]);
  const categories = ['All', ...new Set(agents.map(agent => agent.group))];

  return <main>
    <section className="hero">
      <div className="signal">open-source agent shelf</div>
      <h1>Preset specialists for people too lazy to configure AI twice.</h1>
      <p>Lazy Agent Shelf turns one high-quality agent source into Claude, Codex, Cursor, OpenCode, VSCode, Trae, and generic AGENTS.md outputs.</p>
      <div className="terminal">npx lazy-agent-shelf install code-reviewer --target codex</div>
    </section>

    <section className="toolbar">
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search agents, workflows, use cases..." />
      <div className="chips">{categories.map(c => <button className={c === category ? 'active' : ''} key={c} onClick={() => setCategory(c)}>{c}</button>)}</div>
    </section>

    <section className="grid">
      {filtered.map((agent, index) => <article className="card" style={{'--delay': `${index * 45}ms`}} key={agent.id}>
        <div className="card-top"><span>{agent.category}</span><code>{agent.id}</code></div>
        <h2>{agent.name}</h2>
        <p>{agent.description}</p>
        <div className="targets">{agent.targets.slice(0, 4).map(t => <em key={t}>{t}</em>)}</div>
        <pre>lazy-agent-shelf install {agent.id}</pre>
      </article>)}
    </section>

    <section className="stacks">
      <div>
        <span className="signal">recommended packs</span>
        <h2>Install a working department, not a single prompt.</h2>
      </div>
      {stacks.map(([name, desc, ids]) => <div className="stack" key={name}>
        <h3>{name}</h3>
        <p>{desc}</p>
        <code>{ids.join(' + ')}</code>
      </div>)}
    </section>
  </main>;
}

createRoot(document.getElementById('root')).render(<App />);

