import { Comments, CommentText } from '../components/Comments';
import { render } from '../lib/testingUtils';
import { Comment } from '../lib/types';
import { setApp } from '../lib/firebaseWrapper';
import * as firebaseTesting from '@firebase/testing';

jest.mock('../lib/firebaseWrapper');

const testComments: Array<Comment> = [
  {
    id: 'comment-id',
    commentText: 'my first comment',
    authorId: 'comment-author-id',
    authorDisplayName: 'Mike D',
    authorSolveTime: 55.4,
    authorCheated: false,
    publishTime: new Date().getTime(),
  },
];

test('basic comment display', () => {
  setApp(
    firebaseTesting.initializeTestApp({
      projectId: 'test1',
    }) as firebase.app.App
  );
  const { getByText, container } = render(
    <Comments
      solveTime={10}
      didCheat={false}
      puzzleId="puzz"
      puzzleAuthorId="puzzAuthor"
      user={undefined}
      comments={testComments}
    />,
    {}
  );
  expect(getByText(/my first comment/i)).toBeVisible();
  expect(container.firstChild).toMatchSnapshot();
});

test('spoiler text rendering', () => {
  const r = render(<CommentText text='foo bar >!baz' />, {});
  expect(r.container).toMatchSnapshot();

  const r1 = render(<CommentText text='foo bar >!baz!<' />, {});
  expect(r1.container).toMatchSnapshot();

  const r2 = render(<CommentText text='>!baz foo bam ! >> fooey!<' />, {});
  expect(r2.container).toMatchSnapshot();

  const r3 = render(<CommentText text='>!baz foo bam ! >> fooey!< with after text' />, {});
  expect(r3.container).toMatchSnapshot();
});

test('security rules should only allow commenting as onesself', async () => {
  const app = firebaseTesting.initializeTestApp({
    projectId: 'mdcrosshare',
    auth: {
      uid: 'mike',
      admin: false,
      firebase: {
        sign_in_provider: 'google.com',
      },
    },
  });

  await firebaseTesting.assertFails(
    app.firestore().collection('cfm').add({ c: 'comment text' })
  );
  await firebaseTesting.assertFails(
    app.firestore().collection('cfm').add({ c: 'comment text', a: 'jared' })
  );
  await firebaseTesting.assertSucceeds(
    app.firestore().collection('cfm').add({ c: 'comment text', a: 'mike' })
  );
  app.delete();
});

test('security rules should only allow commenting if non-anonymous', async () => {
  const app = firebaseTesting.initializeTestApp({
    projectId: 'mdcrosshare',
    auth: {
      uid: 'mike',
      admin: false,
      firebase: {
        sign_in_provider: 'anonymous',
      },
    },
  });

  await firebaseTesting.assertFails(
    app.firestore().collection('cfm').add({ c: 'comment text' })
  );
  await firebaseTesting.assertFails(
    app.firestore().collection('cfm').add({ c: 'comment text', a: 'jared' })
  );
  await firebaseTesting.assertFails(
    app.firestore().collection('cfm').add({ c: 'comment text', a: 'mike' })
  );
  app.delete();
});
