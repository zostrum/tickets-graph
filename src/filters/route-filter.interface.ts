import type { GraphRoute } from '../graph/index.js';

export interface RouteFilter {
  apply(route: GraphRoute): boolean;
}
