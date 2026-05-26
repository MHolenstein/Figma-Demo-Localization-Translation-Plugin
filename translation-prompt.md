# Claude Translation Prompt

Use this prompt when you want Claude to generate a **translation CSV** from a Figma page via the MCP connection. This is for full language translation of UI copy, messaging, labels, and interface text — **not** for market-specific localization-only changes (use `localization-prompt.md` for that).
---

## Prompt to give Claude

```
Read the Figma page using the MCP connection: [ADD FIGMA LINK]

USER INPUTS

SOURCE LANGUAGE:
[EXAMPLE: English]

TARGET LANGUAGE:
[EXAMPLE: French]

OPTIONAL NOTES:

Maintain concise mobile UI phrasing
Keep marketing tone professional
Use informal Spanish tone
Preserve legal terminology exactly

TASK

Analyze all TEXT nodes on the current Figma page.

For each TEXT node, capture:

node.id
node.name
node.characters

Before translating, analyze the surrounding component hierarchy and UI context to understand:

the type of interface
the purpose of the screen
the role of the text element
whether the text is UI copy, metadata, placeholder content, or data

Use the surrounding UI hierarchy and component context to determine the correct meaning and tone of each string.

Translate based on functional UI intent, not literal dictionary substitution.

Generate translations ONLY where translation is appropriate.

Do NOT translate:

brand names
product names
personal names
email addresses
URLs
tracking numbers
coupon codes
API keys
hex values
phone numbers
pure numeric values
SKU identifiers
file names
code snippets
icon names
placeholder labels such as:
"Label text"
"Enter text"
"Placeholder"

Skip text that is clearly non-linguistic data or synthetic metadata.

Translate:

UI labels
buttons
menus
messages
notifications
marketing copy
instructions
tooltips
error states
timestamps
date labels
relative time labels

When translating dates/times:

Convert formatting conventions appropriately for the TARGET LANGUAGE locale.

Examples:

MM/DD/YYYY → DD/MM/YYYY
12-hour time → 24-hour time
"7 days ago" → equivalent natural phrasing in target language

Apply target-language typographic conventions where appropriate.

Examples:

French quotation marks:
"Hello" → « Bonjour »

Locale-specific punctuation spacing
Locale-specific quotation styles
Locale-specific number/date formatting conventions

Preserve punctuation, spacing, capitalization, line breaks, emojis, inline formatting tokens, markup wrappers, variables, placeholders, and template syntax when present.

Only translate the human-readable content.

Examples:

"Hello {firstName}"
→ preserve {firstName}

"Your balance is {{amount}}"
→ preserve {{amount}}

"<strong>Continue</strong>"
→ preserve tags while translating text

The target value should represent the FULL final translated text for the node.

Do NOT output partial replacements for isolated words or phrases.

Translations should sound natural, native, and production-ready for real software UI usage.

Avoid overly literal machine translation phrasing.

Match the tone and register of the original interface.

Formal enterprise interfaces should remain formal.
Consumer/mobile interfaces may use more conversational language.

Do NOT correct typos unless correction would naturally occur as part of translation into the target language.

When translation ambiguity exists, choose the interpretation most consistent with the surrounding UI context.

Use exact Figma node.id values.

OUTPUT FORMAT

Output RFC 4180 CSV format with EXACTLY these columns:

source,target,mode,layer_id,layer_name,pattern_type

Rules:

Include the header row
mode should always be "translation"
pattern_type should always be "text"
Quote ALL CSV fields
Escape internal quotes using double quotes ("")
Do NOT truncate long text nodes

The plugin uses layer_id values for precise node targeting and review navigation.

FINAL OUTPUT RULES:

Write the complete CSV to a file named:
translation-output.csv

Save the file in the current project root

The file must contain ONLY valid RFC 4180 CSV content

Example:

He said "Hello"
becomes:
"He said ""Hello"""

Do NOT summarize changes
Do NOT explain translations
Do NOT append notes after the CSV
Do NOT include markdown formatting
Do NOT prepend or append commentary

After saving the file, reply ONLY with:
translation-output.csv saved
```

---
## Example Output
```
source,target,mode,layer_id,layer_name,pattern_type
"Continue","Continuer","translation","234:89","Primary CTA","text"
"Forgot Password?","Mot de passe oublié ?","translation","234:102","Password Link","text"
"Your order has shipped","Votre commande a été expédiée","translation","234:115","Shipping Status","text"
"7 days ago","il y a 7 jours","translation","234:128","Timestamp","text"
"Save Changes","Enregistrer les modifications","translation","234:141","Save Button","text"
```



## Notes

- The plugin accepts this CSV directly — upload it, review each row, uncheck anything you want to skip, then click Apply.
- Rows with a `layer_id` will navigate directly to that layer when clicked in the review dialog.
- Rows without a `layer_id` will fall back to text matching when possible. 
- For best precision and navigation behavior, include layer_id values whenever available.
- The plugin supports both `mode=localization` and `mode=translation` rows in the same CSV.
- In most workflows, localization should be performed before translation so that region-specific content (dates, currencies, locations, formatting, terminology) is finalized prior to language translation.
- After localization is applied, a translation pass can generate the final target-language UI copy.