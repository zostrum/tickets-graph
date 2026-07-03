import express, { type Express } from 'express';

import { GraphService } from './graph/index.js';
import { createGraphRouter } from './routes/index.js';

export function createApp(graphService: GraphService): Express {
  const app = express();

  app.use(express.json());

  app.use('/api/graph', createGraphRouter(graphService));

  return app;
}
