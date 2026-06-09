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

This prompt is for localization, not full translation.

Do NOT translate general UI copy, buttons, navigation, or body text into another language.

If the TARGET MARKET is an English-speaking locale, update spelling, terminology, formatting, and market-specific conventions for that locale’s English variant.

Examples:
"analyze" → "analyse"
"zip code" → "postcode"
"cell phone" → "mobile phone"

If the TARGET MARKET is not English-speaking, do NOT translate general language in localization mode. Only update localization details such as dates, currencies, units, addresses, phone numbers, local place references, and locale-specific formatting.

LOCALIZATION CATEGORIES

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
urls

The amount of localization should match the target market. Some market changes may require only a few updates. Others may require broader regional adaptation.

GENERAL LOCALIZATION RULES

Only include rows where a localization change is needed.

Use exact Figma node.id values.

Generate realistic locale-appropriate synthetic data.

Preserve punctuation and surrounding meaning.

Preserve template syntax, variables, inline wrappers, and markup when present. Only localize the human-readable content inside them.

Do NOT remove, collapse, or normalize line breaks, indentation, tabs, bullets, or spacing.

Do NOT use markdown syntax to represent styling.

Do NOT output formatting placeholders or wrapper tokens, including but not limited to:
{ts1}
{/ts1}
{ts2}
{/ts2}
{b}
{/b}


**
__

Do NOT output invisible control characters, zero-width spaces, replacement characters, byte-order marks, or other hidden formatting characters.

Output only literal visible source text and literal visible target text.

DATES AND EVENT TIMING

When dates appear related to the event timeline, shift them appropriately relative to the TARGET EVENT DATE.

Preserve relative timing for dates that appear connected to the event.

Infer source date formatting from the existing text, then update to the target market’s expected date formatting.

Examples:
"April 14, 2026" → "18 June 2026"
"3 weeks" → "2 weeks"

CURRENCY LOCALIZATION

When SOURCE MARKET and TARGET MARKET use different currencies, update visible currency symbols, currency codes, and currency formatting for the target market.

Do this even when the optional notes say to keep currency amounts the same.

“Keep currency amounts the same” means:

do not perform exchange-rate calculations
preserve the numeric amount
update only the currency symbol, code, placement, and formatting as appropriate

Examples:
"$35M" → "£35M"
"$50M target" → "£50M target"
"$15M remaining" → "£15M remaining"
"$24.99" → "£24.99"
"USD 35M" → "GBP 35M"

For currency values inside longer text nodes, output one localization row per exact visible currency substring when possible.

Do NOT rewrite a full sentence just to update currency symbols.

SUBSTRING REPLACEMENT RULES

Localization mode should preserve Figma text styling, line breaks, indentation, list formatting, and rich text ranges.

To do this, prefer targeted substring replacements instead of full-node rewrites.

For each localization change:

source = smallest exact visible substring from the Figma text node that needs to change
target = exact visible localized replacement for that substring only
layer_id = exact Figma node.id for the parent text node
layer_name = Figma text node name
pattern_type = the kind of localization being performed

The plugin performs a literal string search for source, so source must match the visible Figma text character-for-character.

Target must contain only the replacement text. Do not include markdown, wrapper tokens, or invisible characters.

Do NOT output the full text node unless the entire node truly needs to change.

Do NOT rewrite surrounding text that does not need localization.

If the Figma text node contains multiple unrelated localization changes, output one row per changed phrase where possible.

If the same source substring appears multiple times in the same text node and only one instance should change, use the smallest longer phrase that uniquely identifies the intended replacement while still preserving as much surrounding text as possible.

SUBSTRING EXAMPLE

If the Figma text node says:

You’ve generated $35M toward your $50M target, leaving $15M remaining.

And only currency formatting needs to change, output separate targeted rows like:

"$35M","£35M","localization","123:456","Pipeline Summary","currency"
"$50M","£50M","localization","123:456","Pipeline Summary","currency"
"$15M","£15M","localization","123:456","Pipeline Summary","currency"

Do NOT output:

"You’ve generated $35M toward your $50M target, leaving $15M remaining.","You’ve generated £35M toward your £50M target, leaving £15M remaining.","localization","123:456","Pipeline Summary","currency"

OUTPUT FORMAT

Output RFC 4180 CSV format with EXACTLY these columns:

source,target,mode,layer_id,layer_name,pattern_type

Column definitions:

source = exact visible substring from the Figma text node to replace
target = exact visible localized replacement substring
mode = "localization"
layer_id = exact Figma node.id for the parent text node
layer_name = Figma text node name
pattern_type = one of the allowed values below

Rules:

Include the header row
mode should always be "localization"
Quote ALL CSV fields
Escape internal quotes using double quotes ("")
Do NOT truncate long text nodes

Allowed pattern_type values:

date
currency
phone
address
temperature
name
url
text

Example CSV rows:

"source","target","mode","layer_id","layer_name","pattern_type"
"New York","London","localization","123:001","Location Label","text"
"zip code","postcode","localization","123:002","Form Label","text"
"$24.99","£24.99","localization","123:003","Price Label","currency"
"(212) 555-0100","+44 20 7946 0100","localization","123:004","Contact Phone","phone"
"72°F","22°C","localization","123:005","Temperature Display","temperature"

COMMAND / FILE EDITING PREFERENCES

Please minimize approval prompts and avoid shell commands that embed large or multi-line file contents inside quoted arguments.

Do NOT use:

node -e with large inline scripts
python -c with large inline scripts
perl -e / sed -i with long quoted replacement text
terminal commands that include markdown headings or large blocks of code inside quoted strings

Instead:

Prefer the editor/file-editing tools available to you
Read files first, then apply targeted edits
Keep terminal commands simple and inspectable
Use commands mainly for git diff, lightweight tests, and file inspection
If writing a full file is unavoidable, use a quoted heredoc delimiter such as:
cat > filename <<'EOF'

Before making broad changes, briefly explain the intended files and approach. Batch small related edits together instead of asking for confirmation after every tiny step.

FINAL OUTPUT RULES

Write the complete CSV to a file named:

localization-output.csv

Save the file in the current project root.

The file must contain ONLY valid RFC 4180 CSV content.

Do NOT summarize or explain the changes.

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
"https://example.com/us/en/product","https://example.com/gb/en/product",localization,234:180,Product Link,url
```

---

## Notes

- The plugin accepts this CSV directly — upload it, review each row, uncheck anything you want to skip, then click Apply.
- Rows with a `layer_id` will navigate directly to that layer when clicked in the review dialog.
- Rows without a `layer_id` will fall back to text matching when possible.
- For best precision and navigation behavior, include layer_id values whenever available.
- The plugin supports both `mode=localization` and `mode=translation` rows in the same CSV.
- In most workflows, localization should be performed before translation so that region-specific content (dates, currencies, locations, formatting, terminology) is finalized prior to language translation.
- After localization is applied, a translation pass can generate the final target-language UI copy.