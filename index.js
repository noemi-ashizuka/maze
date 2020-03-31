const { Engine, 
        Render, 
        Runner, 
        World, 
        Bodies,
        Body,
        Events 
    } = Matter;

const cellsHorizontal = 15;
const cellsVertical = 10;
const width = window.innerWidth;
const height = window.innerHeight;

const unitLengthX = width / cellsHorizontal;
const unitLengthY = height / cellsVertical;

const engine = Engine.create();
engine.world.gravity.y = 0;
const { world } = engine;
const render = Render.create({
    element: document.body, 
    engine: engine,
    options: {
        wireframes: false,
        width,
        height
    }
});
Render.run(render);
Runner.run(Runner.create(), engine);

// Walls
const walls = [
    Bodies.rectangle(width / 2, 0, width, 2, { isStatic: true}), 
    Bodies.rectangle(width / 2, height, width, 2, { isStatic: true}),
    Bodies.rectangle(0, height / 2, 2, height, { isStatic: true}),
    Bodies.rectangle(width, height / 2, 2, height, { isStatic: true})
];
World.add(world, walls);

// Maze generations

const shuffle = arr => {
    let counter = arr.length;

    while (counter > 0) {
        const index = Math.floor(Math.random() * counter);

        counter--;

        const temp = arr[counter];
        arr[counter] = arr[index];
        arr[index] = temp;
    }

    return arr;
};

const grid = Array(cellsVertical) //rows
.fill(null)
.map(() => Array(cellsHorizontal).fill(false)); //columns we can't use Array(3).fill([false, false, false]) bacause this uses the SAME array for each location not 3 different arrays

const verticals = Array(cellsVertical) //columns
.fill(null)
.map(() => Array(cellsHorizontal - 1).fill(false)); //lines of walls

const horizontals = Array(cellsVertical - 1) //lines of walls
.fill(null)
.map(() => Array(cellsHorizontal).fill(false)); // rows

const startRow = Math.floor(Math.random() * cellsVertical);
const startColumn = Math.floor(Math.random() * cellsHorizontal);

const stepThroughCell = (row, column) => {
    // If I have visited the cell at [row, column] then return
    if (grid[row][column]) {
        return;
    }
    // Mark this cell as visited
    grid[row][column] = true;
    // Assemble randomly ordered list of neighbor
    const neighbors = shuffle([
        [row - 1, column, "up"], //up
        [row, column + 1, "right"], //right
        [row + 1, column, "down"], //down
        [row, column - 1, "left"] //left
    ]);
    // For each neighbor...
    for (let neighbor of neighbors) {
        const [nextRow, nextColumn, direction] = neighbor; //where we are travelling to
        // See if that neighbor is out of bound
        if (nextRow < 0 || 
            nextRow >= cellsVertical || 
            nextColumn < 0 || 
            nextColumn >= cellsHorizontal
        ) {
            continue;
        }
        // If we have visited that neighbor, continue to next neighbor
        if (grid[nextRow][nextColumn]) {
            continue;
        }
        // Remove a wall from either hor or vert array
        if (direction === "left") {
            verticals[row][column - 1] = true;
        } else if (direction === "right") {
            verticals[row][column] = true;
        } else if (direction === "up") {
            horizontals[row - 1][column] = true;
        } else if (direction === "down") {
            horizontals[row][column] = true;
        }

        stepThroughCell(nextRow, nextColumn);
    }
};

stepThroughCell(startRow, startColumn);

// making horizontal walls

horizontals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
        if (open) {
            return;
        }

        const wall = Bodies.rectangle(
            columnIndex * unitLengthX + unitLengthX / 2,
            rowIndex * unitLengthY + unitLengthY,
            unitLengthX, 
            5,
            {
                label: "wall",
                isStatic: true,
                render: {
                    fillStyle: "gold"
                }
            }
        );
        World.add(world, wall);
    });
});

// making vertical walls

verticals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) =>{
        if (open) {
            return;
        }

        const wall = Bodies.rectangle(
            columnIndex * unitLengthX + unitLengthX,
            rowIndex * unitLengthY + unitLengthY / 2,
            5,
            unitLengthY,
            {
                label: "wall",
                isStatic: true,
                render: {
                    fillStyle: "gold"
                }
            }
            );
            World.add(world, wall);
    });
});

// Goal
const goal = Bodies.rectangle(
    width - unitLengthX / 2,
    height - unitLengthY / 2,
    unitLengthX * .7, //we want the goal to scale so with this it's always 70% of a unit
    unitLengthY * .7,
    {
        label: "goal",
        isStatic: true,
        render: {
            fillStyle: "teal"
        }
    }
);

World.add(world, goal);

// Ball

const ballRadius = Math.min(unitLengthX, unitLengthY) / 4;
const ball = Bodies.circle(
    unitLengthX / 2,
    unitLengthY / 2,
    ballRadius, {
        label: "ball",
        render: {
            fillStyle: "violet"
        }
    } //to make the ball always half the size of a cell
);

World.add(world, ball);

document.addEventListener("keydown", event => {
    const { x, y} = ball.velocity;
    
    if(event.keyCode === 87) {
        Body.setVelocity(ball, { x, y: y - 5 });
    }
    if(event.keyCode === 68) {
        Body.setVelocity(ball, { x: x + 5, y });
    }
    if(event.keyCode === 83) {
        Body.setVelocity(ball, { x, y: y + 5 });
    }
    if(event.keyCode === 65) {
        Body.setVelocity(ball, { x: x - 5, y });
    }
});

// Win Condition

Events.on(engine, "collisionStart", event => {
    event.pairs.forEach(collision => {
        const labels = ["ball", "goal"];

        if (
            labels.includes(collision.bodyA.label) &&
            labels.includes(collision.bodyB.label)
        ) { //win event (makes all bodies in the maze fall)
            document.querySelector(".winner").classList.remove("hidden");
            document.querySelector("#reset").addEventListener("click", function() {
                reset();
            });
            world.gravity.y = 1; //reset gravity
            world.bodies.forEach(body => { //remove static flag from walls so they move
                if (body.label === "wall") {
                    Body.setStatic(body, false);
                }
            });
        }

    });
});


//function to reset, one day
function reset () {
    console.log("game reset")
    
};
