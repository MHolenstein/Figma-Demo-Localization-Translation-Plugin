# Figma Translation Prompt

Paste this into Claude (with Figma MCP access) to generate a translation CSV for the plugin.

---

You are helping translate a Figma design file using a CSV find-and-replace plugin. Here is the workflow:

1. I will give you a Figma file URL and a target language.
2. Use the Figma MCP tool (`get_figma_data`) to pull the file using the fileKey and nodeId from the URL.
3. Extract every `text:` value from the nodes section of the result. Each value is a separate Figma text node. Before translating, read the full component tree to understand the screen context — what kind of UI this is, what each element's role is, and how text nodes relate to their parent containers (e.g. a node inside a "order number" or "tracking ID" container should not be translated even if it looks like a word).
4. Output a CSV with two columns: `source` and `target`.
   - `source` = the exact text string from the Figma node, character-for-character. Do not split, combine, or paraphrase.
   - `target` = your translation into [TARGET LANGUAGE], informed by the UI context. For example, a word like "Content" means something different as a chat bubble label vs. a section header — translate accordingly.
   - Skip only: placeholder labels (e.g. `Label text`), icon names, URLs, and any text that is clearly a data value rather than UI copy (e.g. order numbers, IDs, phone numbers, numeric codes).
   - Do translate timestamps and date labels (e.g. `7 days ago`, `Today`, `0:00 AM`). Convert date formats and time formats to the convention of the target language (e.g. MM/DD/YY → DD/MM/YY for French; 12-hour with AM/PM → 24-hour for languages that conventionally use it). Apply these conversions to the target column only — never alter the source.
   - Wrap any field containing a comma, quote, or newline in double quotes. Escape internal quotes by doubling them. Represent newlines inside fields as literal newlines within the quoted field (do not use \n escape sequences).
   - Before outputting the CSV, flag any text nodes that appear to contain typos or errors — list them separately above the CSV so the user can review.
5. Do not translate proper nouns (brand names, personal names).
6. If any text string is ambiguous — could be translated multiple ways depending on context — add a note after the CSV explaining your choice and the alternative.
7. Always save the CSV as a file in the current working directory, regardless of how few rows it contains.

Target language: **[French / Spanish / German / etc.]**
Figma URL: **[paste URL here]**

---

## Note on CSV format compatibility

The plugin now supports an extended 6-column CSV format:
```
source,target,mode,layer_id,layer_name,pattern_type
```
The 2-column `source,target` output from this prompt is still fully supported — the plugin will treat all rows as `mode=translation` and match by text content. If you want layer-targeted replacement (more precise, navigable in the review dialog), ask Claude to also capture `node.id` and output the extended format with `layer_id` populated.
