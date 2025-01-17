import * as t from 'io-ts';

// We import this instead of defining it here so that we can define it
// differently for the main react app and the 'functions' subdirectory
import { timestamp } from './timestamp';

const CommentV = t.intersection([
  t.type({
    /** comment text */
    c: t.string,
    /** author id */
    a: t.string,
    /** author display name */
    n: t.string,
    /** author solve time in fractional seconds */
    t: t.number,
    /** author did cheat? */
    ch: t.boolean,
    /** comment publish timestamp */
    p: timestamp,
  }),
  t.partial({
    /** author username */
    un: t.string,
  }),
]);
type CommentT = t.TypeOf<typeof CommentV>;

export interface CommentWithRepliesT extends CommentT {
  /** comment id */
  i: string;
  /** replies */
  r?: Array<CommentWithRepliesT>;
}

const CommentWithRepliesV: t.Type<CommentWithRepliesT> = t.recursion(
  'CommentWithReplies',
  () =>
    t.intersection([
      CommentV,
      t.type({
        /** comment id */
        i: t.string,
      }),
      t.partial({
        /** replies */
        r: t.array(CommentWithRepliesV),
      }),
    ])
);

export const CommentForModerationV = t.intersection([
  CommentV,
  t.type({
    /** puzzle id */
    pid: t.string,
    /** id of the comment this is a reply to */
    rt: t.union([t.string, t.null]),
  }),
]);
export type CommentForModerationT = t.TypeOf<typeof CommentForModerationV>;

export const CommentForModerationWithIdV = t.intersection([
  CommentForModerationV,
  t.type({
    /** comment id */
    i: t.string,
  }),
]);
export type CommentForModerationWithIdT = t.TypeOf<
  typeof CommentForModerationWithIdV
>;

const DBPuzzleMandatoryV = t.type({
  /** author's user id */
  a: t.string,
  /** author's display name */
  n: t.string,
  /** category */
  c: t.union([t.string, t.null]),
  /** is this puzzle moderated? */
  m: t.boolean,
  /** timestamp when the puzzle goes live */
  p: timestamp,
  /** title */
  t: t.string,
  /** grid width / columns */
  w: t.number,
  /** grid height / rows */
  h: t.number,
  /** across clue strings */
  ac: t.array(t.string),
  /** across clue display numbers */
  an: t.array(t.number),
  /** down clue strings */
  dc: t.array(t.string),
  /** down clue display numbers */
  dn: t.array(t.number),
  /** grid (solution) */
  g: t.array(t.string),
});
const DBPuzzleOptionalV = t.partial({
  /** highlighted cell indexes */
  hs: t.array(t.number),
  /** use shade instead of circle for highlight? */
  s: t.boolean,
  /** comments */
  cs: t.array(CommentWithRepliesV),
  /** is this puzzle featured (should appear on homepage) */
  f: t.boolean,
  /** constructor notes */
  cn: t.string,
  /** blog post */
  bp: t.string,
  /** guest constructor */
  gc: t.string,
  /** isPrivate */
  pv: t.boolean,
  /** isPrivateUntil */
  pvu: timestamp,
  /** daily mini date */
  dmd: t.string,
  /** clue explanations (key is index into ac + dc) */
  cx: t.record(t.number, t.string),
  /** puzzle is marked for deletion */
  del: t.boolean,
  /** if present, this is a contest puzzle! these are the contest answers */
  ct_ans: t.array(t.string),
  /** the contest has a prize so give ppl option to include email address in submission */
  ct_prz: t.boolean,
  /** explanation of contest answer (shown as blog post after submission) */
  ct_exp: t.string,
});
export const DBPuzzleV = t.intersection([
  DBPuzzleMandatoryV,
  DBPuzzleOptionalV,
]);
export type DBPuzzleT = t.TypeOf<typeof DBPuzzleV>;

const PlayBaseV = t.intersection([
  t.type({
    /** crossword id */
    c: t.string,
    /** updated at */
    ua: timestamp,
    /** filled in grid */
    g: t.array(t.string),
    /** play time of last update to each cell, in fractional seconds */
    ct: t.array(t.number),
    /** update iteration count per cell */
    uc: t.array(t.number),
    /** list of (checked) correct cells */
    vc: t.array(t.number),
    /** list of (checked) wrong cells */
    wc: t.array(t.number),
    /** list of cells ever marked wrong */
    we: t.array(t.number),
    /** list of revealed cells */
    rc: t.array(t.number),
    /** total play time, in fractional seconds */
    t: t.number,
    /** did "cheat"? */
    ch: t.boolean,
    /** finished the puzzle? */
    f: t.boolean,
  }),
  t.partial({
    /** contest submission */
    ct_sub: t.string,
    /** contest submission timestamp */
    ct_t: timestamp,
    /** contest submission name */
    ct_n: t.string,
    /** contest prize email */
    ct_em: t.string,
  }),
]);

export const LegacyPlayV = t.intersection([
  PlayBaseV,
  t.type({
    /** user id */
    u: t.string,
  }),
  t.partial({
    /** puzzle title, optional for legacy plays in the db */
    n: t.string,
  }),
]);
export type LegacyPlayT = t.TypeOf<typeof LegacyPlayV>;

const PlayV = t.intersection([
  PlayBaseV,
  t.type({
    /** user id */
    u: t.string,
    /** puzzle title */
    n: t.string,
  }),
]);
export type PlayT = t.TypeOf<typeof PlayV>;

// We don't need a user id in local storage, but we do need a title
export const PlayWithoutUserV = t.intersection([
  PlayBaseV,
  t.type({
    /** puzzle title */
    n: t.string,
  }),
]);
export type PlayWithoutUserT = t.TypeOf<typeof PlayWithoutUserV>;

export function downloadTimestamped<A>(type: t.Type<A>) {
  return t.type({
    downloadedAt: timestamp,
    data: type,
  });
}

export function downloadOptionallyTimestamped<A>(type: t.Type<A>) {
  return t.type({
    downloadedAt: t.union([timestamp, t.null]),
    data: type,
  });
}

export function addZeros(dateString: string) {
  const groups = dateString.match(/^(\d+)-(\d+)-(\d+)$/);
  if (
    !groups ||
    groups[1] === undefined ||
    groups[2] === undefined ||
    groups[3] === undefined
  ) {
    throw new Error('Bad date string: ' + dateString);
  }
  const year = groups[1];
  let month = groups[2];
  if (month.length === 1) {
    month = '0' + month;
  }
  let date = groups[3];
  if (date.length === 1) {
    date = '0' + date;
  }
  return year + '-' + month + '-' + date;
}

export function getDateString(pd: Date): string {
  return pd.getUTCFullYear() + '-' + pd.getUTCMonth() + '-' + pd.getUTCDate();
}

export function prettifyDateString(dateString: string): string {
  const groups = dateString.match(/^(\d+)-(\d+)-(\d+)$/);
  if (!groups) {
    throw new Error('Bad date string: ' + dateString);
  }
  if (
    groups[2] === undefined ||
    groups[1] === undefined ||
    groups[3] === undefined
  ) {
    throw new Error('Bad date string: ' + dateString);
  }
  return parseInt(groups[2]) + 1 + '/' + parseInt(groups[3]) + '/' + groups[1];
}

export const PuzzleStatsV = t.intersection([
  t.type({
    /** author id, denormalized for security rules purposes. */
    a: t.string,
    /** updated at */
    ua: timestamp,
    /** total completions */
    n: t.number,
    /** total completions without cheats */
    s: t.number,
    /** total time spent on puzzle, in fractional seconds */
    nt: t.number,
    /** total time spent by those w/o cheats */
    st: t.number,
    /** total play time of last update to each cell, in fractional seconds */
    ct: t.array(t.number),
    /** total update iteration count for each cell */
    uc: t.array(t.number),
  }),
  t.partial({
    /** secret key for sharing stats access */
    sct: t.string,
  }),
]);
export type PuzzleStatsT = t.TypeOf<typeof PuzzleStatsV>;

const PuzzleInfoV = t.tuple([
  /** title */
  t.string,
  /** author name */
  t.string,
  /** author id */
  t.string,
]);
export const DailyStatsV = t.intersection([
  t.type({
    /** updated at */
    ua: timestamp,
    /** total completions */
    n: t.number,
    /** user ids with completions */
    u: t.array(t.string),
    /** completions by puzzleId */
    c: t.record(t.string, t.number),
    /** completions by hour (as UTC 0-23) */
    h: t.array(t.number),
  }),
  t.partial({
    /** puzzle title, authorName, authorId by puzzleId */
    i: t.record(t.string, PuzzleInfoV),
  }),
]);
export type DailyStatsT = t.TypeOf<typeof DailyStatsV>;

export const CronStatusV = t.type({
  ranAt: timestamp,
});
export type CronStatusT = t.TypeOf<typeof CronStatusV>;

/** date string -> puzzle id */
export const CategoryIndexV = t.record(t.string, t.string);
export type CategoryIndexT = t.TypeOf<typeof CategoryIndexV>;
