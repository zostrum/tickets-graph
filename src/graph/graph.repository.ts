import type { GraphData, GraphEdge, GraphNode } from './graph.types.js';

export class GraphRepository {
  private readonly nodes: GraphNode[];
  private readonly edges: GraphEdge[];
  private readonly nodesByName: Map<string, GraphNode>;

  constructor(graphData: GraphData) {
    this.nodes = graphData.nodes;
    this.edges = graphData.edges;

    this.nodesByName = this.createNodesByNameMap(graphData.nodes);
  }

  /**
   * Get all nodes
   * @returns {GraphNode[]}
   */
  getAllNodes(): GraphNode[] {
    return [...this.nodes];
  }

  getAllEdges(): GraphEdge[] {
    return [...this.edges];
  }

  getNodeByName(name: string): GraphNode | undefined {
    return this.nodesByName.get(name);
  }

  private createNodesByNameMap(nodes: GraphNode[]): Map<string, GraphNode> {
    return new Map(nodes.map((node) => [node.name, node]));
  }
}
