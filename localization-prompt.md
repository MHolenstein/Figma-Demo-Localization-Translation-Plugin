# Claude Localization Prompt

Use this prompt when you want Claude to generate a **localization CSV** from a Figma page via the MCP connection. This is for locale-targeted updates (city swap, currency, dates, phone numbers, addresses, temperatures, synthetic data) — **not** for full translation (use `translation-prompt.md` for that).

---

## Prompt to give Claude

```
Read the Figma page using the MCP connection: [ADD FIGMA LINK]

USER INPUTS

SOURCE MARKET:
[EXAMPLE: New York, NY USA]

TARGET MARKET:
[EXAMPLE: London, UK]

SOURCE EVENT DATE:
[EXAMPLE: April 14, 2026]

TARGET EVENT DATE:
[EXAMPLE: June 18, 2026]

OPTIONAL NOTES:

Keep currency amounts the same
Convert units only when appropriate
Do not translate general UI copy

TASK

Analyze all TEXT nodes on the current Figma page.

For each TEXT node, capture:

node.id
node.name
node.characters

Generate localization updates ONLY where needed for the target market.

Localization updates may include:

city/location references
event references
dates/times
event-linked date adjustments
currency symbols or formatting
phone numbers
addresses/postcodes
units/temperature
spelling variants
locale-specific terminology
synthetic names/data
region-specific formatting conventions
spelling and terminology variants for the target market's English locale

The amount of localization should match the target market.
Some market changes may require only a few updates.
Others may require broader regional adaptation.

Examples:

"New York" → "San Francisco"
"zip code" → "postcode"
"$24.99" → "£24.99"
"(212) 555-0100" → "+44 20 7946 0100"
"72°F" → "22°C"

IMPORTANT:

Do NOT perform exchange-rate calculations
Currency changes should usually be symbolic/formatting only
Only include rows where a localization change is needed
Do NOT translate general UI copy/buttons/navigation
Preserve punctuation and formatting where possible
Preserve inline formatting tokens, markup wrappers, and template syntax when present.
Only localize the human-readable content inside them.
Generate realistic locale-appropriate synthetic data
Use exact Figma node.id values

When dates appear to be related to the event timeline, shift them appropriately relative to the TARGET EVENT DATE
Preserve relative timing for dates that appear connected to the event
Infer source date formatting from the existing text

If the TARGET MARKET is an English-speaking locale, update spelling and terminology to match that locale's English variant
(for example: British English for London, Australian English for Sydney)

If the TARGET MARKET is not English-speaking, do NOT translate the general language in localization mode
Only update localization details such as dates, currencies, units, addresses, and local place references

A single text node may require multiple localization changes at once
(for example: city names, spelling variants, dates, and formatting in the same sentence)

The target value should represent the FULL final localized text for the node

Do NOT output partial replacements for isolated words or phrases

OUTPUT FORMAT

Output RFC 4180 CSV format with EXACTLY these columns:

source,target,mode,layer_id,layer_name,pattern_type

Rules:

Include the header row
mode should always be "localization"
Quote fields when needed
pattern_type should be one of:
date
currency
phone
address
temperature
name
text

FINAL OUTPUT RULES:

Write the complete CSV to a file named:
localization-output.csv
Save the file in the current project root
The file must contain ONLY valid RFC 4180 CSV content
Quote ALL CSV fields
Escape internal quotes using double quotes ("")
Example:
He said "Hello"
becomes:
"He said ""Hello"""
Do NOT truncate long text nodes
Do NOT summarize or explain the changes
After saving the file, reply ONLY with:
localization-output.csv saved
```

---

## Example output

```csv
source,target,mode,layer_id,layer_name,pattern_type
"$24.99","£24.99",localization,234:89,Price Label,currency
"January 15, 2024","15 January 2024",localization,234:102,Event Date,date
"(212) 555-0100","+44 20 7946 0100",localization,234:115,Contact Phone,phone
"New York, NY 10001","London, EC1A 1BB",localization,234:128,Office Address,address
"72°F","22°C",localization,234:141,Temperature Display,temperature
"John Smith","James Hartley",localization,234:154,User Name,name
"zip code","postcode",localization,234:167,Form Label,text
```

---

## Notes

- The plugin accepts this CSV directly — upload it, review each row, uncheck anything you want to skip, then click Apply.
- Rows with a `layer_id` will navigate directly to that layer when clicked in the review dialog.
- Rows without a `layer_id` will fall back to text matching when possible.
For best precision and navigation behavior, include layer_id values whenever available.
- The `localization-prompt.md` and `translation-prompt.md` outputs can be **combined into one CSV** if needed — the plugin handles both `mode` values in a single pass.
