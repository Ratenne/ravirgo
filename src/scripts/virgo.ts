/**
 * Fixed figure traced from the user's 1024×843 reference, 3326_10465_2.jpg.
 * The first supplied image identifies Spica at the lower-right body junction.
 * A uniform scale preserves the reference orientation and aspect ratio.
 * Other vertices use diagram IDs rather than unverified astronomical names.
 */
const referenceStars = [
  { name: 'Spica', x: 587, y: 658 },
  { name: 'Virgo 02', x: 460, y: 465 },
  { name: 'Virgo 03', x: 303, y: 469 },
  { name: 'Virgo 04', x: 73, y: 548 },
  { name: 'Virgo 05', x: 620, y: 305 },
  { name: 'Virgo 06', x: 530, y: 169 },
  { name: 'Virgo 07', x: 735, y: 376 },
  { name: 'Virgo 08', x: 836, y: 313 },
  { name: 'Virgo 09', x: 958, y: 197 },
  { name: 'Virgo 10', x: 943, y: 93 },
  { name: 'Virgo 11', x: 825, y: 95 },
  { name: 'Virgo 12', x: 625, y: 512 },
  { name: 'Virgo 13', x: 340, y: 745 },
  { name: 'Virgo 14', x: 289, y: 655 },
  { name: 'Virgo 15', x: 145, y: 704 },
];
export const stars = referenceStars.map(s => ({ ...s, x: 900 + s.x * .5, y: 50 + s.y * .5 }));
const connections = [
  [0, 1], [0, 11], [0, 12], [1, 2], [2, 3],
  [1, 4], [4, 5], [4, 6], [11, 6],
  [6, 7], [7, 8], [8, 9], [9, 10], [12, 13], [13, 14],
];
// Distance from Spica controls both star activation and outward line drawing.
const depth = stars.map(() => Infinity);
depth[0] = 0;
const queue = [0];
for (let i = 0; i < queue.length; i++) {
  const current = queue[i];
  for (const [a, b] of connections) {
    const next = a === current ? b : b === current ? a : -1;
    if (next !== -1 && depth[next] === Infinity) {
      depth[next] = depth[current] + 1;
      queue.push(next);
    }
  }
}
const duration = Math.max(...depth) + 1;
export const starArrival = depth.map(d => d / duration);
export const edges = connections.map(([a, b]) => {
  const [from, to] = depth[a] <= depth[b] ? [a, b] : [b, a];
  return { from, to, start: depth[from] / duration, end: (depth[from] + 1) / duration };
});
