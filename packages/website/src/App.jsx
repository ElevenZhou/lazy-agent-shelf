import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import catalog from './catalog.json';
import hubCatalog from './hub-catalog.json';
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
const hubByType = hubCatalog.by_type || {};
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
const tabs = ['browse', 'directory', 'aiStarter', 'aiTools', 'workflows', 'workbench', 'setupKits', 'ccSwitch', 'projects', 'submit'];

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

    {activeTab === 'directory' && <DirectoryChannel labels={text} items={hubByType.ai_website || []} />}
    {activeTab === 'aiStarter' && <AIStarterChannel labels={text} />}
    {activeTab === 'aiTools' && <AIToolsChannel labels={text} items={hubByType.tool || []} />}
    {activeTab === 'workflows' && <WorkflowsChannel labels={text} items={hubByType.workflow || []} />}
    {activeTab === 'workbench' && <WorkbenchChannel labels={text} workbench={hubCatalog.workbench} />}
    {activeTab === 'setupKits' && <SetupKitsChannel labels={text} items={hubCatalog.setup_kits || hubByType.setup_kit || []} copied={copied} onCopy={copyCommand} />}
    {activeTab === 'ccSwitch' && <CCSwitchGuide labels={text} copied={copied} onCopy={copyCommand} />}
    {activeTab === 'projects' && <ProjectsChannel labels={text} items={hubByType.project || []} />}
    {activeTab === 'submit' && <SubmitChannel copied={copied} onCopy={copyCommand} labels={text} />}
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
        {(wb.projects || []).map(project => <article className="workbench-project" key={project.id}>
          <div className="card-top"><span>{project.status}</span><code>{project.stage}</code></div>
          <h4>{project.name}</h4>
          <p>{project.summary}</p>
          <div className="targets"><em>{text.fields.risk}: {project.risk_level}</em><em>{text.fields.next}: {project.next_action}</em></div>
        </article>)}
      </section>
      <section className="workbench-panel">
        <h3>{text.sections.risks}</h3>
        {(wb.risks || []).map(risk => <article className="workbench-item" key={risk.id}>
          <strong>{risk.name}</strong>
          <p>{risk.summary}</p>
          <em>{text.fields.risk}: {risk.risk_level}</em>
          <p>{text.fields.mitigation}: {risk.mitigation}</p>
        </article>)}
      </section>
      <section className="workbench-panel">
        <h3>{text.sections.plans}</h3>
        {(wb.plans || []).map(plan => <article className="workbench-item" key={plan.id}>
          <strong>{plan.title}</strong>
          <em>{text.fields.horizon}: {plan.horizon}</em>
          <ul>{(plan.goals || []).map(goal => <li key={goal}>{goal}</li>)}</ul>
        </article>)}
      </section>
      <section className="workbench-panel">
        <h3>{text.sections.progress}</h3>
        {(wb.progress || []).map(item => <article className="workbench-item" key={item.id}>
          <strong>{item.summary}</strong>
          <em>{item.date} · {item.status}</em>
        </article>)}
      </section>
      <section className="workbench-panel">
        <h3>{text.sections.assets}</h3>
        {(wb.assets || []).map(asset => <article className="workbench-item" key={asset.id}>
          <strong>{asset.name}</strong>
          <p>{asset.summary}</p>
          <em>{asset.type} · {asset.status}</em>
        </article>)}
      </section>
      <section className="workbench-panel">
        <h3>{text.sections.relations}</h3>
        {(wb.relations || []).map(relation => <article className="workbench-item" key={relation.id}>
          <strong>{relation.name}</strong>
          <p>{relation.summary}</p>
          <em>{relation.type} · {relation.status}</em>
        </article>)}
      </section>
    </div>
  </section>;
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
