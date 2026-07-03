import type { GraphRoute } from '../graph/index.js';

export interface RouteFilter {
  readonly name: string;
  apply(route: GraphRoute): boolean;
}
