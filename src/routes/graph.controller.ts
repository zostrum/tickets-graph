import type { Request, Response } from 'express';

import { GraphService } from '../graph/index.js';
import { formatGraphRoutesQueryErrors, graphRoutesQuerySchema } from './graph.query-schema.js';

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
    const parsedQuery = graphRoutesQuerySchema.safeParse(req.query);

    if (!parsedQuery.success) {
      res.status(400).json({
        error: {
          message: 'Invalid route query parameters.',
          details: formatGraphRoutesQueryErrors(parsedQuery.error),
        },
      });

      return;
    }

    const result = this.graphService.getRoutes(parsedQuery.data);

    res.status(200).json({
      data: result,
      meta: {
        filters: parsedQuery.data,
        nodesCount: result.nodes.length,
        edgesCount: result.edges.length,
        routesCount: result.routes.length,
      },
    });
  };
}
