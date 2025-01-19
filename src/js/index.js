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
let shotsLeft = 10; // Número máximo de tiros
let gameOver = false; // Estado de si el juego ha terminado
let won = false;
let backgroundMusic;
let shotSound;
let winSound;
let impactPigSound;
let hasPlayedWinSound = false;
let hasPlayedLoseSound = false;



function preload() {
    // Cargar la música de fondo y los efectos de sonido
    backgroundMusic = loadSound('assets/background.mp3');
    shotSound = loadSound('assets/shot.mp3');
    hitPigSound = loadSound('assets/hitPig.mp3');
    winSound = loadSound('assets/winGame.mp3');
    hitBoxSound = loadSound('assets/hitBox.mp3');
    gameOverSound = loadSound('assets/gameOver.mp3');

    slingshotTexture = loadImage('assets/Slingshot_Classic.png'); // Adjusted path for local assets
    birdTexture = loadImage('assets/RedBird.png');
    boxImg = loadImage('assets/box.png');
    squareWoodTexture = loadImage('assets/squareWood.png');
    squareIceTexture = loadImage('assets/squareIce.png');
    squareStoneTexture = loadImage('assets/squareStone.png');
    verticalWoodTexture = loadImage('assets/verticalRectWood.png');
    verticalIceTexture = loadImage('assets/verticalIce.png');
    horizontalWoodTexture = loadImage('assets/horizontalRectWood.png');
    horizontalIceTexture = loadImage('assets/horizontalIce.png');
    pigTexture = loadImage('assets/Sp.png');
    fondo = loadImage('assets/fondo.jpg');
}

function setup() {
    const canvas = createCanvas(1200, 600);

    engine = Engine.create();
    world = engine.world;
    
    const mouse = Matter.Mouse.create(canvas.elt);
    mouse.pixelRatio = pixelDensity();
    const mouseConstraint = Matter.MouseConstraint.create(engine, { mouse });
    World.add(world, mouseConstraint);

    ground = createRect(width / 2, height - 10, width, 20, 'ground',{ isStatic: true });
    World.add(world, ground);

    resetBird();

    //Creación nivel
    pigs.push(createPig(900, 550, 30));
    pigs.push(createPig(600, 550, 30));
    pigs.push(createPig(750, 550, 30));
    //Bloques medianos: 70x35

    //Hielo parte izquierda
    blocks.push(createRect(500, 550, 35, 70, 'verticalIce'));
    blocks.push(createRect(530, 550, 35, 70, 'verticalIce'));
    blocks.push(createRect(550, 550, 20, 140, 'verticalIce'));
    blocks.push(createRect(515, 500, 70, 35, 'horizontalIce'));
    blocks.push(createRect(530, 450, 35, 70, 'verticalIce'));
    
    //Parte central abajo

    blocks.push(createRect(700, 550, 50, 50, 'squareWood'));
    blocks.push(createRect(700, 550, 50, 50, 'squareIce'));
    
    /*blocks.push(createRect(650, 500, 20, 100, 'verticalWood'));
    blocks.push(createRect(650, 500, 100, 20, 'horizontalWood'));
    blocks.push(createRect(650, 500, 70, 70, 'squareIce'));    
    blocks.push(createRect(650, 500, 30, 100, 'verticalIce'));
    blocks.push(createRect(650, 500, 100, 30, 'horizontalIce'));
    blocks.push(createRect(650, 500, 70, 70, 'squareStone'));    */
    
    blocks.forEach(block => World.add(world, block));

    // Reproducir la música de fondo en bucle
    backgroundMusic.setVolume(0.1);
    backgroundMusic.loop(); // Reproducir música de fondo en bucle
    

}

function createRect(x, y, w, h, type, options = {}) {
    let texture = boxImg;
    if (type === 'squareWood') {
        texture = squareWoodTexture;
    } else if (type === 'verticalWood') {
        texture = verticalWoodTexture;
    } else if (type === 'horizontalWood') {
        texture = horizontalWoodTexture
    }else if (type === 'squareIce') {
        texture = squareIceTexture;
    }else if (type === 'horizontalIce') {
        texture = horizontalIceTexture;
    }else if (type === 'verticalIce') {
        texture = verticalIceTexture;
    }else if (type === 'squareStone') {
        texture = squareStoneTexture;
    }
    const rect = Bodies.rectangle(x, y, w, h, options);
    rect.width = w;
    rect.height = h;
    rect.texture = texture
    rect.health = 100;
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
    pig.health = 20;
    return pig;
}

function resetBird() {
    // Si ya hay un pájaro en el mundo, eliminamos su cuerpo y lo removemos de las listas.
    if (bird) {
        World.remove(world, bird);  // Elimina el cuerpo del pájaro del mundo
        bird = null;  // Limpia la referencia del pájaro
    }
    bird = createCircle(150, 400, 20, { restitution: 0.4 });
    slingshot = Constraint.create({
        pointA: { x: 150, y: 450 },
        bodyB: bird,
        stiffness: 0.05,
        length: 0,
    });
    World.add(world, [bird, slingshot]);
    birdLaunched = false;


    resettingBird = true; // Activa el indicador para mover la cámara al inicio.
    birdLaunched = false; // Restablece el indicador de lanzamiento.
}

function launchBird() {
    if (gameOver||won|| !slingshot.bodyB || shotsLeft <= 0) return; // No permite lanzar el pájaro si el juego ha terminado
    if (!slingshot.bodyB) return;

    shotSound.play();
    setTimeout(() => {
        //Soltar pajaro
        slingshot.bodyB = null;
        birdLaunched = true; // Marca el pájaro como lanzado.

        //Fuerza lanzamiento
        const forceMagnitude = 0.0035;
        const deltaX = bird.position.x - slingshot.pointA.x;
        const deltaY = bird.position.y - slingshot.pointA.y;
        //Fuerza x direccion
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
        shotsLeft--;
        
        setTimeout(() => {
            if (!slingshot.bodyB) {
                resetBird();
            }
        }, 1700); // Delay before resetting the bird
    }, 100);
}

function drawGameOver() {
    if (gameOver) {
        fill(255, 0, 0);
        stroke(37,17,12);
        strokeWeight(3);
        textSize(67);
        textAlign(CENTER, CENTER);
        text("GAME OVER", width / 2, height / 2);
    }
}

function drawRemainingShots() {
    fill(0);
    textSize(24);
    textAlign(LEFT, TOP);
    text("Tiros restantes: " + shotsLeft, 20, 20);
}

function checkGameOver() {
    if (shotsLeft <= 0 && pigs.length > 0) {
        gameOver = true;
    }

    if (pigs.length === 0) {
        won = true; // El jugador gana si no quedan cerdos
    }
}

function checkBirdStillMoving() {
    const speedThreshold = 0.1; // Un valor pequeño que indica que el pájaro ha parado
    const velocity = bird.velocity;
    const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
    return speed > speedThreshold;
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
    const checkCollision = (bodyA, bodyB, padding = 0) => {
        const boundsA = bodyA.bounds;
        const boundsB = bodyB.bounds;

        return (
            boundsA.min.x <= boundsB.max.x - padding &&
            boundsA.max.x >= boundsB.min.x + padding &&
            boundsA.min.y <= boundsB.max.y - padding &&
            boundsA.max.y >= boundsB.min.y + padding
        );
    };

    pigs = pigs.filter(pig => {
        if (checkCollision(bird, pig, 0)) {
            hitPigSound.play();

            // Desactiva temporalmente la restitución para evitar rebotes
            const originalRestitution = bird.restitution;
            bird.restitution = 0;

            // Elimina el cerdo del mundo
            World.remove(world, pig);

            // Restaura la restitución después de un breve periodo
            
            bird.restitution = originalRestitution;
            
            return false;
        }
        return true;
    });

    blocks = blocks.filter(block => {
        if (checkCollision(bird, block, 8)) {
            hitBoxSound.play();
            World.remove(world, block);
            return false; // Bloque eliminado
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
        image(slingshotTexture, slingshot.pointA.x-40, slingshot.pointA.y -29, 80, 160);
        stroke(37,17,12);
        strokeWeight(5);
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
        image(block.texture, 0, 0, block.width, block.height);
        pop();
    });
}

function draw() {
    background(fondo);
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
   // Limita la cámara para que no muestre zonas fuera del mundo visible
    cameraX = constrain(cameraX, 0, max(0, width * 2 - width));

    // Cambia el sistema de coordenadas para reflejar la posición y escala de la cámara
    push(); // Guarda el estado actual de la transformación
    translate(-cameraX, 0);  // Mueve la cámara
    scale(cameraScale);  // Aplica el zoom de la cámara

    // Dibuja los objetos después de la transformación
    drawGround();
    drawSlingshot();
    drawBird();
    drawPigs();
    drawBlocks();

    pop(); // Restaura el estado original de la transformación

    // Muestra los tiros restantes
    drawRemainingShots();

    // Verifica si el juego ha terminado, pero solo si el pájaro ya ha parado de moverse
    if (!checkBirdStillMoving()) {
        checkGameOver();
    }

    // Muestra el mensaje de GAME OVER o YOU WIN
    if (gameOver) {
        drawGameOver();
        if(!hasPlayedLoseSound){
            // Reproducir sonido de victoria solo una vez
            gameOverSound.setVolume(0.5);
            gameOverSound.play();
            hasPlayedLoseSound = true; // Marcar que ya se reprodujo el sonido
            backgroundMusic.pause()
        }
    } else if (won) {
        push();
        fill(0, 255, 0);
        stroke(37,17,12);
        strokeWeight(3);
        textSize(67);
        textAlign(CENTER, CENTER);
        text("YOU WIN!", width / 2, height / 2);
        if(!hasPlayedWinSound){
            // Reproducir sonido de victoria solo una vez
        winSound.setVolume(0.5);
        winSound.play();
        hasPlayedWinSound = true; // Marcar que ya se reprodujo el sonido
        backgroundMusic.pause()
        }
        pop();
        
    }
}