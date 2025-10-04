"use client";

import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  codeBlockPlugin,
  CodeToggle,
  CreateLink,
  diffSourcePlugin,
  headingsPlugin,
  imagePlugin,
  InsertImage,
  InsertTable,
  InsertThematicBreak,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  ListsToggle,
  markdownShortcutPlugin,
  MDXEditor,
  quotePlugin,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  UndoRedo,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import { useEffect, useState } from "react";

const RichTextEditor = ({ value, onChange, placeholder }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-64 w-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg"></div>
    );
  }

  return (
    <div className="rich-text-editor border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
      <MDXEditor
        markdown={value || ""}
        onChange={onChange}
        placeholder={placeholder || "Write your post content here..."}
        contentEditableClassName="min-h-[300px] p-4 prose dark:prose-invert max-w-none"
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          linkPlugin(),
          linkDialogPlugin(),
          imagePlugin(),
          codeBlockPlugin(),
          markdownShortcutPlugin(),
          diffSourcePlugin(),
          tablePlugin(),
          toolbarPlugin({
            toolbarContents: () => (
              <>
                <UndoRedo />
                <BoldItalicUnderlineToggles />
                <BlockTypeSelect />
                <ListsToggle />
                <CreateLink />
                <InsertImage />
                <InsertTable />
                <InsertThematicBreak />
                <CodeToggle />
              </>
            ),
          }),
        ]}
      />
    </div>
  );
};

export default RichTextEditor;
