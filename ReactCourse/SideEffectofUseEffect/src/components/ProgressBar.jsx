import { useState, useEffect } from "react";
export default function ProgressBar({ timer }) {
  const [remainingTime, setRemaingTime] = useState(timer);
  useEffect(() => {
    const timer = setInterval(() => {
      console.log("inteval");
      setRemaingTime((prevTime) => prevTime - 10);
    }, 10);
    return () => {
      clearInterval(timer);
    };
  });
  return <progress value={remainingTime} max={timer} />;
}
