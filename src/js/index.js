const {Engine, World, Body, Bodies, Constraint, Composite, Composites} = Matter;

let engine, world, ground, slingshot, bird, pigs = [], blocks = [];
let birdLaunched = false;

function setup() {
    const canvas = createCanvas(800, 600);

    engine = Engine.create();
    world = engine.world;

    const mouse = Matter.Mouse.create(canvas.elt);
    mouse.pixelRatio = pixelDensity();
    const mouseConstraint = Matter.MouseConstraint.create(engine, {mouse});
    World.add(world, mouseConstraint);

    ground = createRect(width / 2, height - 10, width, 20, {isStatic: true});
    World.add(world, ground);

    bird = createCircle(150, 400, 20, {restitution: 0.6});
    slingshot = Constraint.create({
        pointA: {x: 150, y: 400}, bodyB: bird, stiffness: 0.05, length: 0,
    });
    World.add(world, [bird, slingshot]);

    pigs.push(createPig(600, 520, 30));
    pigs.push(createPig(700, 520, 30));

    blocks.push(createRect(650, 500, 60, 60));
    blocks.push(createRect(650, 440, 60, 60));
    blocks.forEach(block => World.add(world, block));
}

function createRect(x, y, w, h, options = {}) {
    const rect = Bodies.rectangle(x, y, w, h, options);
    rect.width = w;
    rect.height = h;
    return rect;
}

function createCircle(x, y, r, options = {}) {
    const circle = Bodies.circle(x, y, r, options);
    circle.circleRadius = r;
    return circle;
}

function createPig(x, y, r) {
    const pig = createCircle(x, y, r, {isStatic: false, restitution: 0.5});
    World.add(world, pig);
    return pig;
}

function launchBird() {
    setTimeout(() => {
        slingshot.bodyB = null;

        const forceMagnitude = 0.0035;
        const deltaX = bird.position.x - slingshot.pointA.x;
        const deltaY = bird.position.y - slingshot.pointA.y;
        Body.applyForce(bird, bird.position, {
            x: deltaX * forceMagnitude, y: deltaY * forceMagnitude,
        });

        const maxSpeed = 2;
        const currentVelocity = bird.velocity;
        const speed = Math.sqrt(currentVelocity.x ** 2 + currentVelocity.y ** 2);

        if (speed > maxSpeed) {
            const scale = maxSpeed / speed;
            Body.setVelocity(bird, {
                x: currentVelocity.x * scale, y: currentVelocity.y * scale,
            });
        }
    }, 100);
}

function mouseReleased() {
    if (slingshot.bodyB) {
        launchBird();
    }
}

function constrainBird() {
    if (slingshot.bodyB) {
        const maxRadius = 50;
        const anchor = slingshot.pointA;
        const birdPos = bird.position;

        const dx = birdPos.x - anchor.x;
        const dy = birdPos.y - anchor.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > maxRadius) {
            const angle = Math.atan2(dy, dx);
            Body.setPosition(bird, {
                x: anchor.x + Math.cos(angle) * maxRadius, y: anchor.y + Math.sin(angle) * maxRadius,
            });
        }
    }
}

function drawGround() {
    fill(127);
    rectMode(CENTER);
    rect(ground.position.x, ground.position.y, width, 20);
}

function drawSlingshot() {
    if (slingshot.bodyB) {
        stroke(0);
        line(slingshot.pointA.x, slingshot.pointA.y, slingshot.bodyB.position.x, slingshot.bodyB.position.y);
    }
}

function drawBird() {
    fill(255, 0, 0);
    ellipse(bird.position.x, bird.position.y, bird.circleRadius * 2);
}

function drawPigs() {
    fill(0, 255, 0);
    pigs.forEach(pig => {
        ellipse(pig.position.x, pig.position.y, pig.circleRadius * 2);
    });
}

function drawBlocks() {
    fill(150);
    blocks.forEach(block => {
        push();
        translate(block.position.x, block.position.y);
        rotate(block.angle);
        rect(0, 0, block.width, block.height);
        pop();
    });
}

function draw() {
    background(200);

    Engine.update(engine);

    if (slingshot.bodyB) {
        constrainBird();
    }

    drawGround();
    drawSlingshot();
    drawBird();
    drawPigs();
    drawBlocks();
}
