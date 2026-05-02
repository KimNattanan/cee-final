import { HandLandmarker, FilesetResolver, HandLandmarkerResult, NormalizedLandmark } from "@mediapipe/tasks-vision";

const HANDS_OUTPUT_DIR = '/hand_gesture_detection';
const THRESHOLD_1_HAND = 4.0;
const THRESHOLD_2_HAND = 8.0;

function apiBase() {
  return (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
}
// 1. Load your JSON datasets
export const loadData = async () => {
  const handData:{
    data:[
      {handmode:number}
    ]
  } = await fetch(`${apiBase()}/hand`).then(res => res.json());
  // const data1Hand = await fetch(`${HANDS_OUTPUT_DIR}/hand1output.json`).then(res => res.json());
  // const data2Hand = await fetch(`${HANDS_OUTPUT_DIR}/hand2output.json`).then(res => res.json());
  // const data2HandRelate = await fetch(`${HANDS_OUTPUT_DIR}/hand2relateoutput.json`).then(res => res.json());
  const data1Hand = handData.data.filter(hand => hand.handmode===1);
  const data2Hand = handData.data.filter(hand => hand.handmode===2);
  const data2HandRelate = handData.data.filter(hand => hand.handmode===3);
  return { data1Hand, data2Hand,data2HandRelate };
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

// def normalize_2hand_landmark(left_hand,right_hand):
//     # 1. Identify Left Wrist (Master Pivot) and Left Knuckle (Master Scale Reference)
//     left_wrist = left_hand[0]
//     left_m_knuckle = left_hand[9]

//     # 2. Calculate the Left Hand Scale
//     dx = left_m_knuckle.x - left_wrist.x
//     dy = left_m_knuckle.y - left_wrist.y
//     dz = left_m_knuckle.z - left_wrist.z
//     master_scale = (dx**2 + dy**2 + dz**2)**0.5

//     # 3. Create a unified normalized list
//     normalized_all = []

//     # Process Left Hand
//     for lm in left_hand:
//         norm_x = (lm.x - left_wrist.x) / master_scale
//         norm_y = (lm.y - left_wrist.y) / master_scale
//         norm_z = (lm.z - left_wrist.z) / master_scale
//         normalized_all.append(norm_x)
//         normalized_all.append(norm_y)
//         normalized_all.append(norm_z)

//     # Process Right Hand
//     for lm in right_hand:
//         norm_x = (lm.x - left_wrist.x) / master_scale
//         norm_y = (lm.y - left_wrist.y) / master_scale
//         norm_z = (lm.z - left_wrist.z) / master_scale
//         normalized_all.append(norm_x)
//         normalized_all.append(norm_y)
//         normalized_all.append(norm_z)
//     return normalized_all

function normalizeLandmarksRelate(left_hand: NormalizedLandmark[],right_hand: NormalizedLandmark[]){
  const left_wrist = left_hand[0]
  let left_m_knuckle = left_hand[9]
  const dx = left_m_knuckle.x - left_wrist.x
  let dy = left_m_knuckle.y - left_wrist.y
  let dz = left_m_knuckle.z - left_wrist.z
  let master_scale = (dx**2 + dy**2 + dz**2)**0.5
  // let normalized_all:NormalizedLandmark[] = [];
  let translated_left = left_hand.map(lm => ({ x: (lm.x - left_wrist.x) / master_scale, y: (lm.y - left_wrist.y) / master_scale, z: (lm.z - left_wrist.z) / master_scale }));
  let translated_right = right_hand.map(lm => ({ x: (lm.x - left_wrist.x) / master_scale, y: (lm.y - left_wrist.y) / master_scale, z: (lm.z - left_wrist.z) / master_scale }));
  return [...translated_left,...translated_right]
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

function classify(handMode: number, results: HandLandmarkerResult, data1Hand: any[], data2Hand: any[],data2HandRelate:any[]): string {
  if (!results.landmarks || results.landmarks.length < 1 || ((handMode === 2 || handMode===3) && results.landmarks.length < 2)) return "searching...";
  
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
    if (left && right) return findNearest([...left, ...right], data2HandRelate, THRESHOLD_2_HAND);
    return "need both hands";
  }
}

function findNearest(record: number[], dataset: any[], threshold: number): string {
  let nearestDist = threshold;
  let label = "unknown";
  for (const entry of dataset) {
    for (const landmark of entry.landmark){
      let dist = 0;
      for (let i = 0; i < landmark.length; i++) {
        dist += Math.pow(landmark[i] - record[i], 2);
      }
      if (dist < nearestDist) {
        nearestDist = dist;
        label = entry.gestureName;
      }
    }
  }
  return label;
}

export const getLandmark =(image:HTMLVideoElement,handLandmarker:HandLandmarker,handMode:number):number[] =>{
  const results = handLandmarker.detectForVideo(image,performance.now());
  if (!results.landmarks || results.landmarks.length < 1 || ((handMode === 2 || handMode===3) && results.landmarks.length < 2)) return [];
  if (handMode === 1) {
    let record = normalizeLandmarks(results.landmarks[0]).flatMap(lm => [lm.x, lm.y, lm.z]).flat();
    return record;
  } else if(handMode===2) {
    let left = null, right = null;
    results.handedness.forEach((h, i) => {
      const flat = normalizeLandmarks(results.landmarks[i]).flatMap(lm => [lm.x, lm.y, lm.z]).flat();
      if (h[0].categoryName === "Left") left = flat;
      else right = flat;
    });
    if (left && right) return [...left, ...right];
  } else{
    let left = null, right = null;
    results.handedness.forEach((h, i) => {
      const flat = normalizeLandmarks(results.landmarks[i]).flatMap(lm => [lm.x, lm.y, lm.z]);
      if (h[0].categoryName === "Left") left = flat;
      else right = flat;
    });
    if (left && right) return [...left, ...right];
  }
  return [];
}

export const predictFromVideo = (video: HTMLVideoElement, handLandmarker: HandLandmarker, data1Hand: any[], data2Hand: any[],data2HandRelate:any[]): string => {
  const results = handLandmarker.detectForVideo(video, performance.now());
  if (results.landmarks) {
    let text = classify(3, results, data1Hand, data2Hand,data2HandRelate);
    if (text.includes("searching") || text.includes("need") || text.includes("unknown")) {
      text = classify(2, results, data2Hand, data2Hand,data2HandRelate);
    }
    if (text.includes("searching") || text.includes("need") || text.includes("unknown")) {
      text = classify(1, results, data1Hand, data2Hand,data2HandRelate);
    }
    return text;
  }
  return "unknown";
}