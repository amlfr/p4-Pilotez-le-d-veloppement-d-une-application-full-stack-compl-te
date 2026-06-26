/** Human-readable file size in French units (o, Ko, Mo, Go), e.g. "1,5 Mo". */
export function formatSize(bytes: number): string {
  const units = ['o', 'Ko', 'Mo', 'Go'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const rounded =
    unit === 0 ? String(value) : value.toFixed(1).replace(/\.0$/, '');
  return `${rounded.replace('.', ',')} ${units[unit]}`;
}
