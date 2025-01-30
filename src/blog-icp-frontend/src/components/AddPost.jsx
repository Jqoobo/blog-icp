import React, { useState, useEffect } from "react";
import { blog_icp_backend } from "../../../declarations/blog-icp-backend";

function AddPost({ getBlogs, getTags }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [newTag, setNewTag] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchTags();
  }, []);

  async function fetchTags() {
    const config = await blog_icp_backend.get_config();
    setAvailableTags(config.tags);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title || !content) {
      setMessage("Title and content cannot be empty!");
      return;
    }

    const result = await blog_icp_backend.add_blog(title, content, selectedTags);
    if ("Ok" in result) {
      setMessage("Post added successfully!");
      setTitle("");
      setContent("");
      setSelectedTags([]);
      getBlogs();
    } else {
      setMessage(`Error: ${result.Err}`);
    }
  }

  async function handleAddTag() {
    if (newTag.trim() === "") return;

    const result = await blog_icp_backend.add_tag_to_config(newTag);
    if ("Ok" in result) {
      setMessage("Tag added successfully!");
      setNewTag("");
      fetchTags();
      getTags();
    } else {
      setMessage(`Error: ${result.Err}`);
    }
  }

  function toggleTag(tag) {
    setSelectedTags((prevTags) =>
      prevTags.includes(tag) ? prevTags.filter((t) => t !== tag) : [...prevTags, tag]
    );
  }

  return (
    <main className="container h-full p-4 mx-auto">
      <h2 className="text-lg font-bold">Add New Post</h2>

      <form className="grid gap-4 pb-4 mb-4 border-b-2 border-indigo-500" onSubmit={handleSubmit}>
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
          <p className="font-bold text-black">Add a New Tag: </p>
          <div className="flex">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              className="w-full px-4 py-1 border-2 border-black outline-none rounded-3xl hover:border-indigo-500"
              placeholder="Enter new tag..."
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-1 ml-2 text-white bg-green-500 rounded-3xl hover:scale-105"
            >
              Add Tag
            </button>
          </div>
        </div>

        <div>
          <p className="font-bold text-black">Select Tags: </p>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag, index) => (
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
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button className="px-4 py-1 text-white bg-indigo-400 rounded-3xl hover:scale-110" type="submit">
            Add Post
          </button>
        </div>
      </form>

      {message && <div className="font-bold text-red-500">{message}</div>}
    </main>
  );
}

export default AddPost;
