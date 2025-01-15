const { Engine, World, Body, Bodies, Constraint, Composite, Composites } = Matter;

let engine, world, ground, slingshot, bird, pigs = [], blocks = [];
let birdLaunched = false;
let slingshotTexture;
let birdTexture;
let pigTexture;
let cameraX = 0; // La posición inicial de la cámara en el eje X.
let cameraScale = 1; // Escala de la cámara.
const CAMERA_PADDING = 300; // Espacio que se muestra más allá del pájaro.
let resettingBird = false; // Indicador para saber si la cámara debe volver al inicio.


function preload() {
    slingshotTexture = loadImage('assets/Slingshot_Classic.png'); // Adjusted path for local assets
    birdTexture = loadImage('assets/RedBird.png');
    pigTexture = loadImage('assets/Sp.png');
}

function setup() {
    const canvas = createCanvas(1200, 600);

    engine = Engine.create();
    world = engine.world;

    const mouse = Matter.Mouse.create(canvas.elt);
    mouse.pixelRatio = pixelDensity();
    const mouseConstraint = Matter.MouseConstraint.create(engine, { mouse });
    World.add(world, mouseConstraint);

    ground = createRect(width / 2, height - 10, width, 20, { isStatic: true });
    World.add(world, ground);

    resetBird();

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
    const pig = createCircle(x, y, r, { isStatic: false, restitution: 0.5 });
    World.add(world, pig);
    return pig;
}

function resetBird() {
    bird = createCircle(150, 400, 20, { restitution: 0.6 });
    slingshot = Constraint.create({
        pointA: { x: 150, y: 450 },
        bodyB: bird,
        stiffness: 0.05,
        length: 0,
    });
    World.add(world, [bird, slingshot]);
    resettingBird = true; // Activa el indicador para mover la cámara al inicio.
    birdLaunched = false; // Restablece el indicador de lanzamiento.
}

function launchBird() {
    setTimeout(() => {
        slingshot.bodyB = null;
        birdLaunched = true; // Marca el pájaro como lanzado.

        const forceMagnitude = 0.0035;
        const deltaX = bird.position.x - slingshot.pointA.x;
        const deltaY = bird.position.y - slingshot.pointA.y;
        Body.applyForce(bird, bird.position, {
            x: deltaX * forceMagnitude,
            y: deltaY * forceMagnitude,
        });

        const maxSpeed = 2;
        const currentVelocity = bird.velocity;
        const speed = Math.sqrt(currentVelocity.x ** 2 + currentVelocity.y ** 2);

        if (speed > maxSpeed) {
            const scale = maxSpeed / speed;
            Body.setVelocity(bird, {
                x: currentVelocity.x * scale,
                y: currentVelocity.y * scale,
            });
        }

        setTimeout(() => {
            if (!slingshot.bodyB) {
                resetBird();
            }
        }, 2000); // Delay before resetting the bird
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
                x: anchor.x + Math.cos(angle) * maxRadius,
                y: anchor.y + Math.sin(angle) * maxRadius,
            });
        }
    }
}

function removeObjectsHitByBird() {
    const checkCollision = (bodyA, bodyB) => {
        const dx = bodyA.position.x - bodyB.position.x;
        const dy = bodyA.position.y - bodyB.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= (bodyA.circleRadius || bodyA.width / 2) + (bodyB.circleRadius || bodyB.width / 2);
    };

    pigs = pigs.filter(pig => {
        if (checkCollision(bird, pig)) {
            World.remove(world, pig);
            return false;
        }
        return true;
    });

    blocks = blocks.filter(block => {
        if (checkCollision(bird, block)) {
            World.remove(world, block);
            return false;
        }
        return true;
    });
}

function drawGround() {
    fill(127);
    rectMode(CENTER);
    rect(ground.position.x, ground.position.y, width, 20);
}

function drawSlingshot() {
    if (slingshot.bodyB) {
        image(slingshotTexture, slingshot.pointA.x, slingshot.pointA.y + 50, 80, 160);
        stroke(0);
        line(slingshot.pointA.x, slingshot.pointA.y, slingshot.bodyB.position.x, slingshot.bodyB.position.y);
    }
}

function drawBird() {
    imageMode(CENTER);
    image(birdTexture, bird.position.x, bird.position.y, bird.circleRadius * 2, bird.circleRadius * 2);
}

function drawPigs() {
    imageMode(CENTER);
    pigs.forEach(pig => {
        image(pigTexture, pig.position.x, pig.position.y, pig.circleRadius * 2, pig.circleRadius * 2);
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

    removeObjectsHitByBird();

    // Actualiza la posición y escala de la cámara.
    if (birdLaunched) {
        const targetCameraX = bird.position.x - width / 2;
        cameraX = lerp(cameraX, targetCameraX, 0.1); // Interpolación para movimiento suave.
        cameraScale = lerp(cameraScale, 0.7, 0.05); // La cámara se aleja al lanzar el pájaro.
    } else if (resettingBird) {
        const targetCameraX = 0;
        cameraX = lerp(cameraX, targetCameraX, 0.1);
        cameraScale = lerp(cameraScale, 1, 0.05); // La cámara regresa a su tamaño original.

        if (Math.abs(cameraX - targetCameraX) < 1 && Math.abs(cameraScale - 1) < 0.01) {
            resettingBird = false; // Detiene el movimiento cuando la cámara está en su posición original.
        }
    }

    // Limita la cámara para que no muestre zonas fuera del mundo visible.
    cameraX = constrain(cameraX, 0, max(0, width * 2 - width));

    // Cambia el sistema de coordenadas para reflejar la posición y escala de la cámara.
    translate(-cameraX, 0);
    scale(cameraScale);

    drawGround();
    drawSlingshot();
    drawBird();
    drawPigs();
    drawBlocks();
}
