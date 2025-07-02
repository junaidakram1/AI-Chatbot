import "./Chat.css";
import NewPrompt from "../../components/NewPrompt/NewPrompt";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useClerk } from "@clerk/clerk-react";
import Markdown from "react-markdown";
import { IKImage } from "imagekitio-react";

const Chat = () => {
  const path = useLocation().pathname;
  const chatId = path.split("/").pop();
  console.log(chatId);

  const { session } = useClerk();

  const fetchChat = async () => {
    if (!session) {
      throw new Error("No active session");
    }

    const token = await session.getToken();

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/chats/${chatId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch chat");
    }

    return res.json();
  };

  const { isLoading, error, data } = useQuery({
    queryKey: ["chat", chatId],
    queryFn: fetchChat,
    enabled: !!chatId,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="chatPage">
      <div className="wrapper">
        <div className="chat">
          {data?.history?.flatMap((message, i) => {
            const elements = [];

            if (message.img) {
              elements.push(
                <IKImage
                  key={`img-${i}`}
                  urlEndpoint={import.meta.env.VITE_IMAGE_KIT_ENDPOINT}
                  path={message.img}
                  height="300"
                  width="400"
                  transformation={[{ height: 300, width: 400 }]}
                  loading="lazy"
                  lqip={{ active: true, quality: 20 }}
                />
              );
            }

            elements.push(
              <div
                key={`msg-${i}`}
                className={message.role === "user" ? "message user" : "message"}
              >
                <Markdown>{message.parts[0].text}</Markdown>
              </div>
            );

            return elements;
          })}

          <NewPrompt data={data} />
        </div>
      </div>
    </div>
  );
};

export default Chat;
