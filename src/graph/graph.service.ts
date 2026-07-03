import type { GraphEdge, GraphNode, GraphQueryResult, GraphRoute, GraphRouteFilterOptions } from './graph.types.js';
import { GraphRepository } from './graph.repository.js';
import { getEnabledRouteFilters } from '../filters/index.js';

export class GraphService {
  constructor(private readonly repository: GraphRepository) {}

  getFullGraph(): GraphQueryResult {
    const routes = this.getAllValidRoutes();

    return {
      nodes: this.repository.getAllNodes(),
      edges: this.repository.getAllEdges(),
      routes,
    };
  }

  getRoutes(options: GraphRouteFilterOptions = {}): GraphQueryResult {
    const filters = getEnabledRouteFilters(options);

    const routes = this.getAllValidRoutes().filter((route) => filters.every((filter) => filter.apply(route)));

    return this.createGraphQueryResultFromRoutes(routes);
  }

  private getAllValidRoutes(): GraphRoute[] {
    return this.repository
      .getAllEdges()
      .map((edge) => this.createRouteFromEdge(edge))
      .filter((route): route is GraphRoute => route !== null);
  }

  private createRouteFromEdge(edge: GraphEdge): GraphRoute | null {
    const fromNode = this.repository.getNodeByName(edge.from);
    const toNode = this.repository.getNodeByName(edge.to);

    /**
     * The provided JSON contains at least one edge target that is not defined
     * in the nodes list: assurance-service.
     *
     * We skip such routes here because a client-renderable graph route should
     * contain resolvable source and target nodes.
     */
    if (!fromNode || !toNode) {
      return null;
    }

    return {
      id: edge.id,
      from: fromNode,
      to: toNode,
      edge,
    };
  }

  private createGraphQueryResultFromRoutes(routes: GraphRoute[]): GraphQueryResult {
    const nodesByName = new Map<string, GraphNode>();
    const edgesById = new Map<string, GraphEdge>();

    for (const route of routes) {
      nodesByName.set(route.from.name, route.from);
      nodesByName.set(route.to.name, route.to);
      edgesById.set(route.edge.id, route.edge);
    }

    return {
      nodes: [...nodesByName.values()],
      edges: [...edgesById.values()],
      routes,
    };
  }
}
