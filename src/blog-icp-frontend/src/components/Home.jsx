import React, { useState, useEffect } from "react";
import { blog_icp_backend } from "declarations/blog-icp-backend/index";
import { Link } from "react-router-dom";

function Home() {
  const [blogs, setBlogs] = useState([]);

  useEffect(() => {
    getBlogs();
  }, []);

  async function getBlogs() {
    const tempBlogs = await blog_icp_backend.get_blogs();
    setBlogs(
      tempBlogs.map((blog) => ({
        ...blog,
        date: blog.date.toString(),
      }))
    );
  }

  return (
    <main className="container mx-auto h-full p-4">
      <img src="/logo2.svg" alt="DFINITY logo" className="mx-auto mt-4" />
      <br />
      <br />
      <div>
        {blogs.map((blog, index) => (
          <div key={index} className="pb-4 border-solid border-b-2 border-indigo-500 mb-4">
            <div className="mb-1 text-right">{new Date(Number(blog.date) / 1_000_000).toLocaleString()}</div>
            <h3 className="text-xl mb-2">{blog.title}</h3>
            <p>{blog.content}</p>
            <div className="mt-2">
              <div className="flex gap-2 flex-wrap">
                {blog.tags.map((tag, idx) => (
                  <div key={idx} className="text-white bg-indigo-400 rounded-3xl py-1 px-4 text-sm w-fit">
                    {tag}
                  </div>
                ))}
              </div>
            </div>
            <Link to={`/post/${index}`} className="text-blue-500">Read more</Link>
          </div>
        ))}
      </div>
    </main>
  );
}

export default Home;