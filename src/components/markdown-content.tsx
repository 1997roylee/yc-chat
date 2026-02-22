"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { LuCheck, LuCopy } from "react-icons/lu";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter, type SyntaxHighlighterProps } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

function CopyButton({ text, className }: { text: string; className?: string }) {
  const t = useTranslations("chat");
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "flex items-center gap-1 rounded px-1.5 py-0.5 text-xs transition-colors",
        "text-zinc-400 hover:text-zinc-100 hover:bg-white/10",
        className,
      )}
      title={t("copy")}
    >
      {copied ? <LuCheck className="h-3.5 w-3.5" /> : <LuCopy className="h-3.5 w-3.5" />}
      {copied ? t("copied") : t("copy")}
    </button>
  );
}

export function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Code blocks with syntax highlighting + copy button
        code({ className, children, ref: _ref, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          const codeText = String(children).replace(/\n$/, "");
          const isBlock = !!match || codeText.includes("\n");

          if (isBlock) {
            const language = match?.[1] ?? "text";
            return (
              <div className="my-3 overflow-hidden rounded-lg border border-white/10">
                {/* Header bar */}
                <div className="flex items-center justify-between bg-zinc-800 px-3 py-1.5">
                  <span className="text-xs text-zinc-400 font-mono">{language}</span>
                  <CopyButton text={codeText} />
                </div>
                <SyntaxHighlighter
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  style={oneDark as any}
                  language={language}
                  PreTag="div"
                  customStyle={{
                    margin: 0,
                    borderRadius: 0,
                    fontSize: "0.8125rem",
                    lineHeight: "1.6",
                  }}
                  {...props}
                >
                  {codeText}
                </SyntaxHighlighter>
              </div>
            );
          }

          // Inline code
          return (
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.8125rem]" {...props}>
              {children}
            </code>
          );
        },

        // Headings
        h1: ({ children }) => (
          <h1 className="mt-4 mb-2 text-lg font-bold leading-tight">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="mt-4 mb-2 text-base font-semibold leading-tight">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="mt-3 mb-1.5 text-sm font-semibold leading-tight">{children}</h3>
        ),

        // Paragraphs
        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,

        // Lists
        ul: ({ children }) => (
          <ul className="mb-2 ml-4 list-disc space-y-1 last:mb-0">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-2 ml-4 list-decimal space-y-1 last:mb-0">{children}</ol>
        ),
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,

        // Blockquote
        blockquote: ({ children }) => (
          <blockquote className="my-2 border-l-2 border-muted-foreground/40 pl-3 text-muted-foreground italic">
            {children}
          </blockquote>
        ),

        // Horizontal rule
        hr: () => <hr className="my-3 border-border" />,

        // Links
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-blue-500 underline underline-offset-2 hover:text-blue-400"
          >
            {children}
          </a>
        ),

        // Bold / italic
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,

        // Tables (GFM)
        table: ({ children }) => (
          <div className="my-3 overflow-x-auto">
            <table className="w-full border-collapse text-sm">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="border-b border-border">{children}</thead>,
        tbody: ({ children }) => <tbody>{children}</tbody>,
        tr: ({ children }) => (
          <tr className="border-b border-border/50 last:border-0">{children}</tr>
        ),
        th: ({ children }) => <th className="px-3 py-1.5 text-left font-semibold">{children}</th>,
        td: ({ children }) => <td className="px-3 py-1.5">{children}</td>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
