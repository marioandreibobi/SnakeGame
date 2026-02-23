// This file contains the main game logic, including game state management, rendering, and updating the game world.

class Game {
    constructor() {
        this.state = 'menu'; // Possible states: menu, playing, gameover
        this.score = 0;
        this.player = null;
        this.enemies = [];
        this.npcs = [];
        this.levelData = null;
    }

    init() {
        this.loadLevel();
        this.player = new Player();
        this.setupEnemies();
        this.setupNPCs();
    }

    loadLevel() {
        // Load level data from JSON
        fetch('src/assets/data/levels.json')
            .then(response => response.json())
            .then(data => {
                this.levelData = data;
                this.render();
            });
    }

    setupEnemies() {
        // Initialize enemies based on level data
        this.enemies = this.levelData.enemies.map(enemyData => new Enemy(enemyData));
    }

    setupNPCs() {
        // Initialize NPCs based on level data
        this.npcs = this.levelData.npcs.map(npcData => new NPC(npcData));
    }

    update() {
        // Update game state, player, enemies, and check for collisions
        if (this.state === 'playing') {
            this.player.update();
            this.enemies.forEach(enemy => enemy.update());
            this.checkCollisions();
        }
    }

    checkCollisions() {
        // Check for collisions between player and enemies
        this.enemies.forEach(enemy => {
            if (this.player.collidesWith(enemy)) {
                this.state = 'gameover';
            }
        });
    }

    render() {
        // Render the game world, player, enemies, and UI
        // This would typically involve drawing to a canvas or updating the DOM
    }

    start() {
        this.state = 'playing';
        this.init();
        this.gameLoop();
    }

    gameLoop() {
        if (this.state === 'playing') {
            this.update();
            this.render();
            requestAnimationFrame(() => this.gameLoop());
        }
    }

    gameOver() {
        // Handle game over logic, display score, etc.
    }
}

const game = new Game();
export default game;