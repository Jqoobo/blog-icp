import React, { useState, useEffect } from "react";
import { HashRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./components/Home";
import AddPost from "./components/AddPost";
import Post from "./components/Post";

// Import canistera z deklaracji:
import { blog_icp_backend } from "../../declarations/blog-icp-backend";

function App() {
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
    <Router>
      <nav className="flex justify-between p-4 text-violet-200 ">
        <div>
          <Link to="/" className="mr-4">
            Home
          </Link>
          <Link to="/add-post">Add Post</Link>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<Home blogs={blogs} />} />
        <Route path="/add-post" element={<AddPost />} />
        <Route path="/post/:id" element={<Post blogs={blogs} />} />
      </Routes>
    </Router>
  );
}

export default App;
