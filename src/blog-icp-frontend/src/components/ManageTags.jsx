import React, { useState, useEffect } from "react";
import axios from "axios";

const CANISTER_URL = "https://aihxp-bqaaa-aaaah-ariyq-cai.icp0.io";

function ManageTags({ getTags }) {
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchTags();
  }, []);

  async function fetchTags() {
    const res = await axios.get(`${CANISTER_URL}/tags`);
    setTags(res.data);
  }

  async function handleAddTag() {
    if (newTag.trim() === "") return;
    try {
      await axios.post(`${CANISTER_URL}/tags`, { tag: newTag });
      setMessage("Tag added successfully!");
      setNewTag("");
      fetchTags();
      getTags();
    } catch (err) {
      setMessage("Błąd dodawania tagu");
    }
  }

  async function handleRemoveTag(tag) {
    try {
      await axios.delete(`${CANISTER_URL}/tags/${tag}`);
      setMessage(`Tag "${tag}" removed successfully!`);
      fetchTags();
      getTags();
    } catch (err) {
      setMessage("Błąd usuwania tagu");
    }
  }

  return (
    <main className="h-full py-8">
      <h2 className="text-4xl font-bold">Manage Global Tags</h2>

      <div className="flex gap-2 mt-4 w-fit">
        <input
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          className="px-4 py-1 mt-2 text-black border-2 border-black outline-none hover:border-violet-800"
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

      <div className="mt-4">
        <h3 className="font-bold">Existing Global Tags</h3>
        <div className="flex flex-wrap gap-2 mt-2">
          {tags.length === 0 ? (
            <p className="text-gray-500">No tags available.</p>
          ) : (
            tags.map((tag, index) => (
              <div
                key={index}
                className="px-4 py-1 text-sm font-bold uppercase rounded-lg bg-gradient-to-r from-violet-600 to-violet-950"
              >
                {tag}
                <button className="ml-2 font-bold " onClick={() => handleRemoveTag(tag)}>
                  ❌
                </button>
              </div>
            ))
          )}
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

export default ManageTags;
