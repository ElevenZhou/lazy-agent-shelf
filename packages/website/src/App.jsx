import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import catalog from './catalog.json';
import './styles.css';

const agents = catalog.agents.map(agent => ({
  ...agent,
  group: agent.category.split('/')[0].replace(/^\w/, c => c.toUpperCase()),
  targets: agent.compatible.map(target => target.replace('-code', '').replace('-copilot', ''))
}));

const collections = catalog.collections || [];
const targets = ['codex', 'claude', 'cursor', 'opencode', 'vscode', 'trae', 'generic', 'all'];
const agentById = new Map(agents.map(agent => [agent.id, agent]));

function App() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [target, setTarget] = useState('codex');
  const [openCollection, setOpenCollection] = useState(collections[0]?.id || '');
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
      <div className="terminal">npx lazy-agent-shelf install code-reviewer --target {target}</div>
    </section>

    <section className="toolbar">
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search agents, workflows, use cases..." />
      <div className="chips">{categories.map(c => <button className={c === category ? 'active' : ''} key={c} onClick={() => setCategory(c)}>{c}</button>)}</div>
      <div className="target-picker">
        <span>Target platform</span>
        <div className="chips">{targets.map(t => <button className={t === target ? 'active' : ''} key={t} onClick={() => setTarget(t)}>{t}</button>)}</div>
      </div>
    </section>

    <section className="grid">
      {filtered.map((agent, index) => <article className="card" style={{'--delay': `${index * 45}ms`}} key={agent.id}>
        <div className="card-top"><span>{agent.category}</span><code>{agent.id}</code></div>
        <h2>{agent.name}</h2>
        <p>{agent.description}</p>
        <div className="targets">{agent.targets.slice(0, 4).map(t => <em key={t}>{t}</em>)}</div>
        <pre>lazy-agent-shelf install {agent.id} --target {target}</pre>
      </article>)}
    </section>

    <section className="stacks">
      <div>
        <span className="signal">recommended packs</span>
        <h2>Install a working department, not a single prompt.</h2>
      </div>
      {collections.slice(0, 5).map(collection => <div className="stack" key={collection.id}>
        <button className="stack-toggle" onClick={() => setOpenCollection(openCollection === collection.id ? '' : collection.id)}>
          <h3>{collection.name}</h3>
          <span>{openCollection === collection.id ? 'close' : 'open'}</span>
        </button>
        <p>{collection.description}</p>
        <code>lazy-agent-shelf install-collection {collection.id} --target {target}</code>
        {openCollection === collection.id && <div className="stack-detail">
          <strong>{collection.agents.length} agents included</strong>
          <ul>
            {collection.agents.map(id => <li key={id}>
              <span>{agentById.get(id)?.name || id}</span>
              <code>{id}</code>
            </li>)}
          </ul>
          <div className="use-cases">
            {(collection.use_cases || []).map(item => <em key={item}>{item}</em>)}
          </div>
        </div>}
      </div>)}
    </section>
  </main>;
}

createRoot(document.getElementById('root')).render(<App />);

