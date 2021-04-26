import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { TimelineMax, Sine } from 'gsap-ssr';

class Player {
    constructor(sceneState, data) {
        this.sceneState = sceneState;
        this.rotatationTL = null;
        this.twoPI = sceneState.utils.getCommonPIs('twoPi');
        this.halfPI = sceneState.utils.getCommonPIs('half');
        this.data = data;
        data.render = this.render;
        data.xPosMulti = 0;
        data.zPosMulti = 0;
        data.direction = 0;
        data.maxSpeedMultiplier = 1;
        data.moveStartTimes = {
            startX: 0,
            startZ: 0,
        };
        if(!this.sceneState.playerKeysCount) {
            this.sceneState.players = {};
            this.sceneState.playerKeys = [];
            this.sceneState.playerKeysCount = 0;
        }
        this.line;
    }

    create() {
        this.data.createPlayerFn(
            this.data,
            this.sceneState,
            THREE,
            CANNON
        );
        this._addPushableBox(this.data.position); // TEMPORARY
    }

    _addPushableBox(pos) { // TEMPORARY
        const position = [pos[0]-2, 20, pos[2]-2];

        const geo = new THREE.BoxBufferGeometry(1, 1, 1);
        const mat = new THREE.MeshLambertMaterial({ color: 0xcc5522 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(position[0], position[1], position[2]);
        this.sceneState.scenes[this.sceneState.curScene].add(mesh);

        this.sceneState.physics.newShape({
            id: 'dummy-box-01',
            type: 'box',
            moving: true,
            mass: 20,
            size: [0.5, 0.5, 0.5],
            position,
            quaternion: null,
            rotation: [0, 0, 0],
            material: { friction: 0.06 },
            updateFn: null,
            mesh,
            sleep: {
                allowSleep: true,
                sleeSpeedLimit: 0.1,
                sleepTimeLimit: 1,
            },
        });
    }

    getDirection() {
        return this.data.direction;
    }

    _rotatePlayer(toDir) {
        this.data.rotatingY = true;
        if(this.rotatationTL) {
            this.rotatationTL.kill();
        }
        const from = this.data.direction;
        if(Math.abs(from - toDir) > Math.PI) {
            if(toDir > 0) {
                toDir -= this.twoPI;
            } else {
                toDir += this.twoPI;
            }
        }
        this.rotationTL = new TimelineMax().to(this.data, 0.1, {
            direction: toDir,
            ease: Sine.easeInOut,
            onComplete: () => {
                this.rotationTL = null;
                this._normaliseRotation();
                this.data.direction = toDir;
                this.data.rotatingY = false;
            },
        });
    }

    _rotatePlayer2(toDir) {
        this.data.rotatingY = true;
        if(this.rotatationTL) {
            this.rotatationTL.kill();
        }
        const from = this.data.mesh.rotation.y;
        if(Math.abs(from - toDir) > Math.PI) {
            if(toDir > 0) {
                toDir -= this.twoPI;
            } else {
                toDir += this.twoPI;
            }
        }
        this.rotationTL = new TimelineMax().to(this.data.mesh.rotation, 0.1, {
            y: toDir,
            ease: Sine.easeInOut,
            onComplete: () => {
                this.rotationTL = null;
                this._normaliseRotation2();
                this.data.direction = toDir;
                this.data.rotatingY = false;
            },
        });
    }

    _normaliseRotation() {
        const curRotation = this.data.direction;
        if(curRotation > Math.PI) {
            this.data.direction -= this.twoPI;
            this._normaliseRotation();
        } else if(curRotation < -Math.PI) {
            this.data.direction += this.twoPI;
            this._normaliseRotation();
        }
    }

    _normaliseRotation2() {
        const curRotation = this.data.mesh.rotation.y;
        if(curRotation > Math.PI) {
            this.data.mesh.rotation.y -= this.twoPI;
            this._normaliseRotation();
        } else if(curRotation < -Math.PI) {
            this.data.mesh.rotation.y += this.twoPI;
            this._normaliseRotation();
        }
    }

    movePlayer(xPosMulti, zPosMulti, dir) {
        this._rotatePlayer(dir);
        this.data.xPosMulti = xPosMulti;
        this.data.zPosMulti = zPosMulti;
        // this.data.direction = dir;
    }

    movePlayer2(xPosMulti, zPosMulti, dir, maxSpeedMultiplier, startTimes) {
        this.data.body.wakeUp();
        this._rotatePlayer(dir);
        this.data.xPosMulti = xPosMulti;
        this.data.zPosMulti = zPosMulti;
        this.data.maxSpeedMultiplier = maxSpeedMultiplier;
        this.data.moveStartTimes = startTimes;
    }

    render = (timeStep) => {
        this.data.renderFn(
            timeStep,
            this.data,
            this.sceneState,
            THREE
        );
    }
}

export default Player;