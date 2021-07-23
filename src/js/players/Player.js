import * as THREE from 'three';
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
            THREE
        );
        this._addPushableBox(); // TEMPORARY
    }

    _addPushableBox() { // TEMPORARY
        const position = [21, 2, 8];

        const geo = new THREE.BoxBufferGeometry(1, 1, 1);
        const mat = new THREE.MeshLambertMaterial({ color: 0xcc5522 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(position[0], position[1], position[2]);
        this.sceneState.scenes[this.sceneState.curScene].add(mesh);

        this.sceneState.physicsClass.addShape({
            id: 'dummy-box-01',
            type: 'box',
            moving: true,
            mass: 50,
            size: [0.5, 0.5, 0.5],
            position,
            rotation: [0, 0, 0],
            material: { friction: 0.2 },
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
        if(this.rotationTL) {
            this.rotationTL.kill();
        }
        this.data.direction = this._bringRotationToRange(this.data.direction);
        let from = this._makeRotationPositive(this.data.direction);
        if(Math.abs(from - toDir) > Math.PI) {
            if(from > Math.PI) {
                from -= this.twoPI;
            } else {
                from += this.twoPI;
            }
        }
        const mesh = this.data.mesh.children[0];
        mesh.rotation.y = from;
        this.rotationTL = new TimelineMax().to(mesh.rotation, 0.2, {
            y: toDir,
            ease: Sine.easeInOut,
            onUpdate: () => {
                this.data.direction = this._bringRotationToRange(mesh.rotation.y);
            },
            onComplete: () => {
                this.rotationTL = null;
                this.data.direction = this._bringRotationToRange(toDir);
                this.data.direction = this._makeRotationPositive(this.data.direction);
                mesh.rotation.y = this.data.direction;
                this.data.rotatingY = false;
            },
        });
    }

    _makeRotationPositive(dir) {
        if(dir < 0) {
            dir += this.twoPI;
        }
        return dir;
    }

    _bringRotationToRange(curDir) {
        if(curDir >= this.twoPI) {
            curDir -= this.twoPI;
            return this._bringRotationToRange(curDir);
        } else if(curDir <= this.twoPI * -1) {
            curDir += this.twoPI;
            return this._bringRotationToRange(curDir);
        }
        return curDir;
    }

    movePlayer(xPosMulti, zPosMulti, dir, startTimes) {
        this._rotatePlayer(dir);
        xPosMulti /= 4;
        zPosMulti /= 4;
        this.data.xPosMulti = xPosMulti;
        this.data.zPosMulti = zPosMulti;
        this.data.moveStartTimes = startTimes;
        this.sceneState.additionalPhysicsData.push({
            phase: 'moveChar',
            data: {
                id: this.data.id,
                bodyIndex: this.data.bodyIndex,
                speed: this.data.speed,
                xPosMulti,
                zPosMulti,
                moveStartTimes: startTimes,
                direction: dir,
            },
        });
    }

    jump(timePressed) {
        const power = timePressed / timePressed;
        this.sceneState.additionalPhysicsData.push({
            phase: 'jumpChar',
            data: {
                id: this.data.id,
                bodyIndex: this.data.bodyIndex,
                power,
                jump: power * this.data.jump,
            },
        });
    }
}

export default Player;