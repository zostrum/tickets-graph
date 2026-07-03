import { Router } from 'express';

import { GraphService } from '../graph/index.js';
import { GraphController } from './graph.controller.js';

export function createGraphRouter(graphService: GraphService): Router {
  const router = Router();
  const controller = new GraphController(graphService);

  router.get('/', controller.getGraph);
  router.get('/routes', controller.getRoutes);

  return router;
}
