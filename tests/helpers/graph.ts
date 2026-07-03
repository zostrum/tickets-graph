import type { GraphEdge, GraphNode, GraphQueryResult, GraphRoute, Vulnerability } from '../../src/graph/graph.types.js';

export function createGraphNode(name: string, overrides: Partial<GraphNode> = {}): GraphNode {
  return {
    name,
    kind: 'service',
    publicExposed: false,
    vulnerabilities: [],
    ...overrides,
  };
}

export function createGraphEdge(from: string, to: string, overrides: Partial<GraphEdge> = {}): GraphEdge {
  return {
    id: `${from}=>${to}`,
    from,
    to,
    ...overrides,
  };
}

export function createGraphRoute(from: GraphNode, to: GraphNode, edge = createGraphEdge(from.name, to.name)): GraphRoute {
  return {
    id: edge.id,
    from,
    to,
    edge,
  };
}

export function createGraphQueryResult(overrides: Partial<GraphQueryResult> = {}): GraphQueryResult {
  return {
    nodes: [],
    edges: [],
    routes: [],
    ...overrides,
  };
}

export function createVulnerability(overrides: Partial<Vulnerability> = {}): Vulnerability {
  return {
    file: 'src/example.ts',
    severity: 'high',
    message: 'Example vulnerability',
    ...overrides,
  };
}
