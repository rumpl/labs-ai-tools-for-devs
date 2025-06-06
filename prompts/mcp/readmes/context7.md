# Context7 MCP Server

Context7 MCP Server -- Up-to-date documentation for LLMs and AI code editors.

[What is an MCP Server?](https://www.anthropic.com/news/model-context-protocol)

## Characteristics
Attribute|Details|
|-|-|
**Image Source**|Official Image
**Docker Image**|[mcp/context7](https://hub.docker.com/repository/docker/mcp/context7)
**Author**|[upstash](https://github.com/upstash)
**Repository**|https://github.com/upstash/context7
**Dockerfile**|https://github.com/upstash/context7/blob/master/Dockerfile
**Docker Image built by**|Docker Inc.
**Docker Scout Health Score**| ![Docker Scout Health Score](https://api.scout.docker.com/v1/policy/insights/org-image-score/badge/mcp/context7)
**Licence**|MIT License

## Available Tools
Tools provided by this Server|Short Description
-|-
`get-library-docs`|Fetches up-to-date documentation for a library.|
`resolve-library-id`|Required first step: Resolves a general package name into a Context7-compatible library ID.|

---
## Tools Details

#### Tool: **`get-library-docs`**
Fetches up-to-date documentation for a library. You must call 'resolve-library-id' first to obtain the exact Context7-compatible library ID required to use this tool.
Parameters|Type|Description
-|-|-
`context7CompatibleLibraryID`|`string`|Exact Context7-compatible library ID (e.g., 'mongodb/docs', 'vercel/nextjs') retrieved from 'resolve-library-id'.
`tokens`|`number` *optional*|Maximum number of tokens of documentation to retrieve (default: 5000). Higher values provide more context but consume more tokens.
`topic`|`string` *optional*|Topic to focus documentation on (e.g., 'hooks', 'routing').

---
#### Tool: **`resolve-library-id`**
Required first step: Resolves a general package name into a Context7-compatible library ID. Must be called before using 'get-library-docs' to retrieve a valid Context7-compatible library ID.
Parameters|Type|Description
-|-|-
`libraryName`|`string`|Library name to search for and retrieve a Context7-compatible library ID.

---
## Use this MCP Server

```json
{
  "mcpServers": {
    "context7": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "mcp/context7"
      ]
    }
  }
}
```

[Why is it safer to run MCP Servers with Docker?](https://www.docker.com/blog/the-model-context-protocol-simplifying-building-ai-apps-with-anthropic-claude-desktop-and-docker/)
