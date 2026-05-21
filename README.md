# Figma Localization & Translation Plugin

Localize and translate Figma designs using Claude + Figma MCP, then apply changes through a CSV review workflow.

## Overview

This plugin supports two modes:

**Translation** — replace UI copy with a fully translated version in another language.

**Localization** — make targeted regional updates within the same language: city references, addresses, phone numbers, currencies, dates, temperatures, and synthetic data.

Both modes use the same workflow:

1. Claude reads your Figma file via MCP
2. Claude generates a CSV of proposed changes
3. Upload the CSV into the plugin
4. Review and approve/reject individual rows
5. Click Apply — the plugin updates matching text layers in Figma

---

# Requirements

- Claude Code
- Figma MCP setup
- A Figma personal access token
- The plugin installed in Figma
- Access to the target Figma file

---

# Setup

## 1. Install the Plugin

In Figma:
- Plugins > Development > Import Plugin from Manifest → select `manifest.json`

## 2. Configure Figma MCP

Set up Figma MCP in Claude Code.

Example `.mcp.json`:

```json
{
  "figma": {
    "command": "YOUR_MCP_SERVER",
    "env": {
      "FIGMA_ACCESS_TOKEN": "YOUR_TOKEN"
    }
  }
}
```

---

# Usage

## Translation Mode

Use this to translate all UI copy into another language.

### Step 1 — Open your Figma file

Open the page you want translated and copy its URL.

### Step 2 — Run the translation prompt

Open `translation-prompt.md`, fill in the target language and Figma URL, and paste into Claude.

Claude will:
- read all text layers via MCP
- translate content into the target language
- output a CSV file

### Step 3 — Import the CSV into the plugin

In Figma:
1. Run the plugin
2. Upload the generated CSV
3. Review the proposed changes — uncheck any rows you want to skip
4. Click **Apply Changes**

---

## Localization Mode

Use this to swap a design from one market/region to another (e.g. New York → London) without translating the language.

Localization updates can include:
- City and location references
- Addresses and postcodes
- Phone number formats
- Currency symbols and formatting
- Date and time formats
- Temperature units
- Spelling variants (e.g. "zip code" → "postcode")
- Locale-appropriate synthetic names and data

### Step 1 — Open your Figma file

Open the target page and copy its URL.

### Step 2 — Run the localization prompt

Open `localization-prompt.md`. At the top of the prompt, fill in:

- **SOURCE MARKET** — e.g. `New York, NY USA`
- **TARGET MARKET** — e.g. `London, UK`
- **OPTIONAL NOTES** — any constraints (e.g. "keep currency amounts the same")

Paste the prompt into Claude.

Claude will:
- read all text layers and their node IDs via MCP
- detect localizable patterns (dates, phones, addresses, etc.)
- generate a CSV with only the rows that need updating

### Step 3 — Import the CSV into the plugin

In Figma:
1. Run the plugin
2. Upload the generated CSV
3. Review the changes — each row shows a type badge (currency, date, phone, etc.)
4. Click any row to navigate directly to that layer in Figma
5. Uncheck any rows you want to skip
6. Click **Apply Changes**

---

# CSV Format

Both prompts output a CSV the plugin can read directly. The extended format supports localization metadata:

```
source,target,mode,layer_id,layer_name,pattern_type
```

| Column | Required | Description |
|--------|----------|-------------|
| `source` | yes | Exact current text in Figma |
| `target` | yes | Replacement text |
| `mode` | no | `translation` or `localization` (defaults to `translation`) |
| `layer_id` | no | Figma node ID — enables direct targeting and click-to-navigate |
| `layer_name` | no | Human-readable layer name (display only) |
| `pattern_type` | no | `date`, `currency`, `phone`, `address`, `temperature`, `name`, or `text` |

The plugin is fully backward compatible with the original 2-column `source,target` format.

**Matching behavior:**
- Rows with a `layer_id` are applied directly to that node — precise and fast
- Rows without a `layer_id` fall back to text-matching across all text nodes on the current page

---

# Limitations

- Only searches the current Figma page (not the entire file)
- Requires an exact text match for text-based rows (no partial replacement)
- Layer IDs in a CSV are tied to the specific file — they won't transfer to a duplicate
- Does not preserve mixed text styles within a replaced layer
- Translation quality depends on the model used

---

# Why CSV?

Using CSV as the bridge layer keeps the workflow:
- **Reviewable** — inspect every change before it touches the file
- **Editable** — adjust targets manually before applying
- **Shareable** — hand off to a translator or stakeholder for review
- **Versionable** — commit CSVs alongside design files
- **Safe** — no AI writes directly to Figma; you approve each change
