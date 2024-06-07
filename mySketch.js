let nodeArray = [];
let linkArray = [];
const cutHistory = [];
let lastInteractionTime = 0;

const gridCount = 100;  // Increased grid density
const friction = 0.5;  // Adjusted friction
const forceMultiplier = 0.35;  // Increased force multiplier
const knifeRange = 10;
const speedLimit = 10;

const node = function (x, y, pinned) {
  this.pos = createVector(x, y);
  this.vel = createVector(0, 0);
  this.force = createVector(0, 0);
  this.pinned = pinned;
  this.visible = true;

  this.show = () => {
    if (this.visible) {
      rect(this.pos.x, this.pos.y, 0.1);
    }
  };

  this.update = () => {
    if (this.pinned) return;
    const acc = this.force.copy().mult(forceMultiplier);

    this.vel.add(acc);
    this.vel.limit(speedLimit);
    this.pos.add(this.vel);

    this.force.mult(0);
    this.vel.mult(friction);
  };

  this.checkVisibility = () => {
    this.visible = linkArray.some(
      link => link.node1 === this || link.node2 === this
    );
  };
};

const link = function (node1, node2) {
  this.node1 = node1;
  this.node2 = node2;

  this.getMiddlePoint = () => this.node1.pos.copy().add(this.node2.pos).div(2);

  this.show = () => {
    line(
      this.node1.pos.x,
      this.node1.pos.y,
      this.node2.pos.x,
      this.node2.pos.y
    );
  };

  this.update = () => {
    const difference = this.node2.pos.copy().sub(this.node1.pos);
    this.node1.pinned || this.node1.force.add(difference);
    this.node2.pinned || this.node2.force.sub(difference);
  };
};

function setup() {
  createCanvas(800, 800);  // Adjusted canvas size
  nodeArray = createNodes();
  linkArray = createLinks(nodeArray);
}

function createNodes() {
  const nodes = [];
  for (let j = 0; j <= gridCount; j++) {
    for (let i = 0; i <= gridCount; i++) {
      const pinned =
        i == 0 || j == 0 || i == gridCount || j == gridCount ? true : false;
      const x = map(i, 0, gridCount, 0, width - 1);
      const y = map(j, 0, gridCount, 0, height - 1);
      nodes.push(new node(x, y, pinned));
    }
  }
  return nodes;
}

function createLinks(nodes) {
  const links = [];
  nodes.forEach((current, index) => {
    const rest = nodes.slice(index + 1);
    const neighbors = rest.filter(
      target => current.pos.dist(target.pos) <= width / gridCount
    );
    neighbors.forEach(
      target =>
        (current.pinned && target.pinned) ||
        links.push(new link(current, target))
    );
  });
  return links;
}

function draw() {
  background("#ffcba4");
  stroke("black");
  fill("black");
  rectMode(CENTER);

  linkArray.forEach(link => link.update());
  nodeArray.forEach(node => node.update());

  linkArray.forEach(link => link.show());
  nodeArray.forEach(node => node.show());

  if (keyIsPressed && (key == " " || key == "u" || key == "U")) {
    undo();
    lastInteractionTime = millis();  // Record last interaction time
  }

  if (millis() - lastInteractionTime > 3000) {
    undo();  // Auto-fix if no interaction for more than 3 seconds
  }
}

function undo() {
  if (!cutHistory.length) return;
  const tail = cutHistory.pop();
  linkArray.push(tail);
  updateNodeVisibility();
}

function updateNodeVisibility() {
  nodeArray.forEach(node => node.checkVisibility());
}

function mouseDragged() {
  lastInteractionTime = millis();  // Record last interaction time
  const mouse = createVector(mouseX, mouseY);

  linkArray = linkArray.filter(link => {
    const middle = link.getMiddlePoint();
    const difference = middle.copy().sub(mouse);
    const distance = Math.hypot(difference.x, difference.y);

    if (distance > knifeRange) return true;
    cutHistory.push(link);
    return false;
  });

  updateNodeVisibility();
}
