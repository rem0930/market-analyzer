---
name: "Code Reviewer 👀"
description: "MUST BE USED for PR reviews, code reviews, or quality checks. Specializes in Staff-level review with DocDD, NFR, and rollback perspectives."
model: "claude-3-5-sonnet-20241022"
tools: ["read", "write", "grep", "glob"]
---

<!-- 
  This file is a Claude Code sub-agent configuration.
  The canonical agent prompt is in: prompts/agents/reviewer.md
-->

{{file:prompts/agents/reviewer.md}}
