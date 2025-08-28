import React, { useState, useEffect } from "react";
import { createActor, blog_icp_backend, canisterId } from "../../declarations/blog-icp-backend";
import { AuthClient } from "@dfinity/auth-client";
import Home from "./components/Home";
import AddPost from "./components/AddPost";
import Post from "./components/Post";
import ManageTags from "./components/ManageTags";
import { HashRouter as Router, Routes, Route, Link } from "react-router-dom";
import api from "../api";

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
    const res = await api.get("/posts");
    setBlogs(res.data);
  }

  async function getTags() {
    const res = await api.get("/tags");
    setTags(res.data);
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
      <div className="flex flex-col items-center justify-center h-screen gap-12">
        <img src="/icpLogo.svg" alt="Internet Computer Logo" className="w-64 h-auto sm:w-96" />
        <button
          onClick={login}
          className="px-4 py-2 font-normal transform rounded-lg sm:text-xl bg-gradient-to-r from-violet-800 to-violet-950"
        >
          Log in with Internet Identity
        </button>
      </div>
    );
  }

  return (
    <>
      <Router>
        <header>
          <nav className="flex items-center justify-between py-8 text-xl border-b-[1px] text-violet-50 border-violet-800">
            <Link to="/">
              <img src="/icpLogo.svg" alt="Internet Computer Logo" className="w-48 h-auto" />
            </Link>
            <div className="flex gap-10">
              <Link to="/add-post" className="hover:text-violet-400">
                Add Post
              </Link>
              <Link to="/manage-tags" className="hover:text-violet-400">
                Manage Tags
              </Link>
            </div>
            <button
              onClick={logout}
              className="px-4 py-1 text-lg rounded-lg bg-gradient-to-r from-violet-800 to-violet-950"
            >
              Logout
            </button>
          </nav>
        </header>
        <Routes>
          <Route path="/" element={<Home blogs={blogs} />} />
          <Route path="/add-post" element={<AddPost getBlogs={getBlogs} getTags={getTags} />} />
          <Route path="/post/:id" element={<Post blogs={blogs} getBlogs={getBlogs} />} />
          <Route path="/manage-tags" element={<ManageTags getTags={getTags} tags={tags} />} />
        </Routes>
      </Router>
      <footer className="flex items-center justify-between py-4">
        <p className="">
          Created by{" "}
          <span className="inline-block text-xl text-transparent bg-gradient-to-r from-violet-200 via-violet-400 to-violet-500 bg-clip-text">
            w64191 do pracy magisterskiej - Blog ICP
          </span>{" "}
        </p>
        <img src="/logo2.svg" alt="DFINITY logo" className="w-64" />
      </footer>
    </>
  );
}

export default App;
