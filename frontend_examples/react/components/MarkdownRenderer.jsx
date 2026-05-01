import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { Copy, Check } from 'lucide-react';

/**
 * CodeBlock - 代码块组件
 * 支持语法高亮和一键复制
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
      {/* 语言标签和复制按钮 */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 rounded-t-lg">
        <span className="text-xs font-mono text-gray-400 uppercase">
          {language || 'text'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-400
                   hover:text-white hover:bg-gray-700 rounded transition-colors"
          title={copied ? 'Copied!' : 'Copy code'}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
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

      {/* 代码高亮 */}
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
 * InlineCode - 行内代码组件
 */
function InlineCode({ children }) {
  return (
    <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-pink-600
                   dark:text-pink-400 rounded text-sm font-mono">
      {children}
    </code>
  );
}

/**
 * MarkdownRenderer - Markdown 渲染器
 *
 * 支持功能:
 * - GitHub Flavored Markdown (GFM)
 * - 代码语法高亮
 * - 一键复制代码
 * - 自动换行
 * - 表格支持
 * - 任务列表
 * - 链接安全处理
 */
export default function MarkdownRenderer({ content, className = '' }) {
  return (
    <div className={`markdown-body prose prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          // 代码块处理
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

          // 链接处理（安全性）
          a({ node, children, href, ...props }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 underline"
                {...props}
              >
                {children}
              </a>
            );
          },

          // 标题处理
          h1({ node, children, ...props }) {
            return (
              <h1 className="text-2xl font-bold mt-6 mb-4 pb-2 border-b border-gray-200" {...props}>
                {children}
              </h1>
            );
          },

          h2({ node, children, ...props }) {
            return (
              <h2 className="text-xl font-bold mt-5 mb-3" {...props}>
                {children}
              </h2>
            );
          },

          h3({ node, children, ...props }) {
            return (
              <h3 className="text-lg font-semibold mt-4 mb-2" {...props}>
                {children}
              </h3>
            );
          },

          // 列表处理
          ul({ node, children, ...props }) {
            return (
              <ul className="list-disc list-inside space-y-1 my-3" {...props}>
                {children}
              </ul>
            );
          },

          ol({ node, children, ...props }) {
            return (
              <ol className="list-decimal list-inside space-y-1 my-3" {...props}>
                {children}
              </ol>
            );
          },

          // 表格处理
          table({ node, children, ...props }) {
            return (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200" {...props}>
                  {children}
                </table>
              </div>
            );
          },

          thead({ node, children, ...props }) {
            return (
              <thead className="bg-gray-50" {...props}>
                {children}
              </thead>
            );
          },

          th({ node, children, ...props }) {
            return (
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" {...props}>
                {children}
              </th>
            );
          },

          td({ node, children, ...props }) {
            return (
              <td className="px-4 py-2 border-t border-gray-200 text-sm" {...props}>
                {children}
              </td>
            );
          },

          // 引用块处理
          blockquote({ node, children, ...props }) {
            return (
              <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-3 bg-blue-50 italic text-gray-700" {...props}>
                {children}
              </blockquote>
            );
          },

          // 分隔线
          hr({ node, ...props }) {
            return <hr className="my-6 border-gray-300" {...props} />;
          },

          // 图片处理
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

          // 段落
          p({ node, children, ...props }) {
            return (
              <p className="my-3 leading-relaxed text-gray-800" {...props}>
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
 * StreamingMarkdown - 流式 Markdown 渲染
 * 支持逐字符显示效果
 */
export function StreamingMarkdown({ content, isStreaming, className = '' }) {
  return (
    <div className="relative">
      <MarkdownRenderer content={content} className={className} />

      {/* 流式指示器（光标效果） */}
      {isStreaming && (
        <span className="inline-block w-2 h-4 ml-1 bg-blue-600 animate-pulse" />
      )}
    </div>
  );
}
