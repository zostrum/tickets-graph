import { graphRoutesQuerySchema, formatGraphRoutesQueryErrors } from '../src/routes/graph.query-schema.js';

describe('graphRoutesQuerySchema', () => {
  it('parses boolean query parameter strings', () => {
    expect(
      graphRoutesQuerySchema.parse({
        startPublic: 'true',
        endSink: 'false',
        hasVulnerability: 'true',
      }),
    ).toEqual({
      startPublic: true,
      endSink: false,
      hasVulnerability: true,
    });
  });

  it('allows omitted query parameters', () => {
    expect(graphRoutesQuerySchema.parse({})).toEqual({});
  });

  it('formats invalid query parameter errors by field', () => {
    const parsedQuery = graphRoutesQuerySchema.safeParse({
      startPublic: 'yes',
      endSink: '1',
    });

    expect(parsedQuery.success).toBe(false);

    if (!parsedQuery.success) {
      expect(formatGraphRoutesQueryErrors(parsedQuery.error)).toEqual([
        {
          field: 'startPublic',
          message: 'Expected value to be either "true" or "false".',
        },
        {
          field: 'endSink',
          message: 'Expected value to be either "true" or "false".',
        },
      ]);
    }
  });
});
