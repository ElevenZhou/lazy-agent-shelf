#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

const ROOT = process.cwd();
const AGENTS_DIR = path.join(ROOT, 'agents');
const COLLECTIONS_DIR = path.join(ROOT, 'collections');
const CONTENT_DIR = path.join(ROOT, 'content');
const SETUP_KITS_DIR = path.join(ROOT, 'setup-kits');
const WORKBENCH_DIR = path.join(ROOT, 'workbench');
const TARGETS = ['claude', 'codex', 'cursor', 'opencode', 'vscode', 'trae', 'generic'];

function readText(file) {
  return fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
}

function parseScalar(value) {
  if (value === undefined) return '';
  return value.trim().replace(/^['"]|['"]$/g, '');
}

function parseAgentYaml(text) {
  const out = {};
  const lines = text.split(/\r?\n/);
  let current = null;
  let parent = null;
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const top = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (top) {
      const [, key, value] = top;
      parent = key;
      current = null;
      if (value) out[key] = parseScalar(value);
      else if (key === 'quality') out[key] = {};
      else out[key] = [];
      continue;
    }
    const nestedListKey = line.match(/^\s{2}([A-Za-z0-9_]+):\s*$/);
    if (nestedListKey && parent && typeof out[parent] === 'object' && !Array.isArray(out[parent])) {
      current = nestedListKey[1];
      out[parent][current] = [];
      continue;
    }
    const item = line.match(/^\s+-\s+(.*)$/) || line.match(/^\s{4}-\s+(.*)$/);
    if (item) {
      if (parent === 'quality' && current) out[parent][current].push(parseScalar(item[1]));
      else if (Array.isArray(out[parent])) out[parent].push(parseScalar(item[1]));
    }
  }
  return out;
}

function findAgentDirs(dir = AGENTS_DIR) {
  if (!fs.existsSync(dir)) return [];
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (fs.existsSync(path.join(full, 'agent.yaml'))) found.push(full);
      else found.push(...findAgentDirs(full));
    }
  }
  return found.sort();
}

function findCollectionDirs(dir = COLLECTIONS_DIR) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => path.join(dir, entry.name))
    .filter(full => fs.existsSync(path.join(full, 'collection.yaml')))
    .sort();
}

function loadAgents() {
  return findAgentDirs().map(dir => {
    const meta = parseAgentYaml(readText(path.join(dir, 'agent.yaml')));
    const prompt = readText(path.join(dir, 'prompt.md'));
    const examplesPath = path.join(dir, 'examples.md');
    const examples = fs.existsSync(examplesPath) ? readText(examplesPath) : '';
    return { dir, meta, prompt, examples };
  });
}

function loadCollections() {
  return findCollectionDirs().map(dir => {
    const meta = parseAgentYaml(readText(path.join(dir, 'collection.yaml')));
    return { dir, meta };
  });
}

function readYaml(file) {
  return YAML.parse(readText(file)) || {};
}

function loadHubContent() {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  const items = [];
  for (const entry of fs.readdirSync(CONTENT_DIR, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.yaml') || entry.name === 'taxonomy.yaml') continue;
    const file = path.join(CONTENT_DIR, entry.name);
    const data = readYaml(file);
    for (const item of data.items || []) {
      items.push({
        ...item,
        source_file: path.relative(ROOT, file).replace(/\\/g, '/')
      });
    }
  }
  return items.sort((a, b) => `${a.type}:${a.id}`.localeCompare(`${b.type}:${b.id}`));
}

function loadSetupKitMeta() {
  if (!fs.existsSync(SETUP_KITS_DIR)) return [];
  const kits = [];
  for (const entry of fs.readdirSync(SETUP_KITS_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const kitFile = path.join(SETUP_KITS_DIR, entry.name, 'kit.yaml');
    if (!fs.existsSync(kitFile)) continue;
    const meta = readYaml(kitFile);
    kits.push({
      ...meta,
      type: 'setup_kit',
      repo_path: path.relative(ROOT, path.dirname(kitFile)).replace(/\\/g, '/'),
      source_file: path.relative(ROOT, kitFile).replace(/\\/g, '/')
    });
  }
  return kits.sort((a, b) => (a.id || '').localeCompare(b.id || ''));
}

function loadWorkbench() {
  if (!fs.existsSync(WORKBENCH_DIR)) return null;
  const readWorkbenchFile = name => {
    const file = path.join(WORKBENCH_DIR, `${name}.yaml`);
    if (!fs.existsSync(file)) return name === 'workbench' ? {} : [];
    const data = readYaml(file);
    return name === 'workbench' ? data : data.items || [];
  };
  const meta = readWorkbenchFile('workbench');
  const projects = readWorkbenchFile('projects');
  const assets = readWorkbenchFile('assets');
  const relations = readWorkbenchFile('relations');
  const progress = readWorkbenchFile('progress');
  const risks = readWorkbenchFile('risks');
  const plans = readWorkbenchFile('plans');
  return {
    schema_version: 1,
    meta,
    summary: {
      projects: projects.length,
      active_projects: projects.filter(item => item.status === 'active').length,
      high_risks: risks.filter(item => ['high', 'critical'].includes(item.risk_level)).length,
      active_plans: plans.filter(item => item.status === 'active').length,
      recent_progress: progress.length,
      assets: assets.length,
      relations: relations.length
    },
    projects,
    assets,
    relations,
    progress,
    risks,
    plans
  };
}

function validateHubItem(item) {
  const errors = [];
  const validTypes = ['agent', 'skill', 'ai_website', 'tool', 'workflow', 'project', 'setup_kit', 'memory', 'guide'];
  const validRatings = ['S', 'A', 'B', 'C', 'Watch'];
  const validStatuses = ['draft', 'review', 'published', 'archived', 'mvp', 'planned'];
  for (const key of ['id', 'type', 'name', 'category']) {
    if (!item[key]) errors.push(`missing ${key}`);
  }
  if (item.id && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id)) errors.push('id must be kebab-case');
  if (item.type && !validTypes.includes(item.type)) errors.push(`unsupported type ${item.type}`);
  if (item.category && !/^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/.test(item.category)) errors.push('category must use lowercase path segments');
  if (!item.one_liner && !item.description) errors.push('missing one_liner or description');
  if (!Array.isArray(item.best_for) || item.best_for.length === 0) errors.push('missing list best_for');
  if (!Array.isArray(item.not_good_for) || item.not_good_for.length === 0) errors.push('missing list not_good_for');
  if (item.rating && !validRatings.includes(item.rating)) errors.push(`invalid rating ${item.rating}`);
  if (item.status && !validStatuses.includes(item.status)) errors.push(`invalid status ${item.status}`);
  return errors;
}

function validateHub(args = {}) {
  const items = loadHubContent();
  const setupKits = loadSetupKitMeta().map(kit => ({
    ...(items.find(item => item.type === 'setup_kit' && item.id === kit.id) || {}),
    ...kit
  }));
  const mergedItems = [
    ...items.filter(item => item.type !== 'setup_kit'),
    ...setupKits
  ];
  const seen = new Set();
  let failures = 0;
  for (const item of mergedItems) {
    const key = `${item.type}:${item.id}`;
    const errors = validateHubItem(item);
    if (seen.has(key)) errors.push(`duplicate ${key}`);
    seen.add(key);
    if (errors.length) {
      failures += errors.length;
      console.error(`FAIL ${key} (${item.source_file || 'unknown source'})`);
      for (const error of errors) console.error(`  - ${error}`);
    } else {
      console.log(`OK   ${key}`);
    }
  }
  if (failures) process.exit(1);
  console.log(`\nHub lint passed for ${mergedItems.length} items.`);
}

function validateAgent(agent) {
  const errors = [];
  const { meta, prompt } = agent;
  for (const key of ['id', 'name', 'category', 'version', 'description']) {
    if (!meta[key]) errors.push(`missing ${key}`);
  }
  for (const key of ['compatible', 'inputs', 'outputs']) {
    if (!Array.isArray(meta[key]) || meta[key].length === 0) errors.push(`missing list ${key}`);
  }
  if (!meta.quality?.checklist || meta.quality.checklist.length < 3) errors.push('quality.checklist needs at least 3 items');
  for (const heading of ['## Use When', '## Do Not Use When', '## Operating Workflow', '## Safety Boundaries']) {
    if (!prompt.includes(heading)) errors.push(`prompt missing ${heading}`);
  }
  return errors;
}

function validateCollection(collection, agentIds) {
  const errors = [];
  const { meta } = collection;
  for (const key of ['id', 'name', 'description']) {
    if (!meta[key]) errors.push(`missing ${key}`);
  }
  if (!Array.isArray(meta.agents) || meta.agents.length === 0) errors.push('missing list agents');
  for (const id of meta.agents || []) {
    if (!agentIds.has(id)) errors.push(`unknown agent ${id}`);
  }
  return errors;
}

function frontMatter(meta) {
  return `---\nname: ${meta.name}\nid: ${meta.id}\ncategory: ${meta.category}\nversion: ${meta.version}\ndescription: ${meta.description}\n---\n\n`;
}

function render(agent, target) {
  const { meta, prompt, examples } = agent;
  const base = `${prompt.trim()}\n\n${examples.trim()}\n`;
  if (target === 'codex') {
    return `---\nname: ${meta.id}\ndescription: ${meta.description}\n---\n\n${base}`;
  }
  if (target === 'cursor') {
    return `---\ndescription: ${meta.description}\nglobs: **/*\nalwaysApply: false\n---\n\n${base}`;
  }
  if (target === 'claude') {
    return frontMatter(meta) + base;
  }
  if (target === 'opencode') {
    return `# ${meta.name}\n\nAgent ID: ${meta.id}\nCategory: ${meta.category}\n\n${base}`;
  }
  if (target === 'vscode') {
    return `# ${meta.name} Copilot Instructions\n\n${base}`;
  }
  if (target === 'trae') {
    return `# Trae Agent: ${meta.name}\n\n${base}`;
  }
  if (target === 'generic') {
    return `## ${meta.name} (${meta.id})\n\n${base}`;
  }
  throw new Error(`Unknown target: ${target}`);
}

function outputPath(outRoot, agent, target) {
  const id = agent.meta.id;
  if (target === 'codex') return path.join(outRoot, 'codex', 'skills', id, 'SKILL.md');
  if (target === 'cursor') return path.join(outRoot, 'cursor', '.cursor', 'rules', `${id}.mdc`);
  if (target === 'claude') return path.join(outRoot, 'claude', '.claude', 'agents', `${id}.md`);
  if (target === 'opencode') return path.join(outRoot, 'opencode', '.opencode', 'agents', `${id}.md`);
  if (target === 'vscode') return path.join(outRoot, 'vscode', '.github', 'instructions', `${id}.instructions.md`);
  if (target === 'trae') return path.join(outRoot, 'trae', '.trae', 'agents', `${id}.md`);
  if (target === 'generic') return path.join(outRoot, 'generic', 'AGENTS.md');
}

function writeFile(file, text, append = false) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (append) fs.appendFileSync(file, text + '\n', 'utf8');
  else fs.writeFileSync(file, text, 'utf8');
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const key = token.slice(2);
      args[key] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
    } else args._.push(token);
  }
  return args;
}

function resolveTargets(targetArg) {
  const raw = targetArg || 'generic';
  const targets = raw === 'all' ? TARGETS : raw.split(',').map(x => x.trim()).filter(Boolean);
  for (const target of targets) {
    if (!TARGETS.includes(target)) throw new Error(`Unsupported target ${target}`);
  }
  return targets;
}

function list() {
  const agents = loadAgents();
  for (const a of agents) console.log(`${a.meta.id.padEnd(28)} ${a.meta.category.padEnd(22)} ${a.meta.name}`);
  console.log(`\n${agents.length} agents`);
}

function listCollections() {
  const collections = loadCollections();
  for (const c of collections) {
    console.log(`${c.meta.id.padEnd(24)} ${(c.meta.agents || []).length.toString().padStart(2)} agents  ${c.meta.name}`);
  }
  console.log(`\n${collections.length} collections`);
}

function lint() {
  const agents = loadAgents();
  const agentIds = new Set(agents.map(agent => agent.meta.id));
  const collections = loadCollections();
  let failures = 0;
  for (const agent of agents) {
    const errors = validateAgent(agent);
    if (errors.length) {
      failures += errors.length;
      console.error(`FAIL ${agent.dir}`);
      for (const e of errors) console.error(`  - ${e}`);
    } else console.log(`OK   ${agent.meta.id}`);
  }
  for (const collection of collections) {
    const errors = validateCollection(collection, agentIds);
    if (errors.length) {
      failures += errors.length;
      console.error(`FAIL ${collection.dir}`);
      for (const e of errors) console.error(`  - ${e}`);
    } else console.log(`OK   ${collection.meta.id}`);
  }
  if (failures) process.exit(1);
  console.log(`\nLint passed for ${agents.length} agents and ${collections.length} collections.`);
}

function build(args) {
  const outRoot = path.resolve(args.out || 'generated');
  const targets = resolveTargets(args.target || TARGETS.join(','));
  const agents = loadAgents();
  for (const target of targets) {
    if (!TARGETS.includes(target)) throw new Error(`Unsupported target ${target}`);
    const genericPath = target === 'generic' ? outputPath(outRoot, agents[0], target) : null;
    if (genericPath) writeFile(genericPath, '# Generated AGENTS.md\n', false);
    for (const agent of agents) {
      const file = outputPath(outRoot, agent, target);
      writeFile(file, render(agent, target), target === 'generic');
    }
  }
  console.log(`Built ${agents.length} agents for ${targets.join(', ')} into ${outRoot}`);
}

function catalog(args) {
  const outFile = path.resolve(args.out || 'packages/website/src/catalog.json');
  const agents = loadAgents().map(agent => ({
    id: agent.meta.id,
    name: agent.meta.name,
    zh_name: agent.meta.zh_name || '',
    category: agent.meta.category,
    version: agent.meta.version,
    description: agent.meta.description,
    zh_description: agent.meta.zh_description || '',
    tags: agent.meta.tags || [],
    scenarios: agent.meta.scenarios || [],
    tools: agent.meta.tools || [],
    compatible: agent.meta.compatible || [],
    inputs: agent.meta.inputs || [],
    outputs: agent.meta.outputs || [],
    path: path.relative(ROOT, agent.dir).replace(/\\/g, '/')
  }));
  const agentIds = new Set(agents.map(agent => agent.id));
  const collections = loadCollections().map(collection => ({
    id: collection.meta.id,
    name: collection.meta.name,
    zh_name: collection.meta.zh_name || '',
    description: collection.meta.description,
    zh_description: collection.meta.zh_description || '',
    tags: collection.meta.tags || [],
    agents: (collection.meta.agents || []).filter(id => agentIds.has(id)),
    use_cases: collection.meta.use_cases || [],
    zh_use_cases: collection.meta.zh_use_cases || [],
    path: path.relative(ROOT, collection.dir).replace(/\\/g, '/')
  }));
  const categories = [...new Set(agents.map(agent => agent.category.split('/')[0]))].sort();
  const data = {
    schema_version: 1,
    agent_count: agents.length,
    collection_count: collections.length,
    categories,
    agents,
    collections
  };
  writeFile(outFile, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`Wrote catalog for ${agents.length} agents and ${collections.length} collections to ${outFile}`);
}

function hubCatalog(args) {
  const outFile = path.resolve(args.out || 'packages/website/src/hub-catalog.json');
  const contentItems = loadHubContent();
  const setupKitMeta = loadSetupKitMeta();
  const workbench = loadWorkbench();
  const setupContentById = new Map(contentItems.filter(item => item.type === 'setup_kit').map(item => [item.id, item]));
  const setupKits = setupKitMeta.map(kit => ({
    ...(setupContentById.get(kit.id) || {}),
    ...kit,
    details: loadSetupKitDetails(kit)
  }));
  const mergedItems = [
    ...contentItems.filter(item => item.type !== 'setup_kit'),
    ...setupKits
  ].sort((a, b) => `${a.type}:${a.id}`.localeCompare(`${b.type}:${b.id}`));
  const byType = {};
  for (const item of mergedItems) {
    const type = item.type || 'unknown';
    if (!byType[type]) byType[type] = [];
    byType[type].push(item);
  }
  const data = {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    item_count: mergedItems.length,
    types: Object.keys(byType).sort(),
    items: mergedItems,
    by_type: byType,
    setup_kits: setupKits
  };
  if (workbench) data.workbench = workbench;
  writeFile(outFile, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`Wrote hub catalog for ${mergedItems.length} items and ${setupKits.length} setup kits to ${outFile}`);
}

function install(args) {
  const id = args._[1];
  if (!id) throw new Error('Usage: install <agent-id> --target <target> --out <directory>');
  const targets = resolveTargets(args.target || 'generic');
  const agent = loadAgents().find(a => a.meta.id === id);
  if (!agent) throw new Error(`Agent not found: ${id}`);
  const outRoot = path.resolve(args.out || 'generated/install');
  for (const target of targets) {
    const file = outputPath(outRoot, agent, target);
    writeFile(file, render(agent, target), target === 'generic');
  }
  console.log(`Installed ${id} for ${targets.join(', ')} into ${outRoot}`);
}

function installCollection(args) {
  const id = args._[1];
  if (!id) throw new Error('Usage: install-collection <collection-id> --target <target> --out <directory>');
  const targets = resolveTargets(args.target || 'generic');
  const agents = loadAgents();
  const byId = new Map(agents.map(agent => [agent.meta.id, agent]));
  const collection = loadCollections().find(c => c.meta.id === id);
  if (!collection) throw new Error(`Collection not found: ${id}`);
  const outRoot = path.resolve(args.out || 'generated/install');
  for (const target of targets) {
    for (const agentId of collection.meta.agents || []) {
      const agent = byId.get(agentId);
      if (!agent) throw new Error(`Collection ${id} references missing agent ${agentId}`);
      const file = outputPath(outRoot, agent, target);
      writeFile(file, render(agent, target), target === 'generic');
    }
  }
  console.log(`Installed collection ${id} with ${(collection.meta.agents || []).length} agents for ${targets.join(', ')} into ${outRoot}`);
}

function findSetupKit(id) {
  const kit = loadSetupKitMeta().find(item => item.id === id);
  if (!kit) throw new Error(`Setup kit not found: ${id}`);
  return kit;
}

function setupList() {
  const kits = loadSetupKitMeta();
  for (const kit of kits) {
    const status = kit.status || 'unknown';
    console.log(`${kit.id.padEnd(28)} ${status.padEnd(10)} ${kit.name}`);
  }
  console.log(`\n${kits.length} setup kits`);
}

function setupShow(args) {
  const id = args._[2];
  if (!id) throw new Error('Usage: setup show <kit-id>');
  const kit = findSetupKit(id);
  console.log(`${kit.name} (${kit.id})`);
  console.log(`Description: ${kit.description || ''}`);
  console.log(`Version: ${kit.version || ''}`);
  console.log(`Status: ${kit.status || ''}`);
  console.log(`Path: ${kit.repo_path}`);
  if (kit.modes?.length) {
    console.log('\nModes:');
    for (const mode of kit.modes) {
      console.log(`  - ${mode.id}: ${mode.name} (${(mode.includes || []).join(', ')})`);
    }
  }
  if (kit.entrypoints) {
    console.log('\nEntrypoints:');
    for (const [name, value] of Object.entries(kit.entrypoints)) console.log(`  - ${name}: ${value}`);
  }
  if (kit.safety?.review_before_publish?.length) {
    console.log('\nSafety notes:');
    for (const note of kit.safety.review_before_publish) console.log(`  - ${note}`);
  }
}

function resolveSetupPath(kit, relativePath) {
  return path.join(ROOT, kit.repo_path, relativePath);
}

function copySetupAsset(source, outArg, defaultName) {
  if (!fs.existsSync(source)) throw new Error(`Source file not found: ${source}`);
  if (!outArg) {
    console.log(path.resolve(source));
    return;
  }
  const outPath = path.resolve(outArg);
  const target = path.extname(outPath) ? outPath : path.join(outPath, defaultName);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  console.log(`Wrote ${target}`);
}

function csvEscape(value) {
  const text = value === undefined || value === null ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else current += char;
  }
  values.push(current);
  return values;
}

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(line => line.trim());
  if (!lines.length) return { headers: [], rows: [] };
  const headers = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map(line => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] || '']));
  });
  return { headers, rows };
}

function writeCsv(file, headers, rows) {
  const text = [
    headers.map(csvEscape).join(','),
    ...rows.map(row => headers.map(header => csvEscape(row[header])).join(','))
  ].join('\n') + '\n';
  writeFile(file, text);
}

function isPrivateDomain(domain) {
  const value = (domain || '').toLowerCase().trim();
  if (!value) return true;
  if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(value)) return true;
  if (/^\d{1,3}(?:\.\d{1,3}){3}(?::\d+)?$/.test(value)) return true;
  const privateHints = [
    'admin',
    'console',
    'dashboard',
    'merchant',
    'account',
    'accounts.',
    'login',
    'auth',
    'api.',
    'api2.',
    'api3.',
    'feishu.cn',
    'service.gov',
    'tax.',
    'proxy',
    'cheap',
    'vcc',
    'mail.',
    'bank',
    'paypal',
    'stripe',
    'billing',
    'buy.',
    'invoice',
    'gov.uk',
    'my.'
  ];
  if (privateHints.some(hint => value.includes(hint))) return true;
  const publicAllowList = [
    'github.com',
    'google.com',
    'baidu.com',
    'flaios.com',
    'cloud.tencent.com',
    'joinquant.com',
    'coinglass.com',
    'litemonitor.cn',
    'trae.cn',
    'doubao.com',
    'chatgpt.com',
    'claude.ai',
    'perplexity.ai',
    'openai.com',
    'code.visualstudio.com',
    'cherry-ai.com',
    'clash-verge.org',
    'gofrp.org',
    'nssm.cc',
    'tdx.com.cn',
    'feishu.cn',
    'comfyanonymous.github.io'
  ];
  return !publicAllowList.some(domain => value === domain || value.endsWith(`.${domain}`));
}

function bookmarkHtml(title, sites) {
  const now = Math.floor(Date.now() / 1000);
  const lines = [
    '<!DOCTYPE NETSCAPE-Bookmark-file-1>',
    '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
    `<TITLE>${title}</TITLE>`,
    '<H1>Bookmarks</H1>',
    '<DL><p>',
    `  <DT><H3 ADD_DATE="${now}">${title}</H3>`,
    '  <DL><p>'
  ];
  for (const site of sites) {
    const domain = site['域名'] || site.domain || site.name || '';
    const url = domain.startsWith('http') ? domain : `https://${domain}/`;
    lines.push(`    <DT><A HREF="${url}" ADD_DATE="${now}">${domain}</A>`);
  }
  lines.push('  </DL><p>', '</DL><p>');
  return lines.join('\n') + '\n';
}

function publicWebsiteRows(kitRoot, includePrivate = false) {
  const websitesCsv = path.join(kitRoot, 'websites.csv');
  if (!fs.existsSync(websitesCsv)) return [];
  const { rows } = parseCsv(readText(websitesCsv));
  return includePrivate ? rows : rows.filter(row => !isPrivateDomain(row['域名']));
}

function loadSetupKitDetails(kit) {
  const kitRoot = path.join(ROOT, kit.repo_path);
  const appsFile = path.join(kitRoot, 'apps.yaml');
  const foldersFile = path.join(kitRoot, 'folders.yaml');
  const details = {};
  if (fs.existsSync(appsFile)) {
    const apps = readYaml(appsFile).apps || [];
    details.apps = apps;
    details.app_summary = {
      total: apps.length,
      required: apps.filter(app => app.priority === 'required').length,
      recommended: apps.filter(app => app.priority === 'recommended').length,
      optional: apps.filter(app => app.priority === 'optional').length,
      auto: apps.filter(app => app.install_mode === 'auto').length,
      manual: apps.filter(app => app.install_mode === 'manual').length,
      secret_required: apps.filter(app => app.secret_required).length
    };
    details.apps_by_priority = {
      required: apps.filter(app => app.priority === 'required'),
      recommended: apps.filter(app => app.priority === 'recommended'),
      optional: apps.filter(app => app.priority === 'optional')
    };
  }
  if (fs.existsSync(foldersFile)) {
    const folders = readYaml(foldersFile);
    details.folders = folders.folders || [];
    details.folder_root = folders.root || {};
  }
  const publicSites = publicWebsiteRows(kitRoot, false);
  details.public_websites = publicSites.slice(0, 24).map(row => ({
    domain: row['域名'],
    visit_count_30d: Number(row['Chrome访问计数合计'] || 0),
    typed_count_30d: Number(row['手动输入计数合计'] || 0),
    last_visit_at: row['最近访问时间'] || ''
  }));
  details.public_website_count = publicSites.length;
  return details;
}

function setupExport(args) {
  const id = args._[2];
  if (!id) throw new Error('Usage: setup export <kit-id> --out <directory> [--include-private]');
  const kit = findSetupKit(id);
  const outRoot = path.resolve(args.out || path.join('generated', 'setup-exports', id));
  const includePrivate = Boolean(args['include-private']);
  fs.mkdirSync(outRoot, { recursive: true });

  const kitRoot = path.join(ROOT, kit.repo_path);
  const copied = [];
  const copyIfExists = (relativePath, targetName = relativePath) => {
    const source = path.join(kitRoot, relativePath);
    if (!fs.existsSync(source)) return;
    const target = path.join(outRoot, targetName);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
    copied.push(targetName.replace(/\\/g, '/'));
  };

  copyIfExists('kit.yaml');
  copyIfExists('apps.yaml');
  copyIfExists('apps.csv');
  copyIfExists('folders.yaml');
  copyIfExists('README.md');
  copyIfExists(kit.entrypoints?.agent_prompt || 'agent-prompts/general-setup-agent.md');
  if (kit.entrypoints?.windows) copyIfExists(kit.entrypoints.windows);

  let publicSites = [];
  const websitesCsv = path.join(kitRoot, 'websites.csv');
  if (fs.existsSync(websitesCsv)) {
    const { headers } = parseCsv(readText(websitesCsv));
    publicSites = publicWebsiteRows(kitRoot, includePrivate);
    writeCsv(path.join(outRoot, includePrivate ? 'websites.csv' : 'websites.public.csv'), headers, publicSites);
    writeFile(path.join(outRoot, 'bookmarks.html'), bookmarkHtml(`${kit.name} Websites`, publicSites));
    copied.push(includePrivate ? 'websites.csv' : 'websites.public.csv', 'bookmarks.html');
  }

  const summary = `# ${kit.name} Export\n\n` +
    `- Kit: ${kit.id}\n` +
    `- Source: ${kit.repo_path}\n` +
    `- Include private websites: ${includePrivate}\n` +
    `- Website count: ${publicSites.length}\n\n` +
    `## Files\n\n${copied.map(file => `- ${file}`).join('\n')}\n\n` +
    `## Safety\n\n- Review scripts before running.\n- Do not share private domains, API keys, cookies, tokens, or proxy subscriptions.\n- Run Windows scripts with -DryRun before real installation.\n`;
  writeFile(path.join(outRoot, 'EXPORT-README.md'), summary);
  console.log(`Exported ${kit.id} to ${outRoot}`);
  console.log(`Files: ${copied.length + 1}`);
}

function setupScript(args) {
  const id = args._[2];
  if (!id) throw new Error('Usage: setup script <kit-id> --platform <windows|mac> --out <file-or-dir>');
  const platform = args.platform || 'windows';
  const kit = findSetupKit(id);
  let relativePath = kit.entrypoints?.[platform];
  if (!relativePath && platform === 'windows') relativePath = 'scripts/windows/bootstrap.ps1';
  if (!relativePath && platform === 'mac') relativePath = 'scripts/mac/bootstrap.sh';
  if (!relativePath) throw new Error(`No script entrypoint for platform ${platform}`);
  const source = resolveSetupPath(kit, relativePath);
  copySetupAsset(source, args.out, path.basename(relativePath));
  if (!args.out && platform === 'windows') {
    console.log(`\nDryRun command:\npowershell -NoProfile -ExecutionPolicy Bypass -File "${source}" -Mode Basic -DryRun`);
  }
}

function renderSetupAgentPrompt(kit, target) {
  const promptPath = kit.entrypoints?.agent_prompt || 'agent-prompts/general-setup-agent.md';
  const source = resolveSetupPath(kit, promptPath);
  if (!fs.existsSync(source)) throw new Error(`Agent prompt not found: ${source}`);
  const prompt = readText(source).trim();
  if (target === 'codex') {
    return `---\nname: ${kit.id}-setup\ndescription: Initialize ${kit.name} from its setup kit files, with DryRun-first safety boundaries.\n---\n\n${prompt}\n`;
  }
  if (target === 'claude') {
    return `---\nname: ${kit.id}-setup\ndescription: Initialize ${kit.name} from its setup kit files.\n---\n\n${prompt}\n`;
  }
  return prompt + '\n';
}

function setupAgent(args) {
  const id = args._[2];
  if (!id) throw new Error('Usage: setup agent <kit-id> --target <codex|claude|generic> --out <file-or-dir>');
  const target = args.target || 'generic';
  const kit = findSetupKit(id);
  const text = renderSetupAgentPrompt(kit, target);
  if (!args.out) {
    console.log(text);
    return;
  }
  const outPath = path.resolve(args.out);
  const defaultName = target === 'codex' ? 'SKILL.md' : `${kit.id}-setup.md`;
  const file = path.extname(outPath) ? outPath : path.join(outPath, defaultName);
  writeFile(file, text);
  console.log(`Wrote ${file}`);
}

function setup(args) {
  const subcommand = args._[1] || 'list';
  if (subcommand === 'list') setupList();
  else if (subcommand === 'show') setupShow(args);
  else if (subcommand === 'export') setupExport(args);
  else if (subcommand === 'script') setupScript(args);
  else if (subcommand === 'agent') setupAgent(args);
  else throw new Error(`Unknown setup command: ${subcommand}`);
}

function help() {
  console.log(`Lazy Agent Shelf CLI\n\nCommands:\n  list\n  collections\n  lint\n  lint:hub\n  catalog --out <file>\n  hub-catalog --out <file>\n  build --target <all|claude,codex,cursor,opencode,vscode,trae,generic> --out <dir>\n  install <agent-id> --target <target> --out <dir>\n  install-collection <collection-id> --target <target> --out <dir>\n  setup list\n  setup show <kit-id>\n  setup export <kit-id> --out <directory> [--include-private]\n  setup script <kit-id> --platform <windows|mac> --out <file-or-dir>\n  setup agent <kit-id> --target <codex|claude|generic> --out <file-or-dir>\n`);
}

const args = parseArgs(process.argv.slice(2));
const cmd = args._[0] || 'help';
try {
  if (cmd === 'list') list();
  else if (cmd === 'collections') listCollections();
  else if (cmd === 'lint') lint();
  else if (cmd === 'lint:hub') validateHub(args);
  else if (cmd === 'catalog') catalog(args);
  else if (cmd === 'hub-catalog') hubCatalog(args);
  else if (cmd === 'build') build(args);
  else if (cmd === 'install') install(args);
  else if (cmd === 'install-collection') installCollection(args);
  else if (cmd === 'setup') setup(args);
  else help();
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
