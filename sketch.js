let stars = [];
let missiles = [];
let explosions = [];
const colors = ['#ffbe0b', '#fb5607', '#ff006e', '#8338ec', '#3a86ff'];
let lastSpawnTime = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  // 初始產生 20 個物件
  for (let i = 0; i < 20; i++) {
    stars.push(new Star());
  }
  noStroke();
}

function draw() {
  background(0);

  // 每隔三秒（3000毫秒）產生一個新物件
  if (millis() - lastSpawnTime > 3000) {
    stars.push(new Star());
    lastSpawnTime = millis();
  }

  // 處理粒子間的碰撞
  for (let i = 0; i < stars.length; i++) {
    // 處理與其他星星的碰撞
    for (let j = i + 1; j < stars.length; j++) {
      stars[i].checkCollision(stars[j]);
    }
  }

  // 更新與顯示星星
  for (let star of stars) {
    star.update();
    star.display();
  }

  // 更新與顯示飛彈，並偵測與星星的碰撞
  for (let i = missiles.length - 1; i >= 0; i--) {
    missiles[i].update();
    missiles[i].display();
    
    for (let j = stars.length - 1; j >= 0; j--) {
      if (missiles[i].hits(stars[j])) {
        createExplosion(stars[j].x, stars[j].y, stars[j].color);
        stars.splice(j, 1);
        missiles.splice(i, 1);
        break; 
      }
    }
    // 移除超出螢幕的飛彈
    if (missiles[i] && missiles[i].isOffScreen()) {
      missiles.splice(i, 1);
    }
  }

  // 更新與顯示爆炸特效
  for (let i = explosions.length - 1; i >= 0; i--) {
    explosions[i].update();
    explosions[i].display();
    if (explosions[i].isDead()) explosions.splice(i, 1);
  }

  drawArrow();
}

class Star {
  constructor() {
    this.size = random(40, 80);
    this.radius = this.size * 0.5; // 用於碰撞判斷的半徑
    this.x = random(this.radius, width - this.radius);
    this.y = random(this.radius, height - this.radius);
    this.color = color(random(colors));
    
    // 隨機速度
    this.vx = random(-2, 2);
    this.vy = random(-2, 2);
    
    this.isScared = false;
  }

  update() {
    // 移動
    this.x += this.vx;
    this.y += this.vy;

    // 邊界反彈 (碰撞牆壁)
    if (this.x - this.radius < 0 || this.x + this.radius > width) {
      this.vx *= -1;
      this.x = constrain(this.x, this.radius, width - this.radius);
    }
    if (this.y - this.radius < 0 || this.y + this.radius > height) {
      this.vy *= -1;
      this.y = constrain(this.y, this.radius, height - this.radius);
    }

    // 滑鼠互動偵測
    let d = dist(mouseX, mouseY, this.x, this.y);
    if (d < 150) {
      this.isScared = true;
      // 逃跑邏輯：計算遠離滑鼠的向量並彈開
      let force = createVector(this.x - mouseX, this.y - mouseY);
      force.setMag(6); 
      this.vx = force.x;
      this.vy = force.y;
    } else {
      this.isScared = false;
    }
  }

  // 處理粒子間的碰撞反彈
  checkCollision(other) {
    let dx = other.x - this.x;
    let dy = other.y - this.y;
    let distance = sqrt(dx * dx + dy * dy);
    let minDistance = this.radius + other.radius;

    if (distance < minDistance) {
      // 簡單的彈性碰撞速度交換模擬
      let tempVx = this.vx;
      let tempVy = this.vy;
      this.vx = other.vx;
      this.vy = other.vy;
      other.vx = tempVx;
      other.vy = tempVy;

      // 防止重疊卡住，手動將其推開一點點
      let overlap = minDistance - distance;
      let nx = dx / distance;
      let ny = dy / distance;
      this.x -= nx * overlap / 2;
      this.y -= ny * overlap / 2;
      other.x += nx * overlap / 2;
      other.y += ny * overlap / 2;
    }
  }

  display() {
    push();
    translate(this.x, this.y);
    
    // 繪製圓角星星主體
    fill(this.color);
    this.drawRoundedStar(0, 0, this.radius, this.radius * 0.4, 5);

    // 眼睛與眼球邏輯
    let angleToMouse = atan2(mouseY - this.y, mouseX - this.x);
    let pupilSize = this.isScared ? 12 : 6;
    let eyeDist = this.isScared ? 5 : 3;

    fill(255);
    ellipse(-this.size * 0.15, -this.size * 0.05, 15, 18);
    ellipse(this.size * 0.15, -this.size * 0.05, 15, 18);

    fill(0);
    let px = cos(angleToMouse) * eyeDist;
    let py = sin(angleToMouse) * eyeDist;
    ellipse(-this.size * 0.15 + px, -this.size * 0.05 + py, pupilSize, pupilSize);
    ellipse(this.size * 0.15 + px, -this.size * 0.05 + py, pupilSize, pupilSize);

    // 嘴巴：驚嚇圓形 vs 弧線笑臉
    noFill();
    stroke(0);
    strokeWeight(2);
    if (this.isScared) { fill(0); ellipse(0, this.size * 0.15, 12, 12); }
    else { arc(0, this.size * 0.1, 15, 10, 0, PI); }
    
    pop();
  }

  hits(other) {
    return dist(this.x, this.y, other.x, other.y) < this.radius;
  }

  drawRoundedStar(x, y, r1, r2, n) {
    let angle = TWO_PI / n;
    beginShape();
    for (let a = 0; a < TWO_PI + angle * 2; a += angle) {
      curveVertex(x + cos(a) * r1, y + sin(a) * r1);
      curveVertex(x + cos(a + angle / 2) * r2, y + sin(a + angle / 2) * r2);
    }
    endShape(CLOSE);
  }
}

class Missile {
  constructor(x, y, targetX, targetY) {
    this.x = x;
    this.y = y;
    this.history = []; // 用於存放歷史座標以產生拖影
    let angle = atan2(targetY - y, targetX - x);
    this.vx = cos(angle) * 10;
    this.vy = sin(angle) * 10;
    this.color = color('#daff11'); // 螢光黃
  }

  update() {
    // 紀錄歷史位置
    this.history.push(createVector(this.x, this.y));
    if (this.history.length > 10) this.history.shift();

    this.x += this.vx;
    this.y += this.vy;
  }

  display() {
    // 繪製拖影
    for (let i = 0; i < this.history.length; i++) {
      let pos = this.history[i];
      let alpha = map(i, 0, this.history.length, 0, 150);
      fill(219, 255, 17, alpha);
      noStroke();
      ellipse(pos.x, pos.y, 5);
    }

    // 繪製本體
    fill(this.color);
    ellipse(this.x, this.y, 8);
  }

  hits(star) {
    let d = dist(this.x, this.y, star.x, star.y);
    return d < star.radius;
  }

  isOffScreen() {
    return (this.x < 0 || this.x > width || this.y < 0 || this.y > height);
  }
}

class ExplosionParticle {
  constructor(x, y, col) {
    this.x = x;
    this.y = y;
    this.vx = random(-5, 5);
    this.vy = random(-5, 5);
    this.alpha = 255;
    this.color = col;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= 10;
  }

  display() {
    noStroke();
    let c = color(this.color);
    fill(red(c), green(c), blue(c), this.alpha);
    ellipse(this.x, this.y, 4);
  }

  isDead() {
    return this.alpha <= 0;
  }
}

function drawArrow() {
  push();
  translate(width / 2, height / 2);
  let angle = atan2(mouseY - height / 2, mouseX - width / 2);
  rotate(angle);
  
  // 繪製發射台箭頭
  fill(255);
  noStroke();
  rectMode(CENTER);
  rect(-10, 0, 40, 15, 5); // 箭身
  triangle(10, -15, 10, 15, 35, 0); // 箭頭
  
  // 箭頭中間加一點細節
  fill(0);
  ellipse(15, 0, 5);
  pop();
}

function mousePressed() {
  if (mouseButton === LEFT) {
    missiles.push(new Missile(width / 2, height / 2, mouseX, mouseY));
  }
}

function createExplosion(x, y, col) {
  for (let i = 0; i < 15; i++) {
    explosions.push(new ExplosionParticle(x, y, col));
  }
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }