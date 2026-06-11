import { testData } from "./globals.js";

const canvas = document.getElementById("space");
const ctx = canvas.getContext("2d");
const earthPosX = canvas.width / 2;
const earthPosY = canvas.height / 2 + 250;
const earthMoonDistance = earthPosY - 550;
const earthRadius = 63.78137;
const moonRadius = 17.374;
const trajectoryRadius = earthRadius + 15;
const moonTrajectoryRadius = moonRadius + 15;
const k = 0.5522;
const velocity = 5;
const segDist = [];
const scaledData = [];
const distanceScale = 100;

const trajectory = [
  // around Earth
  { x: earthPosX, y: earthPosY - trajectoryRadius },
  { x: earthPosX - trajectoryRadius, y: earthPosY },
  { x: earthPosX, y: earthPosY + trajectoryRadius },
  { x: earthPosX + trajectoryRadius, y: earthPosY },
  // around Moon
  { x: earthPosX - moonTrajectoryRadius, y: earthMoonDistance },
  { x: earthPosX, y: earthMoonDistance - moonTrajectoryRadius },
  { x: earthPosX + moonTrajectoryRadius, y: earthMoonDistance },
  // back to Earth
  { x: earthPosX, y: earthPosY },
];

// moon-earth distance = 384,400 km
// Earth Radius = 6378.137 km
// Moon Radius = 1737.4 km
// 3689,773564	4222,72217	3028,891599 Rx(km)[J2000-EARTH]

const dummyData = [
  // around Earth
  { elapsedTime: 5, x: earthPosX, y: earthPosY - trajectoryRadius, vx: 2, vy: 2 },
  { elapsedTime: 5, x: earthPosX - trajectoryRadius, y: earthPosY, vx: 2, vy: 2 },
  { elapsedTime: 5, x: earthPosX, y: earthPosY + trajectoryRadius, vx: 3, vy: 3 },
  { elapsedTime: 5, x: earthPosX + trajectoryRadius, y: earthPosY, vx: 3, vy: 3 },
  // around Moon
  { elapsedTime: 5, x: earthPosX - moonTrajectoryRadius, y: earthMoonDistance, vx: 3, vy: 3 },
  { elapsedTime: 5, x: earthPosX, y: earthMoonDistance - moonTrajectoryRadius, vx: 2, vy: 2 },
  { elapsedTime: 5, x: earthPosX + moonTrajectoryRadius, y: earthMoonDistance, vx: 2, vy: 2 },
  // back to Earth
  { elapsedTime: 5, x: earthPosX, y: earthPosY, vx: 2, vy: 2 },
];

const trajectoryCtrlPts = [
  {
    cp1x: trajectory[0].x - k * trajectoryRadius,
    cp1y: trajectory[0].y,
    cp2x: trajectory[1].x,
    cp2y: trajectory[1].y - k * trajectoryRadius
  },
  {
    cp1x: trajectory[1].x,
    cp1y: trajectory[1].y + k * trajectoryRadius,
    cp2x: trajectory[2].x - k * trajectoryRadius,
    cp2y: trajectory[2].y
  },
  {
    cp1x: trajectory[2].x + k * trajectoryRadius,
    cp1y: trajectory[2].y,
    cp2x: trajectory[3].x,
    cp2y: trajectory[3].y + k * trajectoryRadius
  },

  {
    cp1x: trajectory[3].x,
    cp1y: trajectory[3].y,
    cp2x: trajectory[4].x,
    cp2y: trajectory[4].y
  },
  {
    cp1x: trajectory[4].x,
    cp1y: trajectory[4].y - k * moonTrajectoryRadius,
    cp2x: trajectory[5].x - k * moonTrajectoryRadius,
    cp2y: trajectory[5].y
  },
  {
    cp1x: trajectory[5].x + k * moonTrajectoryRadius,
    cp1y: trajectory[5].y,
    cp2x: trajectory[6].x,
    cp2y: trajectory[6].y - k * moonTrajectoryRadius
  },

  {
    cp1x: trajectory[6].x,
    cp1y: trajectory[6].y,
    cp2x: trajectory[7].x,
    cp2y: trajectory[7].y
  },
];

let x = 50;
let y = canvas.height / 2;
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

function drawStaticTrajectory() {
  ctx.beginPath();
  ctx.moveTo(trajectory[0].x, trajectory[0].y);

  for (let i = 1; i < trajectory.length; i++) {
    ctx.lineTo(trajectory[i].x, trajectory[i].y);
    ctx.strokeStyle = "yellow";
    ctx.lineWidth = 5;
    ctx.stroke();
  }

  // Stage points
  for (let i = 0; i < trajectory.length; i++) {
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(trajectory[i].x, trajectory[i].y, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.font = "20px monospace"
    ctx.fillText(`${i + 1}`, trajectory[i].x - 15, trajectory[i].y - 10);
  }
}

function drawTrajectory(lastSegIdx, newX, newY) {
  ctx.beginPath();
  // ctx.moveTo(trajectory[0].x, trajectory[0].y);
  ctx.moveTo(scaledData[0].rx, scaledData[0].ry);
  ctx.strokeStyle = "yellow";
  ctx.lineWidth = 5;


  for (let i = 0; i <= lastSegIdx; i++) {
    // ctx.lineTo(trajectory[i].x, trajectory[i].y);
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
  // const p1 = trajectory[lastSegIdx];
  const p1 = scaledData[lastSegIdx];
  if (!p1) {
    console.error("p1 is undefined");
    return;
  }
  
  // const p2 = trajectory[lastSegIdx + 1];
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
  // const totalVel = Math.sqrt(Math.pow(dummyData[lastSegIdx].vx, 2) * Math.pow(dummyData[lastSegIdx].vx, 2));
  const totalVel = Math.sqrt(Math.pow(scaledData[lastSegIdx].vx / distanceScale, 2) * Math.pow(scaledData[lastSegIdx].vy / distanceScale, 2));

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
  ctx.beginPath();
  // ctx.moveTo(trajectory[0].x, trajectory[0].y);
  ctx.moveTo(scaledData[0].rx, scaledData[0].ry);
  drawBody(earthRadius, "#0095DD", earthPosX, earthPosY);
  drawBody(moonRadius, "hsl(215, 7%, 54%)", earthPosX, earthMoonDistance);

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
      rx: earthPosX + (data[i].rx / distanceScale), 
      ry: earthPosY + (data[i].ry / distanceScale),
      vx: 100,
      vy: 100
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

scaleCoordinates(distanceScale, testData, earthPosX, earthPosY);
getAllSegmentsDistances(scaledData);
draw(earthRadius, earthPosX, earthPosY, moonRadius, earthMoonDistance);
