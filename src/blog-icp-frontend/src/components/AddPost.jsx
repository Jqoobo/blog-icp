import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function AddPost({ getBlogs, getTags }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [newTag, setNewTag] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const CANISTER_URL = "https://aihxp-bqaaa-aaaah-ariyq-cai.icp0.io";

  useEffect(() => {
    fetchTags();
  }, []);

  async function fetchTags() {
    const res = await axios.get(`${CANISTER_URL}/tags`);
    setAvailableTags(Array.isArray(res.data) ? res.data : []);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title || !content) {
      setMessage("Title and content cannot be empty!");
      return;
    }
    try {
      await axios.post(`${CANISTER_URL}/posts`, {
        title,
        content,
        tags: selectedTags,
      });
      setMessage("Post added successfully!");
      setTitle("");
      setContent("");
      setSelectedTags([]);
      getBlogs();
      navigate("/");
    } catch (err) {
      setMessage("Błąd dodawania posta");
    }
  }

  async function handleAddTag() {
    if (newTag.trim() === "") return;
    try {
      await api.post(`/tags`, { tag: newTag });
      setMessage("Tag added successfully!");
      setNewTag("");
      fetchTags();
      getTags();
    } catch (err) {
      setMessage("Błąd dodawania tagu");
    }
  }

  function toggleTag(tag) {
    setSelectedTags((prevTags) => (prevTags.includes(tag) ? prevTags.filter((t) => t !== tag) : [...prevTags, tag]));
  }

  return (
    <main className="flex flex-col justify-start h-full gap-6 py-8">
      <h2 className="mb-5 text-4xl font-bold">Add New Post</h2>

      <form className="grid gap-4 pb-8 border-b-[1px] border-violet-800" onSubmit={handleSubmit}>
        <div>
          <p className="font-bold ">Title</p>
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
          <p className="font-bold">Add a new tag (optional)</p>
          <div className="flex items-center justify-start gap-2 w-fit">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              className="w-full px-4 py-1 mt-2 text-black border-2 border-black outline-none hover:border-violet-800"
              placeholder="Enter new tag..."
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-2 py-1 mt-2 rounded-lg bg-gradient-to-r from-violet-600 to-violet-950 text-nowrap"
            >
              Add Tag
            </button>
          </div>
        </div>
        <div>
          <p className="font-bold">Select existing tags</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {(Array.isArray(availableTags) ? availableTags : []).map((tag, index) => (
              <button
                key={index}
                type="button"
                className={`px-4 py-1 text-sm font-bold uppercase rounded-lg ${
                  selectedTags.includes(tag)
                    ? "bg-gradient-to-r from-violet-600 to-violet-950 "
                    : "bg-gray-300 text-black"
                }`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button className="px-3 py-1 text-lg rounded-lg bg-gradient-to-r from-violet-600 to-violet-950" type="submit">
            Add Post
          </button>
        </div>
      </form>

      {message && (
        <div className="mt-4 text-lg font-bold text-violet-400">
          {message}
          <div className="hidden">{setTimeout(() => setMessage(""), 3000)}</div>
        </div>
      )}
    </main>
  );
}

export default AddPost;
