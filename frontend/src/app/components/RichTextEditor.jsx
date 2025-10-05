"use client";

import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CodeToggle,
  CreateLink,
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
  const [sanitizedValue, setSanitizedValue] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    setMounted(true);
    console.log("RichTextEditor input value:", JSON.stringify(value, null, 2)); // Debug input
    try {
      let parsedValue = typeof value === "string" ? value : "";
      if (parsedValue.includes("{") && parsedValue.includes("}")) {
        console.warn("Detected potential JSON-like content:", parsedValue);
        parsedValue = parsedValue.replace(
          /\{[^}]+\}/g,
          "```plaintext\nInvalid content detected\n```"
        );
      }
      // Normalize code block syntax
      parsedValue = parsedValue.replace(/```(\w*)\n/g, "```$1\n");
      setSanitizedValue(parsedValue);
      console.log("Sanitized value:", parsedValue); // Debug sanitized output
      setError(null);
    } catch (err) {
      console.error("Error sanitizing markdown:", err);
      setSanitizedValue(parsedValue);
      setError(err.message);
    }
  }, [value]);

  if (!mounted) {
    return (
      <div className="h-64 w-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg"></div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700">
        Error parsing markdown: {error}. Displaying raw content:
        <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded">
          {sanitizedValue}
        </pre>
      </div>
    );
  }

  return (
    <div className="rich-text-editor border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
      <MDXEditor
        markdown={sanitizedValue}
        onChange={(markdown) => {
          console.log("MDXEditor output markdown:", markdown); // Debug output
          onChange(markdown);
        }}
        placeholder={placeholder || "Write your post content here..."}
        contentEditableClassName="min-h-[300px] p-4 prose dark:prose-invert utilidad:prose-code:bg-gray-100 utilidad:prose-code:dark:bg-gray-800 max-w-none"
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          linkPlugin(),
          linkDialogPlugin(),
          imagePlugin({
            imageUploadHandler: async (file) => {
              return "https://res.cloudinary.com/devmahdi/image/upload/v1755627793/placeholder.jpg";
            },
          }),
          markdownShortcutPlugin(),
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
