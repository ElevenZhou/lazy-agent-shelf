import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const agents = [
  ['code-reviewer', 'Code Reviewer', 'Engineering', 'Find correctness and maintainability issues before merge.', ['claude', 'codex', 'cursor', 'opencode']],
  ['bug-investigator', 'Bug Investigator', 'Engineering', 'Reproduce, isolate, and explain software failures from evidence.', ['claude', 'codex', 'cursor']],
  ['frontend-builder', 'Frontend Builder', 'Engineering', 'Create distinctive responsive UI with verification steps.', ['codex', 'cursor', 'vscode']],
  ['backend-api-architect', 'Backend API Architect', 'Engineering', 'Design API contracts, validation, data flow, and migrations.', ['claude', 'codex', 'opencode']],
  ['security-auditor', 'Security Auditor', 'Engineering', 'Audit code and config for practical security risks.', ['claude', 'codex', 'cursor']],
  ['test-writer', 'Test Writer', 'Engineering', 'Write focused tests for behavior and regressions.', ['codex', 'cursor', 'vscode']],
  ['product-manager', 'Product Manager', 'Product', 'Turn vague ideas into scoped requirements and metrics.', ['claude', 'codex', 'trae']],
  ['ux-flow-designer', 'UX Flow Designer', 'Product', 'Map journeys, states, friction, and handoff copy.', ['claude', 'codex', 'cursor']],
  ['seo-strategist', 'SEO Strategist', 'Growth', 'Plan keyword clusters, content, and technical SEO experiments.', ['claude', 'codex', 'trae']],
  ['landing-page-copywriter', 'Landing Page Copywriter', 'Growth', 'Write positioning, objections, and CTA variants.', ['claude', 'cursor', 'trae']],
  ['data-analyst', 'Data Analyst', 'Data', 'Analyze datasets with reproducible steps and decision outputs.', ['codex', 'vscode', 'opencode']],
  ['agent-quality-evaluator', 'Agent Quality Evaluator', 'Meta', 'Review agents for clarity, overlap, safety, and portability.', ['claude', 'codex', 'cursor']]
];

const stacks = [
  ['Solo Founder Stack', 'Build, ship, explain, and grow a small product.', ['product-manager', 'frontend-builder', 'backend-api-architect', 'landing-page-copywriter', 'seo-strategist']],
  ['Code Quality Stack', 'Keep a repo healthy while moving fast.', ['code-reviewer', 'bug-investigator', 'security-auditor', 'test-writer']],
  ['Agent Maker Stack', 'Design and evaluate reusable AI specialists.', ['agent-quality-evaluator', 'product-manager', 'code-reviewer']]
];

function App() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const filtered = useMemo(() => agents.filter(([id, name, cat, desc]) => {
    const q = query.toLowerCase();
    return (category === 'All' || cat === category) && [id, name, desc].join(' ').toLowerCase().includes(q);
  }), [query, category]);
  const categories = ['All', ...new Set(agents.map(a => a[2]))];

  return <main>
    <section className="hero">
      <div className="signal">open-source agent shelf</div>
      <h1>Preset specialists for people too lazy to configure AI twice.</h1>
      <p>Lazy Agent Shelf turns one high-quality agent source into Claude, Codex, Cursor, OpenCode, VSCode, Trae, and generic AGENTS.md outputs.</p>
      <div className="terminal">npx universal-agents install code-reviewer --target codex</div>
    </section>

    <section className="toolbar">
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search agents, workflows, use cases..." />
      <div className="chips">{categories.map(c => <button className={c === category ? 'active' : ''} key={c} onClick={() => setCategory(c)}>{c}</button>)}</div>
    </section>

    <section className="grid">
      {filtered.map(([id, name, cat, desc, targets], index) => <article className="card" style={{'--delay': `${index * 45}ms`}} key={id}>
        <div className="card-top"><span>{cat}</span><code>{id}</code></div>
        <h2>{name}</h2>
        <p>{desc}</p>
        <div className="targets">{targets.map(t => <em key={t}>{t}</em>)}</div>
        <pre>universal-agents install {id}</pre>
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

