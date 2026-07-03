import { GraphRepository } from '../src/graph/graph.repository.js';
import { GraphService } from '../src/graph/graph.service.js';
import type { GraphData } from '../src/graph/graph.types.js';

import { createGraphEdge, createGraphNode, createVulnerability } from './helpers/graph.js';

describe('GraphService', () => {
  const publicApiNode = createGraphNode('public-api', { publicExposed: true });
  const databaseNode = createGraphNode('database', { kind: 'rds' });
  const workerNode = createGraphNode('worker', { vulnerabilities: [createVulnerability()] });
  const queueNode = createGraphNode('queue', { kind: 'sqs' });
  const internalApiNode = createGraphNode('internal-api');
  const orphanNode = createGraphNode('orphan');

  const graphData: GraphData = {
    nodes: [publicApiNode, databaseNode, workerNode, queueNode, internalApiNode, orphanNode],
    edges: [
      createGraphEdge('public-api', 'database'),
      createGraphEdge('public-api', 'worker'),
      createGraphEdge('worker', 'queue'),
      createGraphEdge('internal-api', 'database'),
      createGraphEdge('public-api', 'missing-service'),
    ],
  };

  function createService(data = graphData): GraphService {
    return new GraphService(new GraphRepository(data));
  }

  it('returns the full graph while skipping invalid routes', () => {
    const result = createService().getFullGraph();

    expect(result.nodes).toEqual(graphData.nodes);
    expect(result.edges).toEqual(graphData.edges);
    expect(result.routes.map((route) => route.id)).toEqual([
      'public-api=>database',
      'public-api=>worker',
      'worker=>queue',
      'internal-api=>database',
    ]);
  });

  it('applies enabled route filters with AND semantics', () => {
    const result = createService().getRoutes({
      startPublic: true,
      endSink: true,
    });

    expect(result.routes.map((route) => route.id)).toEqual(['public-api=>database']);
    expect(result.nodes).toEqual([publicApiNode, databaseNode]);
    expect(result.edges).toEqual([createGraphEdge('public-api', 'database')]);
  });

  it('filters routes that include a vulnerable endpoint', () => {
    const result = createService().getRoutes({
      hasVulnerability: true,
    });

    expect(result.routes.map((route) => route.id)).toEqual(['public-api=>worker', 'worker=>queue']);
    expect(result.nodes).toEqual([publicApiNode, workerNode, queueNode]);
    expect(result.edges).toEqual([createGraphEdge('public-api', 'worker'), createGraphEdge('worker', 'queue')]);
  });

  it('deduplicates nodes and edges in filtered results', () => {
    const duplicatedGraphData: GraphData = {
      nodes: [publicApiNode, databaseNode],
      edges: [createGraphEdge('public-api', 'database'), createGraphEdge('public-api', 'database')],
    };

    const result = createService(duplicatedGraphData).getRoutes();

    expect(result.routes).toHaveLength(2);
    expect(result.nodes).toEqual([publicApiNode, databaseNode]);
    expect(result.edges).toEqual([createGraphEdge('public-api', 'database')]);
  });

  it('returns empty result arrays for an empty graph', () => {
    expect(createService({ nodes: [], edges: [] }).getRoutes()).toEqual({
      nodes: [],
      edges: [],
      routes: [],
    });
  });
});
