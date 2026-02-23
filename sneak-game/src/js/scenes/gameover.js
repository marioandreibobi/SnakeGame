function gameOverScene(finalScore, restartGame) {
    const gameOverContainer = document.createElement('div');
    gameOverContainer.classList.add('game-over');

    const scoreText = document.createElement('h1');
    scoreText.textContent = `Game Over! Your Score: ${finalScore}`;
    gameOverContainer.appendChild(scoreText);

    const restartButton = document.createElement('button');
    restartButton.textContent = 'Restart';
    restartButton.addEventListener('click', restartGame);
    gameOverContainer.appendChild(restartButton);

    const exitButton = document.createElement('button');
    exitButton.textContent = 'Exit';
    exitButton.addEventListener('click', () => {
        window.close(); // or redirect to a different page
    });
    gameOverContainer.appendChild(exitButton);

    document.body.appendChild(gameOverContainer);
}

export default gameOverScene;