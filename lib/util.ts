// Bỏ dấu tiếng Việt và chuẩn hoá so sánh tên
export function normalizeName(s: string): string {
  return (s || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

export function isNumericLike(v: any): boolean {
  if (v === null || v === undefined || v === '') return false;
  if (typeof v === 'number') return true;
  if (typeof v === 'string') return /^-?\d+(\.\d+)?$/.test(v.trim());
  return false;
}
