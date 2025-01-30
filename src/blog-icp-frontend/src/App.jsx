import React, { useState, useEffect } from "react";
import { createActor, blog_icp_backend, canisterId } from "../../declarations/blog-icp-backend";
import { AuthClient } from "@dfinity/auth-client";
import Home from "./components/Home";
import AddPost from "./components/AddPost";
import Post from "./components/Post";
import ManageTags from "./components/ManageTags";
import { HashRouter as Router, Routes, Route, Link } from "react-router-dom";

function App() {
  const [authClient, setAuthClient] = useState(null);
  const [identity, setIdentity] = useState(null);
  const [backend, setBackend] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [tags, setTags] = useState([]);

  useEffect(() => {
    async function initAuth() {
      const client = await AuthClient.create();
      setAuthClient(client);

      if (await client.isAuthenticated()) {
        const identity = client.getIdentity();
        setIdentity(identity);
        setBackend(createActor(canisterId, { agentOptions: { identity } }));
      }
    }
    initAuth();
  }, []);

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

  async function login() {
    await authClient.login({
      identityProvider: "https://identity.ic0.app",
      onSuccess: async () => {
        const identity = authClient.getIdentity();
        setIdentity(identity);
        setBackend(createActor(canisterId, { agentOptions: { identity } }));
        console.log("Logged in as", canisterId);
      },
    });
  }

  async function logout() {
    await authClient.logout();
    setIdentity(null);
    setBackend(null);
  }

  if (!identity) {
    return (
      <div className="flex items-center justify-center h-screen">
        <button onClick={login} className="px-4 py-2 text-white bg-indigo-500 rounded-lg">
          Log in with Internet Identity
        </button>
      </div>
    );
  }

  return (
    <Router>
      <nav className="flex justify-between p-4 text-violet-200">
        <div className="flex gap-4">
          <Link to="/" className="mr-4">
            Home
          </Link>
          <Link to="/add-post">Add Post</Link>
          <Link to="/manage-tags">Manage Tags</Link>
        </div>
        <button onClick={logout} className="px-4 py-1 text-white bg-red-500 rounded-lg">
          Disconnect
        </button>
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
