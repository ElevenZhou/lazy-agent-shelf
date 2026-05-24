import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import catalog from './catalog.json';
import hubCatalog from './hub-catalog.json';
import en from './locales/en.json';
import zhCN from './locales/zh-CN.json';
import n6AiDeployPrompt from '../../../docs/guides/n6-ai-deploy-prompt.md?raw';
import n6DeploymentRunbook from '../../../docs/guides/n6-deployment-runbook.md?raw';
import n6LaunchWorklist from '../../../docs/guides/n6-launch-worklist.md?raw';
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
const hubByType = hubCatalog.by_type || {};
const targets = ['codex', 'claude', 'cursor', 'opencode', 'vscode', 'trae', 'generic', 'all'];
const release = {
  version: 'v0.1.2',
  code: 'N6/N7',
  date: '2026-05-17'
};
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
const tabs = ['browse', 'directory', 'aiStarter', 'aiTools', 'workflows', 'workbench', 'crsDeploy', 'crsN6', 'setupKits', 'ccSwitch', 'finance', 'projects', 'submit'];
const n6Docs = [
  {
    id: 'worklist',
    title: '上线工作清单',
    kicker: '中心维护者',
    source: 'central/N6上线工作清单.md',
    content: n6LaunchWorklist
  },
  {
    id: 'runbook',
    title: '部署执行步骤',
    kicker: 'RDP 实操',
    source: 'central/N6部署执行步骤.md',
    content: n6DeploymentRunbook
  },
  {
    id: 'prompt',
    title: 'AI 自动化提示词',
    kicker: '节点 AI',
    source: 'Other/AI自动化部署的提示词.md',
    content: n6AiDeployPrompt
  },
  {
    id: 'htmlGuide',
    title: '节点部署指南',
    kicker: 'HTML 总览',
    source: 'DOC/index.html',
    publicPath: 'crs2-node-deploy-index.html'
  }
];

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
  const [openCollection, setOpenCollection] = useState('');
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

    {activeTab === 'directory' && <DirectoryChannel labels={text} items={hubByType.ai_website || []} />}
    {activeTab === 'aiStarter' && <AIStarterChannel labels={text} />}
    {activeTab === 'aiTools' && <AIToolsChannel labels={text} items={hubByType.tool || []} />}
    {activeTab === 'workflows' && <WorkflowsChannel labels={text} items={hubByType.workflow || []} />}
    {activeTab === 'workbench' && <WorkbenchChannel labels={text} workbench={hubCatalog.workbench} />}
    {activeTab === 'crsDeploy' && <CrsNodeDeployChannel labels={text} copied={copied} onCopy={copyCommand} />}
    {activeTab === 'crsN6' && <CrsN6Channel labels={text} />}
    {activeTab === 'setupKits' && <SetupKitsChannel labels={text} items={hubCatalog.setup_kits || hubByType.setup_kit || []} copied={copied} onCopy={copyCommand} />}
    {activeTab === 'ccSwitch' && <CCSwitchGuide labels={text} copied={copied} onCopy={copyCommand} />}
    {activeTab === 'finance' && <FinanceChannel labels={text} />}
    {activeTab === 'projects' && <ProjectsChannel labels={text} items={hubByType.project || []} />}
    {activeTab === 'submit' && <SubmitChannel copied={copied} onCopy={copyCommand} labels={text} />}
    {selectedAgent && <AgentModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} target={target} copied={copied} onCopy={copyCommand} labels={text} />}
    <SiteFooter labels={text} release={release} />
    <ScrollJumps />
  </main>;
}

function SiteFooter({ labels, release }) {
  return <footer className="site-footer">
    <div>
      <span>{labels.release.label}</span>
      <strong>{release.version} · {release.code} · {labels.release.name}</strong>
    </div>
    <p>{labels.release.body}</p>
    <code>{labels.release.date}: {release.date}</code>
  </footer>;
}

function ScrollJumps() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const scrollToBottom = () => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });

  return <div className="scroll-jumps" aria-label="Page scroll shortcuts">
    <button type="button" onClick={scrollToTop} aria-label="回到顶部" title="回到顶部">↑</button>
    <button type="button" onClick={scrollToBottom} aria-label="跳到底部" title="跳到底部">↓</button>
  </div>;
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

function CCSwitchGuide({ labels, copied, onCopy }) {
  const text = labels.ccSwitch;
  return <section className="channel-page cc-switch-page">
    <div className="channel-hero cc-switch-hero">
      <span className="signal">{text.signal}</span>
      <h2>{text.title}</h2>
      <p>{text.body}</p>
      <div className="cc-switch-actions">
        <a href={text.downloadUrl} target="_blank" rel="noreferrer">{text.downloadLabel}</a>
        <a href={text.homepageUrl} target="_blank" rel="noreferrer">{text.homepageLabel}</a>
      </div>
    </div>

    <div className="cc-switch-flow">
      {text.steps.map((step, index) => <article key={step.title}>
        <strong>{String(index + 1).padStart(2, '0')}</strong>
        <span>{step.kicker}</span>
        <h3>{step.title}</h3>
        <p>{step.body}</p>
      </article>)}
    </div>

    <div className="cc-switch-config">
      <article className="cc-switch-terminal">
        <span>{text.config.kicker}</span>
        <h3>{text.config.title}</h3>
        <p>{text.config.body}</p>
        <div className="cc-switch-values">
          <div>
            <b>{text.config.endpointLabel}</b>
            <Command text={text.config.endpoint} copied={copied} onCopy={onCopy} labels={labels} compact />
          </div>
          <div>
            <b>{text.config.keyLabel}</b>
            <Command text={text.config.key} copied={copied} onCopy={onCopy} labels={labels} compact />
          </div>
        </div>
      </article>
      <article className="cc-switch-checklist">
        <h3>{text.checklistTitle}</h3>
        <ul>{text.checklist.map(item => <li key={item}>{item}</li>)}</ul>
      </article>
    </div>

    <div className="usage-note cc-switch-note">
      <h3>{text.noteTitle}</h3>
      <p>{text.noteBody}</p>
    </div>
  </section>;
}

function FinanceChannel({ labels }) {
  const text = labels.finance;
  return <section className="channel-page finance-page">
    <div className="channel-hero finance-hero">
      <span className="signal">{text.signal}</span>
      <h2>{text.title}</h2>
      <p>{text.body}</p>
    </div>
    <div className="finance-grid">
      {text.items.map((item, index) => {
        const content = <>
          <strong>{String(index + 1).padStart(2, '0')}</strong>
          <span>{item.category}</span>
          <h3>{item.title}</h3>
          <p>{item.body}</p>
          <em>{item.cta}</em>
        </>;
        return item.pending
          ? <article className="finance-card pending" key={item.title}>{content}</article>
          : <a className="finance-card" href={item.url} target="_blank" rel="noreferrer" key={item.title}>{content}</a>;
      })}
    </div>
    <div className="usage-note finance-note">
      <h3>{text.noteTitle}</h3>
      <p>{text.noteBody}</p>
    </div>
  </section>;
}

function DirectoryChannel({ labels, items }) {
  const featuredItems = items.length ? items.slice(0, 6) : labels.directory.featured;
  return <section className="channel-page">
    <div className="channel-hero directory-hero">
      <span className="signal">{labels.directory.signal}</span>
      <h2>{labels.directory.title}</h2>
      <p>{labels.directory.body}</p>
    </div>
    <div className="taxonomy-grid">
      <article className="taxonomy-lead">
        <span className="signal">{labels.directory.categoriesTitle}</span>
        <h3>{labels.directory.searchHint}</h3>
      </article>
      {labels.directory.categories.map(category => <article className="taxonomy-card" key={category.id}>
        <code>{category.id}</code>
        <h3>{category.name}</h3>
        <p>{category.body}</p>
      </article>)}
    </div>
    <div className="spotlight-grid">
      {featuredItems.map(site => <article className="spotlight-card" key={site.id || site.name}>
        <div className="card-top"><span>{site.rating}</span><code>{site.category || site.name}</code></div>
        <h3>{site.name}</h3>
        <p>{site.one_liner || site.body}</p>
        <InfoList title={labels.directory.cardLabels.bestFor} items={site.best_for || site.bestFor} />
        <div className="demo-strip">
          <b>{labels.directory.cardLabels.note}</b>
          <p>{site.owner_note || site.note}</p>
        </div>
      </article>)}
    </div>
  </section>;
}

function AIToolsChannel({ labels, items }) {
  return <section className="channel-page">
    <div className="channel-hero">
      <span className="signal">{labels.aiTools.signal}</span>
      <h2>{labels.aiTools.title}</h2>
      <p>{labels.aiTools.body}</p>
    </div>
    {items.length ? <div className="tool-data-grid">
      {items.map(tool => <article className="tool-data-card" key={tool.id}>
        <div className="card-top"><span>{tool.rating}</span><code>{tool.category}</code></div>
        <h3>{tool.name}</h3>
        <p>{tool.one_liner}</p>
        <div className="targets">
          {(tool.tags || []).slice(0, 6).map(tag => <em key={tag}>{tag}</em>)}
        </div>
        <InfoList title={labels.aiTools.bestFor} items={tool.best_for} />
        <div className="demo-strip">
          <b>{labels.directory?.cardLabels?.note || 'Note'}</b>
          <p>{tool.owner_note}</p>
        </div>
      </article>)}
    </div> : <div className="tool-channel-grid">
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
    </div>}
    <div className="usage-note">
      <h3>{labels.aiTools.noteTitle}</h3>
      <p>{labels.aiTools.noteBody}</p>
    </div>
  </section>;
}

function WorkflowsChannel({ labels, items }) {
  const workflows = items.length ? items : labels.workflowsHub.items;
  return <section className="channel-page">
    <div className="channel-hero workflow-hero">
      <span className="signal">{labels.workflowsHub.signal}</span>
      <h2>{labels.workflowsHub.title}</h2>
      <p>{labels.workflowsHub.body}</p>
    </div>
    <div className="workflow-grid">
      {workflows.map((workflow, index) => <article className="workflow-card" key={workflow.id || workflow.name}>
        <strong>{String(index + 1).padStart(2, '0')}</strong>
        <span>{workflow.stage || workflow.category}</span>
        <h3>{workflow.name}</h3>
        <p>{workflow.one_liner || workflow.body}</p>
        <div className="targets">
          {(workflow.steps || workflow.tags || []).map(step => <em key={step}>{step}</em>)}
        </div>
      </article>)}
    </div>
  </section>;
}

function ProjectsChannel({ labels, items }) {
  const projects = items.length ? items : labels.projectsHub.items;
  return <section className="channel-page">
    <div className="channel-hero project-hero">
      <span className="signal">{labels.projectsHub.signal}</span>
      <h2>{labels.projectsHub.title}</h2>
      <p>{labels.projectsHub.body}</p>
    </div>
    <div className="project-layout">
      <aside className="project-fields">
        <span className="signal">{labels.projectsHub.fieldsTitle}</span>
        <ul>{labels.projectsHub.fields.map(field => <li key={field}>{field}</li>)}</ul>
      </aside>
      <div className="project-list">
        {projects.map(project => <article className="project-card" key={project.id || project.name}>
          <h3>{project.name}</h3>
          <p>{project.one_liner || project.body}</p>
          <div className="targets">
            {(project.tags || []).map(tag => <em key={tag}>{tag}</em>)}
          </div>
        </article>)}
      </div>
    </div>
  </section>;
}

function SetupKitsChannel({ labels, items, copied, onCopy }) {
  const kits = items.length ? items : labels.setupKits.items;
  const commandFor = (template, kit) => template.replaceAll('{id}', kit.id || 'personal-ai-workstation');
  return <section className="channel-page">
    <div className="channel-hero setup-hero">
      <span className="signal">{labels.setupKits.signal}</span>
      <h2>{labels.setupKits.title}</h2>
      <p>{labels.setupKits.body}</p>
    </div>
    <div className="setup-grid">
      {kits.map(kit => <article className="setup-card" key={kit.id || kit.name}>
        <div className="setup-card-head">
          <div>
            <div className="card-top"><span>{labels.setupKits.labels.status}: {kit.status}</span><code>{kit.repo_path || kit.path}</code></div>
            <h3>{kit.name}</h3>
            <p>{kit.one_liner || kit.description || kit.body}</p>
          </div>
          <div className="setup-head-lists">
            <InfoList title={labels.setupKits.labels.modes} items={(kit.modes || []).map(mode => typeof mode === 'string' ? mode : mode.name)} />
            <InfoList title={labels.setupKits.labels.includes} items={kit.includes || Object.values(kit.source_files || {})} />
          </div>
        </div>
        {kit.details && <SetupKitDetails kit={kit} labels={labels.setupKits.detailLabels} />}
        {kit.id && <div className="setup-command-pack">
          <span>{labels.setupKits.commandTitle}</span>
          {labels.setupKits.commands.map(command => <div className="setup-command" key={command.label}>
            <strong>{command.label}</strong>
            <p>{command.body}</p>
            <Command text={commandFor(command.template, kit)} copied={copied} onCopy={onCopy} labels={labels} compact />
          </div>)}
        </div>}
      </article>)}
    </div>
    <div className="usage-note setup-warning">
      <h3>{labels.setupKits.warningTitle}</h3>
      <p>{labels.setupKits.warningBody}</p>
    </div>
  </section>;
}

function WorkbenchChannel({ labels, workbench }) {
  const wb = workbench || { summary: {}, projects: [], risks: [], plans: [], progress: [], assets: [], relations: [] };
  const summary = wb.summary || {};
  const text = labels.workbench;
  const projects = wb.projects || [];
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || '');
  const selectedProject = projects.find(project => project.id === selectedProjectId) || projects[0];
  const TimeMeta = ({ item }) => {
    const updated = item.updated_at || item.date;
    const modified = item.last_modified_at;
    if (!updated && !modified) return null;
    return <small className="workbench-time">
      {updated && <span>{text.fields.updated}: {updated}</span>}
      {modified && <span>{text.fields.modified}: {modified}</span>}
    </small>;
  };
  const DetailList = ({ title, items }) => {
    if (!items?.length) return null;
    return <div className="workbench-detail-block">
      <strong>{title}</strong>
      <ul>{items.map(item => <li key={item}>{item}</li>)}</ul>
    </div>;
  };
  const LinkList = ({ links }) => {
    const entries = Object.entries(links || {});
    if (!entries.length) return null;
    return <div className="workbench-detail-block">
      <strong>{text.detail.links}</strong>
      <ul>{entries.map(([name, url]) => <li key={name}>
        <span>{name}</span>
        {String(url).startsWith('http') ? <a href={url} target="_blank" rel="noreferrer">{url}</a> : <code>{url}</code>}
      </li>)}</ul>
    </div>;
  };
  const stats = [
    [text.summaryLabels.projects, summary.projects || 0],
    [text.summaryLabels.activeProjects, summary.active_projects || 0],
    [text.summaryLabels.highRisks, summary.high_risks || 0],
    [text.summaryLabels.activePlans, summary.active_plans || 0],
    [text.summaryLabels.assets, summary.assets || 0],
    [text.summaryLabels.relations, summary.relations || 0]
  ];
  return <section className="channel-page workbench-page">
    <div className="channel-hero workbench-hero">
      <span className="signal">{text.signal}</span>
      <h2>{text.title}</h2>
      <p>{text.body}</p>
    </div>
    <div className="workbench-stats">
      {stats.map(([label, value]) => <article key={label}><strong>{value}</strong><span>{label}</span></article>)}
    </div>
    <div className="workbench-layout">
      <section className="workbench-panel workbench-projects">
        <h3>{text.sections.projects}</h3>
        {projects.map(project => <button
          type="button"
          className={`workbench-project ${selectedProject?.id === project.id ? 'active' : ''}`}
          key={project.id}
          onClick={() => setSelectedProjectId(project.id)}
          aria-pressed={selectedProject?.id === project.id}
        >
          <div className="card-top"><span>{project.status}</span><code>{project.stage}</code></div>
          <h4>{project.name}</h4>
          <p>{project.summary}</p>
          <div className="targets"><em>{text.fields.risk}: {project.risk_level}</em><em>{text.fields.next}: {project.next_action}</em></div>
          <TimeMeta item={project} />
          <span className="workbench-open">{selectedProject?.id === project.id ? text.detail.opened : text.detail.open}</span>
        </button>)}
        {selectedProject && <article className="workbench-project-detail">
          <span className="signal">{text.detail.signal}</span>
          <h3>{selectedProject.name}</h3>
          <p>{selectedProject.owner_note || selectedProject.summary}</p>
          <div className="workbench-detail-grid">
            <div><span>{text.fields.status}</span><strong>{selectedProject.status}</strong></div>
            <div><span>{text.fields.stage}</span><strong>{selectedProject.stage}</strong></div>
            <div><span>{text.fields.risk}</span><strong>{selectedProject.risk_level}</strong></div>
          </div>
          <div className="workbench-detail-block">
            <strong>{text.fields.next}</strong>
            <p>{selectedProject.next_action}</p>
          </div>
          <DetailList title={text.detail.agents} items={selectedProject.related_agents || []} />
          <DetailList title={text.detail.workflows} items={selectedProject.related_workflows || []} />
          <LinkList links={selectedProject.links} />
          <TimeMeta item={selectedProject} />
        </article>}
      </section>
      <section className="workbench-panel">
        <h3>{text.sections.risks}</h3>
        {(wb.risks || []).map(risk => <article className="workbench-item" key={risk.id}>
          <strong>{risk.name}</strong>
          <p>{risk.summary}</p>
          <em>{text.fields.risk}: {risk.risk_level}</em>
          <p>{text.fields.mitigation}: {risk.mitigation}</p>
          <TimeMeta item={risk} />
        </article>)}
      </section>
      <section className="workbench-panel">
        <h3>{text.sections.plans}</h3>
        {(wb.plans || []).map(plan => <article className="workbench-item" key={plan.id}>
          <strong>{plan.title}</strong>
          <em>{text.fields.horizon}: {plan.horizon}</em>
          <ul>{(plan.goals || []).map(goal => <li key={goal}>{goal}</li>)}</ul>
          <TimeMeta item={plan} />
        </article>)}
      </section>
      <section className="workbench-panel">
        <h3>{text.sections.progress}</h3>
        {(wb.progress || []).map(item => <article className="workbench-item" key={item.id}>
          <strong>{item.summary}</strong>
          <em>{item.date} · {item.status}</em>
          <TimeMeta item={item} />
        </article>)}
      </section>
      <section className="workbench-panel">
        <h3>{text.sections.assets}</h3>
        {(wb.assets || []).map(asset => <article className="workbench-item" key={asset.id}>
          <strong>{asset.name}</strong>
          <p>{asset.summary}</p>
          <em>{asset.type} · {asset.status}</em>
          <LinkList links={asset.links} />
          <TimeMeta item={asset} />
        </article>)}
      </section>
      <section className="workbench-panel">
        <h3>{text.sections.relations}</h3>
        {(wb.relations || []).map(relation => <article className="workbench-item" key={relation.id}>
          <strong>{relation.name}</strong>
          <p>{relation.summary}</p>
          <em>{relation.type} · {relation.status}</em>
          <TimeMeta item={relation} />
        </article>)}
      </section>
    </div>
  </section>;
}


function CrsNodeDeployChannel({ labels, copied, onCopy }) {
  const text = labels.crsDeploy || {};
  const [activeNodeId, setActiveNodeId] = useState('N7');
  const fullDownloadUrl = 'https://github.com/ElevenZhou/crs2-deploy-public/releases/download/v0.1.1/crs2-bundle-v0.1.1-core-v0.1.126-baseline.zip';
  const fullShaUrl = 'https://github.com/ElevenZhou/crs2-deploy-public/releases/download/v0.1.1/crs2-bundle-v0.1.1-core-v0.1.126-baseline.zip.sha256';
  const liteDownloadUrl = 'https://github.com/ElevenZhou/crs2-deploy-public/releases/download/v0.1.1/crs2-bundle-v0.1.1-core-v0.1.126-baseline-lite.zip';
  const liteShaUrl = 'https://github.com/ElevenZhou/crs2-deploy-public/releases/download/v0.1.1/crs2-bundle-v0.1.1-core-v0.1.126-baseline-lite.zip.sha256';
  const repoUrl = 'https://github.com/ElevenZhou/crs2-deploy-public';
  const releaseUrl = 'https://github.com/ElevenZhou/crs2-deploy-public/releases/tag/v0.1.1';
  const nodeDetails = [
    {
      id: 'N6',
      title: 'N6 首发节点',
      status: '已上线，NewAPI 待接入',
      statusTone: 'warn',
      host: 'n6',
      domain: 'https://n6.api.flaios.com',
      port: 16006,
      core: 'v0.1.126-baseline',
      deployedAt: '2026-05-16 03:55',
      operator: 'Erik',
      localIp: '192.168.100.92',
      source: 'central/节点部署总表.md · N6 详情',
      summary: '第一台 CRS2.0 家庭节点，用来验证 FRP、NSSM、Docker Compose、NewAPI 地址口径和文档流程。',
      done: [
        'GitHub 私仓与 crs2-core baseline 建立完成',
        'release bundle 首版打包完成',
        'install.ps1 注册 sub2api / frpc 两个 NSSM 服务',
        'frps 16006 端口预留，n6.api.flaios.com 已规划',
        '沉淀 N6 上线清单、RDP 步骤和节点 AI 提示词'
      ],
      pending: [
        '首尔宿主机 curl http://127.0.0.1:16006/health 复核',
        '节点侧创建 newapi-relay 专用 key 并回传指纹',
        'NewAPI 添加 N6-n6-sub2api channel，Base URL 用 http://172.17.0.1:16006',
        '端到端 smoke test 后补齐联系人 / ISP / key 指纹'
      ],
      lessons: [
        'NewAPI 在 Docker 容器里，channel Base URL 不能写 127.0.0.1',
        '首尔宿主机手工验证用 127.0.0.1:16006/health',
        'N6 暴露的问题已反哺到 N7 一键 bootstrap 流程'
      ]
    },
    {
      id: 'N7',
      title: 'N7 一键部署验证节点',
      status: '已上线，FRP 已连通，NewAPI 待接入',
      statusTone: 'ok',
      host: 'n7',
      domain: 'https://n7.api.flaios.com',
      port: 16007,
      core: 'v0.1.126-baseline',
      deployedAt: '2026-05-17 05:01',
      operator: 'maxhub',
      localIp: '192.168.31.121',
      source: 'DOC/N7-deployment-report.html · central/节点部署总表.md',
      summary: 'N7 跑通了外层 UAC + ASCII inner 启动器 + bootstrap 自动恢复链路，sub2api、frpc、postgres、redis 均健康。',
      done: [
        '启动部署-管理员.cmd 改为外层 UAC + launch-bootstrap-admin-inner.cmd，解决闪退 / 中文文件名乱码',
        '部署仓自有 ps1/md/toml/tpl 统一 UTF-8 with BOM，cmd/bat 保持 ASCII-only',
        'bootstrap.ps1 完成 install.ps1，自动恢复任务已删除，后续开机不会重复安装',
        'Docker 容器 3/3 healthy，本地 http://127.0.0.1:8080/health 返回 200',
        'frpc login to server success，n7-sub2api start proxy success',
        '飞书部署完成卡片已补发，包含节点信息和初始管理员信息'
      ],
      pending: [
        '首尔宿主机 curl http://127.0.0.1:16007/health 复核',
        'N7 节点创建 newapi-relay 专用 key 并回传指纹',
        'NewAPI 添加 N7-n7-sub2api channel，Base URL 用 http://172.17.0.1:16007',
        '端到端 smoke test，确认 NewAPI 日志路由到 N7 channel'
      ],
      lessons: [
        '8080 被 com.docker.backend / wslrelay 监听是正常映射，不是端口冲突',
        'frpc.exe --version 改用 Start-Process 重定向捕获，避开 StandardOutputEncoding 控制台错误',
        'FRP 目录和 frpc.exe 加 Defender 排除，同时添加 Windows 防火墙 frpc 出站允许规则'
      ]
    }
  ];
  const activeNode = nodeDetails.find(node => node.id === activeNodeId) || nodeDetails[0];
  const commands = [
    {
      label: '解压后进入目录',
      body: '如果节点机已经拿到 release zip，就解压到标准目录后进入。',
      command: 'cd C:\\projects\\crs2-deploy'
    },
    {
      label: '管理员一键部署',
      body: '推荐双击启动部署-管理员.cmd；如果用命令行，就在管理员 PowerShell 里执行。',
      command: '.\\bootstrap.ps1 -NodeId N7 -AutoResume'
    },
    {
      label: '部署状态检查',
      body: '部署完成后在节点机执行，确认 Docker 服务、frpc 服务和 health 都正常。',
      command: 'pwsh -File .\\OPS\\status.ps1'
    },
    {
      label: '首尔宿主机验证',
      body: 'N7 对应 16007；N8 对应 16008。这个命令在首尔服务器上跑。',
      command: 'curl -i http://127.0.0.1:16007/health'
    }
  ];
  const aiPrompt = `你是 CRS2.0 节点机部署助手。\n\n目标：把这台 Windows 节点机部署成 sub2api 节点，通过 frp 反连首尔服务器。\n\n下载包选择：\n- 环境已有或能联网下载依赖：优先轻量在线包 crs2-bundle-v0.1.1-core-v0.1.126-baseline-lite.zip。\n- 网络差或想一次带齐依赖：使用完整离线包 crs2-bundle-v0.1.1-core-v0.1.126-baseline.zip。\n\n节点编号：N7  # 按实际替换，例如 N8 / N9\n标准目录：C:\\projects\\crs2-deploy\n\n请按下面顺序执行：\n1. 确认 release zip 已解压到 C:\\projects\\crs2-deploy，且存在 启动部署-管理员.cmd、bootstrap.ps1、install.ps1。\n2. 如果不是管理员 PowerShell，提醒用户双击 启动部署-管理员.cmd 并确认 UAC。\n3. 优先运行：.\\bootstrap.ps1 -NodeId N7 -AutoResume\n4. 如需重启，提醒用户重启后登录 Windows，脚本会自动继续；如果没继续，就再次双击 启动部署-管理员.cmd。\n5. 完成后运行：pwsh -File .\\OPS\\status.ps1\n6. 把节点编号、远端端口、health 状态、frpc 日志最后 20 行汇报给用户。\n\n不要做的事：\n- 不要提交 secrets.local.env。\n- 不要修改 nodes.toml，除非中心明确要求。\n- 不要手工 docker run，优先使用仓库脚本。`;
  const nodeRows = ['N6','N7','N8','N9','N10','N11','N12','N13','N14','N15','N16','N17','N18','N19','N20'].map(id => {
    const n = Number(id.replace('N', ''));
    return { id, port: 16000 + n, subdomain: `n${n}`, channel: `${id}-n${n}-sub2api`, domain: `https://n${n}.api.flaios.com` };
  });
  return <section className="channel-page crs-deploy-page">
    <div className="channel-hero crs-deploy-hero">
      <span className="signal">{text.signal || 'CRS NODE DEPLOY'}</span>
      <h2>{text.title || 'CRS2.0 节点机一键部署台'}</h2>
      <p>{text.body || '给 N7-N20 节点机看的单页说明：下载 release、解压、双击一键安装、重启自动恢复、最后按端口接入 NewAPI。'}</p>
      <div className="crs-deploy-actions">
        <a href={liteDownloadUrl} target="_blank" rel="noreferrer">下载轻量在线包</a>
        <a href={fullDownloadUrl} target="_blank" rel="noreferrer">下载完整离线包</a>
        <a href={releaseUrl} target="_blank" rel="noreferrer">查看公开 Release</a>
        <a href={repoUrl} target="_blank" rel="noreferrer">公开下载仓库</a>
      </div>
    </div>

    <div className="crs-deploy-grid">
      <article className="crs-deploy-card span-2">
        <span className="signal">01 / Download</span>
        <h3>节点机只要拿到这个包</h3>
        <p>当前推荐版本是 <strong>v0.1.1</strong>。公开下载仓库只放 release 包，不放内部源码、FRP token、飞书 webhook 和节点表；N3/N7 这类节点可以直接访问。</p>
        <div className="crs-package-grid">
          <div className="crs-package-card recommended">
            <span>推荐 / 快速下载</span>
            <strong>轻量在线包 · 约 6.9 MB</strong>
            <p>不含 Docker Desktop / NSSM / frpc 实物安装包，保留 <code>download-all.ps1</code> 和 <code>MANIFEST.toml</code>，缺依赖时自动从官方地址补齐。</p>
            <a href={liteDownloadUrl} target="_blank" rel="noreferrer">下载 lite.zip</a>
            <a href={liteShaUrl} target="_blank" rel="noreferrer">lite SHA256</a>
            <pre><code>A8C9A5C53C90EA50E323FECF8BDB57F7F0A4AC1743225C6EFC33FE13CBFDCBD7</code></pre>
          </div>
          <div className="crs-package-card">
            <span>离线 / 兜底</span>
            <strong>完整离线包 · 约 659 MB</strong>
            <p>内含 Docker Desktop / NSSM / frpc 实物安装包，节点机不依赖现场下载这些大文件，更稳但下载更慢。</p>
            <a href={fullDownloadUrl} target="_blank" rel="noreferrer">下载 full.zip</a>
            <a href={fullShaUrl} target="_blank" rel="noreferrer">full SHA256</a>
            <pre><code>06F3EE1F36DF1B6A91A24F07187E85823A2CC32E4B03842E7FD39BBEAD835C51</code></pre>
          </div>
        </div>
        <div className="crs-link-list">
          <a href={releaseUrl} target="_blank" rel="noreferrer">Release v0.1.1：两种包都在这里</a>
          <a href={repoUrl} target="_blank" rel="noreferrer">https://github.com/ElevenZhou/crs2-deploy-public</a>
        </div>
      </article>

      <article className="crs-deploy-card">
        <span className="signal">02 / One Click</span>
        <h3>最短安装步骤</h3>
        <ol>
          <li>在节点机下载 zip：优先轻量在线包；网络差或要离线兜底时下载完整离线包。</li>
          <li>解压到 <code>C:\projects\crs2-deploy</code>。</li>
          <li>双击 <code>启动部署-管理员.cmd</code>。</li>
          <li>弹 UAC 后点允许，输入节点编号，例如 <code>N7</code>。</li>
          <li>如果提示重启，重启并登录 Windows；脚本会自动继续。</li>
        </ol>
      </article>

      <article className="crs-deploy-card">
        <span className="signal">03 / Rules</span>
        <h3>节点编号规则</h3>
        <p>端口固定按 <code>16000 + 节点数字</code> 计算。N7 就是 <code>16007</code>，N20 就是 <code>16020</code>。</p>
        <p>域名采用 <code>n7.api.flaios.com</code> 这种方式；NewAPI channel 名称采用 <code>N7-n7-sub2api</code>。</p>
      </article>
    </div>

    <section className="crs-deploy-card">
      <div className="crs-section-head">
        <div>
          <span className="signal">Node Records</span>
          <h3>N6 / N7 部署详情</h3>
        </div>
        <p>每个节点单独记录上线状态、验证口径、NewAPI 待办和部署中沉淀的规范。</p>
      </div>
      <div className="crs-node-tabs" role="tablist" aria-label="节点部署详情">
        {nodeDetails.map(node => <button type="button" role="tab" aria-selected={activeNode.id === node.id} className={activeNode.id === node.id ? 'active' : ''} key={node.id} onClick={() => setActiveNodeId(node.id)}>
          <span>{node.id}</span>
          <strong>{node.title}</strong>
          <em>{node.status}</em>
        </button>)}
      </div>
      <article className="crs-node-detail">
        <div className="crs-node-head">
          <div>
            <span className="signal">{activeNode.source}</span>
            <h4>{activeNode.title}</h4>
            <p>{activeNode.summary}</p>
          </div>
          <b className={`crs-node-status ${activeNode.statusTone}`}>{activeNode.status}</b>
        </div>
        <div className="crs-node-facts">
          <div><span>节点</span><strong>{activeNode.id}</strong></div>
          <div><span>主机名</span><strong>{activeNode.host}</strong></div>
          <div><span>frp 端口</span><strong>{activeNode.port}</strong></div>
          <div><span>core</span><strong>{activeNode.core}</strong></div>
          <div><span>部署时间</span><strong>{activeNode.deployedAt}</strong></div>
          <div><span>操作者</span><strong>{activeNode.operator}</strong></div>
        </div>
        <div className="crs-node-addresses">
          <code>{activeNode.domain}</code>
          <code>NewAPI Base URL: http://172.17.0.1:{activeNode.port}</code>
          <code>首尔宿主机验证: http://127.0.0.1:{activeNode.port}/health</code>
          <code>节点本机: http://127.0.0.1:8080/health</code>
        </div>
        <div className="crs-node-lists">
          <div>
            <h5>已完成</h5>
            <ul>{activeNode.done.map(item => <li key={item}>{item}</li>)}</ul>
          </div>
          <div>
            <h5>待接入</h5>
            <ul>{activeNode.pending.map(item => <li key={item}>{item}</li>)}</ul>
          </div>
          <div>
            <h5>规范沉淀</h5>
            <ul>{activeNode.lessons.map(item => <li key={item}>{item}</li>)}</ul>
          </div>
        </div>
      </article>
    </section>

    <section className="crs-deploy-card">
      <div className="crs-section-head">
        <div>
          <span className="signal">Copy Commands</span>
          <h3>需要复制的命令</h3>
        </div>
        <p>能双击就双击；命令行主要给 AI 或远程协助时使用。</p>
      </div>
      <div className="crs-command-grid">
        {commands.map(item => <div className="crs-command" key={item.label}>
          <strong>{item.label}</strong>
          <p>{item.body}</p>
          <pre><code>{item.command}</code></pre>
          <button type="button" onClick={() => onCopy(item.command)}>{copied === item.command ? labels.copied : labels.copy}</button>
        </div>)}
      </div>
    </section>

    <section className="crs-deploy-card">
      <div className="crs-section-head">
        <div>
          <span className="signal">AI Prompt</span>
          <h3>发给节点机 AI 的安装提示词</h3>
        </div>
        <button type="button" onClick={() => onCopy(aiPrompt)}>{copied === aiPrompt ? labels.copied : labels.copy}</button>
      </div>
      <pre className="crs-ai-prompt"><code>{aiPrompt}</code></pre>
    </section>

    <section className="crs-deploy-card">
      <div className="crs-section-head">
        <div>
          <span className="signal">NewAPI Mapping</span>
          <h3>首尔 / NewAPI 接入映射</h3>
        </div>
        <p>NewAPI 在 Docker 里，所以 channel Base URL 必须用 <code>172.17.0.1</code>；首尔宿主机手工 curl 才用 <code>127.0.0.1</code>。</p>
      </div>
      <div className="crs-table-wrap">
        <table className="crs-deploy-table">
          <thead><tr><th>节点</th><th>端口</th><th>域名</th><th>NewAPI channel</th><th>NewAPI Base URL</th><th>首尔宿主机验证</th></tr></thead>
          <tbody>{nodeRows.map(row => <tr key={row.id}>
            <td>{row.id}</td>
            <td>{row.port}</td>
            <td>{row.domain}</td>
            <td>{row.channel}</td>
            <td><code>http://172.17.0.1:{row.port}</code></td>
            <td><code>http://127.0.0.1:{row.port}/health</code></td>
          </tr>)}</tbody>
        </table>
      </div>
    </section>
  </section>;
}

function CrsN6Channel({ labels }) {
  const [activeDocId, setActiveDocId] = useState(n6Docs[0].id);
  const activeDoc = n6Docs.find(doc => doc.id === activeDocId) || n6Docs[0];
  const text = labels.crsN6 || {
    signal: 'CRS NODE OPS',
    title: 'CRS N6 首发节点上线台',
    body: '把 N6 上线清单、RDP 执行步骤和节点 AI 自动化提示词收拢到一个可操作页面。',
    meta: ['N6 是首个家庭节点样板', 'N7-N16 后续复用这套 SOP', '部署、验证、复盘同页追踪'],
    sourceLabel: '来源'
  };
  return <section className="channel-page crs-n6-page">
    <div className="channel-hero crs-n6-hero">
      <span className="signal">{text.signal}</span>
      <h2>{text.title}</h2>
      <p>{text.body}</p>
      <div className="crs-n6-meta">
        {text.meta.map(item => <em key={item}>{item}</em>)}
      </div>
    </div>
    <div className="crs-n6-shell">
      <aside className="crs-n6-tabs" aria-label="N6 文档标签">
        {n6Docs.map(doc => <button className={doc.id === activeDoc.id ? 'active' : ''} key={doc.id} onClick={() => setActiveDocId(doc.id)}>
          <span>{doc.kicker}</span>
          <strong>{doc.title}</strong>
          <small>{doc.source}</small>
        </button>)}
      </aside>
      <article className="crs-n6-doc">
        <div className="crs-n6-doc-head">
          <div>
            <span className="signal">{activeDoc.kicker}</span>
            <h3>{activeDoc.title}</h3>
          </div>
          <code>{text.sourceLabel}: {activeDoc.source}</code>
        </div>
        {activeDoc.publicPath
          ? <iframe className="crs-n6-frame" title={activeDoc.title} src={`${import.meta.env.BASE_URL}${activeDoc.publicPath}`} />
          : <MarkdownDocument content={activeDoc.content} />}
      </article>
    </div>
  </section>;
}

function MarkdownDocument({ content }) {
  const blocks = useMemo(() => toMarkdownBlocks(content), [content]);
  return <div className="markdown-doc">
    {blocks.map((block, index) => {
      if (block.type === 'code') return <pre className="markdown-code" key={index}><code>{block.value}</code></pre>;
      if (block.type === 'hr') return <hr key={index} />;
      if (block.type === 'heading') {
        const Heading = `h${Math.min(block.level + 2, 6)}`;
        return <Heading key={index}>{block.value}</Heading>;
      }
      if (block.type === 'quote') return <blockquote key={index}>{block.value}</blockquote>;
      if (block.type === 'list') return <ul key={index}>{block.items.map(item => <li key={item}>{formatInlineMarkdown(item)}</li>)}</ul>;
      if (block.type === 'table') return <pre className="markdown-table" key={index}>{block.value}</pre>;
      return <p key={index}>{formatInlineMarkdown(block.value)}</p>;
    })}
  </div>;
}

function toMarkdownBlocks(content) {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.trim()) continue;
    if (line.startsWith('```')) {
      const fence = [];
      i += 1;
      while (i < lines.length && !lines[i].startsWith('```')) {
        fence.push(lines[i]);
        i += 1;
      }
      blocks.push({ type: 'code', value: fence.join('\n') });
      continue;
    }
    if (/^---+$/.test(line.trim())) {
      blocks.push({ type: 'hr' });
      continue;
    }
    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) {
      blocks.push({ type: 'heading', level: heading[1].length, value: heading[2] });
      continue;
    }
    if (line.startsWith('>')) {
      const quote = [line.replace(/^>\s?/, '')];
      while (i + 1 < lines.length && lines[i + 1].startsWith('>')) {
        i += 1;
        quote.push(lines[i].replace(/^>\s?/, ''));
      }
      blocks.push({ type: 'quote', value: quote.join(' ') });
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      const items = [line.replace(/^\s*[-*]\s+/, '')];
      while (i + 1 < lines.length && /^\s*[-*]\s+/.test(lines[i + 1])) {
        i += 1;
        items.push(lines[i].replace(/^\s*[-*]\s+/, ''));
      }
      blocks.push({ type: 'list', items });
      continue;
    }
    if (line.includes('|') && i + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1])) {
      const table = [line, lines[i + 1]];
      i += 2;
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
        table.push(lines[i]);
        i += 1;
      }
      i -= 1;
      blocks.push({ type: 'table', value: table.join('\n') });
      continue;
    }
    const paragraph = [line];
    while (i + 1 < lines.length && lines[i + 1].trim() && !/^(#{1,6})\s+/.test(lines[i + 1]) && !/^\s*[-*]\s+/.test(lines[i + 1]) && !lines[i + 1].startsWith('```') && !lines[i + 1].startsWith('>')) {
      i += 1;
      paragraph.push(lines[i]);
    }
    blocks.push({ type: 'paragraph', value: paragraph.join(' ') });
  }
  return blocks;
}

function formatInlineMarkdown(text) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) return <code key={index}>{part.slice(1, -1)}</code>;
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
    return part;
  });
}

function SetupKitDetails({ kit, labels }) {
  const details = kit.details || {};
  const summary = details.app_summary || {};
  const appGroups = [
    { key: 'required', title: labels.requiredApps },
    { key: 'recommended', title: labels.recommendedApps },
    { key: 'optional', title: labels.optionalApps }
  ];
  return <div className="setup-details">
    <div className="setup-summary">
      <strong>{labels.appSummary}</strong>
      <div>
        <em>{labels.required}: {summary.required || 0}</em>
        <em>{labels.recommended}: {summary.recommended || 0}</em>
        <em>{labels.optional}: {summary.optional || 0}</em>
        <em>{labels.auto}: {summary.auto || 0}</em>
        <em>{labels.manual}: {summary.manual || 0}</em>
        <em>{labels.secretRequired}: {summary.secret_required || 0}</em>
      </div>
    </div>
    {appGroups.map(group => <div className="setup-app-group" key={group.key}>
      <h4>{group.title}</h4>
      <div className="setup-app-list">
        {(details.apps_by_priority?.[group.key] || []).slice(0, 8).map(app => <article key={app.id}>
          <div className="setup-app-title">
            <strong>{app.name}</strong>
            <AppLinks app={app} />
          </div>
          <span>{app.category}</span>
          <p>{app.purpose}</p>
          <div className="targets">
            <em>{labels.installMode}: {app.install_mode}</em>
            <em>{labels.secret}: {app.secret_required ? labels.yes : labels.no}</em>
          </div>
        </article>)}
      </div>
    </div>)}
    <div className="setup-mini-grids">
      <InfoList title={labels.folders} items={(details.folders || []).map(folder => `${folder.path} - ${folder.purpose}`)} />
      <InfoList title={labels.safety} items={kit.safety?.review_before_publish || []} />
      <WebsiteDirectory title={`${labels.publicWebsites} (${details.public_website_count || 0})`} labels={labels} sites={(details.public_websites || []).slice(0, 12)} />
    </div>
  </div>;
}

function WebsiteDirectory({ title, labels, sites }) {
  return <div className="info-list website-directory">
    <h3>{title}</h3>
    <div className="website-directory-head">
      <span>{labels.siteName}</span>
      <span>{labels.siteUrl}</span>
    </div>
    <div className="website-directory-list">
      {sites.map(site => {
        const url = `https://${site.domain}/`;
        return <a href={url} target="_blank" rel="noreferrer" key={site.domain}>
          <strong>{site.domain.replace(/^www\./, '')}</strong>
          <code>{site.domain}</code>
        </a>;
      })}
    </div>
  </div>;
}

function AppLinks({ app }) {
  const links = [
    { label: 'GitHub', url: app.github, icon: 'github' },
    { label: '官网', url: app.homepage },
    { label: '下载', url: app.download_url }
  ].filter(link => link.url && link.url !== '无' && link.url !== 'none');
  if (!links.length) return null;
  return <div className="setup-app-links">
    {links.map(link => <a className={link.icon === 'github' ? 'github-link' : ''} href={link.url} target="_blank" rel="noreferrer" title={link.label} aria-label={link.label} key={link.label}>
      {link.icon === 'github' ? <GitHubIcon /> : link.label}
    </a>)}
  </div>;
}

function GitHubIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path fill="currentColor" d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2.02c-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.56-.29-5.25-1.28-5.25-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.17 1.18A10.98 10.98 0 0 1 12 6.16c.98 0 1.95.13 2.87.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.11 3.04.74.81 1.19 1.83 1.19 3.09 0 4.42-2.7 5.4-5.27 5.68.42.36.79 1.07.79 2.16v3.01c0 .31.21.67.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
  </svg>;
}

function SubmitChannel({ copied, onCopy, labels }) {
  return <section className="channel-page">
    <div className="channel-hero submit-hero">
      <span className="signal">{labels.submit.signal}</span>
      <h2>{labels.submit.title}</h2>
      <p>{labels.submit.body}</p>
    </div>
    <div className="submit-grid">
      {labels.submit.methods.map(method => <article className="submit-card" key={method.title}>
        <h3>{method.title}</h3>
        <p>{method.body}</p>
        <Command text={method.command} copied={copied} onCopy={onCopy} labels={labels} compact />
      </article>)}
    </div>
    <div className="submit-footer">
      <InfoList title={labels.submit.typesTitle} items={labels.submit.types} />
      <InfoList title={labels.submit.docsTitle} items={labels.submit.docs} />
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
