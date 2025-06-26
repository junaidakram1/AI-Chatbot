import { useAuth } from "@clerk/clerk-react";
import "./Dashboard.css";

const Dashboard = () => {
  console.log("dash rendered");
  const { userId } = useAuth();
  const handleSubmit = async (e) => {
    e.preventDefault();
    // console.log("Form submitted", text);
    const text = e.target.text.value;
    if (!text) return;

    try {
      const response = await fetch("http://localhost:3000/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, text }),
      });

      const result = await response.json();
      console.log("Server response:", result);
    } catch (err) {
      console.error("Request failed:", err);
    }
  };

  return (
    <div className="dashboardPage">
      <div className="texts">
        <div className="logo">
          <img src="/logo.png" alt="" />
          <h1>JD AI</h1>
        </div>
        <div className="options">
          <div className="option">
            <img src="/chat.png" alt="" />
            <span>Create a New Chat</span>
          </div>
          <div className="option">
            <img src="/image.png" alt="" />
            <span>Analyze Images</span>
          </div>
          <div className="option">
            <img src="/code.png" alt="" />
            <span>Help Me with My Code</span>
          </div>
        </div>
      </div>
      <div className="formContainer">
        <form onSubmit={handleSubmit}>
          <input type="text" name="text" placeholder="What's Poppin!.." />
          <button type="submit">
            <img src="/arrow.png" alt="" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Dashboard;
