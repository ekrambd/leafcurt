/**
 * Official Standard Code 128 (Subset B) Barcode Generator.
 * Fully compatible with all real laser and mobile phone camera scanners (ZBar, ZXing, Google Lens, iOS Camera).
 */

const CODE128_PATTERNS = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112'
];

/**
 * Encodes an ASCII string into standard Code 128 (Subset B) modules.
 * Returns an array of bar and space widths (alternating bar, space, bar, space...)
 */
export function encodeCode128B(rawText: string): { width: number; isBar: boolean }[] {
  const text = (rawText || '1001').trim();
  const startCode = 104; // Start Code B
  let checkSum = startCode;
  const codes: number[] = [startCode];

  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    // ASCII 32 to 126
    const code = charCode - 32;
    if (code >= 0 && code <= 94) {
      codes.push(code);
      checkSum += code * (i + 1);
    }
  }

  const checkDigit = checkSum % 103;
  codes.push(checkDigit);
  codes.push(106); // Stop Code

  // Build alternating bars and spaces with quiet zones
  const patternString = codes.map(c => CODE128_PATTERNS[c] || CODE128_PATTERNS[0]).join('');
  const modules: { width: number; isBar: boolean }[] = [];

  // Leading quiet zone (10 modules wide space)
  modules.push({ width: 10, isBar: false });

  for (let i = 0; i < patternString.length; i++) {
    const w = parseInt(patternString[i], 10) || 1;
    const isBar = i % 2 === 0;
    modules.push({ width: w, isBar });
  }

  // Trailing quiet zone (10 modules wide space)
  modules.push({ width: 10, isBar: false });

  return modules;
}
