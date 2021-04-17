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
        this.rayCastLeft = new THREE.Raycaster();
        this.rayCastLeft.far = 2;
        if(!this.sceneState.playerKeysCount) {
            this.sceneState.players = {};
            this.sceneState.playerKeys = [];
            this.sceneState.playerKeysCount = 0;
        }
        this.line;
    }

    create() {
        const data = this.data;
        this.sceneState.players[data.id] = data;
        this.sceneState.userPlayerId = data.id;
        this.sceneState.playerKeys.push(data.id);
        this.sceneState.playerKeysCount += 1;
        const pGeo = new THREE.BoxBufferGeometry(0.4, 1.82, 0.8);
        const pMat = new THREE.MeshLambertMaterial({ color: 0x002f00 });
        const pMesh = new THREE.Mesh(pGeo, pMat);
        pMesh.position.set(data.position[0], data.position[1], data.position[2]);
        const nGeo = new THREE.BoxBufferGeometry(0.1, 0.1, 0.1);
        const nMesh = new THREE.Mesh(nGeo, new THREE.MeshLambertMaterial({ color: 0x777777 }));
        nMesh.position.set(data.position[0]+0.2, data.position[1], data.position[2]);
        pMesh.add(nMesh);
        data.mesh = pMesh;
        this.sceneState.scenes[this.sceneState.curScene].add(pMesh);
    }

    getDirection() {
        return this.data.direction;
    }

    _rotatePlayer(toDir) {
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
                this._normaliseRotation();
                this.data.direction = toDir;
            },
        });
    }

    _normaliseRotation() {
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
        this.data.direction = dir;
    }

    _collision(data) {
        const angle = data.direction + this.halfPI;
        const distance = 2;
        const collisionThreshold = 0.4;
        const newX = data.position[0] + (distance * Math.sin(angle));
        const newZ = data.position[2] + (distance * Math.cos(angle));
        const startPos = new THREE.Vector3(data.position[0], data.position[1], data.position[2]);
        const targetPos = new THREE.Vector3(newX, data.position[1], newZ);
        this.rayCastLeft.set(startPos, targetPos);
        let intersect = [];
        if(this.sceneState.curLevelMesh) {
            intersect = this.rayCastLeft.intersectObject(this.sceneState.curLevelMesh);
        }
        
        const geometry = new THREE.BufferGeometry().setFromPoints([startPos, targetPos]);
        const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
        if(this.line) {
            this.line.geometry.dispose();
            this.line.material.dispose();
            this.sceneState.scenes[this.sceneState.curScene].remove(this.line);
        }
        this.line = new THREE.Line(geometry, material);
        this.sceneState.scenes[this.sceneState.curScene].add(this.line);
        
        if(intersect[0] && intersect[0].distance < collisionThreshold) {
            console.log('tadaa', intersect);
        }

        return intersect[0] && intersect[0].distance < collisionThreshold;
    }

    render = () => {
        const data = this.data;
        // if(!this._collision(data)) {
        data.position[0] += data.xPosMulti * data.moveSpeed;
        data.position[2] += data.zPosMulti * data.moveSpeed;
        data.mesh.position.set(data.position[0], data.position[1], data.position[2]);
        if(data.userPlayer && this.sceneState.settings.debug.cameraFollowsPlayer) {
            this.sceneState.cameras[this.sceneState.curScene].position.set(-10+data.position[0], 17+data.position[1], -10+data.position[2]);
            this.sceneState.cameras[this.sceneState.curScene].lookAt(new THREE.Vector3(data.position[0], data.position[1], data.position[2]));
        }
    }
}

export default Player;