import 'dotenv/config';

import { createApp } from './app.js';
import { GraphRepository, GraphService, loadGraph } from './graph/index.js';

const port = Number(process.env.PORT ?? 3000);

async function bootstrap(): Promise<void> {
  const loadedGraph = await loadGraph();

  if (loadedGraph.warnings.length > 0) {
    console.warn('Graph loaded with warnings:');

    for (const warning of loadedGraph.warnings) {
      console.warn(`- [${warning.code}] ${warning.message}`);
    }
  }

  const graphRepository = new GraphRepository(loadedGraph.data);
  const graphService = new GraphService(graphRepository);
  const app = createApp(graphService);

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

bootstrap().catch((error: unknown) => {
  console.error('Failed to start server');
  console.error(error);
  process.exit(1);
});
