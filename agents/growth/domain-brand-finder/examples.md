# Examples

## Example Prompt

Use Domain Brand Finder to name an AI API management platform. Prefer `.com`, keep it under 8 letters if possible, avoid names that sound like proxy, relay, reseller, or cheap access.

## Structured Input Example

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

## Expected Behavior

- Generate several naming lanes such as coined AI OS, flow/core, company-linked, infrastructure, and Chinese-friendly hybrid names.
- Check domains through RDAP when network access is available.
- Recommend only apparently available names unless the user asks to include taken or premium inspiration.
- Explain why banned `relay/proxy` wording is avoided.
- Produce a buy-priority list and next steps.
- Warn that availability is not trademark clearance or guaranteed registrar checkout success.
