#!/usr/bin/env -S npx ts-node-script

import { PathReporter } from 'io-ts/lib/PathReporter';
import { isRight } from 'fp-ts/lib/Either';
import {
  getDateString,
  DailyStatsV,
  DBPuzzleT,
  DBPuzzleV,
} from '../lib/dbtypes';

import { AdminApp } from '../lib/firebaseWrapper';

if (process.argv.length !== 2) {
  throw Error(
    'Invalid use of generateWeeklyEmail. Usage: ./scripts/generateWeeklyEmail.ts'
  );
}

const db = AdminApp.firestore();

function sumOnto(
  a: Record<string, number>,
  b: Record<string, number> | undefined
) {
  if (!b) {
    return;
  }
  for (const [k, v] of Object.entries(b)) {
    a[k] = (a[k] || 0) + v;
  }
}

function replaceOnto<T>(
  a: Record<string, T>,
  b: Record<string, T> | undefined
) {
  if (!b) {
    return;
  }
  Object.assign(a, b);
}

async function topPuzzlesForWeek(): Promise<Array<[string, string]>> {
  const totalC: Record<string, number> = {};
  const allIs: Record<string, [string, string, string]> = {};
  const d = new Date();
  for (let i = 0; i < 7; i += 1) {
    const dateString = getDateString(d);
    console.log(dateString);
    const dbres = await db.collection('ds').doc(dateString).get();
    if (!dbres.exists) {
      continue;
    }
    const validationResult = DailyStatsV.decode(dbres.data());
    if (isRight(validationResult)) {
      sumOnto(totalC, validationResult.right.c);
      replaceOnto(allIs, validationResult.right.i);
    } else {
      console.error(PathReporter.report(validationResult).join(','));
    }
    d.setDate(d.getDate() - 1);
  }
  return Promise.all(
    Object.entries(totalC)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(
        async ([id]): Promise<(DBPuzzleT & { id: string }) | null> => {
          const dbres = await db.collection('c').doc(id).get();
          if (!dbres.exists) {
            return null;
          }
          const validationResult = DBPuzzleV.decode(dbres.data());
          if (isRight(validationResult)) {
            return { ...validationResult.right, id };
          } else {
            return null;
          }
        }
      )
  ).then((puzzles) => {
    return puzzles
      .filter((p) => {
        if (p === null) {
          return false;
        }
        if (p.pv) {
          return false;
        }
        if (p.pvu && p.pvu.toDate() > new Date()) {
          return false;
        }
        return true;
      })
      .map((p): [string, string] => {
        if (!p) {
          throw new Error('impossible');
        }
        return ['https://crosshare.org/crosswords/' + p.id, `${p.t} by ${p.n}`];
      });
  });
}

async function generateWeeklyEmail() {
  const topForWeek = await topPuzzlesForWeek();
  console.log('<strong>Most popular puzzles this week:</strong><br />');
  topForWeek.forEach(([link, text]) => {
    console.log('<a href="' + link + '">' + text + '</a> - <br /><br />');
  });
}

generateWeeklyEmail().then(() => {
  console.log('Finished generation');
});
