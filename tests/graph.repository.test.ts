import { GraphRepository } from '../src/graph/graph.repository.js';

import { createGraphEdge, createGraphNode } from './helpers/graph.js';

describe('GraphRepository', () => {
  const apiNode = createGraphNode('api');
  const databaseNode = createGraphNode('database', { kind: 'rds' });
  const apiToDatabaseEdge = createGraphEdge('api', 'database');

  function createRepository(): GraphRepository {
    return new GraphRepository({
      nodes: [apiNode, databaseNode],
      edges: [apiToDatabaseEdge],
    });
  }

  it('returns all nodes and edges', () => {
    const repository = createRepository();

    expect(repository.getAllNodes()).toEqual([apiNode, databaseNode]);
    expect(repository.getAllEdges()).toEqual([apiToDatabaseEdge]);
  });

  it('returns array copies so callers cannot mutate repository collections', () => {
    const repository = createRepository();

    repository.getAllNodes().push(createGraphNode('queue'));
    repository.getAllEdges().push(createGraphEdge('api', 'queue'));

    expect(repository.getAllNodes()).toEqual([apiNode, databaseNode]);
    expect(repository.getAllEdges()).toEqual([apiToDatabaseEdge]);
  });

  it('finds nodes by name', () => {
    const repository = createRepository();

    expect(repository.getNodeByName('api')).toBe(apiNode);
    expect(repository.getNodeByName('missing')).toBeUndefined();
  });
});
