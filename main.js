import { INPUT_DATA } from "./out.js";

const canvas = document.getElementById("space");
const topCanvas = document.getElementById("top");
const ctx = canvas.getContext("2d");
const topCtx = topCanvas.getContext("2d");
const earthPosX = 50;
const earthPosY = canvas.height / 2 + 200;
const distanceScale = 300;
const playbackSpeed = 40000;
const earthMoonDistance = 384400; // km
const earthRadius = 6378.137; // km
const moonRadius = 1737.4; // km
const moonOrbitalLinearSpeed = 1.022; // km/s
const moonAngularVelocity = moonOrbitalLinearSpeed / earthMoonDistance; // rad/s
const scaledData = [];
const colors = ["hsl(120, 55%, 52%)", "orange", "cornflowerblue"];
const phases = [
  { timestamp: 0, phase: "Launch" },
  { timestamp: 8, phase: "Jettison SRB, fairings, and LAS" },
  { timestamp: 9, phase: "Core stage MECO" },
  { timestamp: 49, phase: "Perigee raise maneuver" },
  { timestamp: 107, phase: "Apogee raise burn" },
  { timestamp: 204, phase: "Orion separation" },
  { timestamp: 673, phase: "Orion USS burn" },
  { timestamp: 1171, phase: "Perigee raise burn" },
  { timestamp: 1512, phase: "TLI" },
  { timestamp: 1727, phase: "Outbound transit to Moon" },
  { timestamp: 7000, phase: "Lunar flyby" },
  { timestamp: 7656, phase: "Trans-Earth return" },
  { timestamp: 12774, phase: "Crew module separation" },
  { timestamp: 12945, phase: "Entry & Splashdown" },
]; // timestamps from INPUT_DATA

let totalMissionTime = 0; // min
let lastFrameTime = null; // ms
let moonPosX = earthMoonDistance / distanceScale;
let moonPosY = earthPosY;

function drawBody(radius, color, posX, posY) {
  ctx.beginPath();
  ctx.arc(posX, posY, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.closePath();
}

// approximate angle to match spacecraft trajectory
const startAngle = 41 * Math.PI / 180;

function drawMoon(radius, color, totalMissionTime) {
  ctx.beginPath();
  ctx.strokeStyle = "red";
  ctx.lineWidth = 1;
  // theta = v*t/r
  const endAngle = startAngle - (moonAngularVelocity * totalMissionTime * 60); // rad
  ctx.arc(earthPosX, earthPosY, earthMoonDistance / distanceScale, startAngle, endAngle, true);
  const newX = earthPosX + (earthMoonDistance / distanceScale) * Math.cos(endAngle);
  const newY = earthPosY + (earthMoonDistance / distanceScale) * Math.sin(endAngle);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(newX, newY, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

let curGlobalPhase = 0;
function drawTrajectory(idx, newX, newY) {
  let color = 0;
  let curPhase = 0;

  drawPhasePoint(curPhase, colors[color], scaledData[0].rx, scaledData[0].ry);
  if (curGlobalPhase === curPhase) {
    drawPhaseName(curGlobalPhase);
    curGlobalPhase++;
  }
  curPhase++;

  ctx.beginPath();
  ctx.moveTo(scaledData[0].rx, scaledData[0].ry);
  ctx.lineWidth = 2;
  ctx.strokeStyle = colors[color];

  for (let i = 1; i <= idx; i++) {
    ctx.lineTo(scaledData[i].rx, scaledData[i].ry);

    if (scaledData[i].time >= 7000 && color === 0) {
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(scaledData[i].rx, scaledData[i].ry);
      color = 2;
      ctx.strokeStyle = colors[color];
    } else if (scaledData[i].time >= 450 && color === 1) {
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(scaledData[i].rx, scaledData[i].ry);
      color = 0;
      ctx.strokeStyle = colors[color];
    } else if (scaledData[i].time >= 204 && scaledData[i].time < 450 && color === 0) {
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(scaledData[i].rx, scaledData[i].ry);
      color = 1;
      ctx.strokeStyle = colors[color];
    }

    if (curPhase < phases.length && scaledData[i].time === phases[curPhase].timestamp) {
      drawPhasePoint(curPhase, colors[color], scaledData[i].rx, scaledData[i].ry);
      if (curGlobalPhase === curPhase) {
        drawPhaseName(curGlobalPhase);
        curGlobalPhase++;
      }
      curPhase++;
    }
  }

  ctx.lineTo(newX, newY);
  ctx.stroke();
}

function drawPhasePoint(curPhase, color, x, y) {
  topCtx.beginPath();
  topCtx.fillStyle = color;
  topCtx.arc(x, y, 10, 0, 2 * Math.PI);
  topCtx.fill();
  topCtx.font = "17px serif";
  topCtx.textAlign = "center";
  topCtx.fillStyle = "white";
  topCtx.fillText(`${curPhase + 1}`, x - 1, y + 5);
}

function drawPhaseName(idx) {
  topCtx.clearRect(0, 0, canvas.width, 120);
  topCtx.fillStyle = "white";
  topCtx.font = "28px monospace";
  topCtx.fillText(`${phases[idx].phase}`, canvas.width / 2, 50);
}

let lastIdx;
let lastX;
let lastY;

function getNewCoordinates(totalMissionTime) {
  const idx = scaledData.findIndex(p => p.time > totalMissionTime);

  if (idx === -1) return null;
  lastIdx = idx;

  const p1 = scaledData[idx - 1];
  if (!p1) {
    console.error("p1 is undefined");
    return;
  }

  const p2 = scaledData[idx];
  if (!p2) {
    console.error("p2 is undefined");
    return;
  }

  // calculate percentage of the current segment to travel to
  const t = (totalMissionTime - p1.time) / (p2.time - p1.time);

  // interpolate the coordinates
  const newX = (1 - t) * p1.rx + t * p2.rx;
  const newY = (1 - t) * p1.ry + t * p2.ry;
  lastX = newX;
  lastY = newY;

  return { newX, newY, idx };
}

function drawSpacecraft(newX, newY) {
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(newX, newY, 7, 0, 2 * Math.PI);
  ctx.fill();
}

function displayMetrics(missionTime, vx, vy) {
  ctx.fillStyle = "white";
  ctx.font = "20px monospace";
  let t;
  if (missionTime > 1440) {
    const days = Math.floor(missionTime / 60 / 24);
    const hours = Math.floor((missionTime / 60) % 24);
    t = `${days} days ${hours} hours`;
  } else {
    const hours = Math.round(missionTime / 60);
    t = hours < 9 ? `0${hours} hours` : `${hours} hours`;
  }
  ctx.fillText(`Mission time: ${t}`, 20, 30);
  ctx.fillText(`Velocity: ${Math.sqrt(Math.pow(vx, 2) + Math.pow(vy, 2)).toFixed(1)} km/s`, 20, 60);
}

function displayData() {
  ctx.fillStyle = "white";
  ctx.font = "20px monospace";
  ctx.fillText(`Scale: 1:${distanceScale}`, 20, 90);
}

function draw(frameTime, earthRadius, earthPosX, earthPosY, moonRadius) {
  if (lastFrameTime === null) {
    lastFrameTime = frameTime;
  }

  const realDelta = frameTime - lastFrameTime; // ms
  totalMissionTime += (realDelta / 60000) * playbackSpeed; // min
  lastFrameTime = frameTime;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBody(earthRadius / distanceScale, "#0095DD", earthPosX, earthPosY);
  drawMoon(moonRadius / distanceScale, "hsl(215, 7%, 54%)", totalMissionTime);

  const coordinates = getNewCoordinates(totalMissionTime);
  if (coordinates) {
    const { newX, newY, idx } = coordinates;
    drawTrajectory(idx, newX, newY);
    drawSpacecraft(newX, newY);
    displayMetrics(scaledData[idx].time, scaledData[idx].vx, scaledData[idx].vy);
  } else {
    drawTrajectory(lastIdx, lastX, lastY);
    drawSpacecraft(lastX, lastY);
    displayMetrics(scaledData[lastIdx].time, scaledData[lastIdx].vx, scaledData[lastIdx].vy);
  }

  if (totalMissionTime <= scaledData[scaledData.length - 1].time) {
    requestAnimationFrame((t) => draw(t, earthRadius, earthPosX, earthPosY, moonRadius));
  } else {
    if (lastIdx < scaledData.length - 1) {
      requestAnimationFrame((t) => drawFinalFrame(t, earthRadius, earthPosX, earthPosY, moonRadius));
    }
  }
}

function scaleCoordinates(distanceScale, data, earthPosX, earthPosY) {
  for (let i = 0; i < data.length; i++) {
    scaledData[i] = {
      ...data[i],
      time: Math.trunc(data[i].time),
      rx: earthPosX - (data[i].rx / distanceScale),
      ry: earthPosY + (data[i].ry / distanceScale),
    };
  }
}

/*
 * Manually renders the last timestamp of input data because of high playback speed of the animation, some timestamps may be skipped, resulting in an incomplete animation.
*/
function drawFinalFrame(frameTime, earthRadius, earthPosX, earthPosY, moonRadius) {
  const realDelta = frameTime - lastFrameTime; // ms
  totalMissionTime += (realDelta / 60000) * playbackSpeed; // min
  lastFrameTime = frameTime;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBody(earthRadius / distanceScale, "#0095DD", earthPosX, earthPosY);
  drawMoon(moonRadius / distanceScale, "hsl(215, 7%, 54%)", totalMissionTime);
  const lastIdx = scaledData.length - 1;
  drawTrajectory(lastIdx, scaledData[lastIdx].rx, scaledData[lastIdx].ry);
  drawSpacecraft(scaledData[lastIdx].rx, scaledData[lastIdx].ry);
  displayMetrics(scaledData[lastIdx].time, scaledData[lastIdx].vx, scaledData[lastIdx].vy);
}

scaleCoordinates(distanceScale, INPUT_DATA, earthPosX, earthPosY);
requestAnimationFrame((t) => draw(t, earthRadius, earthPosX, earthPosY, moonRadius));
