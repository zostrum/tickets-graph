import type { GraphRouteFilterOptions } from '../graph/index.js';
import type { RouteFilter } from './route-filter.interface.js';
import { PublicSourceFilter } from './public-source.filter.js';
import { SinkTargetFilter } from './sink-target.filter.js';
import { VulnerableNodeFilter } from './vulnerable-node.filter.js';

const filterByOptionName: Record<keyof GraphRouteFilterOptions, RouteFilter> = {
  startPublic: new PublicSourceFilter(),
  endSink: new SinkTargetFilter(),
  hasVulnerability: new VulnerableNodeFilter(),
};

export function getEnabledRouteFilters(options: GraphRouteFilterOptions): RouteFilter[] {
  return Object.entries(options)
    .filter(([, enabled]) => enabled === true)
    .map(([name]) => filterByOptionName[name as keyof GraphRouteFilterOptions]);
}
