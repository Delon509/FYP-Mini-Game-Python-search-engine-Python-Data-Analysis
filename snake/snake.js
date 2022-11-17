window.onload = function() {
    // Get the canvas and context
    var canvas = document.getElementById("viewport"); 
    var context = canvas.getContext("2d");
    var scoreboard = document.getElementById("score");
    var displays =  document.getElementById("characters");
    // Timing and frames per second
    var lastframe = 0;
    var fpstime = 0;
    var framecount = 0;
    var fps = 0;
    
    var initialized = false;
    
    // Images
    var images = [];
    var characters = [];
    var tileimage;
    var atoz;
    
    // Image loading global variables
    var loadcount = 0;
    var loadtotal = 0;
    var preloaded = false;
    //Word
    var dict= ['test','sos','easy','fantastic','history','science','music'];
    vocab = dict.map(element => {
        return element.toUpperCase();
      });
    var chosen;
    var currentanswer;
    var characterlist;
    var charposition;

    function wordinit(){
        const order= Math.floor(Math.random() * vocab.length);
        chosen = vocab[order];
        console.log(chosen);
        currentanswer=[];
        characterlist= new Array(26);
        characterlist= characterlist.fill(0,0,26);
        for(let char of chosen){
            if(currentanswer.indexOf(char)==-1){
                currentanswer.push(char);
            }
        }
    }
    
    function displayUserProcess(){
        var text="";
        for(let i =0;i<chosen.length;i++){
            var char =chosen.charAt(i);
            var listlocation = char.charCodeAt() -65;
            if(characterlist[listlocation]==1){
                var temphtmltext="<span style='color:red'>"+char+" </span>";
                text+=temphtmltext;
            }
            else{
                var temphtmltext="<span style='color:Gray'>"+char+" </span>";
                text+=temphtmltext;
            }
        }
        return text;
    }

    function angle(dx,dy,Direction) {
        var theta = Math.atan2(dy, dx); 
        theta *= 180 / Math.PI; 
        if (theta < 0) theta = 360 + theta;
        if(Direction==="C") theta=-1; 
        return theta;
      }
    // Load images
    function loadImages(imagefiles) {
        // Initialize variables
        loadcount = 0;
        loadtotal = imagefiles.length;
        preloaded = false;
        
        // Load the images
        var loadedimages = [];
        for (var i=0; i<imagefiles.length; i++) {
            // Create the image object
            var image = new Image();
            
            // Add onload event handler
            image.onload = function () {
                loadcount++;
                if (loadcount == loadtotal) {
                    // Done loading
                    preloaded = true;
                }
            };
            
            // Set the source url of the image
            image.src = imagefiles[i];
            
            // Save to the image array
            loadedimages[i] = image;
        }
        
        // Return an array of images
        return loadedimages;
    }
    
    // Level properties
    var Level = function (columns, rows, tilewidth, tileheight) {
        this.columns = columns;
        this.rows = rows;
        this.tilewidth = tilewidth;
        this.tileheight = tileheight;
        
        // Initialize tiles array
        this.tiles = [];
        for (var i=0; i<this.columns; i++) {
            this.tiles[i] = [];
            for (var j=0; j<this.rows; j++) {
                this.tiles[i][j] = 0;
            }
        }
    };
    
    // Generate a default level with walls
    Level.prototype.generate = function() {
        for (var i=0; i<this.columns; i++) {
            for (var j=0; j<this.rows; j++) {
                if (i == 0 || i == this.columns-1 ||
                    j == 0 || j == this.rows-1) {
                    // Add walls at the edges of the level
                    this.tiles[i][j] = 1;
                } else {
                    // Add empty space
                    this.tiles[i][j] = 0;
                }
            }
        }
    };
    
    
    // Snake
    var Snake = function() {
        this.init(0, 0, 1, 4, 1);
    }
    
    // Direction table: Up, Right, Down, Left
    Snake.prototype.directions = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    
    // Initialize the snake at a location
    Snake.prototype.init = function(x, y, direction, speed, numsegments) {
        this.x = x;
        this.y = y;
        this.direction = direction; // Up, Right, Down, Left
        this.speed = speed;         // Movement speed in blocks per second
        this.movedelay = 0;
        
        // Reset the segments and add new ones
        this.segments = [];
        this.growsegments = 0;
        for (var i=0; i<numsegments; i++) {
            this.segments.push({x:this.x - i*this.directions[direction][0],
                                y:this.y - i*this.directions[direction][1]});
        }
    }
    
    // Increase the segment count
    Snake.prototype.grow = function() {
        this.growsegments++;
    };
    
    // Check we are allowed to move
    Snake.prototype.tryMove = function(dt) {
        this.movedelay += dt;
        var maxmovedelay = 1 / this.speed;
        if (this.movedelay > maxmovedelay) {
            return true;
        }
        return false;
    };
    
    // Get the position of the next move
    Snake.prototype.nextMove = function() {
        var nextx = this.x + this.directions[this.direction][0];
        var nexty = this.y + this.directions[this.direction][1];
        return {x:nextx, y:nexty};
    }
    
    // Move the snake in the direction
    Snake.prototype.move = function() {
        // Get the next move and modify the position
        var nextmove = this.nextMove();
        this.x = nextmove.x;
        this.y = nextmove.y;
    
        // Get the position of the last segment
        var lastseg = this.segments[this.segments.length-1];
        var growx = lastseg.x;
        var growy = lastseg.y;
    
        // Move segments to the position of the previous segment
        for (var i=this.segments.length-1; i>=1; i--) {
            this.segments[i].x = this.segments[i-1].x;
            this.segments[i].y = this.segments[i-1].y;
        }
        
        // Grow a segment if needed
        if (this.growsegments > 0) {
            this.segments.push({x:growx, y:growy});
            this.growsegments--;
        }
        
        // Move the first segment
        this.segments[0].x = this.x;
        this.segments[0].y = this.y;
        
        // Reset movedelay
        this.movedelay = 0;
    }

    // Create objects
    var snake = new Snake();
    var level = new Level(20, 20, 32, 32);
    
    // Variables
    var score = 0;              // Score
    var gameover = true;        // Game is over
    var gameovertime = 1;       // How long we have been game over
    var gameoverdelay = 0.5;    // Waiting time after game over
    /*var joy1IinputPosX = document.getElementById("joy1PosizioneX");
    var joy1InputPosY = document.getElementById("joy1PosizioneY");
    var joy1Direzione = document.getElementById("joy1Direzione");
    var joy1X = document.getElementById("joy1X");
    var joy1Y = document.getElementById("joy1Y");
    var joy1Angle = document.getElementById("joy1Angle");*/
    var Angle=-1;
/*
setInterval(function(){ joy1IinputPosX.value=Joy1.GetPosX(); }, 50);
setInterval(function(){ joy1InputPosY.value=Joy1.GetPosY(); }, 50);
setInterval(function(){ joy1Direzione.value=Joy1.GetDir(); }, 50);
setInterval(function(){ joy1X.value=Joy1.GetX(); }, 50);
setInterval(function(){ joy1Y.value=Joy1.GetY(); }, 50);
*/
// Create JoyStick object into the DIV 'joy1Div'
/*
var Joy1 = new JoyStick('joy1Div', {}, function(stickData) {
    joy1IinputPosX.value = stickData.xPosition;
    joy1InputPosY.value = stickData.yPosition;
    joy1Direzione.value = stickData.cardinalDirection;
    joy1X.value = stickData.x;
    joy1Y.value = stickData.y;
    joy1Angle.value = angle(stickData.x,stickData.y);
    Angle=angle(stickData.x,stickData.y,stickData.cardinalDirection);
});*/
var joy3Param = { "title": "joystick1" };
var Joy1 = new JoyStick('joy1Div', joy3Param);
setInterval(function(){ Angle=angle(Joy1.GetX(),Joy1.GetY(),Joy1.GetDir()); }, 50);
    function joystickcontrol(Angle){
        
            if (Angle>135 && Angle<=225) {
                // Left or A
                if (snake.direction != 1)  {
                    snake.direction = 3;
                }
            } else if (Angle>45 && Angle<=135) {
                // Up or W
                if (snake.direction != 2)  {
                    snake.direction = 0;
                }
            } else if ((Angle>=0 && Angle<=45)||(Angle>315 && Angle<=360)) {
                // Right or D
                if (snake.direction != 3)  {
                    snake.direction = 1;
                }
            } else if (Angle>225 && Angle<=315) {
                // Down or S
                if (snake.direction != 0)  {
                    snake.direction = 2;
                }
            }
    
}
    // Initialize the game
    function init() {
        // Load images
        wordinit();
        images = loadImages(["snake-graphics.png"]);
        tileimage = images[0];
        characters = loadImages(["az.png"]);
        atoz = characters[0];
        scoreboard.innerHTML= "Score : 0";
        displays.innerHTML = displayUserProcess();
        // Add mouse events
        
        
        // Add keyboard events
        document.addEventListener("keydown", onKeyDown);
        canvas.addEventListener("mousedown", onMouseDown);
        
        // New game
        newGame();
        gameover = true;
    
        // Enter main loop
        main(0);
    }
    
    // Check if we can start a new game
    function tryNewGame() {
        if (gameovertime > gameoverdelay) {
            wordinit();
            newGame();
            gameover = false;
        }
    }
    
    function newGame() {
        // Initialize the snake
        
        snake.init(10, 10, 1, 4, 4);
        
        // Generate the default level
        level.generate();
        
        
        addCharacters();
        
        // Initialize the score
        scoreboard.innerHTML="Score : 0";
        displays.innerHTML = displayUserProcess();
        score = 0;
        
        // Initialize variables
        gameover = false;
    }
    
    // Add an apple to the level at an empty position
    function addCharacters() {
        // Loop until we have a valid apple
        charposition= new Array(2);
        charposition[0]= new Array(currentanswer.length);
        charposition[1]= new Array(currentanswer.length);
        
        for(let i=0;i<currentanswer.length;++i){
            var valid = false;
            while (!valid) {
            // Get a random position
            var ax = randRange(0, level.columns-1);
            var ay = randRange(0, level.rows-1);
            
            // Make sure the snake doesn't overlap the new apple
            var overlap = false;
            for (var j=0; j<snake.segments.length; j++) {
                // Get the position of the current snake segment
                var sx = snake.segments[0][j];
                var sy = snake.segments[1][j];
                
                // Check overlap
                if (ax == sx && ay == sy) {
                    overlap = true;
                    break;
                }
            }
            // Make sure the new char doesn't overlap the exist char
            if(!overlap){
                for (var k=0; k<=i; k++) {
                    
                    var sx = charposition[0][k];
                    var sy = charposition[1][k];
                    
                    // Check overlap
                    if (ax == sx && ay == sy) {
                        overlap = true;
                        break;
                    }
                }
            }
            
            
            // Tile must be empty
            if (!overlap && level.tiles[ax][ay] == 0) {
                // Add an apple at the tile position
                level.tiles[ax][ay] = currentanswer[i].charCodeAt()+35;
                valid = true;
                charposition[0][i]=ax;
                charposition[1][i]=ay;
            }
        }
        }
    }
    
    // Main loop
    function main(tframe) {
        // Request animation frames
        window.requestAnimationFrame(main);
        
        if (!initialized) {
            // Preloader
            
            // Clear the canvas
            context.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw a progress bar
            var loadpercentage = loadcount/loadtotal;
            context.strokeStyle = "#ff8080";
            context.lineWidth=3;
            context.strokeRect(18.5, 0.5 + canvas.height - 51, canvas.width-37, 32);
            context.fillStyle = "#ff8080";
            context.fillRect(18.5, 0.5 + canvas.height - 51, loadpercentage*(canvas.width-37), 32);
            
            // Draw the progress text
            var loadtext = "Loaded " + loadcount + "/" + loadtotal + " images";
            context.fillStyle = "#000000";
            context.font = "16px Verdana";
            context.fillText(loadtext, 18, 0.5 + canvas.height - 63);
            
            if (preloaded) {
                initialized = true;
            }
        } else {
            // Update and render the game
            
            update(tframe);
            render();
            joystickcontrol(Angle);
        }
    }
    
    // Update the game state
    function update(tframe) {
        var dt = (tframe - lastframe) / 1000;
        lastframe = tframe;
        
        // Update the fps counter
        updateFps(dt);
        
        if (!gameover) {
            updateGame(dt);
        } else {
            gameovertime += dt;
        }
    }
    
    function updateGame(dt) {
        // Move the snake
        if (snake.tryMove(dt)) {
            // Check snake collisions
            
            // Get the coordinates of the next move
            var nextmove = snake.nextMove();
            var nx = nextmove.x;
            var ny = nextmove.y;
            
            if (nx >= 0 && nx < level.columns && ny >= 0 && ny < level.rows) {
                if (level.tiles[nx][ny] == 1) {
                    // Collision with a wall
                    gameover = true;
                }
                
                // Collisions with the snake itself
                for (var i=0; i<snake.segments.length; i++) {
                    var sx = snake.segments[i].x;
                    var sy = snake.segments[i].y;
                    
                    if (nx == sx && ny == sy) {
                        // Found a snake part
                        gameover = true;
                        break;
                    }
                }
                
                if (!gameover) {
                    // The snake is allowed to move

                    // Move the snake
                    
                    snake.move();
                    
                    // Check collision with char
                    if (level.tiles[nx][ny] >=100) {
                        // Remove the apple
                        var value =level.tiles[nx][ny] -35;
                        level.tiles[nx][ny] = 0;
                        //in order
                        if(currentanswer.shift().charCodeAt()===value || characterlist[value-65]===1){
                            characterlist[value-65]=1;
                            console.log("the size of currentanswer is "+ currentanswer.length);
                            // check finish one word?
                            if(currentanswer.length===0){
                                wordinit();
                                addCharacters();
                                snake.grow();
                                score++;
                                scoreboard.innerHTML= "Score: "+score;
                            }
                        }else{
                            gameover= true;
                        }
                        
                        
                        
                        // Add a point to the score
                        displays.innerHTML=displayUserProcess();
                    }
                    

                }
            } else {
                // Out of bounds
                gameover = true;
            }
            
            if (gameover) {
                gameovertime = 0;
            }
        }
    }
    
    function updateFps(dt) {
        if (fpstime > 0.25) {
            // Calculate fps
            fps = Math.round(framecount / fpstime);
            
            // Reset time and framecount
            fpstime = 0;
            framecount = 0;
        }
        
        // Increase time and framecount
        fpstime += dt;
        framecount++;
    }
    
    // Render the game
    function render() {
        // Draw background
        context.fillStyle = "#577ddb";
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        drawLevel();
        drawSnake();
            
        // Game over
        if (gameover) {
            context.fillStyle = "rgba(0, 0, 0, 0.5)";
            context.fillRect(0, 0, canvas.width, canvas.height);
            
            context.fillStyle = "#ffffff";
            context.font = "24px Verdana";
            drawCenterText("Press Me to start!", 0, canvas.height/2, canvas.width);
        }
    }
    
    // Draw the level tiles
    function drawLevel() {
        for (var i=0; i<level.columns; i++) {
            for (var j=0; j<level.rows; j++) {
                // Get the current tile and location
                var tile = level.tiles[i][j];
                var tilex = i*level.tilewidth;
                var tiley = j*level.tileheight;
                
                // Draw tiles based on their type
                if (tile == 0) {
                    // Empty space
                    context.fillStyle = "#f7e697";
                    context.fillRect(tilex, tiley, level.tilewidth, level.tileheight);
                } else if (tile == 1) {
                    // Wall
                    context.fillStyle = "#bcae76";
                    context.fillRect(tilex, tiley, level.tilewidth, level.tileheight);
                } else if (tile >=100) {
                    // Apple
                    
                    // Draw apple background
                    context.fillStyle = "#f7e697";
                    context.fillRect(tilex, tiley, level.tilewidth, level.tileheight);
                    
                    // Draw the apple image
                    var tx = tile-100;
                    var ty = 0;
                    var tilew = 66;
                    var tileh = 66;
                    //context.drawImage(tileimage, tx*tilew, ty*tileh, tilew, tileh, tilex, tiley, level.tilewidth, level.tileheight);
                    context.drawImage(atoz, tx*tilew, ty*tileh, tilew, tileh, tilex, tiley, level.tilewidth, level.tileheight);
                }
            }
        }
    }
    
    // Draw the snake
    function drawSnake() {
        // Loop over every snake segment
        for (var i=0; i<snake.segments.length; i++) {
            var segment = snake.segments[i];
            var segx = segment.x;
            var segy = segment.y;
            var tilex = segx*level.tilewidth;
            var tiley = segy*level.tileheight;
            
            // Sprite column and row that gets calculated
            var tx = 0;
            var ty = 0;
            
            if (i == 0) {
                // Head; Determine the correct image
                var nseg = snake.segments[i+1]; // Next segment
                if (segy < nseg.y) {
                    // Up
                    tx = 3; ty = 0;
                } else if (segx > nseg.x) {
                    // Right
                    tx = 4; ty = 0;
                } else if (segy > nseg.y) {
                    // Down
                    tx = 4; ty = 1;
                } else if (segx < nseg.x) {
                    // Left
                    tx = 3; ty = 1;
                }
            } else if (i == snake.segments.length-1) {
                // Tail; Determine the correct image
                var pseg = snake.segments[i-1]; // Prev segment
                if (pseg.y < segy) {
                    // Up
                    tx = 3; ty = 2;
                } else if (pseg.x > segx) {
                    // Right
                    tx = 4; ty = 2;
                } else if (pseg.y > segy) {
                    // Down
                    tx = 4; ty = 3;
                } else if (pseg.x < segx) {
                    // Left
                    tx = 3; ty = 3;
                }
            } else {
                // Body; Determine the correct image
                var pseg = snake.segments[i-1]; // Previous segment
                var nseg = snake.segments[i+1]; // Next segment
                if (pseg.x < segx && nseg.x > segx || nseg.x < segx && pseg.x > segx) {
                    // Horizontal Left-Right
                    tx = 1; ty = 0;
                } else if (pseg.x < segx && nseg.y > segy || nseg.x < segx && pseg.y > segy) {
                    // Angle Left-Down
                    tx = 2; ty = 0;
                } else if (pseg.y < segy && nseg.y > segy || nseg.y < segy && pseg.y > segy) {
                    // Vertical Up-Down
                    tx = 2; ty = 1;
                } else if (pseg.y < segy && nseg.x < segx || nseg.y < segy && pseg.x < segx) {
                    // Angle Top-Left
                    tx = 2; ty = 2;
                } else if (pseg.x > segx && nseg.y < segy || nseg.x > segx && pseg.y < segy) {
                    // Angle Right-Up
                    tx = 0; ty = 1;
                } else if (pseg.y > segy && nseg.x > segx || nseg.y > segy && pseg.x > segx) {
                    // Angle Down-Right
                    tx = 0; ty = 0;
                }
            }
            
            // Draw the image of the snake part
            context.drawImage(tileimage, tx*64, ty*64, 64, 64, tilex, tiley,
                              level.tilewidth, level.tileheight);
        }
    }
    
    // Draw text that is centered
    function drawCenterText(text, x, y, width) {
        var textdim = context.measureText(text);
        context.fillText(text, x + (width-textdim.width)/2, y);
    }
    
    // Get a random int between low and high, inclusive
    function randRange(low, high) {
        return Math.floor(low + Math.random()*(high-low+1));
    }
    
    // Mouse event handlers
    function onMouseDown(e) {
        // Get the mouse position
        var pos = getMousePos(canvas, e);
        
        if (gameover) {
            // Start a new game
            tryNewGame();
        } else {
            // Change the direction of the snake
            snake.direction = (snake.direction + 1) % snake.directions.length;
        }
    }
    
    // Keyboard event handler
    function onKeyDown(e) {
        if (gameover) {
            tryNewGame();
        } else {
            if (e.keyCode == 37 || e.keyCode == 65) {
                // Left or A
                if (snake.direction != 1)  {
                    snake.direction = 3;
                }
            } else if (e.keyCode == 38 || e.keyCode == 87) {
                // Up or W
                if (snake.direction != 2)  {
                    snake.direction = 0;
                }
            } else if (e.keyCode == 39 || e.keyCode == 68) {
                // Right or D
                if (snake.direction != 3)  {
                    snake.direction = 1;
                }
            } else if (e.keyCode == 40 || e.keyCode == 83) {
                // Down or S
                if (snake.direction != 0)  {
                    snake.direction = 2;
                }
            }
            
        }
    }
    function getMousePos(canvas, e) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: Math.round((e.clientX - rect.left)/(rect.right - rect.left)*canvas.width),
            y: Math.round((e.clientY - rect.top)/(rect.bottom - rect.top)*canvas.height)
        };
    }
    
    
    // Call init to start the game
    init();
};