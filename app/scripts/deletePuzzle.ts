#!/usr/bin/env -S npx ts-node-script --skip-project -O '{"resolveJsonModule":true,"esModuleInterop":true,"jsx":"preserve","downlevelIteration":true}'

import { PathReporter } from 'io-ts/lib/PathReporter';
import { isRight } from 'fp-ts/lib/Either';
import { DBPuzzleV } from '../lib/dbtypes';

import { AdminApp } from '../lib/firebaseWrapper';
import { PuzzleIndexV } from '../lib/serverOnly';

if (process.argv.length !== 3) {
  throw Error(
    'Invalid use of deletePuzzle. Usage: ./scripts/deletePuzzle.ts [puzzleId]'
  );
}

const db = AdminApp.firestore();

async function removeFromIndex(
  indexRes: FirebaseFirestore.DocumentSnapshot,
  puzzleId: string
) {
  console.log(`attempting delete for ${indexRes.id}`);
  if (!indexRes.exists) {
    console.log('no index, skipping');
    return;
  }

  const validationResult = PuzzleIndexV.decode(indexRes.data());
  if (!isRight(validationResult)) {
    console.error(PathReporter.report(validationResult).join(','));
    return;
  }
  const idx = validationResult.right;
  const pi = idx.i.indexOf(puzzleId);
  if (pi < 0) {
    console.log('puzzle not in index');
    return;
  }

  console.log('splicing out ', idx.i.splice(pi, 1));
  idx.t.splice(pi, 1);

  console.log('writing');
  await indexRes.ref.set(idx);
}

async function deletePuzzle() {
  console.log(`deleting ${process.argv[2]}`);
  const dbres = await db.doc(`c/${process.argv[2]}`).get();
  if (!dbres.exists) {
    console.error('no such puzzle');
    return;
  }
  const validationResult = DBPuzzleV.decode(dbres.data());
  if (!isRight(validationResult)) {
    console.error(PathReporter.report(validationResult).join(','));
    return;
  }
  const dbpuz = validationResult.right;

  if (dbpuz.c) {
    console.error(`Can't delete for category ${dbpuz.c}`);
    return;
  }

  console.log('deleting notifications');
  db.collection('n')
    .where('p', '==', dbres.id)
    .get()
    .then((snap) => {
      snap.forEach(async (res) => {
        console.log('deleting notification');
        await res.ref.delete();
      });
    });

  const featuredIndexRes = await db.doc('i/featured').get();
  removeFromIndex(featuredIndexRes, dbres.id);

  const authorIndexRes = await db.doc(`i/${dbpuz.a}`).get();
  removeFromIndex(authorIndexRes, dbres.id);

  console.log('deleting puzzle');
  await db.doc(`c/${process.argv[2]}`).delete();
}

deletePuzzle().then(() => {
  console.log('Done');
});