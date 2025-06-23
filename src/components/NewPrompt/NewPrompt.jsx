import React from "react";
import "./NewPrompt.css";
import { useRef, useEffect } from "react";
import Upload from "../Upload/Upload";
import { useState } from "react";
import { IKImage } from "imagekitio-react";

const NewPrompt = () => {
  const endRef = useRef(null);
  const [img, setImg] = useState({
    isLoading: false,
    error: "",
    dbData: {},
  });

  useEffect(() => {
    endRef.current.scrollIntoView({ behavior: "smooth" });
  }, []);
  return (
    <>
      {img.isLoading && <div>Loading!</div>}
      {img.dbData?.filePath && (
        <IKImage
          urlEndpoint={import.meta.env.VITE_IMAGE_KIT_ENDPOINT}
          path={img.dbData?.filePath}
          width="340"
          transformation={[{ width: 340 }]}
        />
      )}
      <div className="endChat" ref={endRef}></div>
      <div className="newPrompt">
        <form className="newForm">
          <Upload setImg={setImg} />
          <input type="file" id="file" multiple={false} hidden />
          <input type="text" placeholder="What's Popping!" />
          <button>
            <img src="/arrow.png" alt="" />
          </button>
        </form>
      </div>
    </>
  );
};

export default NewPrompt;
