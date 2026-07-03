import type { Request, Response } from 'express';

import type { GraphRouteFilterOptions } from '../graph/index.js';
import { GraphService } from '../graph/index.js';

export class GraphController {
  constructor(private readonly graphService: GraphService) {}

  getGraph = (_req: Request, res: Response): void => {
    const result = this.graphService.getFullGraph();

    res.status(200).json({
      data: result,
      meta: {
        nodesCount: result.nodes.length,
        edgesCount: result.edges.length,
        routesCount: result.routes.length,
      },
    });
  };

  getRoutes = (req: Request, res: Response): void => {
    const options = parseRouteFilterOptions(req.query);
    const result = this.graphService.getRoutes(options);

    res.status(200).json({
      data: result,
      meta: {
        filters: options,
        nodesCount: result.nodes.length,
        edgesCount: result.edges.length,
        routesCount: result.routes.length,
      },
    });
  };
}

function parseRouteFilterOptions(query: Request['query']): GraphRouteFilterOptions {
  return {
    startPublic: parseOptionalBoolean(query.startPublic),
    endSink: parseOptionalBoolean(query.endSink),
    hasVulnerability: parseOptionalBoolean(query.hasVulnerability),
  };
}

function parseOptionalBoolean(value: unknown): boolean | undefined {
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return undefined;
}
