import * as THREE from 'three';

class UserControls {
    constructor(sceneState, player) {
        this.sceneState = sceneState;
        this.player = player;
        this.listeners = {};
        this.keydownTimes = {
            a: 0, d: 0, w: 0, s: 0, jump: 0,
        };
        this.twoPI = sceneState.utils.getCommonPIs('twoPi');
        this.halfPI = sceneState.utils.getCommonPIs('half');
        this.direction = player.getDirection();
        this.stopTwoKeyPressTime = 0;
        this.twoKeyDirection = 0;
        this.rayclicker = new THREE.Raycaster();
        this.rayshooter = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.clickPlane = [];
        this._createClickPlane();
        this._initKeyListeners();
    }

    _createClickPlane() {
        const clickPlaneGeo = new THREE.PlaneBufferGeometry(256, 256, 1, 1);
        const clickPlaneMat = new THREE.MeshBasicMaterial({color: 0xff0000});
        const clickPlane = new THREE.Mesh(clickPlaneGeo, clickPlaneMat);
        clickPlane.position.x = 64;
        clickPlane.position.y = 0;
        clickPlane.position.z = 64;
        clickPlane.rotation.x = -Math.PI / 2;
        clickPlane.material.opacity = 0;
        clickPlane.material.transparent = true;
        this.sceneState.scenes[this.sceneState.curScene].add(clickPlane);
        this.clickPlane.push(clickPlane);
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
        const data = this.player.getPlayerData();
        const shotHeight = data.mesh.children[0].position.y;
        const maxDistance = 10;

        this.mouse.x = (parseInt(e.clientX) / document.documentElement.clientWidth) * 2 - 1;
        this.mouse.y = - (parseInt(e.clientY) / document.documentElement.clientHeight) * 2 + 1;
        this.rayclicker.setFromCamera(this.mouse, this.sceneState.cameras[this.sceneState.curScene]);
        const intersects = this.rayclicker.intersectObjects(this.clickPlane);
        const pos = intersects[0].point;
        const curPosX = data.mesh.children[0].position.x;
        const curPosZ = data.mesh.children[0].position.z;
        const distX = pos.x - curPosX;
        const distZ = pos.z - curPosZ;
        let a = Math.atan2(distX, distZ);
        if(a - this.halfPI < Math.PI) {
            a += Math.PI * 2 - this.halfPI;
        } else {
            a -= this.halfPI;
        }
        if(Math.abs(a - data.mesh.children[0].rotation.y) > Math.PI) {
            data.mesh.children[0].rotation.y > a
                ? data.mesh.children[0].rotation.y -= this.twoPI
                : a -= this.twoPI;
        }
        this.player.rotatePlayer(a);

        const startPoint = data.mesh.children[0].position;
        startPoint.y = shotHeight;
        const direction = new THREE.Vector3();
        direction.subVectors(new THREE.Vector3(pos.x, shotHeight, pos.z), startPoint).normalize();
        this.rayshooter.set(startPoint, direction);
        let intersectsLevel = this.rayshooter.intersectObjects(
            this.sceneState.levelAssets.lvlMeshes,
            true
        );

        if(intersectsLevel.length && intersectsLevel[0].distance > maxDistance) intersectsLevel = [];
        if(!intersectsLevel.length) {
            // shot into space or the distance to a wall is longer than the max distance
            const targetPos = [0,0];
            let dir;
            if(startPoint.z > pos.z && startPoint.x > pos.x) { dir = 1; } else
            if(startPoint.z < pos.z && startPoint.x > pos.x) { dir = 3; } else
            if(startPoint.z < pos.z && startPoint.x < pos.x) { dir = 5; } else
            if(startPoint.z > pos.z && startPoint.x < pos.x) { dir = 7; }
            const xLength = Math.abs(Math.cos(a) * maxDistance);
            const zLength = Math.abs(Math.sin(a) * maxDistance);
            dir > 4 ? targetPos[0] = startPoint.x + xLength : targetPos[0] = startPoint.x - xLength;
            dir > 2 && dir < 6 ? targetPos[1] = startPoint.z + zLength : targetPos[1] = startPoint.z - zLength;
            intersectsLevel.push({
                point: {
                    x: targetPos[0],
                    y: shotHeight,
                    z: targetPos[1],
                },
                distance: maxDistance,
            });
        }

        const point = intersectsLevel[0].point;
        const material = new THREE.LineBasicMaterial({ color: 0x0000ff });
        const points = [];
        points.push(startPoint);
        points.push(new THREE.Vector3(point.x, shotHeight, point.z));
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, material);
        this.sceneState.scenes[this.sceneState.curScene].add(line);
        setTimeout(() => {
            line.material.dispose();
            geometry.dispose();
            this.sceneState.scenes[this.sceneState.curScene].remove(line);
        }, 2000);

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