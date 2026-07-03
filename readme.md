# Train Ticket Graph Query API

A Node.js + TypeScript REST API for loading and querying the Train Ticket microservice graph.

The application loads a graph definition from `data/train-ticket-be.json`, normalizes service connections, and exposes API endpoints that return graph data in a client-renderable format.

## Assignment Summary

The input JSON represents a graph of Train Ticket microservices and their relationships.

The API provides a way to query the graph and filter routes between services by:

- routes that start in a public service
- routes that end in a sink node, such as RDS/SQS
- routes that contain a vulnerable node

The implementation is intentionally generic so new route filters can be added with minimal changes.

## Tech Stack

- Node.js
- TypeScript
- Express
- Zod
- dotenv
- Jest

## Core Concepts

### Graph

The source JSON contains:

- `nodes`: graph nodes such as services, RDS instances, and queues
- `edges`: graph connections between nodes

Example source edge:

```json
{
  "from": "admin-order-service",
  "to": ["order-service", "order-other-service"]
}
```

During loading, this edge is normalized into two direct edges:

```txt
admin-order-service => order-service
admin-order-service => order-other-service
```

### Route Definition

In this project, a route is defined as a single direct edge connection:

```txt
source node -> target node
```

A route is not treated as a full multi-hop path.

The reason I decided to do so is not obvious definition in original PDF file. This definition seems to me as the most possible.

### Normalized Graph Edge

Internally, every edge has the following shape:

```ts
{
  id: string;
  from: string;
  to: string;
}
```

The `id` is generated as:

```txt
from=>to
```

Example:

```txt
admin-order-service=>order-service
```

### Graph Route

A route contains the edge and its resolved source/target nodes:

```ts
{
  id: string;
  from: GraphNode;
  to: GraphNode;
  edge: GraphEdge;
}
```

Routes with missing source or target nodes are skipped from the query result because they cannot be rendered safely by a client application.

## Important Design Decisions

### 1. JSON File as Source of Truth

The application does not use a database.

The graph is loaded from:

```txt
data/train-ticket-be.json
```

The file is read during application startup and stored in memory.

### 2. Runtime Validation with Zod

The raw JSON is validated before being used by the application.

Validation checks the basic expected structure:

- `nodes` must be an array
- `edges` must be an array
- each node must have `name` and `kind`
- each edge must have `from` and `to`
- `to` can be either a string or an array of strings

Extra fields are allowed because the source graph may contain metadata that is not used directly by the API.

### 3. Edge Normalization

The source JSON allows this format:

```ts
{
  from: string;
  to: string | string[];
}
```

The application normalizes it into:

```ts
{
  from: string;
  to: string;
}
```

This makes route filtering simpler and avoids special cases in the query layer.

### 4. In-Memory Repository

The graph repository stores normalized graph data in memory and builds a lookup map for efficient route resolution.

This avoids repeatedly scanning arrays when resolving routes.

### 5. Filter Extensibility

Each route filter is implemented separately and follows a common interface:

```ts
interface RouteFilter {
  apply(route: GraphRoute): boolean;
}
```

Current filters:

| Filter                 | Query Param             | Description                                                  |
| ---------------------- | ----------------------- | ------------------------------------------------------------ |
| Public source filter   | `startPublic=true`      | Keeps routes where the source node is public                 |
| Sink target filter     | `endSink=true`          | Keeps routes where the target node is a sink                 |
| Vulnerable node filter | `hasVulnerability=true` | Keeps routes where source or target node has vulnerabilities |

New filters can be added by:

1. creating a new filter class
2. registering it in `filter-registry.ts`
3. adding the query parameter to `graph.query-schema.ts`

## Sink Node Definition

A sink node is currently defined as a node where:

```ts
node.kind === 'rds' || node.kind === 'sqs';
```

I decided to use 'sqs' instead of 'sql'(as in PDF) cause it seems like a typo - there is no sql nodes, but sqs is present.

The provided graph currently contains two sink nodes:

```txt
prod-postgresdb
prod-sqs
```

## Vulnerability Definition

A node is considered vulnerable when it has a non-empty `vulnerabilities` array.

A route matches `hasVulnerability=true` when either the source node or target node has at least one vulnerability.

```ts
route.from.vulnerabilities.length > 0 || route.to.vulnerabilities.length > 0;
```

## Installation

```bash
npm install
```

## Environment Variables

Create a local `.env` file:

```bash
cp .env.example .env
```

Example:

```env
PORT=3000
NODE_ENV=development
```

## Available Scripts

### Start Development Server

```bash
npm run dev
```

Runs the API with `tsx watch`.

### Build

```bash
npm run build
```

Compiles TypeScript into the `dist/` directory.

### Start Production Build

```bash
npm start
```

Runs the compiled application from `dist/server.js`.

Before running this command, build the project first:

```bash
npm run build
npm start
```

### Compile Tests

```bash
npm run test:compile
```

Compiles application and test TypeScript into `.tmp/jest/`.

The project uses TypeScript with ESM, so tests are compiled before Jest executes them.

### Run Unit Tests

```bash
npm test
```

Compiles the test project and runs the Jest unit test suite.

### Run Unit Tests in Watch Mode

```bash
npm run test:watch
```

Compiles the test project and starts Jest in watch mode.

### Run Unit Tests with Coverage

```bash
npm run test:coverage
```

Compiles the test project, runs Jest, and writes coverage output to `coverage/`.

## API Endpoints

## Get Full Graph

```http
GET /api/graph
```

Returns all valid graph nodes, normalized edges, and direct-edge routes.

Example response shape:

```json
{
  "data": {
    "nodes": [],
    "edges": [],
    "routes": []
  },
  "meta": {
    "nodesCount": 0,
    "edgesCount": 0,
    "routesCount": 0
  }
}
```

## Get Routes

```http
GET /api/graph/routes
```

Returns direct-edge routes.

Without query parameters, this endpoint returns all valid direct-edge routes.

Example:

```bash
curl http://localhost:3000/api/graph/routes
```

## Route Filters

Filters are passed as query parameters.

Allowed values:

```txt
true
false
```

Invalid values return `400`.

### Routes Starting in Public Services

```http
GET /api/graph/routes?startPublic=true
```

Keeps routes where the source node has:

```ts
publicExposed === true;
```

Example:

```bash
curl "http://localhost:3000/api/graph/routes?startPublic=true"
```

### Routes Ending in Sink Nodes

```http
GET /api/graph/routes?endSink=true
```

Keeps routes where the target node is a sink.

Example:

```bash
curl "http://localhost:3000/api/graph/routes?endSink=true"
```

### Routes Containing Vulnerable Nodes

```http
GET /api/graph/routes?hasVulnerability=true
```

Keeps routes where either the source node or target node has vulnerabilities.

Example:

```bash
curl "http://localhost:3000/api/graph/routes?hasVulnerability=true"
```

### Combined Filters

Filters can be combined.

Example:

```bash
curl "http://localhost:3000/api/graph/routes?startPublic=true&endSink=true&hasVulnerability=true"
```

This returns routes that satisfy all selected filters.

Because a route is defined as a direct edge, this query only returns edges where:

- the source node is public
- the target node is a sink
- either source or target node is vulnerable

If no direct edge satisfies all conditions, the response will contain an empty route list.

## Query Validation

Only exact boolean strings are accepted:

```txt
true
false
```

Valid:

```http
GET /api/graph/routes?startPublic=true
GET /api/graph/routes?startPublic=false
```

Invalid:

```http
GET /api/graph/routes?startPublic=yes
GET /api/graph/routes?endSink=1
GET /api/graph/routes?hasVulnerability=maybe
```

Invalid response example:

```json
{
  "error": {
    "message": "Invalid route query parameters.",
    "details": [
      {
        "field": "startPublic",
        "message": "Expected value to be either \"true\" or \"false\"."
      }
    ]
  }
}
```

## Response Format

### Node

```ts
{
  name: string;
  kind: string;
  language?: string;
  path?: string;
  publicExposed: boolean;
  vulnerabilities: Vulnerability[];
  metadata?: Record<string, unknown>;
}
```

### Edge

```ts
{
  id: string;
  from: string;
  to: string;
}
```

### Route

```ts
{
  id: string;
  from: GraphNode;
  to: GraphNode;
  edge: GraphEdge;
}
```

### Graph Query Result

```ts
{
  nodes: GraphNode[];
  edges: GraphEdge[];
  routes: GraphRoute[];
}
```

The `nodes` and `edges` arrays are deduplicated based on the returned routes.

This makes the response convenient for graph visualization libraries, where the client usually needs a list of nodes and edges.

## Data Warnings

The loader performs non-blocking graph validation.

Warnings may include:

- duplicate node names
- edge source node does not exist
- edge target node does not exist
- isolated node with no incoming or outgoing edges

The application does not fail startup for these warnings because the provided JSON file is treated as the assignment input.

Warnings are printed during application startup.

Example:

```txt
Graph loaded with warnings:
- [UNKNOWN_EDGE_TARGET] Edge target node does not exist: assurance-service
- [ISOLATED_NODE] Node has no incoming or outgoing edges: gateway-service
```

Routes that reference missing nodes are skipped from API results.

## Local Usage Example

Start the server:

```bash
npm run dev
```

Get all routes:

```bash
curl http://localhost:3000/api/graph/routes
```

Get routes connected to vulnerable nodes:

```bash
curl "http://localhost:3000/api/graph/routes?hasVulnerability=true"
```

Get routes ending in RDS/SQS sink nodes:

```bash
curl "http://localhost:3000/api/graph/routes?endSink=true"
```

## Adding a New Filter

Example: add a filter for Java services.

### 1. Create Filter

```ts
import type { GraphRoute } from '../graph/index.js';
import type { RouteFilter } from './route-filter.interface.js';

export class JavaServiceFilter implements RouteFilter {
  apply(route: GraphRoute): boolean {
    return route.from.language === 'java' || route.to.language === 'java';
  }
}
```

### 2. Register Filter

Update `filter-registry.ts`:

```ts
const filterByOptionName = {
  startPublic: new PublicSourceFilter(),
  endSink: new SinkTargetFilter(),
  hasVulnerability: new VulnerableNodeFilter(),
  hasJavaNode: new JavaServiceFilter(),
};
```

### 3. Add Query Schema Field

Update `graph.query-schema.ts`:

```ts
export const graphRoutesQuerySchema = z.object({
  startPublic: optionalBooleanQueryParamSchema,
  endSink: optionalBooleanQueryParamSchema,
  hasVulnerability: optionalBooleanQueryParamSchema,
  hasJavaNode: optionalBooleanQueryParamSchema,
});
```

## Known Limitations

- The API treats routes as direct edges only.
- It does not calculate multi-hop paths.
- It does not calculate shortest paths.
- It does not persist graph data in a database.
- It does not include authentication.

These limitations are intentional for the current assignment scope.
