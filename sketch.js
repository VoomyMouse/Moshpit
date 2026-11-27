// moshpit settings

const LETTER_SIZE = 1.8;
const LETTER_SPEED = 4;
const LETTER_GAP = 1.2;

const SPIN = 0.12;
const SPIN_DRAG = 0.9;
const MAX_SPIN = 0.12;

const STROBE_BPM = 154;
const STROBE_RATE = 8;

const OVERLAY_ALPHA = 1;


// files

const asset = path => new URL(path, document.baseURI).href;

// background
const BG_PATH = asset("background/4x/bg.jpg");
const OVERLAY_PATH = asset("background/4x/overlay.jpg");

// menu graphics
const INFO_PATH = asset("navigatie/svg/informatie.svg");

const MUSIC_OFF_PATH = asset("navigatie/svg/musicoff.svg");
const MUSIC_ON_PATH = asset("navigatie/svg/musicon.svg");

const STROBE_OFF_PATH = asset("navigatie/svg/strobeoff.svg");
const STROBE_ON_PATH = asset("navigatie/svg/strobeon.svg");

// sound
const MUSIC_URL = asset("sound/hondenfokker-beige.mp3");


// letters

const LETTER_FILES = [
  asset("images/svg/m.svg"),
  asset("images/svg/o.svg"),
  asset("images/svg/s.svg"),
  asset("images/svg/h.svg"),
  asset("images/svg/p.svg"),
  asset("images/svg/i.svg"),
  asset("images/svg/t.svg")
];

const LINKS = [
  "https://en.wikipedia.org/wiki/Graphic_design",
  "https://nl.wikipedia.org/wiki/Yves_Klein",
  "https://nl.wikipedia.org/wiki/Kauw",
  "https://en.wikipedia.org/wiki/Product_design",
  "https://en.wikipedia.org/wiki/Karel_Martens",
  "https://en.wikipedia.org/wiki/Wim_Crouwel",
  "https://en.wikipedia.org/wiki/Dieter_Rams"
];


// settings

let letters = [];
let letterImgs = [];

let bg;
let music;

let infoGraphic;
let musicIcon;
let strobeIcon;

let musicOn = false;
let strobeOn = false;

const baseWidth = 718;
const baseHeight = 824;


// window scaling

function responsiveScale() {
  return min(width / baseWidth, height / baseHeight);
}


// preload

function preload() {
  bg = loadImage(BG_PATH);
  music = loadSound(MUSIC_URL);

  LETTER_FILES.forEach(path => {
    let img = createImg(path, "");
    img.hide();
    letterImgs.push(img);
  });
}


// setup

function setup() {
  pixelDensity(Math.min(window.devicePixelRatio || 1, 3));

  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);

  addLetters();
  addMenu();
  addOverlay();
}


// letter settings

function addLetters() {
  letterImgs.forEach((img, i) => {
    let angle = random(TWO_PI);
    let speed = random(1.5, 3);

    letters.push({
      img,
      x: random(width * 0.2, width * 0.8),
      y: random(height * 0.2, height * 0.8),
      vx: cos(angle) * speed,
      vy: sin(angle) * speed,
      rotation: random(-0.15, 0.15),
      rotationSpeed: 0,
      size: 150,
      radius: 70,
      link: LINKS[i]
    });
  });
}


// menu

function addMenu() {
  infoGraphic = createImg(INFO_PATH, "Information");
  infoGraphic.id("information-graphic");
  infoGraphic.addClass("moshpit-ui-graphic");

  let controls = createDiv();
  controls.id("moshpit-controls");

  strobeIcon = createImg(STROBE_OFF_PATH, "Toggle strobe");
  strobeIcon.id("strobe-icon");
  strobeIcon.addClass("moshpit-ui-graphic");
  strobeIcon.parent(controls);
  strobeIcon.mousePressed(toggleStrobe);

  musicIcon = createImg(MUSIC_OFF_PATH, "Toggle music");
  musicIcon.id("music-icon");
  musicIcon.addClass("moshpit-ui-graphic");
  musicIcon.parent(controls);
  musicIcon.mousePressed(toggleMusic);
}


// overlay

function addOverlay() {
  let overlay = createImg(OVERLAY_PATH, "Overlay");

  overlay.addClass("moshpit-overlay");
  overlay.style("opacity", OVERLAY_ALPHA);
}


// size

function letterSize(img, size) {
  let aspect = img.naturalWidth / img.naturalHeight;

  return aspect > 1
    ? [size, size / aspect]
    : [size * aspect, size];
}


// strobe interval

function draw() {
  let interval = 60000 / STROBE_BPM / (STROBE_RATE / 4);
  let flash = strobeOn && floor(millis() / interval) % 2 === 0;

  drawbackground(flash);

  let scale = responsiveScale();

  for (let l of letters) {
    let radius = l.radius * scale * LETTER_SIZE;
    let size = l.size * scale * LETTER_SIZE;

    l.x += l.vx * scale * LETTER_SPEED;
    l.y += l.vy * scale * LETTER_SPEED;

    l.rotation += l.rotationSpeed;
    l.rotationSpeed *= SPIN_DRAG;

    l.rotationSpeed = constrain(
      l.rotationSpeed,
      -MAX_SPIN,
      MAX_SPIN
    );

    // bounce

    if (l.x < radius || l.x > width - radius) {
      l.vx *= -1;
      l.x = constrain(l.x, radius, width - radius);
    }

    if (l.y < radius || l.y > height - radius) {
      l.vy *= -1;
      l.y = constrain(l.y, radius, height - radius);
    }

    // draw letter

    let img = l.img.elt;

    if (img.complete && img.naturalWidth > 0) {
      let [w, h] = letterSize(img, size);

      push();
      translate(l.x, l.y);
      rotate(l.rotation);

      drawingContext.drawImage(
        img,
        -w / 2,
        -h / 2,
        w,
        h
      );

      pop();
    }
  }

  colLetters(scale);
  colMenu();
}


// letter collision

function colLetters(scale) {
  for (let i = 0; i < letters.length; i++) {
    for (let j = i + 1; j < letters.length; j++) {
      let a = letters[i];
      let b = letters[j];

      let dx = b.x - a.x;
      let dy = b.y - a.y;
      let dist = sqrt(dx * dx + dy * dy);

      let minDist = (a.radius + b.radius) * scale *
        LETTER_SIZE * LETTER_GAP;

      if (dist >= minDist || dist === 0) continue;

      let nx = dx / dist;
      let ny = dy / dist;

      let relVel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;

      if (relVel < 0) {
        a.vx += relVel * nx;
        a.vy += relVel * ny;
        b.vx -= relVel * nx;
        b.vy -= relVel * ny;

        let spin = random() < 0.5 ? -1 : 1;

        a.rotationSpeed += spin * SPIN;
        b.rotationSpeed -= spin * SPIN;

        a.rotationSpeed = constrain(
          a.rotationSpeed,
          -MAX_SPIN,
          MAX_SPIN
        );

        b.rotationSpeed = constrain(
          b.rotationSpeed,
          -MAX_SPIN,
          MAX_SPIN
        );
      }

      let overlap = (minDist - dist) / 2;

      a.x -= nx * overlap;
      a.y -= ny * overlap;
      b.x += nx * overlap;
      b.y += ny * overlap;
    }
  }
}


// menu collision

function colMenu() {
  let items = [infoGraphic, strobeIcon, musicIcon];
  let scale = responsiveScale();

  let canvas = document.querySelector("canvas");
  if (!canvas) return;

  let canvasRect = canvas.getBoundingClientRect();

  for (let item of items) {
    if (!item || !item.elt) continue;

    let rect = item.elt.getBoundingClientRect();
    if (!rect.width || !rect.height) continue;

    let left = rect.left - canvasRect.left;
    let right = rect.right - canvasRect.left;
    let top = rect.top - canvasRect.top;
    let bottom = rect.bottom - canvasRect.top;

    for (let l of letters) {
      let radius = l.radius * scale * LETTER_SIZE;

      let x = constrain(l.x, left, right);
      let y = constrain(l.y, top, bottom);

      let dx = l.x - x;
      let dy = l.y - y;
      let dist = sqrt(dx * dx + dy * dy);

      let nx, ny, overlap;

      if (dist > 0 && dist < radius) {
        nx = dx / dist;
        ny = dy / dist;
        overlap = radius - dist;

      } else if (
        l.x >= left && l.x <= right &&
        l.y >= top && l.y <= bottom
      ) {
        let edges = [
          { d: l.x - left, x: -1, y: 0 },
          { d: right - l.x, x: 1, y: 0 },
          { d: l.y - top, x: 0, y: -1 },
          { d: bottom - l.y, x: 0, y: 1 }
        ];

        edges.sort((a, b) => a.d - b.d);

        nx = edges[0].x;
        ny = edges[0].y;
        overlap = radius + edges[0].d;

      } else {
        continue;
      }

      let vel = l.vx * nx + l.vy * ny;

      if (vel < 0) {
        l.vx -= 2 * vel * nx;
        l.vy -= 2 * vel * ny;

        l.rotationSpeed +=
          (random() < 0.5 ? -1 : 1) * SPIN;

        l.rotationSpeed = constrain(
          l.rotationSpeed,
          -MAX_SPIN,
          MAX_SPIN
        );
      }

      l.x += nx * (overlap + 1);
      l.y += ny * (overlap + 1);
    }
  }
}


// background

function drawbackground(flash) {
  background(0);

  if (!bg) return;

  let scale = max(
    width / bg.width,
    height / bg.height
  );

  drawingContext.filter = flash ? "invert(1)" : "none";

  image(
    bg,
    width / 2,
    height / 2,
    bg.width * scale,
    bg.height * scale
  );

  drawingContext.filter = "none";
}


// sound

function toggleMusic() {
  if (!music) return;

  userStartAudio();

  if (musicOn) {
    music.stop();
    musicOn = false;
    musicIcon.attribute("src", MUSIC_OFF_PATH);

  } else if (music.isLoaded()) {
    music.loop();
    musicOn = true;
    musicIcon.attribute("src", MUSIC_ON_PATH);
  }
}


// strobe

function toggleStrobe() {
  strobeOn = !strobeOn;

  strobeIcon.attribute(
    "src",
    strobeOn ? STROBE_ON_PATH : STROBE_OFF_PATH
  );
}


// link

function mousePressed() {
  let scale = responsiveScale();

  for (let i = letters.length - 1; i >= 0; i--) {
    let l = letters[i];
    let img = l.img.elt;

    if (!img.complete || !img.naturalWidth) continue;

    let dx = mouseX - l.x;
    let dy = mouseY - l.y;

    let x = dx * cos(l.rotation) + dy * sin(l.rotation);
    let y = -dx * sin(l.rotation) + dy * cos(l.rotation);

    let size = l.size * scale * LETTER_SIZE;
    let [w, h] = letterSize(img, size);

    if (abs(x) < w / 2 && abs(y) < h / 2) {
      window.top.location.href = l.link;
      return false;
    }
  }
}


// responsive window

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  pixelDensity(Math.min(window.devicePixelRatio || 1, 3));
}
