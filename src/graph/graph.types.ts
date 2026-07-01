export type NodeKind = 'service' | 'rds' | 'sqs' | string;

export type VulnerabilitySeverity = 'low' | 'medium' | 'high' | 'critical' | string;

export interface Vulnerability {
  file: string;
  severity: VulnerabilitySeverity;
  message: string;
  metadata?: Record<string, unknown>;
}

/**
 * Raw node shape from train-ticket-be.json.
 *
 * Some fields are service-specific, while infrastructure nodes like RDS/SQS
 * may only contain name, kind, and metadata.
 */
export interface RawGraphNode {
  name: string;
  kind: NodeKind;
  language?: string;
  path?: string;
  publicExposed?: boolean;
  vulnerabilities?: Vulnerability[];
  metadata?: Record<string, unknown>;
}

/**
 * Raw edge shape from train-ticket-be.json.
 *
 * Important:
 * The source file contains both:
 * - { from: string, to: string[] }
 * - { from: string, to: string }
 */
export interface RawGraphEdge {
  from: string;
  to: string | string[];
}

export interface RawGraphData {
  nodes: RawGraphNode[];
  edges: RawGraphEdge[];
}

/**
 * Internal normalized node.
 *
 * For now it is close to RawGraphNode, but we keep it as a separate type
 * so the app is not tightly coupled to the original JSON format.
 */
export interface GraphNode {
  name: string;
  kind: NodeKind;
  language?: string;
  path?: string;
  publicExposed: boolean;
  vulnerabilities: Vulnerability[];
  metadata?: Record<string, unknown>;
}

/**
 * Internal normalized edge.
 *
 * Every edge has exactly one source and one target.
 */
export interface GraphEdge {
  id: string;
  from: string;
  to: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * A route is a shortest path between two graph nodes.
 *
 * Example:
 * frontend -> admin-basic-info-service -> price-service
 */
export interface GraphRoute {
  id: string;
  nodeNames: string[];
  edges: GraphEdge[];
  distance: number;
}

/**
 * Response shape that should be easy to render on the client side.
 *
 * The assignment explicitly asks for a graph structure that is easy
 * to render in a client application. This type represents that output.
 */
export interface GraphQueryResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  routes: GraphRoute[];
}

export interface GraphValidationWarning {
  code: 'DUPLICATE_NODE' | 'UNKNOWN_EDGE_SOURCE' | 'UNKNOWN_EDGE_TARGET' | 'ISOLATED_NODE';

  message: string;
  nodeName?: string;
  edge?: {
    from: string;
    to: string;
  };
}

export interface LoadedGraph {
  data: GraphData;
  warnings: GraphValidationWarning[];
}
