import { getEnabledRouteFilters } from '../src/filters/filter-registry.js';
import { PublicSourceFilter } from '../src/filters/public-source.filter.js';
import { SinkTargetFilter } from '../src/filters/sink-target.filter.js';
import { VulnerableNodeFilter } from '../src/filters/vulnerable-node.filter.js';

import { createGraphEdge, createGraphNode, createGraphRoute, createVulnerability } from './helpers/graph.js';

describe('route filters', () => {
  describe('PublicSourceFilter', () => {
    it('matches routes that start from a public node', () => {
      const filter = new PublicSourceFilter();
      const publicRoute = createGraphRoute(createGraphNode('public-api', { publicExposed: true }), createGraphNode('database'));
      const internalRoute = createGraphRoute(createGraphNode('internal-api'), createGraphNode('database'));

      expect(filter.apply(publicRoute)).toBe(true);
      expect(filter.apply(internalRoute)).toBe(false);
    });
  });

  describe('SinkTargetFilter', () => {
    it('matches routes that end at configured sink node kinds', () => {
      const filter = new SinkTargetFilter();
      const rdsRoute = createGraphRoute(createGraphNode('api'), createGraphNode('database', { kind: 'rds' }));
      const sqsRoute = createGraphRoute(createGraphNode('api'), createGraphNode('queue', { kind: 'sqs' }));
      const serviceRoute = createGraphRoute(createGraphNode('api'), createGraphNode('worker'));

      expect(filter.apply(rdsRoute)).toBe(true);
      expect(filter.apply(sqsRoute)).toBe(true);
      expect(filter.apply(serviceRoute)).toBe(false);
    });
  });

  describe('VulnerableNodeFilter', () => {
    it('matches routes with vulnerabilities on either endpoint', () => {
      const filter = new VulnerableNodeFilter();
      const vulnerableSourceRoute = createGraphRoute(
        createGraphNode('api', { vulnerabilities: [createVulnerability()] }),
        createGraphNode('database'),
      );
      const vulnerableTargetRoute = createGraphRoute(
        createGraphNode('api'),
        createGraphNode('database', { vulnerabilities: [createVulnerability()] }),
      );
      const cleanRoute = createGraphRoute(createGraphNode('api'), createGraphNode('database'));

      expect(filter.apply(vulnerableSourceRoute)).toBe(true);
      expect(filter.apply(vulnerableTargetRoute)).toBe(true);
      expect(filter.apply(cleanRoute)).toBe(false);
    });
  });

  describe('getEnabledRouteFilters', () => {
    it('returns filters only for options set to true', () => {
      const filters = getEnabledRouteFilters({
        startPublic: true,
        endSink: false,
        hasVulnerability: true,
      });

      expect(filters).toHaveLength(2);
      expect(filters[0]).toBeInstanceOf(PublicSourceFilter);
      expect(filters[1]).toBeInstanceOf(VulnerableNodeFilter);
    });

    it('returns no filters when options are false or undefined', () => {
      expect(getEnabledRouteFilters({ startPublic: false, endSink: undefined })).toEqual([]);
    });

    it('returns enabled filters that apply to routes', () => {
      const [publicSourceFilter, sinkTargetFilter] = getEnabledRouteFilters({
        startPublic: true,
        endSink: true,
      });
      const route = createGraphRoute(
        createGraphNode('public-api', { publicExposed: true }),
        createGraphNode('database', { kind: 'rds' }),
        createGraphEdge('public-api', 'database'),
      );

      expect(publicSourceFilter?.apply(route)).toBe(true);
      expect(sinkTargetFilter?.apply(route)).toBe(true);
    });
  });
});
