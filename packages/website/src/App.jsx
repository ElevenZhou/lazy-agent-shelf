import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  scenarios: agent.scenarios || [],
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
const tabs = ['browse', 'scenes', 'aiStarter', 'usage', 'aiTools', 'models'];

function getInitialTab() {
  if (typeof window === 'undefined') return 'browse';
  const requested = new URLSearchParams(window.location.search).get('tab');
  return tabs.includes(requested) ? requested : 'browse';
}

function getInitialLanguage() {
  return 'zh-CN';
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
  const [scenario, setScenario] = useState(locales[getInitialLanguage()].scenes[0]?.id || 'web-product');
  const [target, setTarget] = useState('codex');
  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [openCollection, setOpenCollection] = useState(collections[0]?.id || '');
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [copied, setCopied] = useState('');
  const [visibleCount, setVisibleCount] = useState(12);
  const loadMoreRef = useRef(null);
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
    return (category === 'all' || agent.groupKey === category)
      && [
      agent.id,
      agent.name,
      agent.zh_name,
      agent.description,
      agent.zh_description,
      agent.tags.join(' '),
      agent.scenarios.join(' ')
    ].join(' ').toLowerCase().includes(q);
  }), [localizedAgents, query, category]);
  const visibleAgents = filtered.slice(0, visibleCount);
  const hasMoreAgents = visibleCount < filtered.length;
  const categories = ['all', ...new Set(agents.map(agent => agent.groupKey))];
  const sceneOptions = text.scenes.map(scene => ({
    ...scene,
    count: agents.filter(agent => agent.scenarios.includes(scene.id)).length
  }));
  const activeScene = sceneOptions.find(sceneOption => sceneOption.id === scenario) || sceneOptions[0];
  const sceneAgents = localizedAgents.filter(agent => agent.scenarios.includes(activeScene?.id));
  const assetBase = import.meta.env.BASE_URL;
  const changeTab = tab => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = tab === 'browse' ? window.location.pathname : `${window.location.pathname}?tab=${tab}`;
      window.history.replaceState(null, '', url);
    }
  };

  useEffect(() => {
    setVisibleCount(12);
  }, [query, category, language]);

  useEffect(() => {
    if (!hasMoreAgents || !loadMoreRef.current) return undefined;
    const observer = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting) {
        setVisibleCount(count => Math.min(count + 9, filtered.length));
      }
    }, { rootMargin: '360px' });
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [filtered.length, hasMoreAgents]);

  return <main className={language === 'zh-CN' ? 'lang-zh' : 'lang-en'}>
    <header className="site-nav">
      <div className="brand-lockup">
        <img src={`${assetBase}brand/nav-mark.svg`} alt="FlaiOS" />
        <div>
          <strong>{text.brandName}</strong>
          <span>{text.signal}</span>
        </div>
      </div>
      <nav className="tabs" aria-label={text.primaryNav}>
        {tabs.map(tab => <button className={activeTab === tab ? 'active' : ''} key={tab} onClick={() => changeTab(tab)}>{text.tabs[tab]}</button>)}
      </nav>
      <LanguageSwitcher language={language} onChange={setLanguage} text={text} />
    </header>

    {activeTab === 'browse' && <>
      <section className="hero">
        <img className="hero-flow" src={`${assetBase}brand/hero-flow.svg`} alt="" aria-hidden="true" />
        <span className="eyebrow">{text.eyebrow}</span>
        <h1>{text.heroTitle}</h1>
        <p>{text.heroBody}</p>
        <p className="hero-subline">{text.heroSubline}</p>
        <div className="hero-stats">
          {text.heroStats.map(item => <div key={item.label}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </div>)}
        </div>
        <Command text={`npx lazy-agent-shelf install code-reviewer --target ${target}`} copied={copied} onCopy={copyCommand} labels={text} />
      </section>

      <section className="toolbar">
        <input value={query} onChange={event => setQuery(event.target.value)} placeholder={text.searchPlaceholder} />
        <div className="chips">{categories.map(item => <button className={item === category ? 'active' : ''} key={item} onClick={() => setCategory(item)}>{item === 'all' ? text.allCategories : text.categories[item] || item}</button>)}</div>
        <div className="target-picker">
          <span>{text.targetPlatform}</span>
          <div className="chips">{targets.map(item => <button className={item === target ? 'active' : ''} key={item} onClick={() => setTarget(item)}>{item}</button>)}</div>
        </div>
      </section>

      <section className="grid">
        {visibleAgents.map((agent, index) => <article className="card" style={{'--delay': `${Math.min(index, 8) * 35}ms`}} key={agent.id}>
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
      <div className="load-more" ref={loadMoreRef}>
        <span>{text.listStatus.replace('{visible}', visibleAgents.length).replace('{total}', filtered.length)}</span>
        {hasMoreAgents && <button onClick={() => setVisibleCount(count => Math.min(count + 9, filtered.length))}>{text.loadMore}</button>}
      </div>

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

    {activeTab === 'scenes' && <SceneChannel sceneOptions={sceneOptions} activeScene={activeScene} sceneAgents={sceneAgents} scenario={scenario} onScenarioChange={setScenario} onSelectAgent={setSelectedAgent} labels={text} />}
    {activeTab === 'aiStarter' && <AIStarterChannel labels={text} />}
    {activeTab === 'usage' && <UsageGuide copied={copied} onCopy={copyCommand} labels={text} />}
    {activeTab === 'aiTools' && <AIToolsChannel labels={text} />}
    {activeTab === 'models' && <TopModelsChannel labels={text} />}
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
        <InfoList title={labels.modal.scenarios} items={agent.scenarios} />
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

function SceneChannel({ sceneOptions, activeScene, sceneAgents, scenario, onScenarioChange, onSelectAgent, labels }) {
  return <section className="scenario-page">
    <aside className="scenario-rail">
      <span className="signal">{labels.scenePanel.signal}</span>
      <h2>{labels.scenePanel.navTitle}</h2>
      <p>{labels.scenePanel.navBody}</p>
      <div className="scenario-list">
        {sceneOptions.map(item => <button className={item.id === scenario ? 'active' : ''} key={item.id} onClick={() => onScenarioChange(item.id)}>
          <span>{item.label}</span>
          <em>{item.count ? `${item.count} ${labels.scenePanel.agentUnit}` : labels.scenePanel.planned}</em>
        </button>)}
      </div>
    </aside>
    <div className="scenario-detail">
      <div className="scenario-feature">
        <span className="signal">{labels.scenePanel.filteredBy}</span>
        <h2>{activeScene.label}</h2>
        <p>{activeScene.description}</p>
      </div>
      <div className="scenario-agent-grid">
        {sceneAgents.length ? sceneAgents.map(agent => <article className="scenario-agent" key={agent.id}>
          <div className="card-top"><span>{labels.categories[agent.groupKey] || agent.category}</span><code>{agent.id}</code></div>
          <h3>{agent.name}</h3>
          <p>{agent.description}</p>
          <button onClick={() => onSelectAgent(agent)}>{labels.details}</button>
        </article>) : <article className="scenario-empty">
          <h3>{labels.scenePanel.plannedTitle}</h3>
          <p>{labels.scenePanel.plannedBody}</p>
        </article>}
      </div>
    </div>
  </section>;
}

function AIStarterChannel({ labels }) {
  return <section className="starter-page">
    <div className="starter-head">
      <span className="signal">{labels.aiStarter.signal}</span>
      <h2>{labels.aiStarter.title}</h2>
      <p>{labels.aiStarter.body}</p>
    </div>
    <div className="starter-grid">
      {labels.aiStarter.personas.map((persona, index) => <article className="starter-card" key={persona.title}>
        <strong>{String(index + 1).padStart(2, '0')}</strong>
        <span>{persona.label}</span>
        <h3>{persona.title}</h3>
        <p>{persona.body}</p>
        <div className="demo-strip">
          <b>{labels.aiStarter.demoLabel}</b>
          <p>{persona.demo}</p>
        </div>
        <ul>{persona.steps.map(step => <li key={step}>{step}</li>)}</ul>
      </article>)}
    </div>
  </section>;
}

function AIToolsChannel({ labels }) {
  return <section className="channel-page">
    <div className="channel-hero">
      <span className="signal">{labels.aiTools.signal}</span>
      <h2>{labels.aiTools.title}</h2>
      <p>{labels.aiTools.body}</p>
    </div>
    <div className="tool-channel-grid">
      {labels.aiTools.groups.map(group => <article className="tool-channel-card" key={group.title}>
        <div className="card-top"><span>{group.fit}</span><code>{group.tools.join(' / ')}</code></div>
        <h3>{group.title}</h3>
        <p>{group.body}</p>
        <div className="tool-list">
          {group.tools.map(tool => <em key={tool}>{tool}</em>)}
        </div>
        <InfoList title={labels.aiTools.bestFor} items={group.bestFor} />
        <InfoList title={labels.aiTools.howToUse} items={group.howToUse} />
      </article>)}
    </div>
    <div className="usage-note">
      <h3>{labels.aiTools.noteTitle}</h3>
      <p>{labels.aiTools.noteBody}</p>
    </div>
  </section>;
}

function TopModelsChannel({ labels }) {
  return <section className="channel-page">
    <div className="channel-hero models-hero">
      <span className="signal">{labels.models.signal}</span>
      <h2>{labels.models.title}</h2>
      <p>{labels.models.body}</p>
    </div>
    <div className="model-list">
      {labels.models.items.map((model, index) => <article className="model-row" key={model.name}>
        <strong>{String(index + 1).padStart(2, '0')}</strong>
        <div>
          <h3>{model.name}</h3>
          <p>{model.body}</p>
          <div className="targets">
            {model.bestFor.map(item => <em key={item}>{item}</em>)}
          </div>
        </div>
      </article>)}
    </div>
    <div className="usage-note">
      <h3>{labels.models.noteTitle}</h3>
      <p>{labels.models.noteBody}</p>
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
