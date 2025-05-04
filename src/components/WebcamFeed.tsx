import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
const modelsPath = `${process.env.PUBLIC_URL || "/facial-rec-app"}/models`;

export default function WebcamFeed() {
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Load the face detection model when the component mounts
    const loadModels = async () => {
      
      await faceapi.nets.tinyFaceDetector.loadFromUri(modelsPath);
      await faceapi.nets.faceLandmark68Net.loadFromUri(modelsPath);
      await faceapi.nets.faceExpressionNet.loadFromUri(modelsPath);
      await faceapi.nets.ageGenderNet.loadFromUri(modelsPath);
      console.log("Face detection model loaded.");
    };

    loadModels();
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;

    const detectFaces = async () => {
      if (
        isWebcamActive &&
        webcamRef.current &&
        webcamRef.current.video &&
        canvasRef.current
      ) {
        const video = webcamRef.current.video as HTMLVideoElement;
        const canvas = canvasRef.current;
        if (video.readyState === 4) {
          // Ensure the video is ready
          const detections = await faceapi
            .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions()
            .withAgeAndGender();
          //clear the canvas
          canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
          faceapi.draw.drawDetections(canvas, detections);
          faceapi.draw.drawFaceLandmarks(canvas, detections);
          faceapi.draw.drawFaceExpressions(canvas, detections);
          detections.forEach(result => {
            const { age, gender, genderProbability } = result;
            new faceapi.draw.DrawTextField(
              [
                `${faceapi.utils.round(age, 0)} years`,
                `${gender} (${faceapi.utils.round(genderProbability)})`,
              ],
              result.detection.box.bottomRight
            ).draw(canvas);
          });
        } else {
          console.log("Video not ready for face detection.");
        }
      }
    };

    if (isWebcamActive) {
      intervalId = setInterval(detectFaces, 100); // Run detection every 100ms
    } else {
      clearInterval(intervalId);
    }

    return () => clearInterval(intervalId);
  }, [isWebcamActive]);

  const toggleWebcam = () => {
    setIsWebcamActive(prevState => !prevState);
  };

  return (
    <div className="webcam-container" style={{ textAlign: "center" }}>
      <h1>Webcam Feed</h1>
      {isWebcamActive && (
        <div style={{ position: "relative", display: "inline-block" }}>
          <Webcam
            audio={false}
            ref={webcamRef}
            videoConstraints={{
              width: 640,
              height: 480,
              facingMode: "user",
            }}
            style={{
              width: "640px",
              height: "480px",
              border: "1px solid #ccc",
              borderRadius: "8px",
            }}
          />
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              pointerEvents: "none",
            }}
          />
        </div>
      )}
      <button
        onClick={toggleWebcam}
        style={{
          marginTop: "10px",
          padding: "10px 20px",
          backgroundColor: isWebcamActive ? "#f44336" : "#4CAF50",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        {isWebcamActive ? "Stop Webcam" : "Start Webcam"}
      </button>
    </div>
  );
}
