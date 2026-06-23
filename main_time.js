import { INPUT_DATA } from "./out.js";

const canvas = document.getElementById("space");
const ctx = canvas.getContext("2d");
const earthPosX = 50;
const earthPosY = canvas.height / 2 + 130;
const distanceScale = 330;
const playbackSpeed = 2;
const earthMoonDistance = 384400 / distanceScale; // km
const earthRadius = 6378.137 / distanceScale; // km
const moonRadius = 1737.4 / distanceScale; // km
const moonOrbitalLinearSpeed = 1022 / distanceScale; // km/s
const moonAngularVelocity = moonOrbitalLinearSpeed / earthMoonDistance; // rad/s
const scaledData = [];
const moonOrbit = [];
const colors = ["lightgreen", "orange", "cornflowerblue"];

let totalMissionTime = 0; // ms
let lastFrameTime = null; // ms
let moonPosX = earthMoonDistance;
let moonPosY = earthPosY;

function drawBody(radius, color, posX, posY) {
  ctx.beginPath();
  ctx.arc(posX, posY, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.closePath();
}

const startAngle = -3;
let lastAngle = 0;

function drawMoon(radius, color, totalMissionTime) {
  ctx.beginPath();
  ctx.strokeStyle = "red";
  ctx.lineWidth = 1;
  // km/s / 1000 * ms / km
  // theta = v*t/r
  const endAngle = 2*Math.PI - (moonAngularVelocity / 1000 * playbackSpeed * totalMissionTime); // rad
  // const endAngle = Math.PI + (moonAngularVelocity * playbackSpeed * totalMissionTime) / 2; // rad
  ctx.arc(earthPosX, earthPosY, earthMoonDistance, startAngle, endAngle, true);
  const newX = earthPosX + earthMoonDistance * Math.cos(endAngle);
  const newY = earthPosY + earthMoonDistance * Math.sin(endAngle);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(newX, newY, moonRadius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawTrajectory(idx, newX, newY, totalMissionTime) {
  ctx.beginPath();
  ctx.moveTo(scaledData[0].rx, scaledData[0].ry);
  ctx.lineWidth = 2;
  let phase = 0;
  ctx.strokeStyle = colors[phase];
  
  for (let i = 1; i <= idx; i++) {
    ctx.lineTo(scaledData[i].rx, scaledData[i].ry);
    if (scaledData[i].time >= 7000 && phase === 0) {
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(scaledData[i].rx, scaledData[i].ry);
      phase = 2;
      ctx.strokeStyle = colors[phase];
    } else if (scaledData[i].time >= 450 && phase === 1) {
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(scaledData[i].rx, scaledData[i].ry);
      phase = 0;
      ctx.strokeStyle = colors[phase];
    } else if (scaledData[i].time >= 150 && scaledData[i].time < 450 && phase === 0) {
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(scaledData[i].rx, scaledData[i].ry);
      phase = 1;
      ctx.strokeStyle = colors[phase];
    }
  }

  ctx.lineTo(newX, newY);
  ctx.stroke();
}

let lastIdx;
let lastX;
let lastY;

function getNewCoordinates(totalMissionTime) {
  const idx = scaledData.findIndex(p => p.time > totalMissionTime);

  if (idx === -1) return null;
  lastIdx = idx;

  const p1 = scaledData[idx-1];
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
  ctx.arc(newX, newY, 6, 0, 2 * Math.PI);
  ctx.fill();
}

function displayElapsedTime(mission_time) {
  ctx.fillStyle = "white";
  ctx.font = "20px monospace";
  let t;
  if (mission_time > 1440) {
    const days = Math.floor(mission_time / 60 / 24);
    const hours = Math.floor((mission_time / 60) % 24);
    t = `${days} days ${hours} hours`;
  } else {
    const hours = Math.round(mission_time / 60);
    t = hours < 9 ? `0${hours} hours` : `${hours} hours`;
  }
  ctx.fillText(`Mission time: ${t}`, 20, 30);
}

function displayData() {
  ctx.fillStyle = "white";
  ctx.font = "20px monospace";
  ctx.fillText(`Scale: 1:${distanceScale}`, 20, 60);
}

function draw(frameTime, earthRadius, earthPosX, earthPosY, moonRadius, earthMoonDistance) {
  if (lastFrameTime === null) {
    lastFrameTime = frameTime;
  }

  const realDelta = frameTime - lastFrameTime; // ms
  totalMissionTime += realDelta * playbackSpeed;
  lastFrameTime = frameTime;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBody(earthRadius, "#0095DD", earthPosX, earthPosY);
  drawMoon(moonRadius, "hsl(215, 7%, 54%)", totalMissionTime);

  const coordinates = getNewCoordinates(totalMissionTime);
  if (coordinates) {
    const { newX, newY, idx } = coordinates;
    drawTrajectory(idx, newX, newY, totalMissionTime);
    drawSpacecraft(newX, newY);
    displayElapsedTime(scaledData[idx].time);
  } else {
    drawTrajectory(lastIdx, lastX, lastY, totalMissionTime);
    drawSpacecraft(lastX, lastY);
    displayElapsedTime(scaledData[lastIdx].time);
  }
  displayData();

  if (totalMissionTime < scaledData[scaledData.length - 1].time) {
    requestAnimationFrame((t) => draw(t, earthRadius, earthPosX, earthPosY, moonRadius, earthMoonDistance));
  }
}

function scaleCoordinates(distanceScale, data, earthPosX, earthPosY) {
  for (let i = 0; i < data.length; i++) {
    scaledData[i] = {...data[i], 
      rx: earthPosX - (data[i].rx / distanceScale), 
      ry: earthPosY + (data[i].ry / distanceScale),
    };
  }
}

scaleCoordinates(distanceScale, INPUT_DATA, earthPosX, earthPosY);
requestAnimationFrame((t) => draw(t, earthRadius, earthPosX, earthPosY, moonRadius, earthMoonDistance));
