import React from "react";
import { useParams } from "react-router-dom";

function Post({ blogs }) {
  const { id } = useParams();
  const blog = blogs[id];

  if (!blog) {
    return <div>Post not found</div>;
  }

  return (
    <main className="container mx-auto h-full p-4">
      <div className="pb-4 border-solid border-b-2 border-indigo-500 mb-4">
        <div className="mb-1 text-right">{new Date(Number(blog.date) / 1_000_000).toLocaleString()}</div>
        <h3 className="text-xl mb-2">{blog.title}</h3>
        <p>{blog.content}</p>
        <div className="mt-2">
          <div className="flex gap-2 flex-wrap">
            {blog.tags.map((tag, idx) => (
              <div key={idx} className="text-white bg-indigo-400 rounded-3xl py-1 px-4 text-sm w-fit">
                {tag}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

export default Post;