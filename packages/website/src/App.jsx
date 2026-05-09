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
const platformGuides = [
  {
    id: 'codex',
    title: 'Codex',
    where: 'Install as Codex skills, then call the specialist by task intent inside Codex.',
    command: 'lazy-agent-shelf install code-reviewer --target codex --out ~/.codex/skills',
    notes: ['Best for repo work, code review, debugging, research workflows, and repeatable local tasks.', 'Use collections when you want a ready-made working team instead of one specialist.']
  },
  {
    id: 'claude',
    title: 'Claude Code',
    where: 'Install as Claude Code subagent markdown files under `.claude/agents`.',
    command: 'lazy-agent-shelf install-collection code-quality-pack --target claude --out .',
    notes: ['Best for subagent-style delegation inside a project.', 'Generated files are portable markdown, so you can inspect and edit them.']
  },
  {
    id: 'cursor',
    title: 'Cursor',
    where: 'Install as Cursor rule files under `.cursor/rules`.',
    command: 'lazy-agent-shelf install-collection solo-founder-pack --target cursor --out .',
    notes: ['Best for project-level behavior presets and repeatable coding rules.', 'Use focused agents for review, frontend, backend, product, and naming tasks.']
  },
  {
    id: 'opencode',
    title: 'OpenCode',
    where: 'Install as OpenCode agent markdown under `.opencode/agents`.',
    command: 'lazy-agent-shelf install repo-onboarding-guide --target opencode --out .',
    notes: ['Best for terminal-native workflows and repository assistants.', 'Use `--target all` if you want to prepare every platform at once.']
  },
  {
    id: 'vscode',
    title: 'VSCode Copilot',
    where: 'Install as instruction markdown under `.github/instructions`.',
    command: 'lazy-agent-shelf install security-auditor --target vscode --out .',
    notes: ['Best for project instructions that travel with the repo.', 'Keep sensitive or personal workflow rules out of public repos.']
  },
  {
    id: 'trae',
    title: 'Trae',
    where: 'Install as Trae-compatible prompt markdown under `.trae/agents`.',
    command: 'lazy-agent-shelf install domain-brand-finder --target trae --out .',
    notes: ['Best for product, growth, Chinese-market, and coding assistant workflows.', 'The generated prompt remains readable and editable.']
  }
];

function App() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [target, setTarget] = useState('codex');
  const [activeTab, setActiveTab] = useState('browse');
  const [openCollection, setOpenCollection] = useState(collections[0]?.id || '');
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [copied, setCopied] = useState('');
  const copyCommand = async command => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(command);
      window.setTimeout(() => setCopied(''), 1500);
    } catch {
      setCopied('');
    }
  };
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
      <Command text={`npx lazy-agent-shelf install code-reviewer --target ${target}`} copied={copied} onCopy={copyCommand} />
    </section>

    <section className="tabs">
      <button className={activeTab === 'browse' ? 'active' : ''} onClick={() => setActiveTab('browse')}>Browse Agents</button>
      <button className={activeTab === 'usage' ? 'active' : ''} onClick={() => setActiveTab('usage')}>How to Use / 怎么使用</button>
    </section>

    {activeTab === 'browse' && <>
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
          <div className="card-actions">
            <button onClick={() => setSelectedAgent(agent)}>Details</button>
            <Command text={`lazy-agent-shelf install ${agent.id} --target ${target}`} copied={copied} onCopy={copyCommand} compact />
          </div>
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
          <Command text={`lazy-agent-shelf install-collection ${collection.id} --target ${target}`} copied={copied} onCopy={copyCommand} compact />
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
    </>}

    {activeTab === 'usage' && <UsageGuide copied={copied} onCopy={copyCommand} />}
    {selectedAgent && <AgentModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} target={target} copied={copied} onCopy={copyCommand} />}
  </main>;
}

function Command({ text, copied, onCopy, compact = false }) {
  return <div className={compact ? 'command compact' : 'command'}>
    <code>{text}</code>
    <button onClick={() => onCopy(text)}>{copied === text ? 'copied' : 'copy'}</button>
  </div>;
}

function AgentModal({ agent, onClose, target, copied, onCopy }) {
  const command = `lazy-agent-shelf install ${agent.id} --target ${target}`;
  return <div className="modal-backdrop" onClick={onClose}>
    <section className="modal" onClick={event => event.stopPropagation()}>
      <button className="modal-close" onClick={onClose}>close</button>
      <span className="signal">{agent.category}</span>
      <h2>{agent.name}</h2>
      <p>{agent.description}</p>
      <Command text={command} copied={copied} onCopy={onCopy} />
      <div className="modal-grid">
        <InfoList title="Inputs" items={agent.inputs} />
        <InfoList title="Outputs" items={agent.outputs} />
        <InfoList title="Tags" items={agent.tags} />
        <InfoList title="Compatible" items={agent.compatible} />
      </div>
    </section>
  </div>;
}

function UsageGuide({ copied, onCopy }) {
  return <section className="usage">
    <div className="usage-intro">
      <span className="signal">where these agents run</span>
      <h2>这些 agent 不是在网站里聊天用，而是安装到你常用的 AI 编程工具里用。</h2>
      <p>网站负责浏览、筛选、复制安装命令；真正使用发生在 Codex、Claude Code、Cursor、OpenCode、VSCode Copilot、Trae 等工具中。先选择单个 agent 或套装，再选择目标平台，复制命令安装。</p>
      <Command text="npm install -g lazy-agent-shelf" copied={copied} onCopy={onCopy} />
    </div>

    <div className="usage-steps">
      <article><strong>1</strong><h3>Choose</h3><p>选一个 agent，或直接选 `solo-founder-pack` 这类套装。</p></article>
      <article><strong>2</strong><h3>Install</h3><p>复制网站生成的命令，输出到当前项目或工具配置目录。</p></article>
      <article><strong>3</strong><h3>Use</h3><p>回到目标工具，用自然语言说任务，工具会按生成的 agent/rule/skill 工作。</p></article>
    </div>

    <div className="platform-grid">
      {platformGuides.map(platform => <article className="platform-card" key={platform.id}>
        <div className="card-top"><span>{platform.id}</span><code>{platform.title}</code></div>
        <h3>{platform.title}</h3>
        <p>{platform.where}</p>
        <Command text={platform.command} copied={copied} onCopy={onCopy} compact />
        <ul>{platform.notes.map(note => <li key={note}>{note}</li>)}</ul>
      </article>)}
    </div>

    <div className="usage-note">
      <h3>一句话理解</h3>
      <p>Lazy Agent Shelf 像一个 agent 货架：网站用来挑选，CLI 用来安装，各个 AI 工具才是真正工作的地方。</p>
    </div>
  </section>;
}

function InfoList({ title, items }) {
  return <div className="info-list">
    <h3>{title}</h3>
    <ul>{(items || []).map(item => <li key={item}>{item}</li>)}</ul>
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);

