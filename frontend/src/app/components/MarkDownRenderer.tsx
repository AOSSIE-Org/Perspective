import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          p: ({ node, ...props }) => (
            <p style={{ marginBottom: "1rem" }} {...props} />
          ),
          h1: ({ node, ...props }) => (
            <h1
              style={{
                fontWeight: "bold",
                fontSize: "1.8rem",
                marginBottom: "1rem",
                marginTop: "1.5rem",
              }}
              {...props}
            />
          ),
          h2: ({ node, ...props }) => (
            <h2
              style={{
                fontWeight: "bold",
                fontSize: "1.5rem",
                marginBottom: "0.8rem",
                marginTop: "1.2rem",
              }}
              {...props}
            />
          ),
          h3: ({ node, ...props }) => (
            <h3
              style={{
                fontWeight: "bold",
                fontSize: "1.2rem",
                marginBottom: "0.6rem",
                marginTop: "1rem",
              }}
              {...props}
            />
          ),
          ul: ({ node, ...props }) => (
            <ul
              style={{
                marginBottom: "1rem",
                paddingLeft: "2rem",
                listStyle: "disc",
              }}
              {...props}
            />
          ),
          ol: ({ node, ...props }) => (
            <ol
              style={{
                marginBottom: "1rem",
                paddingLeft: "2rem",
                listStyle: "decimal",
              }}
              {...props}
            />
          ),
          li: ({ node, ...props }) => (
            <li style={{ marginBottom: "0.5rem" }} {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote
              style={{
                borderLeft: "4px solid #e5e7eb",
                paddingLeft: "1rem",
                marginLeft: "0",
                marginBottom: "1rem",
              }}
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownRenderer;
