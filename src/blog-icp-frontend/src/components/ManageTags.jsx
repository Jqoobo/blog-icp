import React, { useState } from "react";
import { blog_icp_backend } from "../../../declarations/blog-icp-backend";

function ManageTags({ getTags, tags }) {
  const [newTag, setNewTag] = useState("");
  const [message, setMessage] = useState("");

  async function handleAddTag() {
    if (newTag.trim() === "") return;

    const result = await blog_icp_backend.add_tag_to_config(newTag);
    if ("Ok" in result) {
      setMessage("Tag added successfully!");
      getTags();
    } else {
      setMessage(`Error: ${result.Err}`);
    }
    setNewTag("");
  }

  return (
    <main className="container h-full p-4 mx-auto">
      <h2 className="mt-6 text-lg font-bold">Manage Tags</h2>

      <div className="mt-4">
        <input
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          className="p-2 border rounded"
          placeholder="Add new tag..."
        />
        <button onClick={handleAddTag} className="p-2 ml-2 text-white bg-indigo-400 rounded">
          Add Tag
        </button>
      </div>

      {message && <p className="mt-2 text-green-500">{message}</p>}

      <h3 className="mt-6 font-bold text-md">Current Tags</h3>
      <div className="flex flex-wrap gap-2 my-2">
        {tags.map((tag, index) => (
          <div key={index} className="px-4 py-1 text-sm text-white bg-indigo-400 rounded-3xl">
            {tag}
          </div>
        ))}
      </div>
    </main>
  );
}

export default ManageTags;
