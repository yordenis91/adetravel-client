import React, { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, Underline, Heading2, Heading3, List, ListOrdered, Quote, Link2, Undo2, Redo2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
}

/** Editor de texto enriquecido (títulos, listas, negritas, enlaces) para los documentos legales. */
export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] }, link: { openOnClick: false } })],
    content: value,
    editorProps: {
      attributes: {
        class:
          "prose prose-slate prose-headings:font-playfair prose-headings:text-navy prose-h2:text-xl prose-h2:mt-6 prose-h3:text-base max-w-none min-h-[320px] max-h-[560px] overflow-y-auto rounded-b-md border border-t-0 border-input bg-white px-4 py-3 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
  });

  // Cuando el valor cambia desde fuera (cargar texto por defecto, restaurar, recargar config).
  useEffect(() => {
    if (editor && value !== (editor.isEmpty ? "" : editor.getHTML())) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) return null;

  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Dirección del enlace (https://…). Déjala vacía para quitarlo.", previous ?? "https://");
    if (url === null) return;
    if (url.trim() === "" || url.trim() === "https://") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
    }
  };

  const tools: { label: string; icon: React.ElementType; run: () => void; active?: boolean }[] = [
    { label: "Título", icon: Heading2, run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive("heading", { level: 2 }) },
    { label: "Subtítulo", icon: Heading3, run: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive("heading", { level: 3 }) },
    { label: "Negrita", icon: Bold, run: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold") },
    { label: "Cursiva", icon: Italic, run: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic") },
    { label: "Subrayado", icon: Underline, run: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive("underline") },
    { label: "Lista", icon: List, run: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive("bulletList") },
    { label: "Lista numerada", icon: ListOrdered, run: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive("orderedList") },
    { label: "Cita", icon: Quote, run: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive("blockquote") },
    { label: "Enlace", icon: Link2, run: setLink, active: editor.isActive("link") },
    { label: "Deshacer", icon: Undo2, run: () => editor.chain().focus().undo().run() },
    { label: "Rehacer", icon: Redo2, run: () => editor.chain().focus().redo().run() },
  ];

  return (
    <div>
      <div className="flex flex-wrap gap-1 rounded-t-md border border-input bg-navy/[0.03] p-1.5">
        {tools.map(({ label, icon: Icon, run, active }) => (
          <Button
            key={label}
            type="button"
            variant={active ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            title={label}
            aria-label={label}
            aria-pressed={active}
            onClick={run}
          >
            <Icon className="w-4 h-4" />
          </Button>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
