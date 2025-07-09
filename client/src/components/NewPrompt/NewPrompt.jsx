import React, { useRef, useEffect, useState } from "react";
import "./NewPrompt.css";
import Upload from "../Upload/Upload";
import { IKImage } from "imagekitio-react";
import { startChat } from "../../gemini/gemini";
import Markdown from "react-markdown";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useClerk } from "@clerk/clerk-react";

const NewPrompt = ({ data }) => {
  const endRef = useRef(null);
  const { session } = useClerk();
  const formRef = useRef(null);
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
    history:
      data?.history?.map(({ role, parts }) => ({
        role,
        parts: [{ text: parts[0].text }],
      })) || [],
    generationConfig: {
      maxOutputTokens: 100,
    },
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [question, answer, img.dbData]);

  // Initialize question and answer from last user and assistant messages
  useEffect(() => {
    if (data?.history?.length >= 2) {
      const lastUserMsg = data.history[data.history.length - 2];
      const lastAIMessage = data.history[data.history.length - 1];

      if (lastUserMsg.role === "user" && lastAIMessage.role === "assistant") {
        setQuestion(lastUserMsg.parts[0].text);
        setAnswer(lastAIMessage.parts[0].text);
      }
    }
  }, [data]);

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ question, answer }) => {
      if (!session) throw new Error("No active session");
      const token = await session.getToken();

      return fetch(`${import.meta.env.VITE_API_URL}/api/chats/${data._id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question: question.length ? question : undefined,
          answer,
          img: img.dbData?.filePath || undefined,
        }),
      }).then((res) => res.json());
    },
    onSuccess: () => {
      queryClient
        .invalidateQueries({ queryKey: ["chat", data._id] })
        .then(() => {
          formRef.current.reset();
          setQuestion("");
          setAnswer("");
          setImg({
            isLoading: false,
            error: "",
            dbData: {},
            aiData: {},
          });
        });
    },
    onError: (err) => {
      console.error(err);
    },
  });

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

      // Pass final accumulatedText directly to mutation
      mutation.mutate({ question: text, answer: accumulatedText });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = e.target.text.value;
    if (!text) return;
    if (!session) {
      console.error("No active session");
      return;
    }

    add(text, false);
    e.target.reset();
  };
  const hasRun = useRef(false);

  useEffect(() => {
    if (!hasRun.current) {
      if (data?.history?.length === 1) {
        add(data.history[0].parts[0].text, true);
      }
    }
    hasRun.current = true;
  }, []);

  return (
    <>
      {img.isLoading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <div>Loading...</div>
        </div>
      )}
      {img.dbData?.filePath && (
        <IKImage
          urlEndpoint={import.meta.env.VITE_IMAGE_KIT_ENDPOINT}
          path={img.dbData.filePath}
          width="340"
          transformation={[{ width: 340 }]}
        />
      )}
      {question && (
        <div className="message user">
          <Markdown>{question}</Markdown>
        </div>
      )}
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
        <form className="newForm" onSubmit={handleSubmit} ref={formRef}>
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
