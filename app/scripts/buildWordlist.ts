#!/usr/bin/env ts-node-script
export { };

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const util = require('util');

const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);

if (process.argv.length !== 5) {
  throw Error('Invalid use of buildWordlist.\nUsage: `buildWordlist.ts <path to peter brodas list> <path to cluedata> <output filename>`');
}

const peters = process.argv[2];
const cluedata = process.argv[3];
const out = process.argv[4];

const wordlist: Record<string, 0 | 1 | 2 | 3> = {};

const peterScoreMap = (petersScore: number): 0 | 1 | 2 | 3 => {
  if (petersScore < 50) {
    return 0;
  }
  if (petersScore < 60) {
    return 1;
  }
  if (petersScore < 80) {
    return 2;
  }
  return 3;
};

const cluedataScoreMap = (score: number): 0 | 1 | 2 | 3 => {
  if (score < 5) {
    return 0;
  }
  if (score < 15) {
    return 1;
  }
  return 2;
};

function fileContentsToWords(contents: string): Array<[string, number]> {
  const wordLines = contents.match(/[^\r\n]+/g);
  if (!wordLines) {
    throw new Error('malformed wordlist');
  }
  return wordLines
    .map(s => s.toUpperCase().split(';'))
    .filter(s => !/[^A-Z]/.test(s[0])) /* Filter any words w/ non-letters */
    .map((s): [string, number] => [s[0], parseInt(s[1])]);
}

readFile(peters, 'utf8').then((pc: string) => {
  const peterWords = fileContentsToWords(pc);
  peterWords.forEach(([word, score]) => {
    if (score >= 35) {
      wordlist[word] = peterScoreMap(score);
    }
  });

  readFile(cluedata, 'utf8').then((cc: string) => {
    const cluedataWords = fileContentsToWords(cc);
    cluedataWords.forEach(([word, score]) => {
      if (!wordlist[word]) {
        const newScore = cluedataScoreMap(score);
        if (newScore > 1) {
          console.log('Adding ' + word);
        }
        wordlist[word] = newScore;
      }
    });

    const outContent = Object.keys(wordlist).map(word => word + ';' + wordlist[word]).join('\n');
    writeFile(out, outContent).then(() => {
      console.log('wrote result to ' + out);
    });
  });
});