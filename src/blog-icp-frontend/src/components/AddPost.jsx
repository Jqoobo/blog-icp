import React, { useState } from "react";
import { blog_icp_backend } from "declarations/blog-icp-backend/index";

function AddPost() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    await blog_icp_backend.add_blog(title, content, tags);
    setTitle("");
    setContent("");
    setTags([]);
  }

  function saveTag() {
    setTags([...tags, tagInput]);
    setTagInput("");
  }

  function removeTag(id) {
    setTags(tags.filter((_, index) => index !== id));
  }

  return (
    <main className="container mx-auto h-full p-4">
      <img src="/logo2.svg" alt="DFINITY logo" className="mx-auto mt-4" />
      <br />
      <br />
      <form className="grid gap-4 pb-4 mb-4 border-solid border-b-2 border-indigo-500" onSubmit={handleSubmit}>
        <div>
          <p className="text-black font-bold">Title: </p>
          <input
            id="title"
            alt="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-3xl py-1 px-4 outline-none border-solid border-2 border-black transition duration-150 ease-in-out hover:border-indigo-500"
          />
        </div>
        <div>
          <p className="text-black font-bold">Content: </p>
          <textarea
            id="content"
            alt="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full rounded-3xl py-1 px-4 outline-none min-h-[100px] border-solid border-2 border-black transition duration-150 ease-in-out hover:border-indigo-500"
          ></textarea>
        </div>
        <div>
          <p className="text-black font-bold">Tags: </p>
          <input
            id="tags"
            alt="tags"
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyUp={(e) => e.key === "Enter" && saveTag()}
            className="w-full rounded-3xl py-1 px-4 outline-none border-solid border-2 border-black transition duration-150 ease-in-out hover:border-indigo-500"
          />
          <div className="flex gap-1 flex-wrap my-2">
            {tags.map((tag, id) => (
              <div
                key={id}
                className="text-white bg-indigo-400 rounded-3xl py-1 px-4 text-sm w-fit"
                onClick={() => removeTag(id)}
              >
                {tag}
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end">
          <button
            className="text-white bg-indigo-400 rounded-3xl py-1 px-4 transition duration-150 ease-in-out hover:scale-110"
            type="submit"
          >
            Click to add!
          </button>
        </div>
      </form>
    </main>
  );
}

export default AddPost;