A Mendix Studio Pro extension that provides a powerful, in-IDE tool to find and replace text across your entire application model.

Core Idea
This tool addresses the common need to perform bulk updates on names and text throughout a Mendix project, such as when refactoring an entity or adhering to new naming conventions. It provides a simple "find and replace" interface that operates on the entire app model, saving significant manual effort.

Features
Global Search: A single search field to find occurrences of a text string across all major project elements, including:

Microflow names

Page and Snippet names

Entity and Attribute names

Variable and Parameter names within microflows

Results Preview: Displays a clear, itemized list of all matches found, showing the element type and its name/location.

Batch Replace: A "Replace All" function that iterates through all found results and replaces the search term with the text from the "Replace" field in a single, safe transaction.

How It Works
Search: The developer enters a term into the "Search" field and initiates the search.

Review: The extension scans the project and populates a list with all matching elements. The developer can review this list to see the scope of the potential changes.

Replace: The developer enters the desired replacement text and clicks the "Replace All" button to apply the changes across the entire project instantly.