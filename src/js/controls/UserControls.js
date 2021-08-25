import * as THREE from 'three';

class UserControls {
    constructor(sceneState, player) {
        this.sceneState = sceneState;
        this.player = player;
        this.listeners = {};
        this.keydownTimes = {
            a: 0, d: 0, w: 0, s: 0, jump: 0,
        };
        this.direction = player.getDirection();
        this.stopTwoKeyPressTime = 0;
        this.twoKeyDirection = 0;
        this.rayclicker = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.clickPlanes = [];
        this._createClickPlane();
        this._initKeyListeners();
    }

    _createClickPlane() {
        const clickPlaneGeo = new THREE.PlaneBufferGeometry(256, 256, 1, 1);
        const clickPlaneMat = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            depthWrite: false,
            depthTest: false,
        });
        const clickPlane = new THREE.Mesh(clickPlaneGeo, clickPlaneMat);
        clickPlane.position.x = 64;
        clickPlane.position.y = 0;
        clickPlane.position.z = 64;
        clickPlane.rotation.x = -Math.PI / 2;
        clickPlane.material.opacity = 0;
        clickPlane.material.transparent = true;
        clickPlane.name = 'level-clickPlane';
        this.sceneState.scenes[this.sceneState.curScene].add(clickPlane);
        this.clickPlanes.push(clickPlane);
    }

    _initKeyListeners() {
        this.listeners.keydown = window.addEventListener('keydown', (e) => {
            if(this.sceneState.loadingLevel) return;
            // console.log('keydown', e);
            switch(e.code) {
            case 'ArrowLeft':
            case 'KeyA':
                if(this.keydownTimes.a === 0) {
                    this.keydownTimes.a = performance.now();
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
            case 'Space':
                this.keydownTimes.jump = performance.now();
                break;
            }
        });
        this.listeners.keyup = window.addEventListener('keyup', (e) => {
            if(this.sceneState.loadingLevel) return;
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
            case 'Space':
                this._keyboardJump();
                break;
            }
        });
        this.listeners.mouseup = document.getElementById('main-stage')
            .addEventListener('mouseup', (e) => { this._mouseClickOnStage(e); });
        document.addEventListener('contextmenu', e => e.preventDefault()); // Disable right click context menu
        window.addEventListener('blur', () => { // Stop all user player movement after the window/tab goes out of focus (blur)
            this.keydownTimes.a = this.keydownTimes.w = this.keydownTimes.s = this.keydownTimes.d = 0;
            if(this._moveKeysPressedCount() === 2) this.stopTwoKeyPressTime = performance.now();
            this.player.movePlayer(
                0,
                0,
                this.player.getDirection(),
                {
                    startX: 0,
                    startZ: 0,
                }
            );
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
        let xPosMulti = 0, zPosMulti = 0;
        const keyCount = this._moveKeysPressedCount();
        if(keyCount === 1) {
            if(this.keydownTimes.a) {
                xPosMulti = -1;
                zPosMulti = 1;
                this.direction = this.sceneState.utils.getCommonPIs('piAndQuarter');
            } else if(this.keydownTimes.d) {
                xPosMulti = 1;
                zPosMulti = -1;
                this.direction = this.sceneState.utils.getCommonPIs('quarter');
            } else if(this.keydownTimes.w) {
                xPosMulti = -1;
                zPosMulti = -1;
                this.direction = this.sceneState.utils.getCommonPIs('threeFourths');
            } else if(this.keydownTimes.s) {
                xPosMulti = 1;
                zPosMulti = 1;
                this.direction = this.sceneState.utils.getCommonPIs('piAndThreeFourths');
            }
        } else if(keyCount === 2) {
            if(this.keydownTimes.a && this.keydownTimes.w) {
                xPosMulti = -1;
                this.direction = Math.PI;
            } else if(this.keydownTimes.a && this.keydownTimes.s) {
                zPosMulti = 1;
                this.direction = this.sceneState.utils.getCommonPIs('threeHalves');
            } else if(this.keydownTimes.d && this.keydownTimes.w) {
                zPosMulti = -1;
                this.direction = this.sceneState.utils.getCommonPIs('half');
            } else if(this.keydownTimes.d && this.keydownTimes.s) {
                xPosMulti = 1;
                this.direction = 0;
            }
            xPosMulti *= 1.5;
            zPosMulti *= 1.5;
            this.twoKeyDirection = this.direction;
        } else if(keyCount === 0) {
            if(performance.now() - this.stopTwoKeyPressTime < 50) {
                this.direction = this.twoKeyDirection;
            }
        }
        const startTime = performance.now();
        this.player.movePlayer(
            xPosMulti,
            zPosMulti,
            this.direction,
            {
                startX: xPosMulti ? startTime : 0,
                startZ: zPosMulti ? startTime : 0,
            }
        );
    }

    _keyboardJump() {
        const timePressed = performance.now() - this.keydownTimes.jump;
        this.keydownTimes.jump = 0;
        this.player.jump(timePressed);
    }

    _mouseClickOnStage(e) {
        e.preventDefault();

        this.mouse.x = (parseInt(e.clientX) / document.documentElement.clientWidth) * 2 - 1;
        this.mouse.y = - (parseInt(e.clientY) / document.documentElement.clientHeight) * 2 + 1;
        this.rayclicker.setFromCamera(this.mouse, this.sceneState.cameras[this.sceneState.curScene]);
        const intersects = this.rayclicker.intersectObjects(this.clickPlanes);
        const pos = intersects[0].point;

        this.player.shoot(pos);

        // NOTE:::::: THIS IS FOR CLICKING ON A TILE WITH AUTO MOVE ENABLED (TODO)!!!! THIS WILL HIGHLIGHT THE TILE!
        // const tileX = Math.floor(pos.x);
        // const tileZ = Math.floor(pos.z);
        // const geo = new THREE.PlaneBufferGeometry(1, 1, 1, 1);
        // const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        // const mesh = new THREE.Mesh(geo, mat);
        // mesh.rotation.x = -Math.PI / 2;
        // mesh.position.x = tileX + 0.5;
        // mesh.position.y = 0.1;
        // mesh.position.z = tileZ + 0.5;
        // this.sceneState.scenes[this.sceneState.curScene].add(mesh);
    }
}

export default UserControls;