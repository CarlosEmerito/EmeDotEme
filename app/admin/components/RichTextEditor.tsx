"use client";

import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Bold, Italic, Heading2, List, ListOrdered, Link as LinkIcon, Unlink } from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    if (url === null) {
      return;
    }

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap gap-2 border-b border-zinc-200 dark:border-zinc-800 p-2 bg-zinc-50 dark:bg-zinc-900/50 rounded-t-md">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors ${editor.isActive("bold") ? "bg-zinc-200 dark:bg-zinc-800 text-[color:var(--color-brand)]" : "text-zinc-600 dark:text-zinc-400"}`}
        title="Negrita"
      >
        <Bold size={18} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors ${editor.isActive("italic") ? "bg-zinc-200 dark:bg-zinc-800 text-[color:var(--color-brand)]" : "text-zinc-600 dark:text-zinc-400"}`}
        title="Cursiva"
      >
        <Italic size={18} />
      </button>
      <div className="w-px h-6 bg-zinc-300 dark:bg-zinc-700 self-center mx-1" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors ${editor.isActive("heading", { level: 2 }) ? "bg-zinc-200 dark:bg-zinc-800 text-[color:var(--color-brand)]" : "text-zinc-600 dark:text-zinc-400"}`}
        title="Título (H2)"
      >
        <Heading2 size={18} />
      </button>
      <div className="w-px h-6 bg-zinc-300 dark:bg-zinc-700 self-center mx-1" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors ${editor.isActive("bulletList") ? "bg-zinc-200 dark:bg-zinc-800 text-[color:var(--color-brand)]" : "text-zinc-600 dark:text-zinc-400"}`}
        title="Lista"
      >
        <List size={18} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors ${editor.isActive("orderedList") ? "bg-zinc-200 dark:bg-zinc-800 text-[color:var(--color-brand)]" : "text-zinc-600 dark:text-zinc-400"}`}
        title="Lista Numerada"
      >
        <ListOrdered size={18} />
      </button>
      <div className="w-px h-6 bg-zinc-300 dark:bg-zinc-700 self-center mx-1" />
      <button
        type="button"
        onClick={setLink}
        className={`p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors ${editor.isActive("link") ? "bg-zinc-200 dark:bg-zinc-800 text-[color:var(--color-brand)]" : "text-zinc-600 dark:text-zinc-400"}`}
        title="Añadir Enlace"
      >
        <LinkIcon size={18} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().unsetLink().run()}
        disabled={!editor.isActive("link")}
        className="p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400 disabled:opacity-50"
        title="Quitar Enlace"
      >
        <Unlink size={18} />
      </button>
    </div>
  );
};

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-500 hover:text-blue-700 underline",
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-zinc dark:prose-invert max-w-none min-h-[300px] p-4 focus:outline-none",
      },
    },
  });

  return (
    <div className="border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-950 overflow-hidden">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
