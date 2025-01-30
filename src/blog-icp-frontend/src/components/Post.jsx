import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { blog_icp_backend } from "../../../declarations/blog-icp-backend";

function Post({ blogs, getBlogs }) {
  const { id } = useParams();
  const blog = blogs[id];

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(blog?.title || "");
  const [content, setContent] = useState(blog?.content || "");
  const [selectedTags, setSelectedTags] = useState(blog?.tags || []);
  const [availableTags, setAvailableTags] = useState([]);
  const [message, setMessage] = useState("");
  const [comment, setComment] = useState("");

  async function fetchTags() {
    const config = await blog_icp_backend.get_config();
    setAvailableTags(config.tags);
  }

  async function handleEdit() {
    setIsEditing(true);
    fetchTags();
  }

  async function handleCancel() {
    setIsEditing(false);
    setTitle(blog.title);
    setContent(blog.content);
    setSelectedTags(blog.tags);
  }

  async function handleSave() {
    const result = await blog_icp_backend.edit_blog(blog.id, title, content, selectedTags);
    if ("Ok" in result) {
      setMessage("Post updated successfully!");
      setIsEditing(false);
      getBlogs();
    } else {
      setMessage(`Error: ${result.Err}`);
    }
  }

  async function handleAddComment() {
    if (comment.trim() === "") return;
    await blog_icp_backend.add_comment(blog.id, comment);
    setComment("");
    getBlogs(); // Odśwież posty po dodaniu komentarza
  }

  function toggleTag(tag) {
    setSelectedTags((prevTags) =>
      prevTags.includes(tag) ? prevTags.filter((t) => t !== tag) : [...prevTags, tag]
    );
  }

  // Funkcja konwertująca timestamp na czytelną datę i godzinę
  function formatDate(timestamp) {
    const date = new Date(Number(timestamp) / 1_000_000); // Przekształcamy timestamp z nanosekund na milisekundy
    return date.toLocaleString("pl-PL", {  
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  if (!blog) {
    return <div>Post not found</div>;
  }

  return (
    <main className="container h-full p-4 mx-auto">
      {isEditing ? (
        <>
          <h2 className="text-lg font-bold">Edit Post</h2>
          <div>
            <p className="font-bold text-black">Title: </p>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-1 border-2 border-black outline-none rounded-3xl hover:border-indigo-500"
            />
          </div>

          <div>
            <p className="font-bold text-black">Content: </p>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full rounded-3xl py-1 px-4 outline-none min-h-[100px] border-2 border-black hover:border-indigo-500"
            />
          </div>

          <div>
            <p className="font-bold text-black">Select Tags: </p>
            <div className="flex flex-wrap gap-2">
              {availableTags.length > 0 ? (
                availableTags.map((tag, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`px-4 py-1 text-sm rounded-3xl w-fit ${
                      selectedTags.includes(tag) ? "bg-indigo-500 text-white" : "bg-gray-300 text-black"
                    }`}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </button>
                ))
              ) : (
                <p className="text-gray-500">No tags available.</p>
              )}
            </div>
          </div>

          <div className="flex gap-4 mt-4">
            <button
              onClick={handleSave}
              className="px-4 py-1 text-white bg-green-500 rounded-3xl hover:scale-110"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-1 text-white bg-red-500 rounded-3xl hover:scale-110"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="pb-4 mb-4 border-b-2 border-indigo-500 border-solid">
            <div className="mb-1 text-right">
              {new Date(Number(blog.date) / 1_000_000).toLocaleString()}
            </div>
            <h3 className="mb-2 text-xl">{blog.title}</h3>
            <p>{blog.content}</p>

            <div className="flex flex-wrap gap-2 mt-2">
              {blog.tags.map((tag, idx) => (
                <div key={idx} className="px-4 py-1 text-sm text-white bg-indigo-400 rounded-3xl w-fit">
                  {tag}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleEdit}
            className="px-4 py-1 text-white bg-indigo-500 rounded-3xl hover:scale-110"
          >
            Edit
          </button>

          {/* Sekcja komentarzy */}
          <h4 className="mt-6 text-lg font-bold">Comments</h4>
          {blog.comments.length === 0 ? (
            <p>No comments yet.</p>
          ) : (
            blog.comments.map((c, index) => (
              <div key={index} className="p-2 my-2 border rounded-lg shadow-md">
                <p>{c.content}</p>
                <p className="mt-1 text-sm text-gray-500">{formatDate(c.date)}</p>
              </div>
            ))
          )}

          {/* Dodawanie komentarzy */}
          <div className="mt-4">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-2 border rounded-lg shadow-sm"
              placeholder="Write a comment..."
            />
            <button
              onClick={handleAddComment}
              className="p-2 mt-2 text-white bg-indigo-400 rounded-lg hover:scale-105"
            >
              Add Comment
            </button>
          </div>
        </>
      )}

      {message && <div className="font-bold text-red-500">{message}</div>}
    </main>
  );
}

export default Post;
