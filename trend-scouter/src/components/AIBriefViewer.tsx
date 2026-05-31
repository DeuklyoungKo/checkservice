'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

interface Props {
  content: string;
}

const components: Components = {
  h1: ({ children }) => (
    <h1 className="text-2xl font-black tracking-tight text-foreground mt-8 mb-3 first:mt-0 pb-2 border-b border-muted">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-lg font-black tracking-tight text-foreground mt-7 mb-2 first:mt-0 flex items-center gap-2">
      <span className="inline-block w-1 h-5 bg-primary rounded-full flex-shrink-0" />
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-black text-foreground/80 mt-5 mb-1.5">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="text-sm font-medium text-foreground/70 leading-relaxed mb-3">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="space-y-1.5 mb-4 pl-0">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="space-y-1.5 mb-4 pl-0 list-none counter-reset-[item]">
      {children}
    </ol>
  ),
  li: ({ children, ordered, index }: any) => (
    <li className="flex items-start gap-3 text-sm font-medium text-foreground/70 leading-relaxed">
      {ordered ? (
        <span className="flex-shrink-0 w-5 h-5 bg-primary/10 text-primary rounded-md flex items-center justify-center text-[10px] font-black mt-0.5">
          {(index ?? 0) + 1}
        </span>
      ) : (
        <span className="flex-shrink-0 w-1.5 h-1.5 bg-primary rounded-full mt-2" />
      )}
      <span>{children}</span>
    </li>
  ),
  strong: ({ children }) => (
    <strong className="font-black text-foreground">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="text-primary not-italic font-bold">{children}</em>
  ),
  hr: () => (
    <hr className="my-6 border-muted" />
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-primary/30 pl-4 my-4 bg-primary/5 py-3 pr-4 rounded-r-2xl">
      {children}
    </blockquote>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.includes('language-');
    if (isBlock) {
      return (
        <code className="block bg-muted/60 rounded-2xl p-4 text-xs font-mono text-foreground/80 overflow-x-auto">
          {children}
        </code>
      );
    }
    return (
      <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-md text-xs font-mono font-bold">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="my-4 overflow-hidden rounded-2xl">{children}</pre>
  ),
};

export function AIBriefViewer({ content }: Props) {
  return (
    <div className="min-h-0">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
