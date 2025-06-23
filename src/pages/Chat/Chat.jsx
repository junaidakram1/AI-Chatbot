import "./Chat.css";
import NewPrompt from "../../components/NewPrompt/NewPrompt";
import { useEffect, useRef } from "react";

const ChatPage = () => {
  return (
    <div className="chatPage">
      <div className="wrapper">
        <div className="chat">
          <div className="message">msg from AI</div>
          <div className="message user">
            msg from user Lorem ipsum dolor sit amet consectetur adipisicing
            elit. Tenetur, consequatur ipsum. Id culpa earum voluptatibus dolore
            quis sit facilis fugit, laborum iure ut excepturi esse quidem
            assumenda delectus ex. Voluptates!
          </div>
          <div className="message">msg from AI</div>
          <div className="message user">msg from user</div>
          <div className="message">msg from AI</div>
          <div className="message user">msg from user</div>
          <div className="message">msg from AI</div>
          <div className="message user">msg from user</div>
          <div className="message">msg from AI</div>
          <div className="message user">msg from user</div>
          <div className="message">msg from AI</div>
          <div className="message user">msg from user</div>

          <NewPrompt />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
