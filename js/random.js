/** Uniform integer in [0, maxExclusive), with rejection sampling to avoid modulo bias. */
export function secureRandomInt(maxExclusive) {
  if (!Number.isSafeInteger(maxExclusive) || maxExclusive < 1 || maxExclusive > 0x100000000) {
    throw new RangeError('Cantidad de participantes fuera del rango permitido.');
  }
  const range = 0x100000000;
  const limit = Math.floor(range / maxExclusive) * maxExclusive;
  const bucket = new Uint32Array(1);
  let value;
  do { crypto.getRandomValues(bucket); value = bucket[0]; } while (value >= limit);
  return value % maxExclusive;
}
