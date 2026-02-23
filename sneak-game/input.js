// This file handles user input, such as keyboard and mouse events, and translates them into actions within the game.

const input = {
    keys: {},
    mouse: {
        x: 0,
        y: 0,
        leftButton: false,
        rightButton: false
    },

    init: function() {
        window.addEventListener('keydown', this.keyDownHandler.bind(this));
        window.addEventListener('keyup', this.keyUpHandler.bind(this));
        window.addEventListener('mousemove', this.mouseMoveHandler.bind(this));
        window.addEventListener('mousedown', this.mouseDownHandler.bind(this));
        window.addEventListener('mouseup', this.mouseUpHandler.bind(this));
    },

    keyDownHandler: function(event) {
        this.keys[event.code] = true;
    },

    keyUpHandler: function(event) {
        this.keys[event.code] = false;
    },

    mouseMoveHandler: function(event) {
        this.mouse.x = event.clientX;
        this.mouse.y = event.clientY;
    },

    mouseDownHandler: function(event) {
        if (event.button === 0) {
            this.mouse.leftButton = true;
        } else if (event.button === 2) {
            this.mouse.rightButton = true;
        }
    },

    mouseUpHandler: function(event) {
        if (event.button === 0) {
            this.mouse.leftButton = false;
        } else if (event.button === 2) {
            this.mouse.rightButton = false;
        }
    },

    isKeyPressed: function(key) {
        return this.keys[key] === true;
    },

    getMousePosition: function() {
        return { x: this.mouse.x, y: this.mouse.y };
    },

    isLeftMouseButtonPressed: function() {
        return this.mouse.leftButton;
    },

    isRightMouseButtonPressed: function() {
        return this.mouse.rightButton;
    }
};

export default input;