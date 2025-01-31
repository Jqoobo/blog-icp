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

  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");

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
    const newTags = selectedTags.length === 0 ? [] : selectedTags;

    const result = await blog_icp_backend.edit_blog(blog.id, [title], [content], [newTags]);

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
    getBlogs();
  }

  async function handleEditComment(commentId) {
    setEditingCommentId(commentId);
    const commentToEdit = blog.comments.find((c) => c.id === commentId);
    if (commentToEdit) {
      setEditingCommentText(commentToEdit.content);
    }
  }

  async function handleSaveComment(commentId) {
    if (editingCommentText.trim() === "") return;

    const result = await blog_icp_backend.edit_comment(blog.id, commentId, editingCommentText);
    if ("Ok" in result) {
      setEditingCommentId(null);
      setEditingCommentText("");
      getBlogs();
    } else {
      setMessage(`Error: ${result.Err}`);
    }
  }

  async function handleRemoveComment(commentId) {
    const result = await blog_icp_backend.remove_comment(blog.id, commentId);
    if ("Ok" in result) {
      getBlogs();
    } else {
      setMessage(`Error: ${result.Err}`);
    }
  }

  function toggleTag(tag) {
    setSelectedTags((prevTags) => (prevTags.includes(tag) ? prevTags.filter((t) => t !== tag) : [...prevTags, tag]));
  }

  function formatDate(timestamp) {
    const date = new Date(Number(timestamp) / 1_000_000);
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
    <main className="flex flex-col justify-between h-full py-8">
      <div className={`flex flex-col ${isEditing ? "justify-start gap-6" : "justify-between"} h-full`}>
        {isEditing ? (
          <>
            <h2 className="mb-4 text-4xl font-bold">Edit Post</h2>

            <div>
              <p className="font-bold">Title</p>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-1 mt-2 text-black border-2 border-black outline-none hover:border-violet-800"
              />
            </div>

            <div>
              <p className="font-bold">Content</p>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-1 mt-2 text-black border-2 border-black outline-none hover:border-violet-800"
              />
            </div>

            <div>
              <p className="font-bold ">Select Tags or unselect to remove</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {availableTags.length > 0 ? (
                  availableTags.map((tag, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`px-4 py-1 text-sm font-bold uppercase rounded-lg  ${
                        selectedTags.includes(tag)
                          ? "bg-gradient-to-r from-violet-600 to-violet-950 "
                          : "bg-gray-300 text-black"
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
                className="px-3 py-1 text-lg rounded-lg bg-gradient-to-r from-violet-600 to-violet-950"
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                className="px-3 py-1 text-lg rounded-lg bg-gradient-to-r from-violet-600 to-violet-950"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col justify-between gap-4">
              <div className="text-xl font-light text-right">{formatDate(blog.date)}</div>
              <button
                onClick={handleEdit}
                className="self-end px-4 py-1 text-lg rounded-lg bg-gradient-to-r from-violet-800 to-violet-950 w-fit "
              >
                Edit Post
              </button>
              <div className="flex flex-col gap-8 mt-10">
                <h3 className="text-4xl font-bold">{blog.title}</h3>
                <p className="text-lg">{blog.content}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-start gap-2 py-8">
              Tags:
              {blog.tags.map((tag, idx) => (
                <div
                  key={idx}
                  className="px-4 py-1 text-sm font-bold uppercase rounded-lg bg-gradient-to-r from-violet-600 to-violet-950"
                >
                  {tag}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="border-t-[1px] border-violet-800 py-4">
        <h4 className="mb-4 text-2xl font-bold">Comments</h4>
        {blog.comments && blog.comments.length === 0 ? (
          <p className="mt-2 text-sm font-light">No comments yet</p>
        ) : (
          blog.comments.map((c, index) => (
            <div key={index} className="flex items-center justify-between py-2 px-4 border-b-[1px] border-gray-500">
              <div>
                {editingCommentId === c.id ? (
                  <>
                    <textarea
                      value={editingCommentText}
                      onChange={(e) => setEditingCommentText(e.target.value)}
                      className="w-full py-1 px-4 outline-none min-h-[50px] border-[1px] border-black hover:border-violet-800 text-black"
                    />
                    <button
                      onClick={() => handleSaveComment(c.id)}
                      className="px-3 py-1 my-2 rounded-lg bg-gradient-to-r from-violet-600 to-violet-950"
                    >
                      Save
                    </button>
                  </>
                ) : (
                  <>
                    <p>{c.content}</p>
                    <p className="mt-1 text-sm text-gray-500">{formatDate(c.date)}</p>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditComment(c.id)}
                  className="px-3 py-1 rounded-lg bg-gradient-to-r from-violet-600 to-violet-950"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleRemoveComment(c.id)}
                  className="px-3 py-1 rounded-lg bg-gradient-to-r from-violet-600 to-violet-950"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}

        <div className="mt-4">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write something nice..."
            className="w-full py-1 px-2 min-h-[50px] text-black outline-none border-[1px] border-black hover:border-violet-800"
          />
          <button
            onClick={handleAddComment}
            className="px-4 py-1 mt-2 text-lg rounded-lg bg-gradient-to-r from-violet-600 to-violet-950"
          >
            Add Comment
          </button>
        </div>
      </div>

      {message && (
        <div className="mt-4 text-lg font-bold text-violet-400">
          {message}
          <div className="hidden">{setTimeout(() => setMessage(""), 3000)}</div>
        </div>
      )}
    </main>
  );
}

export default Post;
