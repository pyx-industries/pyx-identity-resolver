import { parseArgs, describeOutcome, HELP_TEXT } from './v4-cli.utils';
import { MigrationOutcome } from './v4-transform';

const outcome = (over: Partial<MigrationOutcome> = {}): MigrationOutcome => ({
  mutated: true,
  inputResponseCount: 1,
  outputResponseCount: 1,
  rewrittenVersionEntries: 0,
  discardedLinkIds: [],
  ...over,
});

describe('parseArgs', () => {
  it('returns default options for an empty argv', () => {
    expect(parseArgs([])).toEqual({
      options: {
        dryRun: false,
        continueOnError: false,
        verbose: false,
      },
      helpRequested: false,
      helpText: HELP_TEXT,
    });
  });

  it('parses --dry-run, --continue-on-error and --verbose flags', () => {
    const { options } = parseArgs([
      '--dry-run',
      '--continue-on-error',
      '--verbose',
    ]);
    expect(options.dryRun).toBe(true);
    expect(options.continueOnError).toBe(true);
    expect(options.verbose).toBe(true);
  });

  it('parses --only with a value', () => {
    const { options } = parseArgs(['--only', 'gs1/01/09359502000041']);
    expect(options.only).toBe('gs1/01/09359502000041');
  });

  it('throws when --only is missing its value', () => {
    expect(() => parseArgs(['--only'])).toThrow(
      '--only requires a document id argument',
    );
  });

  it('sets helpRequested for -h and --help instead of exiting', () => {
    expect(parseArgs(['-h']).helpRequested).toBe(true);
    expect(parseArgs(['--help']).helpRequested).toBe(true);
  });

  it('throws on an unrecognised argument', () => {
    expect(() => parseArgs(['--bogus'])).toThrow(
      'Unrecognised argument: --bogus',
    );
  });
});

describe('describeOutcome', () => {
  it('shows the variant count when no merge occurred', () => {
    expect(
      describeOutcome(
        outcome({ inputResponseCount: 2, outputResponseCount: 2 }),
      ),
    ).toBe('2 variants');
  });

  it('shows the input -> output collapse when variants were merged', () => {
    expect(
      describeOutcome(
        outcome({ inputResponseCount: 3, outputResponseCount: 1 }),
      ),
    ).toContain('3 variants');
    expect(
      describeOutcome(
        outcome({ inputResponseCount: 3, outputResponseCount: 1 }),
      ),
    ).toContain('merged 2');
  });

  it('appends the rewritten-history count when nonzero', () => {
    expect(describeOutcome(outcome({ rewrittenVersionEntries: 4 }))).toContain(
      '4 version entries rewritten',
    );
  });

  it('appends the discarded link-id count (singular and plural)', () => {
    expect(describeOutcome(outcome({ discardedLinkIds: ['lnk-1'] }))).toContain(
      '1 discarded variant link-id',
    );
    expect(
      describeOutcome(outcome({ discardedLinkIds: ['lnk-1', 'lnk-2'] })),
    ).toContain('2 discarded variant link-ids');
  });
});
