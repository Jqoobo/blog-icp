import React, { useState, useEffect } from "react";
import { blog_icp_backend } from "../../../declarations/blog-icp-backend";

function ManageTags({ getTags }) {
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchTags();
  }, []);

  async function fetchTags() {
    const config = await blog_icp_backend.get_config();
    setTags(config.tags);
  }

  async function handleAddTag() {
    if (newTag.trim() === "") return;

    const result = await blog_icp_backend.add_tag_to_config(newTag);
    if ("Ok" in result) {
      setMessage("Tag added successfully!");
      setNewTag("");
      fetchTags(); // 🔄 Odśwież listę tagów
      getTags(); // 🔄 Powiadamiamy inne komponenty o zmianach
    } else {
      setMessage(`Error: ${result.Err}`);
    }
  }

  async function handleRemoveTag(tag) {
    const result = await blog_icp_backend.remove_tag_from_config(tag);
    if ("Ok" in result) {
      setMessage(`Tag "${tag}" removed successfully!`);
      fetchTags(); // 🔄 Odśwież listę tagów
      getTags(); // 🔄 Powiadamiamy inne komponenty o zmianach
    } else {
      setMessage(`Error: ${result.Err}`);
    }
  }

  return (
    <main className="container h-full p-4 mx-auto">
      <h2 className="text-lg font-bold">Manage Tags</h2>

      {/* Dodawanie nowego tagu */}
      <div className="flex mt-4">
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

      {/* Lista tagów */}
      <div className="mt-4">
        <h3 className="font-bold text-black">Existing Tags:</h3>
        <div className="flex flex-wrap gap-2 mt-2">
          {tags.length === 0 ? (
            <p className="text-gray-500">No tags available.</p>
          ) : (
            tags.map((tag, index) => (
              <div key={index} className="flex items-center px-4 py-1 text-white bg-indigo-400 rounded-3xl">
                {tag}
                <button className="ml-2 font-bold text-red-500 hover:scale-110" onClick={() => handleRemoveTag(tag)}>
                  ❌
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {message && <div className="mt-4 font-bold text-red-500">{message}</div>}
    </main>
  );
}

export default ManageTags;
