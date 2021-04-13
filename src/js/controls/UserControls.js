class UserControls {
    constructor(sceneState, player) {
        this.sceneState = sceneState;
        this.player = player;
        this.listeners = {};
        this.keydownTimes = {
            a: 0, d: 0, w: 0, s: 0
        };
        this._initKeyListeners();
    }

    _initKeyListeners() {
        this.listeners.keydown = window.addEventListener('keydown', (e) => {
            // console.log('keydown', e);
            switch(e.code) {
            case 'KeyA':
                if(this.keydownTimes.a === 0) {
                    this.keydownTimes.a = performance.now();
                    this.player.move('left', this.keydownTimes.a);
                }
                break;
            case 'KeyD':
                if(this.keydownTimes.d === 0) {
                    this.keydownTimes.d = performance.now();
                    this.player.move('right', this.keydownTimes.d);
                }
                break;
            case 'KeyW':
                if(this.keydownTimes.w === 0) {
                    this.keydownTimes.w = performance.now();
                    this.player.move('up', this.keydownTimes.w);
                }
                break;
            case 'KeyS':
                if(this.keydownTimes.s === 0) {
                    this.keydownTimes.s = performance.now();
                    this.player.move('down', this.keydownTimes.s);
                }
                break;
            }
        });
        this.listeners.keyup = window.addEventListener('keyup', (e) => {
            switch(e.code) {
            case 'KeyA':
                this.keydownTimes.a = 0;
                this.player.move('left', 0);
                break;
            case 'KeyD':
                this.keydownTimes.d = 0;
                this.player.move('right', 0);
                break;
            case 'KeyW':
                this.keydownTimes.w = 0;
                this.player.move('up', 0);
                break;
            case 'KeyS':
                this.keydownTimes.s = 0;
                this.player.move('down', 0);
                break;
            }
        });
    }
}

export default UserControls;