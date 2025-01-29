import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import Home from "./components/Home";
import AddPost from "./components/AddPost";
import Post from "./components/Post";
import { blog_icp_backend } from "declarations/blog-icp-backend/index";
import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider, useAccount, useDisconnect } from "wagmi";
import { mainnet, polygon, optimism, arbitrum, base } from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { darkTheme, ConnectButton } from "@rainbow-me/rainbowkit";

const config = getDefaultConfig({
  appName: "My RainbowKit App",
  projectId: "YOUR_PROJECT_ID",
  chains: [mainnet, polygon, optimism, arbitrum, base],
});
const queryClient = new QueryClient();

function App() {
  const [blogs, setBlogs] = useState([]);
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    if (isConnected) {
      getBlogs();
    }
  }, [isConnected]);

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
    <RainbowKitProvider
      modalSize="compact"
      theme={darkTheme({
        accentColor: "#ecc606",
        accentColorForeground: "#422606",
        borderRadius: "small",
        fontStack: "system",
        overlayBlur: "small",
      })}
    >
      {!isConnected ? (
        <div>
          <div>Please connect your wallet to access the app</div>
          <ConnectButton />
        </div>
      ) : (
        <Router>
          <nav className="p-4 bg-indigo-500 text-white flex justify-between">
            <div>
              <Link to="/" className="mr-4">
                Home
              </Link>
              <Link to="/add-post">Add Post</Link>
            </div>
            <button onClick={disconnect} className="bg-red-500 px-4 py-2 rounded">
              Disconnect
            </button>
          </nav>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/add-post" element={<AddPost />} />
            <Route path="/post/:id" element={<Post blogs={blogs} />} />
          </Routes>
        </Router>
      )}
    </RainbowKitProvider>
  );
}

function WrappedApp() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default WrappedApp;