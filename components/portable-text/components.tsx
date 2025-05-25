import { PortableTextComponents } from '@portabletext/react'

export const components: PortableTextComponents = {
  block: {
    h1: ({ children }) => <h1 className="text-4xl font-bold mb-4">{children}</h1>,
    h2: ({ children }) => <h2 className="text-3xl font-bold mb-3">{children}</h2>,
    h3: ({ children }) => <h3 className="text-2xl font-bold mb-2">{children}</h3>,
    normal: ({ children }) => <p className="mb-4">{children}</p>,
    h4: ({ children }) => <h4 className="text-xl font-bold mt-6 mb-3">{children}</h4>,
    blockquote: ({ children }) => (
      <blockquote className="pl-4 border-l-4 border-gray-200 italic my-6">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => <ul className="list-disc ml-4 mb-4">{children}</ul>,
    number: ({ children }) => <ol className="list-decimal ml-4 mb-4">{children}</ol>,
  },
  marks: {
    link: ({ value, children }) => {
      const { href } = value;
      return (
        <a href={href} className="text-blue-600 hover:underline">
          {children}
        </a>
      );
    },
    strong: ({ children }) => <strong className="font-bold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    code: ({ children }) => (
      <code className="bg-gray-100 rounded px-1 py-0.5 font-mono text-sm">
        {children}
      </code>
    ),
  },
} 