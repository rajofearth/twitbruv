import type { EditorThemeClasses } from "lexical"

// Lexical node → Tailwind class names. Keeps styling out of the editor core.
// `first:mt-0` on block-level elements pulls the caret flush with the placeholder
// at the top of an empty editor.
export const editorTheme: EditorThemeClasses = {
  paragraph: "my-3 first:mt-0 leading-relaxed",
  heading: {
    h1: "mt-6 mb-3 first:mt-0 text-2xl font-semibold",
    h2: "mt-5 mb-2 first:mt-0 text-xl font-semibold",
    h3: "mt-4 mb-2 first:mt-0 text-lg font-semibold",
  },
  quote:
    "my-3 first:mt-0 border-l-2 border-border pl-3 italic text-muted-foreground",
  list: {
    ul: "my-3 first:mt-0 list-disc pl-6",
    ol: "my-3 first:mt-0 list-decimal pl-6",
    listitem: "mb-1",
  },
  link: "text-primary underline underline-offset-2 hover:no-underline",
  code: "rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]",
  codeHighlight: {},
  text: {
    bold: "font-semibold",
    italic: "italic",
    underline: "underline underline-offset-2",
    strikethrough: "line-through",
    code: "rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]",
  },
}
