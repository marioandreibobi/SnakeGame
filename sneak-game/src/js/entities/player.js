class Player {
    constructor(x, y) {
        this.position = { x: x, y: y };
        this.health = 100;
        this.speed = 5;
    }

    move(direction) {
        switch (direction) {
            case 'up':
                this.position.y -= this.speed;
                break;
            case 'down':
                this.position.y += this.speed;
                break;
            case 'left':
                this.position.x -= this.speed;
                break;
            case 'right':
                this.position.x += this.speed;
                break;
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health < 0) {
            this.health = 0;
        }
    }

    isAlive() {
        return this.health > 0;
    }
}

export default Player;