import type { GraphData, GraphEdge, GraphNode } from './graph.types.js';

export class GraphRepository {
  private readonly nodes: GraphNode[];
  private readonly edges: GraphEdge[];
  private readonly nodesByName: Map<string, GraphNode>;
  private readonly outgoingEdgesByNode: Map<string, GraphEdge[]>;
  private readonly incomingEdgesByNode: Map<string, GraphEdge[]>;

  constructor(graphData: GraphData) {
    this.nodes = graphData.nodes;
    this.edges = graphData.edges;

    this.nodesByName = this.createNodesByNameMap(graphData.nodes);
    this.outgoingEdgesByNode = this.createOutgoingEdgesMap(graphData.edges);
    this.incomingEdgesByNode = this.createIncomingEdgesMap(graphData.edges);
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

  hasNode(name: string): boolean {
    return this.nodesByName.has(name);
  }

  getOutgoingEdges(nodeName: string): GraphEdge[] {
    return [...(this.outgoingEdgesByNode.get(nodeName) ?? [])];
  }

  getIncomingEdges(nodeName: string): GraphEdge[] {
    return [...(this.incomingEdgesByNode.get(nodeName) ?? [])];
  }

  getNeighbors(nodeName: string): string[] {
    return this.getOutgoingEdges(nodeName).map((edge) => edge.to);
  }

  getPublicNodes(): GraphNode[] {
    return this.nodes.filter((node) => node.publicExposed);
  }

  getSinkNodes(): GraphNode[] {
    return this.nodes.filter((node) => this.isSinkNode(node));
  }

  getVulnerableNodes(): GraphNode[] {
    return this.nodes.filter((node) => node.vulnerabilities.length > 0);
  }

  private createNodesByNameMap(nodes: GraphNode[]): Map<string, GraphNode> {
    return new Map(nodes.map((node) => [node.name, node]));
  }

  private createOutgoingEdgesMap(edges: GraphEdge[]): Map<string, GraphEdge[]> {
    const result = new Map<string, GraphEdge[]>();

    for (const edge of edges) {
      const currentEdges = result.get(edge.from) ?? [];
      currentEdges.push(edge);
      result.set(edge.from, currentEdges);
    }

    return result;
  }

  private createIncomingEdgesMap(edges: GraphEdge[]): Map<string, GraphEdge[]> {
    const result = new Map<string, GraphEdge[]>();

    for (const edge of edges) {
      const currentEdges = result.get(edge.to) ?? [];
      currentEdges.push(edge);
      result.set(edge.to, currentEdges);
    }

    return result;
  }

  private isSinkNode(node: GraphNode): boolean {
    return ['rds', 'sqs'].includes(node.kind);
  }
}
