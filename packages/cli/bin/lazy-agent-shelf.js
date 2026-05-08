#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const AGENTS_DIR = path.join(ROOT, 'agents');
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

function loadAgents() {
  return findAgentDirs().map(dir => {
    const meta = parseAgentYaml(readText(path.join(dir, 'agent.yaml')));
    const prompt = readText(path.join(dir, 'prompt.md'));
    const examplesPath = path.join(dir, 'examples.md');
    const examples = fs.existsSync(examplesPath) ? readText(examplesPath) : '';
    return { dir, meta, prompt, examples };
  });
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

function list() {
  const agents = loadAgents();
  for (const a of agents) console.log(`${a.meta.id.padEnd(28)} ${a.meta.category.padEnd(22)} ${a.meta.name}`);
  console.log(`\n${agents.length} agents`);
}

function lint() {
  const agents = loadAgents();
  let failures = 0;
  for (const agent of agents) {
    const errors = validateAgent(agent);
    if (errors.length) {
      failures += errors.length;
      console.error(`FAIL ${agent.dir}`);
      for (const e of errors) console.error(`  - ${e}`);
    } else console.log(`OK   ${agent.meta.id}`);
  }
  if (failures) process.exit(1);
  console.log(`\nLint passed for ${agents.length} agents.`);
}

function build(args) {
  const outRoot = path.resolve(args.out || 'generated');
  const targetArg = args.target || TARGETS.join(',');
  const targets = targetArg === 'all' ? TARGETS : targetArg.split(',').map(x => x.trim());
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
    tags: agent.meta.tags || [],
    tools: agent.meta.tools || [],
    compatible: agent.meta.compatible || [],
    inputs: agent.meta.inputs || [],
    outputs: agent.meta.outputs || [],
    path: path.relative(ROOT, agent.dir).replace(/\\/g, '/')
  }));
  const categories = [...new Set(agents.map(agent => agent.category.split('/')[0]))].sort();
  const data = {
    schema_version: 1,
    agent_count: agents.length,
    categories,
    agents
  };
  writeFile(outFile, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`Wrote catalog for ${agents.length} agents to ${outFile}`);
}

function install(args) {
  const id = args._[1];
  if (!id) throw new Error('Usage: install <agent-id> --target <target> --out <directory>');
  const target = args.target || 'generic';
  if (!TARGETS.includes(target)) throw new Error(`Unsupported target ${target}`);
  const agent = loadAgents().find(a => a.meta.id === id);
  if (!agent) throw new Error(`Agent not found: ${id}`);
  const outRoot = path.resolve(args.out || 'generated/install');
  const file = outputPath(outRoot, agent, target);
  writeFile(file, render(agent, target), target === 'generic');
  console.log(`Installed ${id} for ${target} at ${file}`);
}

function help() {
  console.log(`Lazy Agent Shelf CLI\n\nCommands:\n  list\n  lint\n  catalog --out <file>\n  build --target <all|claude,codex,cursor,opencode,vscode,trae,generic> --out <dir>\n  install <agent-id> --target <target> --out <dir>\n`);
}

const args = parseArgs(process.argv.slice(2));
const cmd = args._[0] || 'help';
try {
  if (cmd === 'list') list();
  else if (cmd === 'lint') lint();
  else if (cmd === 'catalog') catalog(args);
  else if (cmd === 'build') build(args);
  else if (cmd === 'install') install(args);
  else help();
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
