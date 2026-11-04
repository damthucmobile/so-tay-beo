'use client';

import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  isUser?: boolean;
}

/**
 * Xử lý chuỗi nội dung inline: **in đậm**, *in nghiêng*, `code`, link
 */
function renderInline(text: string, isUser = false): React.ReactNode {
  if (!text) return null;

  // Regex nhận diện các token: inline code, bold+italic, bold, italic, link
  const tokenRegex = /(`[^`]+`|\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*\n]+\*|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    // 1. Inline code: `code`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={index}
          className={`px-1 py-0.5 rounded text-[11px] font-mono ${
            isUser
              ? 'bg-zinc-800 text-zinc-100'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700/60'
          }`}
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // 2. In đậm + In nghiêng: ***text***
    if (part.startsWith('***') && part.endsWith('***') && part.length >= 6) {
      return (
        <strong key={index} className="font-bold italic">
          {part.slice(3, -3)}
        </strong>
      );
    }

    // 3. In đậm: **text**
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong
          key={index}
          className={`font-semibold ${
            isUser ? 'text-white dark:text-zinc-900 font-bold' : 'text-zinc-900 dark:text-zinc-100 font-semibold'
          }`}
        >
          {part.slice(2, -2)}
        </strong>
      );
    }

    // 4. In nghiêng: *text*
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em
          key={index}
          className={`italic ${
            isUser ? 'opacity-90' : 'text-zinc-600 dark:text-zinc-400'
          }`}
        >
          {part.slice(1, -1)}
        </em>
      );
    }

    // 5. Đường dẫn: [text](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const [, label, url] = linkMatch;
      return (
        <a
          key={index}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:opacity-80 font-medium"
        >
          {label}
        </a>
      );
    }

    // Văn bản bình thường
    return <span key={index}>{part}</span>;
  });
}

/**
 * Component hiển thị Markdown trực quan, tối ưu phong cách shadcn / monochrome
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
  isUser = false,
}) => {
  if (!content) return null;

  // Nếu là tin nhắn của user và ngắn, render nhanh
  if (isUser && !content.includes('**') && !content.includes('```') && !content.includes('\n')) {
    return <div className={`whitespace-pre-wrap ${className}`}>{content}</div>;
  }

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 1. Khối mã lệnh (Code block): ```lang ... ```
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // Bỏ dòng đóng ```
      elements.push(
        <div key={`code_${i}`} className="my-2 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800">
          {lang && (
            <div className="bg-zinc-100 dark:bg-zinc-800/90 px-3 py-1 text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
              {lang}
            </div>
          )}
          <pre className="p-3 bg-zinc-50 dark:bg-zinc-900 text-xs font-mono overflow-x-auto text-zinc-800 dark:text-zinc-200 leading-relaxed">
            <code>{codeLines.join('\n')}</code>
          </pre>
        </div>
      );
      continue;
    }

    // 2. Bảng biểu (Table): Kiểm tra dòng có chứa | và dòng kế tiếp là delimiter |---|
    if (
      line.includes('|') &&
      i + 1 < lines.length &&
      lines[i + 1].includes('|') &&
      lines[i + 1].includes('-')
    ) {
      const headerLine = line;
      i += 2; // Bỏ header và delimiter line
      const bodyLines: string[] = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim() !== '') {
        bodyLines.push(lines[i]);
        i++;
      }

      const headers = headerLine
        .split('|')
        .map((h) => h.trim())
        .filter((h, idx, arr) => !(idx === 0 && h === '') && !(idx === arr.length - 1 && h === ''));

      elements.push(
        <div key={`table_${i}`} className="my-2.5 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-xs text-left">
            <thead className="bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 font-semibold border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                {headers.map((h, hIdx) => (
                  <th key={hIdx} className="px-3 py-2">
                    {renderInline(h, isUser)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-zinc-950">
              {bodyLines.map((bLine, rIdx) => {
                const cells = bLine
                  .split('|')
                  .map((c) => c.trim())
                  .filter((c, idx, arr) => !(idx === 0 && c === '') && !(idx === arr.length - 1 && c === ''));
                return (
                  <tr key={rIdx} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                    {cells.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3 py-2 text-zinc-700 dark:text-zinc-300">
                        {renderInline(cell, isUser)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // 3. Tiêu đề (Headings)
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={`h1_${i}`} className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-2 mb-1">
          {renderInline(line.slice(2).trim(), isUser)}
        </h1>
      );
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={`h2_${i}`} className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-2 mb-1">
          {renderInline(line.slice(3).trim(), isUser)}
        </h2>
      );
      i++;
      continue;
    }
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={`h3_${i}`} className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-1.5 mb-0.5">
          {renderInline(line.slice(4).trim(), isUser)}
        </h3>
      );
      i++;
      continue;
    }
    if (line.startsWith('#### ')) {
      elements.push(
        <h4 key={`h4_${i}`} className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mt-1 mb-0.5">
          {renderInline(line.slice(5).trim(), isUser)}
        </h4>
      );
      i++;
      continue;
    }

    // 4. Trích dẫn (Blockquote): > text
    if (line.startsWith('> ') || line === '>') {
      const quoteText = line.startsWith('> ') ? line.slice(2) : '';
      elements.push(
        <div
          key={`quote_${i}`}
          className="border-l-2 border-zinc-400 dark:border-zinc-600 pl-3 py-0.5 my-1 text-xs italic text-zinc-600 dark:text-zinc-400"
        >
          {renderInline(quoteText, isUser)}
        </div>
      );
      i++;
      continue;
    }

    // 5. Đường kẻ ngang: --- hoặc ***
    if (line.trim() === '---' || line.trim() === '***') {
      elements.push(<hr key={`hr_${i}`} className="my-2 border-zinc-200 dark:border-zinc-800" />);
      i++;
      continue;
    }

    // 6. Danh sách có số: 1. , 2. , ...
    const numberedMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
    if (numberedMatch) {
      const [, indent, num, itemContent] = numberedMatch;
      const indentLevel = Math.floor(indent.length / 2);
      elements.push(
        <div
          key={`num_${i}`}
          className="flex items-start gap-1.5 my-0.5 leading-relaxed"
          style={{ paddingLeft: `${indentLevel * 12}px` }}
        >
          <span className="font-semibold text-zinc-700 dark:text-zinc-300 shrink-0 select-none min-w-[18px]">
            {num}.
          </span>
          <div className="flex-1 min-w-0">{renderInline(itemContent, isUser)}</div>
        </div>
      );
      i++;
      continue;
    }

    // 7. Danh sách gạch đầu dòng: - , * , +
    const bulletMatch = line.match(/^(\s*)([-*+])\s+(.*)$/);
    if (bulletMatch) {
      const [, indent, , itemContent] = bulletMatch;
      const indentLevel = Math.floor(indent.length / 2);
      elements.push(
        <div
          key={`bullet_${i}`}
          className="flex items-start gap-2 my-0.5 leading-relaxed"
          style={{ paddingLeft: `${indentLevel * 12}px` }}
        >
          <span className="text-zinc-400 dark:text-zinc-500 shrink-0 select-none mt-1 text-[8px] leading-none">
            ●
          </span>
          <div className="flex-1 min-w-0">{renderInline(itemContent, isUser)}</div>
        </div>
      );
      i++;
      continue;
    }

    // 8. Dòng trống (ngắt đoạn)
    if (line.trim() === '') {
      elements.push(<div key={`blank_${i}`} className="h-1.5" />);
      i++;
      continue;
    }

    // 9. Đoạn văn thường (Paragraph)
    elements.push(
      <p key={`p_${i}`} className="leading-relaxed my-0.5">
        {renderInline(line, isUser)}
      </p>
    );
    i++;
  }

  return <div className={`space-y-0.5 text-xs sm:text-sm ${className}`}>{elements}</div>;
};
