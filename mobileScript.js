const canvas = document.getElementById('canvas1');
document.addEventListener('contextmenu', (event) => event.preventDefault());
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const collisionCanvas = document.getElementById(`collisionCanvas`);
const collisionCtx = collisionCanvas.getContext('2d');
collisionCanvas.width = window.innerWidth;
collisionCanvas.height = window.innerHeight;
let ravens = [];
let timeToNextRaven = 0;
let ravenInterval = 500;
let lastTime = 0;
let score = 0;
let gameOver = false;
let numberOfEnemies = 6;
class Raven {
  constructor() {
    this.spriteWidth = 271;
    this.spriteHeight = 194;
    this.sizeModifier = Math.random() * 0.6 + 0.4;
    this.width = this.spriteWidth * this.sizeModifier;
    this.height = this.spriteHeight * this.sizeModifier;
    this.x = canvas.width;
    this.y = Math.random() * (canvas.height - this.height);
    this.directionX = Math.random() * 5 + 3;
    this.directionY = Math.random() * 5 - 2.5;
    this.markedForDeletion = false;
    this.image = new Image();
    this.image.src = 'ravenMobile.png';
    this.frame = 0;
    this.maxFrame = 4;
    this.timeSinceFlap = 0;
    this.flapInterval = Math.random() * 50 + 50;
    this.randomColors = [
      Math.floor(Math.random() * 255),
      Math.floor(Math.random() * 255),
      Math.floor(Math.random() * 255),
    ];
    this.color =
      `rgb(` +
      this.randomColors[0] +
      `,` +
      this.randomColors[1] +
      `,` +
      this.randomColors[2] +
      `)`;
    this.speed = Math.floor(Math.random() * 1.6 + 1.2);
  }
  update(deltaTime) {
    this.x -= this.directionX * this.speed;
    this.y += this.directionY * this.speed;
    if (this.y < 0 || this.y > canvas.height - this.height) {
      this.directionY = this.directionY * -1;
    }
    if (this.x < 0 - this.width) this.markedForDeletion = true;
    this.timeSinceFlap += deltaTime;
    if (this.timeSinceFlap > this.flapInterval) {
      if (this.frame > this.maxFrame) this.frame = 0;
      else this.frame++;
      this.timeSinceFlap = 0;
    }
    if (this.x < 0 - this.width) gameOver = true;
  }
  draw() {
    collisionCtx.fillStyle = this.color;
    collisionCtx.fillRect(
      this.x + 15,
      this.y + 15,
      this.width + 7.5,
      this.height + 7.5
    );
    ctx.drawImage(
      this.image,
      this.frame * this.spriteWidth,
      0,
      this.spriteWidth,
      this.spriteHeight,
      this.x,
      this.y,
      this.width,
      this.height
    );
  }
}

function drawGameOver() {
  ctx.font = `2.5rem impact`;
  ctx.textAlign = `center`;
  ctx.fillStyle = `white`;
  ctx.fillText(`Iiih tu perdeu!`, canvas.width * 0.5, canvas.height * 0.5);
  ctx.fillText(
    'Tua pontuação foi: ',
    canvas.width * 0.5,
    canvas.height * 0.5 + 50
  );
  ctx.fillText(score, canvas.width * 0.5, canvas.height * 0.5 + 125);
  ctx.fillText(
    'Tente novamente',
    canvas.width * 0.5,
    canvas.height * 0.5 + 175
  );
}
function restartGame() {
  ravens = [];
  score = 0;
  gameOver = false;
  animate(0);
}
function drawScore() {
  ctx.font = `2.5rem impact`;
  ctx.fillStyle = `white`;
  ctx.fillText(`Score:` + score, 0, 35);
}
let explosions = [];
class Explosions {
  constructor(x, y, size) {
    this.image = new Image();
    this.image.src = `boomMobile.png`;
    this.spriteWidth = 200;
    this.spriteHeight = 179;
    this.size = size;
    this.x = x;
    this.y = y;
    this.frame = 0;
    this.sound = new Audio();
    this.sound.src = `boomMobile.wav`;
    this.timeSinceLastFrame = 0;
    this.frameInterval = 8;
    this.markedForDeletion = false;
  }
  update(deltaTime) {
    if (this.frame === 0) this.sound.play();
    this.timeSinceLastFrame += deltaTime;
    if (this.timeSinceLastFrame > this.frameInterval) {
      this.frame++;
      this.timeSinceLastFrame = 0;
      if (this.frame > 5) this.markedForDeletion = true;
    }
  }
  draw() {
    ctx.drawImage(
      this.image,
      this.frame * this.spriteWidth,
      0,
      this.spriteWidth,
      this.spriteHeight,
      this.x,
      this.y - this.size * 0.25,
      this.size,
      this.size
    );
  }
}

window.addEventListener(`click`, function (e) {
  const detectPixelColor = collisionCtx.getImageData(e.x, e.y, 1, 1);
  const pc = detectPixelColor.data;
  ravens.forEach((object) => {
    if (
      object.randomColors[0] === pc[0] &&
      object.randomColors[1] === pc[1] &&
      object.randomColors[2] === pc[2]
    ) {
      //collision detected
      object.markedForDeletion = true;
      if (object.width < 150) {
        score++;
      }
      score++;
      explosions.push(new Explosions(object.x, object.y, object.width));
    }
    if (score > 50) this.speed++;
    if (gameOver) restartGame();
  });
});

function animate(timestamp) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  collisionCtx.clearRect(0, 0, canvas.width, canvas.height);
  let deltaTime = timestamp - lastTime;
  lastTime = timestamp;
  timeToNextRaven += deltaTime;

  if (timeToNextRaven > ravenInterval) {
    ravens.push(new Raven());
    timeToNextRaven = 0;
    ravens.sort(function (a, b) {
      return a.width - b.width;
    });
  }

  drawScore();
  [...ravens, ...explosions].forEach((object) => object.update(deltaTime));
  [...ravens, ...explosions].forEach((object) => object.draw());
  ravens = ravens.filter((object) => !object.markedForDeletion);
  explosions = explosions.filter((object) => !object.markedForDeletion);
  if (!gameOver) requestAnimationFrame(animate);
  else drawGameOver();
}
animate(0);
