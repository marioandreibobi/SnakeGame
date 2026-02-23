class NPC {
    constructor(name, position) {
        this.name = name;
        this.position = position; // { x: number, y: number }
    }

    move(newPosition) {
        this.position = newPosition;
    }

    interact() {
        console.log(`You interacted with ${this.name}.`);
    }
}

export default NPC;