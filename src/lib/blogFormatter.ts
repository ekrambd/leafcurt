/**
 * Universal Blog Article Content Formatter
 * Formats plain text, markdown, and HTML with editorial typography and spacing
 * matching the authentic NeuAura clothing care blog layout.
 */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>');
}

export function formatArticleHtml(rawContent: string): string {
  if (!rawContent || !rawContent.trim()) return '';

  const trimmed = rawContent.trim();

  // If already structured HTML with paragraph tags or headings
  const hasHtmlStructure = /<\s*(p|h1|h2|h3|h4|ul|ol|table|blockquote|div)[\s>]/i.test(trimmed);

  if (hasHtmlStructure) {
    return trimmed;
  }

  // Parse plain text / markdown blocks separated by double (or more) newlines
  const blocks = trimmed.split(/\r?\n\s*\r?\n+/);

  const htmlBlocks = blocks.map(block => {
    const lines = block.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return '';

    // 1. Explicit Markdown H1 or H2 (## )
    if (lines.length === 1 && /^##?\s+/.test(lines[0])) {
      const text = lines[0].replace(/^##?\s+/, '');
      return `<h2>${escapeHtml(text)}</h2>`;
    }

    // 2. Explicit Markdown H3 (### )
    if (lines.length === 1 && /^###\s+/.test(lines[0])) {
      const text = lines[0].replace(/^###\s+/, '');
      return `<h3>${escapeHtml(text)}</h3>`;
    }

    // 3. Explicit Markdown H4 (#### )
    if (lines.length === 1 && /^####\s+/.test(lines[0])) {
      const text = lines[0].replace(/^####\s+/, '');
      return `<h4>${escapeHtml(text)}</h4>`;
    }

    // 4. Unordered List (- or *)
    if (lines.every(l => /^[-*]\s+/.test(l))) {
      const items = lines.map(l => `<li>${formatInline(escapeHtml(l.replace(/^[-*]\s+/, '')))}</li>`).join('');
      return `<ul>${items}</ul>`;
    }

    // 5. Numbered List (1. or 1) )
    if (lines.every(l => /^\d+[\.\)]\s+/.test(l))) {
      const items = lines.map(l => `<li>${formatInline(escapeHtml(l.replace(/^\d+[\.\)]\s+/, '')))}</li>`).join('');
      return `<ol>${items}</ol>`;
    }

    // 6. Blockquote (> )
    if (lines.every(l => /^>\s*/.test(l))) {
      const quoteText = lines.map(l => l.replace(/^>\s*/, '')).join(' ');
      return `<blockquote>${formatInline(escapeHtml(quoteText))}</blockquote>`;
    }

    // 7. Auto-detect natural Headings (Single line, short, no ending sentence punctuation)
    if (lines.length === 1) {
      const single = lines[0];
      const isShort = single.length > 2 && single.length <= 80;
      const noPunctuation = !/[.,;:!?]$/.test(single);
      const isHeadingLike = isShort && noPunctuation;

      if (isHeadingLike) {
        // Major heading if starts with 'How to', 'Step', 'Chapter' or is long title
        if (/^(how to|step\s*\d|part\s*\d|guide to|fabric care|clothing care)/i.test(single) || (single.length >= 35 && single === single.toUpperCase())) {
          return `<h2>${escapeHtml(single)}</h2>`;
        }
        return `<h3>${escapeHtml(single)}</h3>`;
      }
    }

    // 8. Standard Paragraph
    const joined = lines.map(l => formatInline(escapeHtml(l))).join('<br />');
    return `<p>${joined}</p>`;
  });

  return htmlBlocks.filter(Boolean).join('\n');
}
