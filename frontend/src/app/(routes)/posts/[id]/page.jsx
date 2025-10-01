import PostClient from "./PostClient";

export default async function PostPage({ params }) {
  const { id } = params; // Await params resolution
  if (!id) {
    // Handle invalid or missing ID
    return notFound(); // Trigger Next.js 404 page
  }

  return <PostClient id={id} />;
}
