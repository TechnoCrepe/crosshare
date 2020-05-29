import { AuthProps, requiresAdmin } from '../components/AuthContext';
import { BuilderDBLoader } from '../components/Builder';

export default requiresAdmin((authProps: AuthProps) => {
  const size = 5;
  const grid = [
    ' ', ' ', ' ', ' ', ' ',
    ' ', ' ', ' ', ' ', ' ',
    ' ', ' ', ' ', ' ', ' ',
    ' ', ' ', ' ', ' ', ' ',
    ' ', ' ', ' ', ' ', ' ',
  ];
  // size = 15;
  // grid = [
  //   " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ",
  //   " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ",
  //   " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ",
  //   " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ",
  //   " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ",
  //   " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ",
  //   " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ",
  //   " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ",
  //   " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ",
  //   " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ",
  //   " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ",
  //   " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ",
  //   " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ",
  //   " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ",
  //   " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ",
  // ];
  // size = 15;
  // grid = [
  //   "    .    .     ",
  //   "    .    .     ",
  //   "    .    .     ",
  //   "VANBURENZOPIANO",
  //   "...   ..   ....",
  //   "WASHINGTONYHAWK",
  //   "   ..   .      ",
  //   "     .   .     ",
  //   "      .   ..   ",
  //   "ROOSEVELTONJOHN",
  //   "....   ..   ...",
  //   "JEFFERSONNYBONO",
  //   "     .    .    ",
  //   "     .    .    ",
  //   "     .    .    "
  // ];
  // grid = grid.map(s => s.split("")).flat();
  const props = {
    'size': {
      'rows': size,
      'cols': size
    },
    'grid': grid
  };

  return <BuilderDBLoader {...props} {...authProps} />;
});
