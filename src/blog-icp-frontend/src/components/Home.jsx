import React from "react";
import { Link } from "react-router-dom";

function Home({ blogs }) {
  return (
    <main className="w-full">
      <h2 className="py-8 text-4xl font-bold">Check our posts</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {blogs.map((blog, index) => (
          <>
            <Link to={`/post/${index}`}>
              <div key={index} className="p-4 border-[1px] border-violet-800 min-h-[170px] flex flex-col justify-between">
                <div className="mb-1 text-right">{new Date(Number(blog.date) / 1_000_000).toLocaleString()}</div>
                <div className="flex flex-col">
                <h3 className="mb-2 text-3xl font-bold">{blog.title}</h3>
                <div className="mb-2 text-sm text-gray-600">By {blog.owner.toText()}</div>
                <div className="flex items-center justify-between w-full">
                  <div className="flex gap-2 mt-2">
                    {blog.tags.map((tag, idx) => (
                      <div key={idx} className="px-4 py-1 text-sm font-bold uppercase bg-gradient-to-r from-violet-800 to-violet-950 rounded-3xl">
                        {tag}
                      </div>
                    ))}
                  </div>
                </div>
                </div>
              </div>
            </Link>
          </>
        ))}
      </div>
    </main>
  );
}

export default Home;
