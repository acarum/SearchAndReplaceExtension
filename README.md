# Search and Replace Extension (Mendix Studio Pro)

> Project is not used for now due to limitations in the Web Extensibility API. The changes made in the documents are not properly processed into the Studio Pro IDE causing issues with committing / referencing the changed values.

## Overview
This Mendix Studio Pro extension experiments with a native, in-IDE experience for finding and replacing text across an entire application model. The goal is to make large-scale refactors (renaming microflows, adjusting entity names, updating variables, and more) quick and predictable without dropping into manual XML edits or one-off scripts.

## Current State
- **Status:** Development paused until the Web Extensibility API fully supports reflecting document edits back into Studio Pro.
- **Primary blocker:** Studio Pro currently fails to interpret document changes triggered through the API, leading to commit and reference mismatches.
- **Availability:** The codebase remains for reference and future iteration once the underlying platform issues are resolved.

## Features (Prototype)
- Global search that inspects microflows, pages/snippets, entities/attributes, and microflow variables/parameters.
- Results panel that groups matches by element type and shows where the text occurs.
- Batch replacement that safely applies a full set of replacements inside one transaction.

## How It Works 
1. **Search:** Provide the term to locate across the entire Mendix project model.
2. **Review:** Inspect a preview list of every match, organized by element type and location.
3. **Replace:** Supply the new text and apply changes across the project in one action.



