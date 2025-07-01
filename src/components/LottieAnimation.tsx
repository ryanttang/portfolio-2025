import Player from "lottie-react";
import animationData from "./sample-lottie.json";

export default function LottieAnimation() {
  return <Player autoplay loop animationData={animationData} style={{ height: 256, width: 256 }} />;
} 