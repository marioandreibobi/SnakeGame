export function setupMenuScene() {
    const menuContainer = document.createElement('div');
    menuContainer.classList.add('menu');

    const title = document.createElement('h1');
    title.textContent = 'Sneak Game';
    menuContainer.appendChild(title);

    const startButton = document.createElement('button');
    startButton.textContent = 'Start Game';
    startButton.addEventListener('click', () => {
        // Logic to start the game
        console.log('Game Started');
    });
    menuContainer.appendChild(startButton);

    const instructionsButton = document.createElement('button');
    instructionsButton.textContent = 'Instructions';
    instructionsButton.addEventListener('click', () => {
        // Logic to show instructions
        console.log('Show Instructions');
    });
    menuContainer.appendChild(instructionsButton);

    document.body.appendChild(menuContainer);
}