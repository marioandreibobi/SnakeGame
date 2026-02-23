class Enemy {
    constructor(x, y, health) {
        this.x = x;
        this.y = y;
        this.health = health;
        this.speed = 2; // Speed of the enemy
    }

    moveTowards(targetX, targetY) {
        const deltaX = targetX - this.x;
        const deltaY = targetY - this.y;
        const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);

        if (distance > 0) {
            this.x += (deltaX / distance) * this.speed;
            this.y += (deltaY / distance) * this.speed;
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        // Logic for when the enemy dies
        console.log('Enemy has been defeated');
    }
}

export default Enemy;