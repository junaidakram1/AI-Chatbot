import React, { useRef, useEffect, useState } from "react";
import "./NewPrompt.css";
import Upload from "../Upload/Upload";
import { IKImage } from "imagekitio-react";
import { startChat } from "../../api/gemini";
import Markdown from "react-markdown";

const NewPrompt = () => {
  const endRef = useRef(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [img, setImg] = useState({
    isLoading: false,
    error: "",
    dbData: {},
    aiData: {},
  });

  const chat = startChat({
    history: [
      {
        role: "user",
        parts: [{ text: "Hello, I have 2 dogs in my house." }],
      },
      {
        role: "model",
        parts: [{ text: "Great to meet you. What would you like to know?" }],
      },
    ],
    generationConfig: {
      maxOutputTokens: 100,
    },
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [question, answer, img.dbData]);

  const add = async (text, isInitial) => {
    if (!isInitial) setQuestion(text);
    setLoading(true);
    try {
      const result = await chat.sendMessageStream(
        Object.entries(img.aiData || {}).length ? [img.aiData, text] : [text]
      );
      let accumulatedText = "";
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        accumulatedText += chunkText;
        setAnswer(accumulatedText);
      }
      setImg({ isLoading: false, error: "", dbData: {}, aiData: {} });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setImg({ isLoading: false, error: "", dbData: {}, aiData: {} });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = e.target.text.value;
    if (!text) return;
    add(text, false);
    e.target.reset();

    try {
      const response = await fetch("http://localhost:3000/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const result = await response.json();
      console.log("Server response:", result);
    } catch (err) {
      console.error("Request failed:", err);
    }
  };

  return (
    <>
      {img.isLoading && <div>Loading!</div>}
      {img.dbData?.filePath && (
        <IKImage
          urlEndpoint={import.meta.env.VITE_IMAGE_KIT_ENDPOINT}
          path={img.dbData.filePath}
          width="340"
          transformation={[{ width: 340 }]}
        />
      )}
      {question && <div className="message user">{question}</div>}
      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <div>Loading...</div>
        </div>
      )}
      {answer && (
        <div className="message">
          <Markdown>{answer}</Markdown>
        </div>
      )}
      <div className="endChat" ref={endRef}></div>
      <div className="newPrompt">
        <form className="newForm" onSubmit={handleSubmit}>
          <Upload setImg={setImg} />
          <input type="file" id="file" multiple={false} hidden />
          <input type="text" name="text" placeholder="What's Popping!" />
          <button type="submit">
            <img src="/arrow.png" alt="Send" />
          </button>
        </form>
      </div>
    </>
  );
};

export default NewPrompt;
