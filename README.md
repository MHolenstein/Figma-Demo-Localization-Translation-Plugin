# Figma CSV Translation Plugin

Translate Figma designs using Claude + Figma MCP and automatically replace text layers using CSV imports.

## Overview

This workflow combines:

- Claude Desktop + Figma MCP
- A translation prompt
- A Figma plugin for CSV import/replacement

The process:

1. Claude reads your Figma file via MCP
2. Claude translates all visible text into a target language
3. Claude outputs a CSV
4. Upload the CSV into the plugin
5. The plugin automatically replaces matching text layers in Figma

This avoids manual copy/paste and makes large-scale localization dramatically faster.

---

# Requirements

- Claude Code
- Figma MCP setup
- A Figma personal access token
- The Figma Translation Plugin
- Access to the target Figma file

---

# Setup

## 1. Install the Plugin

In Figma:
- Plugin > Developer > Import Plugin from Manifest (select manifest.json)

## 2. Configure Figma MCP

Set up Figma MCP in Claude Desktop.

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

## Step 1 — Open Your Figma File

- Open the page/frame you want translated.
- Copy the page/frame link

## Step 2 — Copy the Prompt

Open:

```text
/prompts/translation-prompt.md
```

Replace:
- target language
- the Figma file URL

Paste the prompt into Claude

## Step 3 — Generate CSV

Claude will:
- read text layers from the Figma file
- translate content
- generate a CSV file

## Step 4 — Import CSV Into Plugin

In Figma:
1. Run the plugin
2. Upload the generated CSV
3. The plugin will find and replace matching text layers


---

# Limitations

- Best results with clearly named text layers
- Complex component structures may require cleanup
- Does not currently preserve text overflow handling
- Translation quality depends on the LLM used

---

# Why CSV?

Using CSV as the bridge layer makes the workflow:
- easy to share with translators to check
- deterministic
- editable
- reviewable
- versionable
- safer than direct AI mutation of design files
