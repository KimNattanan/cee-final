import { HandLandmarker, FilesetResolver, HandLandmarkerResult, NormalizedLandmark } from "@mediapipe/tasks-vision";

const HANDS_OUTPUT_DIR = '/hand_gesture_detection';
const THRESHOLD_1_HAND = 4.0;
const THRESHOLD_2_HAND = 0.8;

// 1. Load your JSON datasets
export const loadData = async () => {
  const data1Hand = await fetch(`${HANDS_OUTPUT_DIR}/hand1output.json`).then(res => res.json());
  const data2Hand = await fetch(`${HANDS_OUTPUT_DIR}/hand2output.json`).then(res => res.json());
  const data2HandRelate = await fetch(`${HANDS_OUTPUT_DIR}/hand2relateoutput.json`).then(res => res.json());
  return { data1Hand, data2Hand };
}

// 2. Initialize MediaPipe
export const initMediaPipe = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
  );
  const handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
      delegate: "GPU"
    },
    runningMode: "VIDEO",
    numHands: 2
  });
  return handLandmarker;
}

// 3. The Classification & Normalization Logic
function normalizeLandmarks(landmarks: NormalizedLandmark[]) {
  const base = landmarks[0];
  let translated = landmarks.map(lm => ({ x: lm.x - base.x, y: lm.y - base.y, z: lm.z - base.z }));
  const ref = translated[9];
  let scale = Math.sqrt(ref.x**2 + ref.y**2 + ref.z**2) || 1e-6;
  let scaled = translated.map(pt => ({ x: pt.x / scale, y: pt.y / scale, z: pt.z / scale }));
  // const refRot = scaled[5];
  // const angle = Math.atan2(refRot.y, refRot.x);
  // const cosA = Math.cos(-angle), sinA = Math.sin(-angle);
  // return scaled.map(pt => ({
  //   x: pt.x * cosA - pt.y * sinA,
  //   y: pt.x * sinA + pt.y * cosA,
  //   z: pt.z
  // }));
  return scaled
}

function classify(handMode: number, results: HandLandmarkerResult, data1Hand: any[], data2Hand: any[]): string {
  if (!results.landmarks || results.landmarks.length < 1 || (handMode === 2 && results.landmarks.length < 2)) return "searching...";
  
  let record = [];
  if (handMode === 1) {
    record = normalizeLandmarks(results.landmarks[0]).flatMap(lm => [lm.x, lm.y, lm.z]);
    return findNearest(record, data1Hand, THRESHOLD_1_HAND);
  } else if(handMode===2) {
    let left = null, right = null;
    results.handedness.forEach((h, i) => {
      const flat = normalizeLandmarks(results.landmarks[i]).flatMap(lm => [lm.x, lm.y, lm.z]);
      if (h[0].categoryName === "Left") left = flat;
      else right = flat;
    });
    if (left && right) return findNearest([...left, ...right], data2Hand, THRESHOLD_2_HAND);
    return "need both hands";
  } else{
    let left = null, right = null;
    results.handedness.forEach((h, i) => {
      const flat = normalizeLandmarks(results.landmarks[i]).flatMap(lm => [lm.x, lm.y, lm.z]);
      if (h[0].categoryName === "Left") left = flat;
      else right = flat;
    });
    if (left && right) return findNearest([...left, ...right], data2Hand, THRESHOLD_2_HAND);
    return "need both hands";
  }
}

function findNearest(record: number[], dataset: any[], threshold: number): string {
  let nearestDist = threshold;
  let label = "unknown";
  for (const entry of dataset) {
    let dist = 0;
    for (let i = 0; i < entry.coords.length; i++) {
      dist += Math.pow(entry.coords[i] - record[i], 2);
    }
    if (dist < nearestDist) {
      nearestDist = dist;
      label = entry.label;
    }
  }
  return label;
}

export const predictFromVideo = (video: HTMLVideoElement, handLandmarker: HandLandmarker, data1Hand: any[], data2Hand: any[]): string => {
  const results = handLandmarker.detectForVideo(video, performance.now());
  if (results.landmarks) {
    let text = classify(2, results, data1Hand, data2Hand);
    if (text.includes("searching") || text.includes("need")) {
      text = classify(1, results, data1Hand, data2Hand);
    }
    return text;
  }
  return "unknown";
}