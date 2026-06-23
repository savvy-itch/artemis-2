import { INPUT_DATA } from "./out.js";

const canvas = document.getElementById("space");
const ctx = canvas.getContext("2d");
const earthPosX = 50;
const earthPosY = canvas.height / 2;
const distanceScale = 400;
const velocitySpeedCoefficient = 2000;
const earthMoonDistance = canvas.width - 50;
const earthRadius = 6378.137 / distanceScale;
const moonRadius = 1737.4 / distanceScale;
const trajectoryRadius = earthRadius + 15;
const moonTrajectoryRadius = moonRadius + 15;
const segDist = [];
const scaledData = [];

let curIdx = 1;
let passedDistance = 0;
let lastSegIdx = 0;

function drawBody(radius, color, posX, posY) {
  ctx.beginPath();
  ctx.arc(posX, posY, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.closePath();
}

function drawTrajectory(lastSegIdx, newX, newY) {
  ctx.beginPath();
  ctx.moveTo(scaledData[0].rx, scaledData[0].ry);
  ctx.strokeStyle = "yellow";
  ctx.lineWidth = 2;

  for (let i = 1; i <= lastSegIdx; i++) {
    ctx.lineTo(scaledData[i].rx, scaledData[i].ry);
  }

  ctx.lineTo(newX, newY);
  ctx.stroke();

  for (let i = 0; i <= lastSegIdx; i++) {
    // phase points
    // ctx.fillStyle = "red";
    // ctx.beginPath();
    // ctx.arc(trajectory[i].x, trajectory[i].y, 5, 0, 2 * Math.PI);
    // ctx.arc(scaledData[i].rx, scaledData[i].ry, 5, 0, 2 * Math.PI);
    // ctx.fill();

    // phase number
    // ctx.fillStyle = "white";
    // ctx.font = "10px monospace";
    // ctx.fillText(`${i + 1}`, trajectory[i].x - 15, trajectory[i].y - 10);
    // ctx.fillText(`${i + 1}`, scaledData[i].rx - 15, scaledData[i].ry - 10);
    curIdx++;
  }
}

function getNewCoordinates(passedDistance) {
  // determine the current segment based on distance
  while (segDist[lastSegIdx] < passedDistance && lastSegIdx < segDist.length) {
    lastSegIdx++;
  }
  const p1 = scaledData[lastSegIdx];
  if (!p1) {
    console.error("p1 is undefined");
    return;
  }
  
  const p2 = scaledData[lastSegIdx + 1];
  console.log({ p1x: p1.rx, p1y: p1.ry });
  console.log({ p2x: p2.rx, p2y: p2.ry });
  
  if (!p2) {
    console.error("p2 is undefined");
    return;
  }

  // calculate percentage of the current segment to travel to
  const t = lastSegIdx > 0
    ? (passedDistance - segDist[lastSegIdx - 1]) / (segDist[lastSegIdx] - segDist[lastSegIdx - 1])
    : passedDistance / segDist[lastSegIdx];
  console.log({ lastSegIdx, t });

  // interpolate the coordinates
  const newX = (1 - t) * p1.rx + t * p2.rx;
  const newY = (1 - t) * p1.ry + t * p2.ry;
  const totalVel = Math.sqrt(Math.pow(scaledData[lastSegIdx].vx, 2) + Math.pow(scaledData[lastSegIdx].vy, 2));
  // const dummyVel = 10;

  return { newX, newY, totalVel };
}

function drawSpacecraft(newX, newY, totalVel) {
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(newX, newY, 7, 0, 2 * Math.PI);
  ctx.fill();
  passedDistance += totalVel;
  console.log("----------");
  console.log({ passedDistance });
}

function draw(earthRadius, earthPosX, earthPosY, moonRadius, earthMoonDistance) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // ctx.beginPath();
  // ctx.moveTo(scaledData[0].rx, scaledData[0].ry);
  drawBody(earthRadius, "#0095DD", earthPosX, earthPosY);
  drawBody(moonRadius, "hsl(215, 7%, 54%)", earthMoonDistance, earthPosY);

  const { newX, newY, totalVel } = getNewCoordinates(passedDistance);
  console.log({ newX, newY, totalVel });
  drawTrajectory(lastSegIdx, newX, newY);
  drawSpacecraft(newX, newY, totalVel);

  if (passedDistance < segDist[segDist.length - 1]) {
    requestAnimationFrame(() => draw(earthRadius, earthPosX, earthPosY, moonRadius, earthMoonDistance));
  }
}

function calcSegmentDistance(p1x, p1y, p2x, p2y, prevDistance) {
  const segmentLen = Math.sqrt(Math.pow((p2x - p1x), 2) + Math.pow((p2y - p1y), 2));
  return segmentLen + prevDistance;
}

function scaleCoordinates(distanceScale, data, earthPosX, earthPosY) {
  for (let i = 0; i < data.length; i++) {
    scaledData[i] = {...data[i], 
      rx: earthPosX - (data[i].rx / distanceScale), 
      ry: earthPosY + (data[i].ry / distanceScale),
      vx: data[i].vx / distanceScale * velocitySpeedCoefficient,
      vy: data[i].vy / distanceScale * velocitySpeedCoefficient,
    };
  }
}

function getAllSegmentsDistances(data) {
  for (let i = 0; i < data.length - 1; i++) {
    if (i === 0) {
      segDist[i] = calcSegmentDistance(data[i].rx, data[i].ry, data[i + 1].rx, data[i + 1].ry, 0);
    } else {
      segDist[i] = calcSegmentDistance(data[i].rx, data[i].ry, data[i + 1].rx, data[i + 1].ry, segDist[i - 1]);
    }
  }

  // for (let i = 0; i < segDist.length; i++) {
  //   console.log(segDist[i]);
  // }
}

scaleCoordinates(distanceScale, INPUT_DATA, earthPosX, earthPosY);
getAllSegmentsDistances(scaledData);
draw(earthRadius, earthPosX, earthPosY, moonRadius, earthMoonDistance);
