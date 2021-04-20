class Logger {
    constructor(sceneState) {
        this.sceneState = sceneState;
    }

    log(...args) {
        console.log(...args);
    }
    
    error(...args) {
        console.error('********* GAME ENGINE ERROR *********', ...args);
    }
}

export default Logger;