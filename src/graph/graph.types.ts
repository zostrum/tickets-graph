export type NodeKind = 'service' | 'rds' | 'sqs' | string;

export type VulnerabilitySeverity = 'low' | 'medium' | 'high' | 'critical' | string;

export interface Vulnerability {
  file: string;
  severity: VulnerabilitySeverity;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface RawGraphNode {
  name: string;
  kind: NodeKind;
  language?: string;
  path?: string;
  publicExposed?: boolean;
  vulnerabilities?: Vulnerability[];
  metadata?: Record<string, unknown>;
}

export interface RawGraphEdge {
  from: string;
  to: string | string[];
}

export interface RawGraphData {
  nodes: RawGraphNode[];
  edges: RawGraphEdge[];
}

export interface GraphNode {
  name: string;
  kind: NodeKind;
  language?: string;
  path?: string;
  publicExposed: boolean;
  vulnerabilities: Vulnerability[];
  metadata?: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphRoute {
  id: string;
  from: GraphNode;
  to: GraphNode;
  edge: GraphEdge;
}

export interface GraphQueryResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  routes: GraphRoute[];
}

export interface GraphValidationWarning {
  code: 'DUPLICATE_NODE' | 'UNKNOWN_EDGE_SOURCE' | 'UNKNOWN_EDGE_TARGET' | 'ISOLATED_NODE';
  message: string;
  node?: GraphNode;
  edge?: {
    from: string;
    to: string;
  };
}

export interface LoadedGraph {
  data: GraphData;
  warnings: GraphValidationWarning[];
}

export interface GraphRouteFilterOptions {
  startPublic?: boolean;
  endSink?: boolean;
  hasVulnerability?: boolean;
}
