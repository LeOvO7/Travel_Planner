import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { Copy, Check } from 'lucide-react';

/**
 * CodeBlock - Code block with syntax highlighting and copy
 */
function CodeBlock({ language, value }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="relative group my-4">
      {/* Language label and copy button */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 rounded-t-lg">
        <span className="text-xs font-mono text-slate-400 uppercase">
          {language || 'text'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-slate-400
                   hover:text-white hover:bg-slate-700 rounded transition-all duration-200"
          title={copied ? 'Copied!' : 'Copy code'}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Syntax highlighting */}
      <SyntaxHighlighter
        language={language || 'text'}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderBottomLeftRadius: '0.5rem',
          borderBottomRightRadius: '0.5rem',
        }}
        showLineNumbers={true}
        wrapLines={true}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
}

/**
 * InlineCode
 */
function InlineCode({ children }) {
  return (
    <code className="px-1.5 py-0.5 bg-indigo-50 text-[#6366F1]
                   rounded text-sm font-mono">
      {children}
    </code>
  );
}

/**
 * MarkdownRenderer
 */
export default function MarkdownRenderer({ content, className = '' }) {
  return (
    <div className={`markdown-body prose prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          // Code block handling
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const value = String(children).replace(/\n$/, '');

            return !inline ? (
              <CodeBlock language={language} value={value} />
            ) : (
              <InlineCode {...props}>{children}</InlineCode>
            );
          },

          // Link handling
          a({ node, children, href, ...props }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#6366F1] hover:text-indigo-600 underline transition-colors"
                {...props}
              >
                {children}
              </a>
            );
          },

          // Headings
          h1({ node, children, ...props }) {
            return (
              <h1 className="text-2xl font-bold mt-6 mb-4 pb-2 border-b border-[#E2E8F0] text-[#0F172A]" {...props}>
                {children}
              </h1>
            );
          },

          h2({ node, children, ...props }) {
            return (
              <h2 className="text-xl font-bold mt-5 mb-3 text-[#0F172A]" {...props}>
                {children}
              </h2>
            );
          },

          h3({ node, children, ...props }) {
            return (
              <h3 className="text-lg font-semibold mt-4 mb-2 text-[#0F172A]" {...props}>
                {children}
              </h3>
            );
          },

          // Lists
          ul({ node, children, ...props }) {
            return (
              <ul className="list-disc list-inside space-y-1 my-3 text-[#0F172A]" {...props}>
                {children}
              </ul>
            );
          },

          ol({ node, children, ...props }) {
            return (
              <ol className="list-decimal list-inside space-y-1 my-3 text-[#0F172A]" {...props}>
                {children}
              </ol>
            );
          },

          // Tables
          table({ node, children, ...props }) {
            return (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full divide-y divide-[#E2E8F0] border border-[#E2E8F0]" {...props}>
                  {children}
                </table>
              </div>
            );
          },

          thead({ node, children, ...props }) {
            return (
              <thead className="bg-slate-50" {...props}>
                {children}
              </thead>
            );
          },

          th({ node, children, ...props }) {
            return (
              <th className="px-4 py-2 text-left text-xs font-semibold text-[#0F172A] uppercase tracking-wider" {...props}>
                {children}
              </th>
            );
          },

          td({ node, children, ...props }) {
            return (
              <td className="px-4 py-2 border-t border-[#E2E8F0] text-sm text-[#0F172A]" {...props}>
                {children}
              </td>
            );
          },

          // Blockquote
          blockquote({ node, children, ...props }) {
            return (
              <blockquote className="border-l-4 border-[#6366F1] pl-4 py-2 my-3 bg-indigo-50 italic text-[#64748B]" {...props}>
                {children}
              </blockquote>
            );
          },

          // Horizontal rule
          hr({ node, ...props }) {
            return <hr className="my-6 border-[#E2E8F0]" {...props} />;
          },

          // Image
          img({ node, alt, src, ...props }) {
            return (
              <img
                src={src}
                alt={alt}
                className="max-w-full h-auto rounded-lg shadow-sm my-4"
                loading="lazy"
                {...props}
              />
            );
          },

          // Paragraph
          p({ node, children, ...props }) {
            return (
              <p className="my-3 leading-relaxed text-[#0F172A]" {...props}>
                {children}
              </p>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

/**
 * StreamingMarkdown - Streaming Markdown rendering with cursor
 */
export function StreamingMarkdown({ content, isStreaming, className = '' }) {
  return (
    <div className="relative">
      <MarkdownRenderer content={content} className={className} />

      {/* Streaming cursor */}
      {isStreaming && (
        <span className="inline-block w-2 h-4 ml-1 bg-[#6366F1] animate-pulse rounded-sm" />
      )}
    </div>
  );
}
