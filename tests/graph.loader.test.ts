import { ZodError } from 'zod';

import { parseRawGraphData } from '../src/graph/graph.schema.js';
import { normalizeGraphData, validateGraphData } from '../src/graph/graph.loader.js';
import type { GraphData, GraphEdge, GraphNode, RawGraphData } from '../src/graph/graph.types.js';

function createNode(name: string, overrides: Partial<GraphNode> = {}): GraphNode {
  return {
    name,
    kind: 'service',
    publicExposed: false,
    vulnerabilities: [],
    ...overrides,
  };
}

function createEdge(from: string, to: string): GraphEdge {
  return {
    id: `${from}=>${to}`,
    from,
    to,
  };
}

describe('parseRawGraphData', () => {
  it('accepts a minimal valid graph', () => {
    const input = {
      nodes: [{ name: 'api', kind: 'service' }],
      edges: [{ from: 'api', to: 'database' }],
    };

    expect(parseRawGraphData(input)).toEqual(input);
  });

  it('accepts string and array edge targets', () => {
    const input = {
      nodes: [{ name: 'api', kind: 'service' }],
      edges: [
        { from: 'api', to: 'database' },
        { from: 'api', to: ['queue', 'cache'] },
      ],
    };

    expect(parseRawGraphData(input).edges).toEqual(input.edges);
  });

  it('preserves extra fields in loose graph records', () => {
    const input = {
      nodes: [
        {
          name: 'api',
          kind: 'service',
          extraNodeField: 'kept',
          vulnerabilities: [
            {
              file: 'src/api.ts',
              severity: 'high',
              message: 'Example vulnerability',
              extraVulnerabilityField: 'kept',
            },
          ],
        },
      ],
      edges: [{ from: 'api', to: 'database', extraEdgeField: 'kept' }],
    };

    const result = parseRawGraphData(input);

    expect(result.nodes[0]).toHaveProperty('extraNodeField', 'kept');
    expect(result.nodes[0]?.vulnerabilities?.[0]).toHaveProperty('extraVulnerabilityField', 'kept');
    expect(result.edges[0]).toHaveProperty('extraEdgeField', 'kept');
  });

  it.each([
    ['empty node name', { nodes: [{ name: '', kind: 'service' }], edges: [] }],
    ['empty node kind', { nodes: [{ name: 'api', kind: '' }], edges: [] }],
    ['empty edge source', { nodes: [{ name: 'api', kind: 'service' }], edges: [{ from: '', to: 'database' }] }],
    ['empty string edge target', { nodes: [{ name: 'api', kind: 'service' }], edges: [{ from: 'api', to: '' }] }],
    ['empty array edge target item', { nodes: [{ name: 'api', kind: 'service' }], edges: [{ from: 'api', to: ['database', ''] }] }],
    [
      'invalid vulnerability shape',
      {
        nodes: [
          {
            name: 'api',
            kind: 'service',
            vulnerabilities: [{ file: 'src/api.ts', severity: 'high' }],
          },
        ],
        edges: [],
      },
    ],
  ])('rejects %s', (_name, input) => {
    expect(() => parseRawGraphData(input)).toThrow(ZodError);
  });
});

describe('normalizeGraphData', () => {
  it('defaults optional node fields while preserving provided metadata', () => {
    const rawGraphData: RawGraphData = {
      nodes: [
        {
          name: 'api',
          kind: 'service',
          language: 'typescript',
          path: 'services/api',
          metadata: { team: 'platform' },
        },
        {
          name: 'database',
          kind: 'rds',
          publicExposed: true,
          vulnerabilities: [
            {
              file: 'database.sql',
              severity: 'high',
              message: 'Example vulnerability',
              metadata: { cwe: 'CWE-89' },
            },
          ],
        },
      ],
      edges: [{ from: 'api', to: 'database' }],
    };

    expect(normalizeGraphData(rawGraphData).nodes).toEqual([
      {
        name: 'api',
        kind: 'service',
        language: 'typescript',
        path: 'services/api',
        publicExposed: false,
        vulnerabilities: [],
        metadata: { team: 'platform' },
      },
      {
        name: 'database',
        kind: 'rds',
        language: undefined,
        path: undefined,
        publicExposed: true,
        vulnerabilities: [
          {
            file: 'database.sql',
            severity: 'high',
            message: 'Example vulnerability',
            metadata: { cwe: 'CWE-89' },
          },
        ],
        metadata: undefined,
      },
    ]);
  });

  it('expands multi-target edges into stable graph edges', () => {
    const rawGraphData: RawGraphData = {
      nodes: [{ name: 'api', kind: 'service' }],
      edges: [
        { from: 'api', to: 'database' },
        { from: 'api', to: ['queue', 'cache'] },
      ],
    };

    expect(normalizeGraphData(rawGraphData).edges).toEqual([
      { id: 'api=>database', from: 'api', to: 'database' },
      { id: 'api=>queue', from: 'api', to: 'queue' },
      { id: 'api=>cache', from: 'api', to: 'cache' },
    ]);
  });
});

describe('validateGraphData', () => {
  it('returns no warnings for a valid connected graph', () => {
    const graphData: GraphData = {
      nodes: [createNode('api'), createNode('database')],
      edges: [createEdge('api', 'database')],
    };

    expect(validateGraphData(graphData)).toEqual([]);
  });

  it('detects duplicate nodes', () => {
    const duplicateNode = createNode('api', { kind: 'rds' });
    const graphData: GraphData = {
      nodes: [createNode('api'), duplicateNode, createNode('database')],
      edges: [createEdge('api', 'database')],
    };

    expect(validateGraphData(graphData)).toEqual([
      {
        code: 'DUPLICATE_NODE',
        message: 'Duplicate node found: api',
        node: duplicateNode,
      },
    ]);
  });

  it('detects unknown edge sources', () => {
    const graphData: GraphData = {
      nodes: [createNode('database')],
      edges: [createEdge('missing-api', 'database')],
    };

    expect(validateGraphData(graphData)).toEqual([
      {
        code: 'UNKNOWN_EDGE_SOURCE',
        message: 'Edge source node does not exist: missing-api',
        edge: { from: 'missing-api', to: 'database' },
      },
    ]);
  });

  it('detects unknown edge targets', () => {
    const graphData: GraphData = {
      nodes: [createNode('api')],
      edges: [createEdge('api', 'missing-database')],
    };

    expect(validateGraphData(graphData)).toEqual([
      {
        code: 'UNKNOWN_EDGE_TARGET',
        message: 'Edge target node does not exist: missing-database',
        edge: { from: 'api', to: 'missing-database' },
      },
    ]);
  });

  it('detects isolated nodes', () => {
    const isolatedNode = createNode('queue');
    const graphData: GraphData = {
      nodes: [createNode('api'), createNode('database'), isolatedNode],
      edges: [createEdge('api', 'database')],
    };

    expect(validateGraphData(graphData)).toEqual([
      {
        code: 'ISOLATED_NODE',
        message: 'Node has no incoming or outgoing edges: queue',
        node: isolatedNode,
      },
    ]);
  });
});
