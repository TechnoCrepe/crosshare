import { NextApiRequest, NextApiResponse } from 'next';
import { createCanvas, loadImage, PNGStream } from 'canvas';
import { isRight } from 'fp-ts/lib/Either';
import { PathReporter } from 'io-ts/lib/PathReporter';

import { App } from '../../../lib/firebaseWrapper';
import { DBPuzzleV, DBPuzzleT } from '../../../lib/dbtypes';

function getPng(puzzle: DBPuzzleT): Promise<PNGStream> {
  console.log('Generating png for ' + puzzle.t);

  const canvas = createCanvas(1200, 630);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let gridWidth = 600;
  let gridHeight = 600;
  let xOffset = 0;
  let yOffset = 0;

  if (puzzle.w !== puzzle.h) {
    if (puzzle.w > puzzle.h) {
      gridHeight = 600 * puzzle.h / puzzle.w;
      yOffset = (600 - gridHeight) / 2;
    } else {
      gridWidth = 600 * puzzle.w / puzzle.h;
      xOffset = (600 - gridWidth) / 2;
    }
  }

  // Puzzle outline
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.strokeRect(300 + xOffset, 15 + yOffset, gridWidth, gridHeight);

  // Grid lines
  ctx.lineWidth = 2;
  const widthDivision = gridWidth / puzzle.w;
  const heightDivision = gridHeight / puzzle.h;
  ctx.beginPath();
  for (let i = 1; i < puzzle.w; i += 1) {
    ctx.moveTo(300 + i * widthDivision + xOffset, 15 + yOffset);
    ctx.lineTo(300 + i * widthDivision + xOffset, 15 + gridHeight + yOffset);
  }
  for (let i = 1; i < puzzle.h; i += 1) {
    ctx.moveTo(300 + xOffset, 15 + i * heightDivision + yOffset);
    ctx.lineTo(300 + gridWidth + xOffset, 15 + i * heightDivision + yOffset);
  }
  ctx.stroke();

  // Grid squares
  for (let i = 0; i < puzzle.g.length; i += 1) {
    if (puzzle.g[i] !== '.') {
      continue;
    }
    const col = i % puzzle.w;
    const row = Math.floor(i / puzzle.w);

    ctx.fillStyle = 'black';
    ctx.fillRect(300 + col * widthDivision + xOffset, 15 + row * heightDivision + yOffset, widthDivision, heightDivision);
  }

  // Center Logo
  ctx.beginPath();
  ctx.arc(600, 315, 150, 0, 2 * Math.PI);
  ctx.fillStyle = 'white';
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 1;
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(600, 315, 145, 0, 2 * Math.PI);
  ctx.fillStyle = '#EB984E';
  ctx.fill();

  return loadImage('./public/logo.svg').then((img) => {
    ctx.drawImage(img, 500, 215);
    return canvas.createPNGStream();
  });
}

async function getPuzzle(puzzleId: string): Promise<DBPuzzleT | null> {
  const db = App.firestore();
  let dbres;
  try {
    dbres = await db.collection('c').doc(puzzleId).get();
  } catch {
    return null;
  }
  if (!dbres.exists) {
    return null;
  }
  const validationResult = DBPuzzleV.decode(dbres.data());
  if (isRight(validationResult)) {
    return validationResult.right;
  } else {
    console.error(PathReporter.report(validationResult).join(','));
    return null;
  }
}

export default async function ogImage(req: NextApiRequest, res: NextApiResponse) {
  const { puzzleId } = req.query;
  if (!puzzleId || Array.isArray(puzzleId)) {
    return res.status(404).json({ statusCode: 404, message: 'bad puzzle params' });
  }
  const puzzle = await getPuzzle(puzzleId);
  if (!puzzle) {
    return res.status(404).json({ statusCode: 404, message: 'failed to get puzzle' });
  }
  res.setHeader('Cache-Control', 'public, max-age=172800, s-maxage=172800');
  res.writeHead(200, { 'Content-Type': 'image/png' });
  const png = await getPng(puzzle);
  png.pipe(res);
}