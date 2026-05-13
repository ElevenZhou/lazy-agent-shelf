# 通用域名品牌 Agent 功能规格

Updated: 2026-05-10

## Purpose

This document defines a standalone open-source agent for project naming, brand-domain analysis, domain availability checks, and ranked domain recommendations.

Working name:

- English: `Domain Brand Finder`
- Chinese: `域名品牌推荐 Agent`

The agent should help users move from a project idea to a short, defensible list of brand names and domains that appear registrable.

## Core use cases

1. Name a new project, product, company, app, API service, SaaS, open-source project, or AI agent.
2. Generate brandable domain candidates from a business description.
3. Check domain availability across `.com`, `.ai`, `.io`, `.app`, `.dev`, `.net`, `.org`, and configurable TLDs.
4. Rank available domains by brand quality, trust, memorability, spelling, business fit, and expansion potential.
5. Explain why names are good or bad.
6. Produce a brand memo: name explanation, domain, slogan, brand story, homepage copy, and positioning.
7. Produce a domain report: checked candidates, source evidence, availability result, recommendation, and next steps.

## Non-goals

The agent must not claim:

- Trademark clearance.
- Legal naming safety.
- Guaranteed registration success from RDAP alone.
- ICP filing completion or regulatory compliance.
- Registrar checkout success before purchase is completed.

The agent can recommend follow-up checks for these items.

## Input contract

The agent should accept either natural-language input or structured input.

Minimum natural-language example:

```text
Help me name an AI API platform. Prefer .com. Avoid names that sound like proxy or relay. Keep it under 8 letters if possible.
```

Recommended structured input:

```json
{
  "project_description": "AI API management platform for building business flows and managing model flows",
  "audience": ["developers", "small teams", "AI application operators"],
  "preferred_tlds": ["com", "ai", "io"],
  "max_name_length": 8,
  "required_terms": ["ai"],
  "banned_terms": ["relay", "proxy", "reseller", "cheap"],
  "brand_style": ["infrastructure", "premium SaaS", "short coined name"],
  "existing_company_name": "Timenova Ltd",
  "regions": ["global", "China users possible"],
  "output_language": "zh-CN"
}
```

## Output contract

The agent should produce a concise recommendation first, then details.

Recommended output sections:

```markdown
## Recommendation

1. **Name** — `domain.com`
   - Availability:
   - Why it fits:
   - Risks:
   - Buy priority:

## Checked Domains

| Domain | Status | Source | Notes |
| --- | --- | --- | --- |

## Naming Rationale

## Rejected Options

## Next Steps
```

For a brand-memo request:

```markdown
## Brand Decision

## Name Explanation

## Positioning

## Slogan

## Brand Story

## About Copy

## Homepage Hero

## Voice and Wording Rules

## Launch Checklist
```

## Workflow

### 1. Parse request

Extract:

- Product category.
- Target users.
- Region and compliance implications.
- Preferred TLDs.
- Length constraints.
- Required/banned words.
- Existing company or product names.
- Tone: technical, premium, playful, serious, local, global.
- Whether the user wants only available domains or also taken/premium inspiration.

If missing, infer defaults:

- Prefer `.com`.
- Include `.ai` for AI-native projects.
- Keep names pronounceable.
- Avoid spammy or low-trust terms.
- Only recommend apparently available domains.

### 2. Build naming lanes

Generate candidates across multiple lanes:

- Descriptive: direct category names.
- Coined: pronounceable invented names.
- Company-linked: derived from existing company name.
- Infrastructure-grade: core, gate, mesh, grid, stack, vault, nexus, orbit.
- Benefit-led: control, clarity, flow, cost, trust.
- Local-language hybrid: useful when Chinese naming matters.

The agent should not rely on a single naming lane.

### 3. Generate candidates

For each lane:

- Generate names.
- Normalize domains.
- Produce variants by TLD.
- Add defensive variants if a name is chosen.
- Remove obvious low-quality candidates before checking.

Candidate filters:

- Avoid confusing spelling.
- Avoid hard-to-say consonant clusters.
- Avoid unintended negative meanings.
- Avoid names too close to major brands.
- Avoid words that imply resale, grey-market access, or temporary forwarding unless explicitly wanted.

### 4. Check domain availability

Use RDAP first where possible.

Suggested endpoints:

| TLD | RDAP endpoint pattern |
| --- | --- |
| `.com` | `https://rdap.verisign.com/com/v1/domain/{domain}` |
| `.net` | `https://rdap.verisign.com/net/v1/domain/{domain}` |
| `.ai` | `https://rdap.identitydigital.services/rdap/domain/{domain}` |
| `.io` | `https://rdap.nic.io/domain/{domain}` |
| `.org` | `https://rdap.publicinterestregistry.org/rdap/domain/{domain}` |
| `.app` | `https://rdap.nic.google/domain/{domain}` |
| `.dev` | `https://rdap.nic.google/domain/{domain}` |

Interpretation:

- HTTP `200`: registered or domain object exists.
- HTTP `404`: appears available at registry level.
- Timeout or unsupported TLD: unknown; verify manually.

Important: RDAP 404 is not a registrar guarantee. Premium, reserved, registry restrictions, or cart race conditions can still block purchase.

### 5. Score candidates

Use a 1-5 score for:

- Brand fit.
- Memorability.
- Pronunciation.
- Spelling clarity.
- Trust.
- Expandability.
- TLD quality.
- Risk.

Recommended weighted score:

```text
total =
  brand_fit * 2.0 +
  memorability * 1.5 +
  spelling * 1.2 +
  trust * 1.5 +
  expandability * 1.2 +
  tld_quality * 1.3 -
  risk * 1.5
```

The score should support the recommendation, not replace judgment.

### 6. Recommend

Only include domains that appear available unless the user asks otherwise.

For each recommendation, explain:

- What the name means.
- Why it fits the project.
- What tradeoff exists.
- Whether it should be bought immediately or only kept as backup.

### 7. Produce action plan

Common next steps:

1. Register the chosen domain immediately.
2. Buy defensive variants if budget allows.
3. Run a basic trademark/search-engine conflict check.
4. Configure DNS.
5. Configure HTTPS.
6. Update product docs and user-facing copy.

## Domain status model

Recommended internal enum:

```typescript
type DomainStatus =
  | "available"
  | "registered"
  | "unknown"
  | "premium_or_reserved"
  | "unsupported_tld"
  | "error";
```

Recommended domain result:

```typescript
interface DomainCheckResult {
  domain: string;
  tld: string;
  status: DomainStatus;
  source: string;
  httpStatus?: number;
  checkedAt: string;
  note?: string;
}
```

Recommended candidate:

```typescript
interface BrandCandidate {
  name: string;
  domains: DomainCheckResult[];
  lane: string;
  explanation: string;
  risks: string[];
  score: {
    brandFit: number;
    memorability: number;
    spelling: number;
    trust: number;
    expandability: number;
    tldQuality: number;
    risk: number;
    total: number;
  };
}
```

## CLI design

Suggested commands:

```bash
domain-brand-agent suggest --brief "AI API flow platform" --tlds com,ai --max-length 8
domain-brand-agent check flaios.com timenovai.com example.ai
domain-brand-agent report --input project.json --output report.md
domain-brand-agent brand-memo --name FlaiOS --domain flaios.com --output brand.md
```

Suggested options:

- `--brief`
- `--input`
- `--output`
- `--tlds`
- `--max-length`
- `--require`
- `--ban`
- `--language`
- `--available-only`
- `--include-taken`
- `--json`
- `--timeout`
- `--registrar-url`

## API design

Suggested HTTP endpoints:

```http
POST /v1/suggest
POST /v1/check
POST /v1/report
POST /v1/brand-memo
```

Example request:

```json
{
  "brief": "AI Flow OS for building business flows and managing model flows",
  "preferredTlds": ["com", "ai"],
  "maxLength": 8,
  "bannedWords": ["relay", "proxy"],
  "availableOnly": true,
  "language": "zh-CN"
}
```

Example response:

```json
{
  "recommendations": [
    {
      "name": "FlaiOS",
      "domain": "flaios.com",
      "availability": "registered",
      "reason": "Short coined name combining Flow, AI, and OS.",
      "risk": "Requires brand explanation, but scales well."
    }
  ],
  "checkedAt": "2026-05-10T00:00:00Z"
}
```

## Implementation notes

Recommended language:

- Python for fast CLI implementation.
- TypeScript if building a web UI or SaaS API.

Recommended dependencies:

- HTTP client with timeout/retry.
- Optional LLM provider adapter for candidate generation.
- Local cache for RDAP responses to avoid rate limits.
- Markdown renderer/exporter for reports.

Caching:

- Cache RDAP results for a short TTL, e.g. 10-60 minutes.
- Always show `checkedAt`.
- Let users force refresh.

Rate limits:

- Limit concurrent RDAP calls.
- Use per-domain timeout.
- Retry once on transient network errors.

## Quality rules

The agent must:

- Prefer fewer, better recommendations over long unranked lists.
- State assumptions before recommendations when important.
- Keep availability evidence attached to each domain.
- Separate public brand language from technical implementation language.
- Avoid overclaiming legal or registration certainty.
- Explain naming rejections, not just successes.

## Example task

Input:

```text
Find a name for an AI platform. It builds business flows with AI and manages model flows. Prefer .com, under 8 letters, no relay/proxy words.
```

Expected behavior:

1. Generate lanes such as coined AI OS, flow/core, company-linked, and infrastructure.
2. Check domains.
3. Recommend only apparently available names.
4. Explain why `relay/proxy` words are avoided.
5. Produce a buy priority list.

## Open-source repository structure

Suggested structure:

```text
domain-brand-agent/
├── README.md
├── LICENSE
├── pyproject.toml
├── src/
│   └── domain_brand_agent/
│       ├── __init__.py
│       ├── cli.py
│       ├── rdap.py
│       ├── naming.py
│       ├── scoring.py
│       ├── reporting.py
│       └── schemas.py
├── tests/
│   ├── test_rdap.py
│   ├── test_scoring.py
│   └── test_reporting.py
└── examples/
    ├── project.json
    └── report.md
```

## Validation checklist

- Can check `.com` domains through Verisign RDAP.
- Can handle unavailable network without crashing.
- Can return `unknown` for unsupported TLDs.
- Can produce Markdown and JSON outputs.
- Can rank candidates deterministically.
- Can produce a short final recommendation.
- Can clearly warn that domain availability is not trademark clearance.

