import { jest } from '@jest/globals';
import type { Request, Response } from 'express';

import { GraphController } from '../src/routes/graph.controller.js';
import type { GraphService } from '../src/graph/graph.service.js';

import { createGraphEdge, createGraphNode, createGraphQueryResult, createGraphRoute } from './helpers/graph.js';

function createResponse(): Response {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

function createRequest(query: Request['query'] = {}): Request {
  return {
    query,
  } as Request;
}

function createGraphServiceMock(overrides: Partial<Record<'getFullGraph' | 'getRoutes', jest.Mock>> = {}): jest.Mocked<GraphService> {
  return {
    getFullGraph: jest.fn(() => createGraphQueryResult()),
    getRoutes: jest.fn(() => createGraphQueryResult()),
    ...overrides,
  } as unknown as jest.Mocked<GraphService>;
}

describe('GraphController', () => {
  it('returns full graph data with meta counts', () => {
    const apiNode = createGraphNode('api');
    const databaseNode = createGraphNode('database', { kind: 'rds' });
    const edge = createGraphEdge('api', 'database');
    const route = createGraphRoute(apiNode, databaseNode, edge);
    const graphResult = createGraphQueryResult({
      nodes: [apiNode, databaseNode],
      edges: [edge],
      routes: [route],
    });
    const graphService = createGraphServiceMock({
      getFullGraph: jest.fn(() => graphResult),
    });
    const controller = new GraphController(graphService);
    const response = createResponse();

    controller.getGraph(createRequest(), response);

    expect(graphService.getFullGraph).toHaveBeenCalledTimes(1);
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({
      data: graphResult,
      meta: {
        nodesCount: 2,
        edgesCount: 1,
        routesCount: 1,
      },
    });
  });

  it('returns a validation error for invalid route query parameters', () => {
    const graphService = createGraphServiceMock();
    const controller = new GraphController(graphService);
    const response = createResponse();

    controller.getRoutes(createRequest({ startPublic: 'yes' }), response);

    expect(graphService.getRoutes).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
      error: {
        message: 'Invalid route query parameters.',
        details: [
          {
            field: 'startPublic',
            message: 'Expected value to be either "true" or "false".',
          },
        ],
      },
    });
  });

  it('returns filtered routes with parsed filter metadata', () => {
    const apiNode = createGraphNode('api', { publicExposed: true });
    const databaseNode = createGraphNode('database', { kind: 'rds' });
    const edge = createGraphEdge('api', 'database');
    const route = createGraphRoute(apiNode, databaseNode, edge);
    const graphResult = createGraphQueryResult({
      nodes: [apiNode, databaseNode],
      edges: [edge],
      routes: [route],
    });
    const graphService = createGraphServiceMock({
      getRoutes: jest.fn(() => graphResult),
    });
    const controller = new GraphController(graphService);
    const response = createResponse();

    controller.getRoutes(createRequest({ startPublic: 'true', endSink: 'false' }), response);

    expect(graphService.getRoutes).toHaveBeenCalledWith({
      startPublic: true,
      endSink: false,
    });
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({
      data: graphResult,
      meta: {
        filters: {
          startPublic: true,
          endSink: false,
        },
        nodesCount: 2,
        edgesCount: 1,
        routesCount: 1,
      },
    });
  });
});
