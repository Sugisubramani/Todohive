import React, { useRef, useState } from "react";
import ReactDOM from "react-dom";
import Webcam from "react-webcam";
import "../styles/CameraPage.css";

function CameraPage() {
  const webcamRef = useRef(null);
  const [showFlash, setShowFlash] = useState(false);

  const sendPhoto = () => {
    // flash effect
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 300);

    const dataUrl = webcamRef.current.getScreenshot();
    if (window.opener) {
      window.opener.postMessage(
        { type: "PHOTO", payload: dataUrl },
        window.origin
      );
      window.close();
    } else {
      alert("Open this page from the main form.");
    }
  };

  return (
    <div className="camera-container">
      {showFlash && <div className="flash" />}
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/png"
        videoConstraints={{ facingMode: "environment" }}
        style={{ width: "100vw", height: "100vh", objectFit: "contain" }}
      />
      <div className="shutter-button" onClick={sendPhoto} />
    </div>
  );
}

// Mounting outside main App
const root = document.getElementById("camera-root");
if (root) ReactDOM.render(<CameraPage />, root);

export default CameraPage;
