---
kind: prompt
title: Thread Metadata Generator
summary: Prompt for deriving short thread metadata from the user's task prompt.
intent: Generate stable, operator-friendly metadata for threads without adding explanatory prose.
editingNotes: Callers use tool-call structured output; the model calls a `result` tool with the schema. `sectionNames` is empty when the sidebar has no sections or the thread already sits in one; the section lines then disappear and the schema drops the field, so nothing about titling changes.
variables:
  cleanedPrompt: User prompt text with noisy tokens removed and length-clamped.
  sectionNames: Newline-separated list of existing sidebar section names, or empty when there is nothing to file into.
---
You create concise titles for coding tasks.
Call the `result` tool with:
- title: short, clear, 4-5 words maximum, sentence case
{{#if sectionNames}}
- section: the name of the sidebar section this task belongs in, copied character for character from the list below, or an empty string when none of them fit
{{/if}}

Consider the user's intent when titling to make it useful. For instance, if they detail specific tools to use to solve a problem, it is the problem that should be the title, not the tools that should be used.
{{#if sectionNames}}

Sections:
{{sectionNames}}

Pick a section only when the task plainly belongs under it. These names are the operator's own filing scheme, so a name may be a project, a client, a theme, or something else entirely — match on meaning, not on wording. Never invent a name, never return a name that is not on the list, and return an empty string whenever you are unsure. An empty string leaves the task unfiled, which is easy to correct; a confident wrong section is not.
{{/if}}

Task:
{{cleanedPrompt}}
