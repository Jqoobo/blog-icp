import React, { useState, useEffect } from "react";
import { HashRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./components/Home";
import AddPost from "./components/AddPost";
import Post from "./components/Post";
import ManageTags from "./components/ManageTags";
import { blog_icp_backend } from "../../declarations/blog-icp-backend";

function App() {
  const [blogs, setBlogs] = useState([]);
  const [tags, setTags] = useState([]);

  useEffect(() => {
    getBlogs();
    getTags();
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

  async function getTags() {
    const config = await blog_icp_backend.get_config();
    setTags(config.tags);
  }

  return (
    <Router>
      <nav className="flex justify-between p-4 text-violet-200">
        <div>
          <Link to="/" className="mr-4">
            Home
          </Link>
          <Link to="/add-post" className="mr-4">
            Add Post
          </Link>
          <Link to="/manage-tags">Manage Tags</Link>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<Home blogs={blogs} />} />
        <Route path="/add-post" element={<AddPost getBlogs={getBlogs} getTags={getTags} />} />
        <Route path="/post/:id" element={<Post blogs={blogs} getBlogs={getBlogs} />} />
        <Route path="/manage-tags" element={<ManageTags getTags={getTags} tags={tags} />} />
      </Routes>
    </Router>
  );
}

export default App;
