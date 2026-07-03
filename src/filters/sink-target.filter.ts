import type { GraphRoute } from '../graph/index.js';
import type { RouteFilter } from './route-filter.interface.js';

export class SinkTargetFilter implements RouteFilter {
  apply(route: GraphRoute): boolean {
    return ['rds', 'sqs'].includes(route.to.kind);
  }
}
