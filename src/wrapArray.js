export default function wrap(thing) {
  if (Array.isArray(thing)) { return thing; }
  return [thing];
}
