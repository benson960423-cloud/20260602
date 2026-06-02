let stars = [];
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

  for (let i = 0; i < stars.size; i++) {
    // 處理與其他星星的碰撞
    for (let j = i + 1; j < stars.length; j++) {
      stars[i].checkCollision(stars[j]);
    }
  }

  for (let star of stars) {
    star.update();
    star.display();
  }
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

function windowResized() { resizeCanvas(windowWidth, windowHeight); }