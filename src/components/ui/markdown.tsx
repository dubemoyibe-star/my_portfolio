import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const INLINE =
  /(!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)|\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)|`([^`]+)`|\*\*([^*]+)\*\*|__([^_]+)__|~~([^~]+)~~|\*([^*\n]+)\*|_([^_\n]+)_)/g;

function safeHref(href: string): boolean {
  return /^(https?:\/\/|mailto:|#|\/(?!\/))/.test(href);
}

function safeImageSrc(src: string): boolean {
  return /^(https?:\/\/|\/(?!\/))/.test(src);
}

function inline(text: string, prefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let offset = 0;
  let match: RegExpExecArray | null;
  INLINE.lastIndex = 0;

  while ((match = INLINE.exec(text)) !== null) {
    if (match.index > offset) {
      nodes.push(text.slice(offset, match.index));
    }

    const key = `${prefix}-${match.index}`;
    if (match[1] && safeImageSrc(match[3])) {
      nodes.push(
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={key}
          src={match[3]}
          alt={match[2]}
          loading="lazy"
          className="my-7 h-auto max-w-full rounded-md border border-border"
        />,
      );
    } else if (match[1]) {
      nodes.push(match[2] || "[image]");
    } else if (match[4]) {
      const href = match[5];
      nodes.push(
        safeHref(href) ? (
          <a
            key={key}
            href={href}
            target={/^https?:\/\//.test(href) ? "_blank" : undefined}
            rel={/^https?:\/\//.test(href) ? "noreferrer" : undefined}
            className="text-link underline decoration-link/40 underline-offset-4 transition-colors hover:decoration-link"
          >
            {match[4]}
          </a>
        ) : (
          match[0]
        ),
      );
    } else if (match[6]) {
      nodes.push(
        <code
          key={key}
          className="rounded bg-surface-raised px-1.5 py-0.5 font-mono text-[0.9em] text-foreground"
        >
          {match[6]}
        </code>,
      );
    } else if (match[7] || match[8]) {
      nodes.push(
        <strong key={key} className="font-semibold text-foreground">
          {match[7] ?? match[8]}
        </strong>,
      );
    } else if (match[9]) {
      nodes.push(<del key={key}>{match[9]}</del>);
    } else if (match[10] || match[11]) {
      nodes.push(<em key={key}>{match[10] ?? match[11]}</em>);
    }

    offset = INLINE.lastIndex;
  }

  if (offset < text.length) nodes.push(text.slice(offset));
  return nodes;
}

function isBlockStart(line: string): boolean {
  return (
    /^#{1,6}\s/.test(line) ||
    /^```/.test(line) ||
    /^>\s?/.test(line) ||
    /^\s*[-+*]\s+/.test(line) ||
    /^\s*\d+[.)]\s+/.test(line) ||
    /^([-*_])(?:\s*\1){2,}$/.test(line.trim())
  );
}

function cells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isTableDivider(line: string): boolean {
  const parts = cells(line);
  return parts.length > 0 && parts.every((part) => /^:?-{3,}:?$/.test(part));
}

/** Render common Markdown blocks without injecting raw HTML into the page. */
export function Markdown({ text, className }: { text: string; className?: string }) {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    const fence = line.match(/^```\s*([\w-]*)\s*$/);
    if (fence) {
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !/^```\s*$/.test(lines[index])) {
        code.push(lines[index]);
        index += 1;
      }
      index += 1;
      blocks.push(
        <pre key={`code-${index}`} className="my-7 overflow-x-auto rounded-lg border border-border bg-surface-raised p-4 font-mono text-small leading-7 text-foreground sm:p-5">
          <code>{code.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+?)\s*#*$/);
    if (heading) {
      const level = heading[1].length;
      const content = inline(heading[2], `heading-${index}`);
      const classes =
        level === 1 || level === 2
          ? "mt-12 text-h3 text-balance first:mt-0"
          : level === 3
            ? "mt-10 text-h4 text-balance first:mt-0"
            : "mt-8 text-h5 text-balance first:mt-0";
      const Tag = (level <= 2 ? "h2" : level === 3 ? "h3" : "h4") as "h2" | "h3" | "h4";
      blocks.push(<Tag key={`heading-${index}`} className={classes}>{content}</Tag>);
      index += 1;
      continue;
    }

    if (/^([-*_])(?:\s*\1){2,}$/.test(line.trim())) {
      blocks.push(<hr key={`rule-${index}`} className="my-9 border-border" />);
      index += 1;
      continue;
    }

    if (line.startsWith(">")) {
      const quote: string[] = [];
      while (index < lines.length && lines[index].startsWith(">")) {
        quote.push(lines[index].replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push(
        <blockquote key={`quote-${index}`} className="my-7 border-l-2 border-border-strong pl-5 text-muted">
          {quote.map((entry, quoteIndex) => (
            <p key={quoteIndex} className={quoteIndex ? "mt-3" : undefined}>
              {inline(entry, `quote-${index}-${quoteIndex}`)}
            </p>
          ))}
        </blockquote>,
      );
      continue;
    }

    const unordered = line.match(/^\s*[-+*]\s+(.*)$/);
    const ordered = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (unordered || ordered) {
      const listItems: string[] = [];
      const pattern = unordered ? /^\s*[-+*]\s+(.*)$/ : /^\s*\d+[.)]\s+(.*)$/;
      while (index < lines.length) {
        const item = lines[index].match(pattern);
        if (!item) break;
        listItems.push(item[1]);
        index += 1;
      }
      const List = unordered ? "ul" : "ol";
      blocks.push(
        <List
          key={`list-${index}`}
          className={cn(
            "my-6 flex flex-col gap-2.5 pl-6 text-body leading-8 text-muted marker:text-accent",
            unordered ? "list-disc" : "list-decimal",
          )}
        >
          {listItems.map((item, itemIndex) => (
            <li key={itemIndex}>{inline(item, `list-${index}-${itemIndex}`)}</li>
          ))}
        </List>,
      );
      continue;
    }

    if (index + 1 < lines.length && line.includes("|") && isTableDivider(lines[index + 1])) {
      const headers = cells(line);
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && lines[index].includes("|") && lines[index].trim()) {
        rows.push(cells(lines[index]));
        index += 1;
      }
      blocks.push(
        <div key={`table-${index}`} className="my-7 overflow-x-auto rounded-md border border-border">
          <table className="w-full border-collapse text-left text-small">
            <thead className="bg-surface-raised text-foreground">
              <tr>{headers.map((cell, cellIndex) => <th key={cellIndex} className="border-b border-border px-3 py-2.5 font-medium">{inline(cell, `th-${index}-${cellIndex}`)}</th>)}</tr>
            </thead>
            <tbody>{rows.map((row, rowIndex) => <tr key={rowIndex} className="border-b border-border/70 last:border-0">{headers.map((_, cellIndex) => <td key={cellIndex} className="px-3 py-2.5 text-muted">{inline(row[cellIndex] ?? "", `td-${index}-${rowIndex}-${cellIndex}`)}</td>)}</tr>)}</tbody>
          </table>
        </div>,
      );
      continue;
    }

    const paragraph: string[] = [];
    while (index < lines.length && lines[index].trim() && !isBlockStart(lines[index])) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    if (paragraph.length === 0) {
      paragraph.push(line.trim());
      index += 1;
    }
    blocks.push(
      <p key={`paragraph-${index}`} className="text-pretty text-body leading-8 text-muted">
        {inline(paragraph.join(" "), `paragraph-${index}`)}
      </p>,
    );
  }

  return <div className={cn("flex flex-col gap-5", className)}>{blocks}</div>;
}
