import React from "react";
import { Link } from "react-router-dom";
import "./ChatList.css";
import { useQuery } from "@tanstack/react-query";
import { FaPen, FaCompass, FaEnvelope } from "react-icons/fa";
import { useClerk } from "@clerk/clerk-react";

const ChatList = () => {
  const { session } = useClerk();

  const fetchUserChats = async () => {
    if (!session) {
      throw new Error("No active session");
    }

    const token = await session.getToken();

    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/userchats`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch user chats");
    }

    return res.json();
  };

  const { isLoading, error, data } = useQuery({
    queryKey: ["userChats"],
    queryFn: fetchUserChats,
  });

  const chats = Array.isArray(data) ? data : [];

  return (
    <div className="chatList">
      <span className="title">DASHBOARD</span>
      <Link to="/dashboard">
        <FaPen className="icon" /> Create a new Chat
      </Link>
      <Link to="/">
        <FaCompass className="icon" /> Explore JD AI
      </Link>
      <Link to="https://junaid-portfolio-seven.vercel.app/" target="_blank">
        <FaEnvelope className="icon" /> Contact
      </Link>
      <hr />
      <span className="title">RECENT CHATS</span>
      <div className="list">
        {isLoading
          ? "Loading..."
          : error
          ? "Something went wrong!"
          : chats.length === 0
          ? "No Chats!"
          : chats.map((chat) => (
              <Link to={`/dashboard/chats/${chat._id}`} key={chat._id}>
                {chat.title}
              </Link>
            ))}
      </div>
      <hr />
      <div className="upgrade">
        <img src="/logo.png" alt="" />
        <div className="texts">
          <span>Upgrade to JD AI Pro</span>
          <span>Get unlimited access to all features</span>
        </div>
      </div>
    </div>
  );
};

export default ChatList;
