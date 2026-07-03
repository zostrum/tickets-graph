import type { GraphRoute } from '../graph/index.js';
import type { RouteFilter } from './route-filter.interface.js';

export class VulnerableNodeFilter implements RouteFilter {
  apply(route: GraphRoute): boolean {
    return route.from.vulnerabilities.length > 0 || route.to.vulnerabilities.length > 0;
  }
}
