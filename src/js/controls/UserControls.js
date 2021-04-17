class UserControls {
    constructor(sceneState, player) {
        this.sceneState = sceneState;
        this.player = player;
        this.listeners = {};
        this.keydownTimes = {
            a: 0, d: 0, w: 0, s: 0
        };
        this.direction = player.getDirection();
        this.stopTwoKeyPressTime = 0;
        this.twoKeyDirection = 0;
        this._initKeyListeners();
    }

    _initKeyListeners() {
        this.listeners.keydown = window.addEventListener('keydown', (e) => {
            // console.log('keydown', e);
            switch(e.code) {
            case 'ArrowLeft':
            case 'KeyA':
                if(this.keydownTimes.a === 0) {
                    this.keydownTimes.a = performance.now();
                    // this._keyboardMove();
                    this._keyboardMove();
                }
                break;
            case 'ArrowRight':
            case 'KeyD':
                if(this.keydownTimes.d === 0) {
                    this.keydownTimes.d = performance.now();
                    this._keyboardMove();
                }
                break;
            case 'ArrowUp':
            case 'KeyW':
                if(this.keydownTimes.w === 0) {
                    this.keydownTimes.w = performance.now();
                    this._keyboardMove();
                }
                break;
            case 'ArrowDown':
            case 'KeyS':
                if(this.keydownTimes.s === 0) {
                    this.keydownTimes.s = performance.now();
                    this._keyboardMove();
                }
                break;
            }
        });
        this.listeners.keyup = window.addEventListener('keyup', (e) => {
            const keyCount = this._moveKeysPressedCount();
            switch(e.code) {
            case 'ArrowLeft':
            case 'KeyA':
                if(this.keydownTimes.a !== 0) {
                    this.keydownTimes.a = 0;
                    if(keyCount === 2) this.stopTwoKeyPressTime = performance.now();
                    this._keyboardMove();
                }
                break;
            case 'ArrowRight':
            case 'KeyD':
                if(this.keydownTimes.d !== 0) {
                    this.keydownTimes.d = 0;
                    if(keyCount === 2) this.stopTwoKeyPressTime = performance.now();
                    this._keyboardMove();
                }
                break;
            case 'ArrowUp':
            case 'KeyW':
                if(this.keydownTimes.w !== 0) {
                    this.keydownTimes.w = 0;
                    if(keyCount === 2) this.stopTwoKeyPressTime = performance.now();
                    this._keyboardMove();
                }
                break;
            case 'ArrowDown':
            case 'KeyS':
                if(this.keydownTimes.s !== 0) {
                    this.keydownTimes.s = 0;
                    if(keyCount === 2) this.stopTwoKeyPressTime = performance.now();
                    this._keyboardMove();
                }
                break;
            }
        });
    }

    _moveKeysPressedCount() {
        let keyCount = 0;
        if(this.keydownTimes.a) keyCount++;
        if(this.keydownTimes.d) keyCount++;
        if(this.keydownTimes.w) keyCount++;
        if(this.keydownTimes.s) keyCount++;
        return keyCount;
    }

    _keyboardMove() {
        let xPosMulti = 0, zPosMulti = 0, maxSpeedMultiplier = 1;
        const keyCount = this._moveKeysPressedCount();
        if(keyCount === 1) {
            if(this.keydownTimes.a) {
                xPosMulti = 1;
                zPosMulti = -1;
                this.direction = this.sceneState.utils.getCommonPIs('quarter');
            } else if(this.keydownTimes.d) {
                xPosMulti = -1;
                zPosMulti = 1;
                this.direction = this.sceneState.utils.getCommonPIs('piAndQuarter'); //
            } else if(this.keydownTimes.w) {
                xPosMulti = 1;
                zPosMulti = 1;
                this.direction = this.sceneState.utils.getCommonPIs('piAndThreeFourths'); //
            } else if(this.keydownTimes.s) {
                xPosMulti = -1;
                zPosMulti = -1;
                this.direction = this.sceneState.utils.getCommonPIs('threeFourths');
            }
        } else if(keyCount === 2) {
            if(this.keydownTimes.a && this.keydownTimes.w) {
                //xPosMulti = 1.25;
                xPosMulti = 1;
                this.direction = 0;
            } else if(this.keydownTimes.a && this.keydownTimes.s) {
                //zPosMulti = -1.25;
                zPosMulti = -1;
                this.direction = this.sceneState.utils.getCommonPIs('half');
            } else if(this.keydownTimes.d && this.keydownTimes.w) {
                //zPosMulti = 1.25;
                zPosMulti = 1;
                this.direction = this.sceneState.utils.getCommonPIs('threeHalves');
            } else if(this.keydownTimes.d && this.keydownTimes.s) {
                //xPosMulti = -1.25;
                xPosMulti = -1;
                this.direction = Math.PI;
            }
            xPosMulti *= 1.5;
            zPosMulti *= 1.5;
            maxSpeedMultiplier = 1.5;
            this.twoKeyDirection = this.direction;
        } else if(keyCount === 0) {
            if(performance.now() - this.stopTwoKeyPressTime < 50) {
                this.direction = this.twoKeyDirection;
            }
        }
        this.player.movePlayer2(xPosMulti, zPosMulti, this.direction, maxSpeedMultiplier);
    }
}

export default UserControls;