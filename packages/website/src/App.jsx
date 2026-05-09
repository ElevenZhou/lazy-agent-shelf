import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import catalog from './catalog.json';
import en from './locales/en.json';
import zhCN from './locales/zh-CN.json';
import './styles.css';

const locales = { en, 'zh-CN': zhCN };
const languageOptions = [
  { id: 'en', label: 'English' },
  { id: 'zh-CN', label: '中文' }
];

const agents = catalog.agents.map(agent => ({
  ...agent,
  groupKey: agent.category.split('/')[0],
  targets: agent.compatible.map(target => target.replace('-code', '').replace('-copilot', ''))
}));

const collections = catalog.collections || [];
const targets = ['codex', 'claude', 'cursor', 'opencode', 'vscode', 'trae', 'generic', 'all'];
const platformCommands = {
  codex: 'lazy-agent-shelf install code-reviewer --target codex --out ~/.codex/skills',
  claude: 'lazy-agent-shelf install-collection code-quality-pack --target claude --out .',
  cursor: 'lazy-agent-shelf install-collection solo-founder-pack --target cursor --out .',
  opencode: 'lazy-agent-shelf install repo-onboarding-guide --target opencode --out .',
  vscode: 'lazy-agent-shelf install security-auditor --target vscode --out .',
  trae: 'lazy-agent-shelf install domain-brand-finder --target trae --out .'
};
const platformTitles = {
  codex: 'Codex',
  claude: 'Claude Code',
  cursor: 'Cursor',
  opencode: 'OpenCode',
  vscode: 'VSCode Copilot',
  trae: 'Trae'
};

function getInitialLanguage() {
  if (typeof navigator === 'undefined') return 'en';
  return navigator.language?.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en';
}

function localizedEntity(entity, language) {
  if (language !== 'zh-CN') return entity;
  return {
    ...entity,
    name: entity.zh_name || entity.name,
    description: entity.zh_description || entity.description,
    use_cases: entity.zh_use_cases || entity.use_cases
  };
}

function App() {
  const [language, setLanguage] = useState(getInitialLanguage);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [target, setTarget] = useState('codex');
  const [activeTab, setActiveTab] = useState('browse');
  const [openCollection, setOpenCollection] = useState(collections[0]?.id || '');
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [copied, setCopied] = useState('');
  const text = locales[language];
  const localizedAgents = useMemo(() => agents.map(agent => localizedEntity(agent, language)), [language]);
  const localizedCollections = useMemo(() => collections.map(collection => localizedEntity(collection, language)), [language]);
  const agentById = useMemo(() => new Map(localizedAgents.map(agent => [agent.id, agent])), [localizedAgents]);

  const copyCommand = async command => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(command);
      window.setTimeout(() => setCopied(''), 1500);
    } catch {
      setCopied('');
    }
  };

  const filtered = useMemo(() => localizedAgents.filter(agent => {
    const q = query.toLowerCase();
    return (category === 'all' || agent.groupKey === category) && [
      agent.id,
      agent.name,
      agent.zh_name,
      agent.description,
      agent.zh_description,
      agent.tags.join(' ')
    ].join(' ').toLowerCase().includes(q);
  }), [localizedAgents, query, category]);
  const categories = ['all', ...new Set(agents.map(agent => agent.groupKey))];

  return <main className={language === 'zh-CN' ? 'lang-zh' : 'lang-en'}>
    <section className="hero">
      <div className="topbar">
        <div className="signal">{text.signal}</div>
        <LanguageSwitcher language={language} onChange={setLanguage} text={text} />
      </div>
      <h1>{text.heroTitle}</h1>
      <p>{text.heroBody}</p>
      <Command text={`npx lazy-agent-shelf install code-reviewer --target ${target}`} copied={copied} onCopy={copyCommand} labels={text} />
    </section>

    <section className="tabs">
      <button className={activeTab === 'browse' ? 'active' : ''} onClick={() => setActiveTab('browse')}>{text.tabs.browse}</button>
      <button className={activeTab === 'usage' ? 'active' : ''} onClick={() => setActiveTab('usage')}>{text.tabs.usage}</button>
    </section>

    {activeTab === 'browse' && <>
      <section className="toolbar">
        <input value={query} onChange={event => setQuery(event.target.value)} placeholder={text.searchPlaceholder} />
        <div className="chips">{categories.map(item => <button className={item === category ? 'active' : ''} key={item} onClick={() => setCategory(item)}>{item === 'all' ? text.allCategories : text.categories[item] || item}</button>)}</div>
        <div className="target-picker">
          <span>{text.targetPlatform}</span>
          <div className="chips">{targets.map(item => <button className={item === target ? 'active' : ''} key={item} onClick={() => setTarget(item)}>{item}</button>)}</div>
        </div>
      </section>

      <section className="grid">
        {filtered.map((agent, index) => <article className="card" style={{'--delay': `${index * 45}ms`}} key={agent.id}>
          <div className="card-top"><span>{text.categories[agent.groupKey] || agent.category}</span><code>{agent.id}</code></div>
          <h2>{agent.name}</h2>
          <p>{agent.description}</p>
          <div className="targets">{agent.targets.slice(0, 4).map(item => <em key={item}>{item}</em>)}</div>
          <div className="card-actions">
            <button onClick={() => setSelectedAgent(agent)}>{text.details}</button>
            <Command text={`lazy-agent-shelf install ${agent.id} --target ${target}`} copied={copied} onCopy={copyCommand} labels={text} compact />
          </div>
        </article>)}
      </section>

      <section className="stacks">
        <div>
          <span className="signal">{text.recommendedPacks}</span>
          <h2>{text.packsTitle}</h2>
        </div>
        {localizedCollections.slice(0, 5).map(collection => <div className="stack" key={collection.id}>
          <button className="stack-toggle" onClick={() => setOpenCollection(openCollection === collection.id ? '' : collection.id)}>
            <h3>{collection.name}</h3>
            <span>{openCollection === collection.id ? text.close : text.open}</span>
          </button>
          <p>{collection.description}</p>
          <Command text={`lazy-agent-shelf install-collection ${collection.id} --target ${target}`} copied={copied} onCopy={copyCommand} labels={text} compact />
          {openCollection === collection.id && <div className="stack-detail">
            <strong>{collection.agents.length} {text.agentsIncluded}</strong>
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

    {activeTab === 'usage' && <UsageGuide copied={copied} onCopy={copyCommand} labels={text} />}
    {selectedAgent && <AgentModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} target={target} copied={copied} onCopy={copyCommand} labels={text} />}
  </main>;
}

function LanguageSwitcher({ language, onChange, text }) {
  return <div className="language-switcher" aria-label={text.languageLabel}>
    <span>{text.languageLabel}</span>
    {languageOptions.map(option => <button className={language === option.id ? 'active' : ''} key={option.id} onClick={() => onChange(option.id)}>{option.label}</button>)}
  </div>;
}

function Command({ text, copied, onCopy, labels, compact = false }) {
  return <div className={compact ? 'command compact' : 'command'}>
    <code>{text}</code>
    <button onClick={() => onCopy(text)}>{copied === text ? labels.copied : labels.copy}</button>
  </div>;
}

function AgentModal({ agent, onClose, target, copied, onCopy, labels }) {
  const command = `lazy-agent-shelf install ${agent.id} --target ${target}`;
  return <div className="modal-backdrop" onClick={onClose}>
    <section className="modal" onClick={event => event.stopPropagation()}>
      <button className="modal-close" onClick={onClose}>{labels.close}</button>
      <span className="signal">{labels.categories[agent.groupKey] || agent.category}</span>
      <h2>{agent.name}</h2>
      <p>{agent.description}</p>
      <Command text={command} copied={copied} onCopy={onCopy} labels={labels} />
      <div className="modal-grid">
        <InfoList title={labels.modal.inputs} items={agent.inputs} />
        <InfoList title={labels.modal.outputs} items={agent.outputs} />
        <InfoList title={labels.modal.tags} items={agent.tags} />
        <InfoList title={labels.modal.compatible} items={agent.compatible} />
      </div>
    </section>
  </div>;
}

function UsageGuide({ copied, onCopy, labels }) {
  const guides = Object.entries(labels.platformGuides).map(([id, guide]) => ({
    id,
    title: platformTitles[id],
    command: platformCommands[id],
    ...guide
  }));

  return <section className="usage">
    <div className="usage-intro">
      <span className="signal">{labels.usage.signal}</span>
      <h2>{labels.usage.title}</h2>
      <p>{labels.usage.body}</p>
      <Command text="npm install -g lazy-agent-shelf" copied={copied} onCopy={onCopy} labels={labels} />
    </div>

    <div className="usage-steps">
      {labels.usage.steps.map((step, index) => <article key={step.title}>
        <strong>{index + 1}</strong><h3>{step.title}</h3><p>{step.body}</p>
      </article>)}
    </div>

    <div className="platform-grid">
      {guides.map(platform => <article className="platform-card" key={platform.id}>
        <div className="card-top"><span>{platform.id}</span><code>{platform.title}</code></div>
        <h3>{platform.title}</h3>
        <p>{platform.where}</p>
        <Command text={platform.command} copied={copied} onCopy={onCopy} labels={labels} compact />
        <ul>{platform.notes.map(note => <li key={note}>{note}</li>)}</ul>
      </article>)}
    </div>

    <div className="usage-note">
      <h3>{labels.usage.noteTitle}</h3>
      <p>{labels.usage.noteBody}</p>
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
