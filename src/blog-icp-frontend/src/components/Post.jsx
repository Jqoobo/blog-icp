import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { blog_icp_backend } from "../../../declarations/blog-icp-backend";

function Post({ blogs, getBlogs }) {
  const { id } = useParams();
  const blog = blogs[id];
  const [comment, setComment] = useState("");

  if (!blog) {
    return <div>Post not found</div>;
  }

  async function addComment() {
    if (comment.trim() === "") return;
    await blog_icp_backend.add_comment(blog.id, comment);
    setComment("");
    getBlogs();
  }

  return (
    <main className="container h-full p-4 mx-auto">
      <h3 className="mb-2 text-xl">{blog.title}</h3>
      <p>{blog.content}</p>

      <h4 className="mt-6 text-lg font-bold">Comments</h4>
      {blog.comments.length === 0 ? (
        <p>No comments yet.</p>
      ) : (
        blog.comments.map((c, index) => (
          <div key={index} className="p-2 my-2 border">
            <p>{c.content}</p>
          </div>
        ))
      )}

      <div className="mt-4">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full p-2 border"
          placeholder="Write a comment..."
        />
        <button onClick={addComment} className="p-2 mt-2 text-white bg-indigo-400 rounded">
          Add Comment
        </button>
      </div>
    </main>
  );
}

export default Post;
