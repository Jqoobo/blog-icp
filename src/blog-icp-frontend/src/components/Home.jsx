import React from "react";
import { Link } from "react-router-dom";

function Home({ blogs }) {
  return (
    <main className="container h-full p-4 mx-auto">
      <img src="/logo2.svg" alt="DFINITY logo" className="mx-auto mt-4" />
      <br />
      <br />
      <div>
        {blogs.map((blog, index) => (
          <div
            key={index}
            className="pb-4 mb-4 border-b-2 border-indigo-500 border-solid"
          >
            <div className="mb-1 text-right">
              {new Date(Number(blog.date) / 1_000_000).toLocaleString()}
            </div>
            <h3 className="mb-2 text-xl">{blog.title}</h3>
            <div className="mt-2">
              <div className="flex flex-wrap gap-2">
                {blog.tags.map((tag, idx) => (
                  <div
                    key={idx}
                    className="px-4 py-1 text-sm text-white bg-indigo-400 rounded-3xl w-fit"
                  >
                    {tag}
                  </div>
                ))}
              </div>
            </div>
            <Link to={`/post/${index}`} className="text-blue-500">
              Read more
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}

export default Home;
