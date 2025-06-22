import React from "react";
import { Link } from "react-router-dom";
import "./ChatList.css";
// import { FaPlusCircle } from "react-icons/fa";
import { FaPen, FaCompass, FaEnvelope } from "react-icons/fa";

const ChatList = () => {
  return (
    <div className="chatList">
      <span className="title">DASHBOARD</span>
      <Link to="/dashboard">
        <FaPen className="icon" /> Create a new Chat
      </Link>
      <Link to="/">
        <FaCompass className="icon" /> Explore JD AI
      </Link>
      <Link to="/">
        <FaEnvelope className="icon" /> Contact
      </Link>
      <hr />
      <span className="title">RECENT CHATS</span>
      <div className="list">
        <Link to="">New Chat</Link>
        <Link to="">New Chat</Link>
        <Link to="">New Chat</Link>
        <Link to="">New Chat</Link>
        <Link to="">New Chat</Link>
        <Link to="">New Chat</Link>
        <Link to="">New Chat</Link>
        <Link to="">New Chat</Link>
        <Link to="">New Chat</Link>
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
