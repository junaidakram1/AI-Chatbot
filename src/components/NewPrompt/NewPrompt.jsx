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
  const [img, setImg] = useState({
    isLoading: false,
    error: "",
    dbData: {},
    aiData: {},
  });

  const chat = startChat({ history: [], generationConfig: {} });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [question, answer, img.dbData]);

  const add = async (text, isInitial) => {
    if (!isInitial) setQuestion(text);

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
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = e.target.text.value;
    if (!text) return;
    add(text, false);
    e.target.reset();
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
