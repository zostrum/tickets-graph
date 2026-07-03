import { z } from 'zod';

const optionalBooleanQueryParamSchema = z
  .union([z.literal('true'), z.literal('false')])
  .transform((value) => value === 'true')
  .optional();

export const graphRoutesQuerySchema = z.object({
  startPublic: optionalBooleanQueryParamSchema,
  endSink: optionalBooleanQueryParamSchema,
  hasVulnerability: optionalBooleanQueryParamSchema,
});

export type ParsedGraphRoutesQuery = z.infer<typeof graphRoutesQuerySchema>;

export function formatGraphRoutesQueryErrors(error: z.ZodError): Array<{
  field: string;
  message: string;
}> {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || 'query',
    message: 'Expected value to be either "true" or "false".',
  }));
}
