import type { GraphRoute } from '../graph/index.js';
import type { RouteFilter } from './route-filter.interface.js';

export class PublicSourceFilter implements RouteFilter {
  apply(route: GraphRoute): boolean {
    return route.from.publicExposed === true;
  }
}
