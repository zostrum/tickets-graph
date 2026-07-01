import { z } from 'zod';

import type { RawGraphData } from './graph.types.js';

export const vulnerabilitySchema = z.looseObject({
  file: z.string(),
  severity: z.string(),
  message: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const rawGraphNodeSchema = z.looseObject({
  name: z.string().min(1),
  kind: z.string().min(1),
  language: z.string().optional(),
  path: z.string().optional(),
  publicExposed: z.boolean().optional(),
  vulnerabilities: z.array(vulnerabilitySchema).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const rawGraphEdgeSchema = z.looseObject({
  from: z.string().min(1),
  to: z.union([z.string().min(1), z.array(z.string().min(1))]),
});

export const rawGraphDataSchema = z.object({
  nodes: z.array(rawGraphNodeSchema),
  edges: z.array(rawGraphEdgeSchema),
});

export function parseRawGraphData(input: unknown): RawGraphData {
  return rawGraphDataSchema.parse(input) as RawGraphData;
}
