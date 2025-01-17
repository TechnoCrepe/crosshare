import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { isRight } from 'fp-ts/lib/Either';
import { PathReporter } from 'io-ts/lib/PathReporter';

import { requiresAuth, AuthProps } from '../../../components/AuthContext';
import { PuzzleResult, puzzleFromDB } from '../../../lib/types';
import { PuzzleStatsT, PuzzleStatsV, DBPuzzleV } from '../../../lib/dbtypes';
import { getFromSessionOrDB } from '../../../lib/dbUtils';
import { App } from '../../../lib/firebaseWrapper';
import { ErrorPage } from '../../../components/ErrorPage';
import { StatsPage } from '../../../components/PuzzleStats';

export default requiresAuth((props: AuthProps) => {
  const router = useRouter();
  const { puzzleId } = router.query;
  if (!puzzleId) {
    return <div />;
  }
  if (Array.isArray(puzzleId)) {
    return <ErrorPage title="Bad Puzzle Id" />;
  }
  return <PuzzleLoader key={puzzleId} puzzleId={puzzleId} auth={props} />;
});

// export for testing
export const PuzzleLoader = ({
  puzzleId,
  auth,
}: {
  puzzleId: string;
  auth: AuthProps;
}) => {
  const [puzzle, setPuzzle] = useState<PuzzleResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let didCancel = false;

    const fetchData = async () => {
      const db = App.firestore();
      db.collection('c')
        .doc(puzzleId)
        .get()
        .then((dbres) => {
          if (didCancel) {
            return;
          }
          if (!dbres.exists) {
            setError('No puzzle found');
          }
          const validationResult = DBPuzzleV.decode(dbres.data());
          if (isRight(validationResult)) {
            console.log('loaded puzzle from db');
            setPuzzle({
              ...puzzleFromDB(validationResult.right),
              id: dbres.id,
            });
          } else {
            console.error(PathReporter.report(validationResult).join(','));
            setError('Malformed puzzle found');
          }
        })
        .catch((e) => {
          console.error(e);
          if (didCancel) {
            return;
          }
          setError(typeof e === 'string' ? e : 'error loading puzzle');
        });
    };
    fetchData();
    return () => {
      didCancel = true;
    };
  }, [puzzleId]);
  if (error) {
    return (
      <ErrorPage title="Something Went Wrong">
        <p>{error}</p>
      </ErrorPage>
    );
  }
  if (!puzzle) {
    return <div>Loading...</div>;
  }

  if (!auth.isAdmin && auth.user.uid !== puzzle.authorId) {
    return (
      <ErrorPage title="Not Allowed">
        <p>You do not have permission to view this page</p>
      </ErrorPage>
    );
  }
  return <StatsLoader puzzle={puzzle} />;
};

const StatsLoader = ({ puzzle }: { puzzle: PuzzleResult }) => {
  const [stats, setStats] = useState<PuzzleStatsT | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [didLoad, setDidLoad] = useState<boolean>(false);

  useEffect(() => {
    let didCancel = false;

    const fetchData = async () => {
      getFromSessionOrDB({
        collection: 's',
        docId: puzzle.id,
        validator: PuzzleStatsV,
        ttl: 30 * 60 * 1000,
      })
        .then((s) => {
          if (didCancel) {
            return;
          }
          setStats(s);
          setDidLoad(true);
        })
        .catch((e) => {
          if (didCancel) {
            return;
          }
          setError(e);
          setDidLoad(true);
        });
    };
    fetchData();
    return () => {
      didCancel = true;
    };
  }, [puzzle.id]);

  if (error) {
    return (
      <ErrorPage title="Error Loading Stats">
        <p>
          Either something went wrong, or we don&apos;t have stats for this
          puzzle yet. Stats are updated once per hour, and won&apos;t be
          available until after a non-author has solved the puzzle.
        </p>
      </ErrorPage>
    );
  }
  if (!didLoad) {
    return <div>Loading stats...</div>;
  }

  return <StatsPage puzzle={puzzle} stats={stats} />;
};
