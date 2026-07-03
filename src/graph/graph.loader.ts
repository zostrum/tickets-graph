import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { parseRawGraphData } from './graph.schema.js';
import type { GraphData, GraphEdge, GraphNode, GraphValidationWarning, LoadedGraph, RawGraphData } from './graph.types.js';

const DEFAULT_GRAPH_FILE_PATH = path.resolve(process.cwd(), 'data', 'train-ticket-be.json');

export async function loadGraph(filePath = DEFAULT_GRAPH_FILE_PATH): Promise<LoadedGraph> {
  const fileContent = await readFile(filePath, 'utf-8');

  let json: unknown;

  try {
    json = JSON.parse(fileContent);
  } catch (error) {
    throw new Error(`Invalid JSON graph file: ${filePath}`, {
      cause: error,
    });
  }

  const rawGraphData = parseRawGraphData(json);
  const graphData = normalizeGraphData(rawGraphData);
  const warnings = validateGraphData(graphData);

  return {
    data: graphData,
    warnings,
  };
}

export function normalizeGraphData(rawGraphData: RawGraphData): GraphData {
  const nodes: GraphNode[] = rawGraphData.nodes.map((node) => ({
    name: node.name,
    kind: node.kind,
    language: node.language,
    path: node.path,
    publicExposed: node.publicExposed ?? false,
    vulnerabilities: node.vulnerabilities ?? [],
    metadata: node.metadata,
  }));

  const edges: GraphEdge[] = rawGraphData.edges.flatMap((edge) => {
    const targets = Array.isArray(edge.to) ? edge.to : [edge.to];

    return targets.map((target) => ({
      id: createEdgeId(edge.from, target),
      from: edge.from,
      to: target,
    }));
  });

  return {
    nodes,
    edges,
  };
}

export function validateGraphData(graphData: GraphData): GraphValidationWarning[] {
  const warnings: GraphValidationWarning[] = [];
  const nodeNames = new Set<string>();
  const connectedNodeNames = new Set<string>();

  for (const node of graphData.nodes) {
    if (nodeNames.has(node.name)) {
      warnings.push({
        code: 'DUPLICATE_NODE',
        message: `Duplicate node found: ${node.name}`,
        nodeName: node.name,
      });

      continue;
    }

    nodeNames.add(node.name);
  }

  for (const edge of graphData.edges) {
    connectedNodeNames.add(edge.from);
    connectedNodeNames.add(edge.to);

    if (!nodeNames.has(edge.from)) {
      warnings.push({
        code: 'UNKNOWN_EDGE_SOURCE',
        message: `Edge source node does not exist: ${edge.from}`,
        edge: {
          from: edge.from,
          to: edge.to,
        },
      });
    }

    if (!nodeNames.has(edge.to)) {
      warnings.push({
        code: 'UNKNOWN_EDGE_TARGET',
        message: `Edge target node does not exist: ${edge.to}`,
        edge: {
          from: edge.from,
          to: edge.to,
        },
      });
    }
  }

  for (const node of graphData.nodes) {
    if (!connectedNodeNames.has(node.name)) {
      warnings.push({
        code: 'ISOLATED_NODE',
        message: `Node has no incoming or outgoing edges: ${node.name}`,
        nodeName: node.name,
      });
    }
  }

  return warnings;
}

function createEdgeId(from: string, to: string): string {
  return `${from}=>${to}`;
}
