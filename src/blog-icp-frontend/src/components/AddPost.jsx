import React, { useState } from "react";
import { blog_icp_backend } from "../../../declarations/blog-icp-backend";

function AddPost() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const result = await blog_icp_backend.add_blog(title, content, tags);
      if ("Ok" in result) {
        setMessage("Post added successfully!");
      } else if ("Err" in result) {
        setMessage("Error: " + result.Err);
      }
      setTitle("");
      setContent("");
      setTags([]);
    } catch (error) {
      console.error("Error while adding post:", error);
      setMessage("Error while adding post");
    }
  }

  function saveTag() {
    if (tagInput.trim().length > 0) {
      setTags([...tags, tagInput]);
      setTagInput("");
    }
  }

  function removeTag(id) {
    setTags(tags.filter((_, index) => index !== id));
  }

  return (
    <main className="container h-full p-4 mx-auto">
      <img src="/logo2.svg" alt="DFINITY logo" className="mx-auto mt-4" />
      <br />
      <br />
      <form
        className="grid gap-4 pb-4 mb-4 border-b-2 border-indigo-500 border-solid"
        onSubmit={handleSubmit}
      >
        <div>
          <p className="font-bold text-black">Title: </p>
          <input
            id="title"
            alt="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-1 transition duration-150 ease-in-out border-2 border-black border-solid outline-none rounded-3xl hover:border-indigo-500"
          />
        </div>
        <div>
          <p className="font-bold text-black">Content: </p>
          <textarea
            id="content"
            alt="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full rounded-3xl py-1 px-4 outline-none min-h-[100px] border-solid border-2 border-black transition duration-150 ease-in-out hover:border-indigo-500"
          ></textarea>
        </div>
        <div>
          <p className="font-bold text-black">Tags: </p>
          <input
            id="tags"
            alt="tags"
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyUp={(e) => e.key === "Enter" && saveTag()}
            className="w-full px-4 py-1 transition duration-150 ease-in-out border-2 border-black border-solid outline-none rounded-3xl hover:border-indigo-500"
          />
          <div className="flex flex-wrap gap-1 my-2">
            {tags.map((tag, id) => (
              <div
                key={id}
                className="px-4 py-1 text-sm text-white bg-indigo-400 rounded-3xl w-fit"
                onClick={() => removeTag(id)}
              >
                {tag}
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end">
          <button
            className="px-4 py-1 text-white transition duration-150 ease-in-out bg-indigo-400 rounded-3xl hover:scale-110"
            type="submit"
          >
            Click to add!
          </button>
        </div>
      </form>

      {message && <div className="font-bold text-red-500">{message}</div>}
    </main>
  );
}

export default AddPost;
