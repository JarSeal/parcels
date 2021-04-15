import * as THREE from 'three';
import { TimelineMax, Sine } from 'gsap-ssr';

class Player {
    constructor(sceneState, data) {
        this.sceneState = sceneState;
        this.rotatationTL = null;
        this.data = data;
        data.render = this.render;
        data.xPosMulti = 0;
        data.zPosMulti = 0;
        if(!this.sceneState.playerKeysCount) {
            this.sceneState.players = {};
            this.sceneState.playerKeys = [];
            this.sceneState.playerKeysCount = 0;
        }
    }

    create() {
        const data = this.data;
        this.sceneState.players[data.id] = data;
        this.sceneState.userPlayerId = data.id;
        this.sceneState.playerKeys.push(data.id);
        this.sceneState.playerKeysCount += 1;
        const pGeo = new THREE.BoxBufferGeometry(0.8, 1.82, 0.4);
        const pMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const pMesh = new THREE.Mesh(pGeo, pMat);
        pMesh.position.set(data.position[0], data.position[1], data.position[2]);
        const nGeo = new THREE.BoxBufferGeometry(0.1, 0.1, 0.1);
        const nMesh = new THREE.Mesh(nGeo, new THREE.MeshLambertMaterial({ color: 0x777777 }));
        nMesh.position.set(data.position[0], data.position[1], data.position[2]-0.2);
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
        const curRotation = this.data.mesh.rotation.y;
        if(curRotation < 0 && toDir > 0 && toDir - curRotation > Math.PI) {
            console.log('HERE1', curRotation, toDir, curRotation + 2 * Math.PI);
            this.data.mesh.rotation.y += 2 * Math.PI;
            console.log('MATKA', toDir - this.data.mesh.rotation.y);
        } else if(curRotation > 0 && toDir < 0 && curRotation - toDir > Math.PI) {
            this.data.mesh.rotation.y -= 2 * Math.PI;
        }
        if(curRotation === toDir) return;
        this.rotationTL = new TimelineMax().to(this.data.mesh.rotation, 0.1, {
            y: toDir,
            ease: Sine.easeInOut,
            onComplete: () => { this.rotationTL = null; },
        });
    }

    movePlayer(xPosMulti, zPosMulti, dir) {
        this._rotatePlayer(dir);
        this.data.xPosMulti = xPosMulti;
        this.data.zPosMulti = zPosMulti;
    }

    render = () => {
        const data = this.data;
        data.position[0] += data.xPosMulti * data.moveSpeed;
        data.position[2] += data.zPosMulti * data.moveSpeed;
        data.mesh.position.set(data.position[0], data.position[1], data.position[2]);
        if(data.userPlayer) {
            this.sceneState.cameras[this.sceneState.curScene].position.set(-10+data.position[0], 17+data.position[1], -10+data.position[2]);
            this.sceneState.cameras[this.sceneState.curScene].lookAt(new THREE.Vector3(data.position[0], data.position[1], data.position[2]));
        }
    }
}

export default Player;