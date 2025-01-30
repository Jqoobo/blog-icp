import React from "react";
import { useParams } from "react-router-dom";

function Post({ blogs }) {
  const { id } = useParams();
  const blog = blogs[id];

  if (!blog) {
    return <div>Post not found</div>;
  }

  return (
    <main className="container h-full p-4 mx-auto">
      <div className="pb-4 mb-4 border-b-2 border-indigo-500 border-solid">
        <div className="mb-1 text-right">{new Date(Number(blog.date) / 1_000_000).toLocaleString()}</div>
        <h3 className="mb-2 text-xl">{blog.title}</h3>
        <p>{blog.content}</p>
        <div className="mt-2">
          <div className="flex flex-wrap gap-2">
            {blog.tags.map((tag, idx) => (
              <div key={idx} className="px-4 py-1 text-sm text-white bg-indigo-400 rounded-3xl w-fit">
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
