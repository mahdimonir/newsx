import { notFound } from "next/navigation";
import PostClient from "./PostClient";

export default async function PostPage({ params }) {
  const { id } = await params; // Await params to resolve the promise

  // Basic validation for ObjectID format (24-character hexadecimal)
  const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);

  if (!id || !isValidObjectId) {
    console.error(`Invalid post ID: ${id}`);
    return notFound();
  }

  console.log(`Processing post ID: ${id}`); // Debugging log

  return <PostClient id={id} />;
}
