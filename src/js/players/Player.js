import * as THREE from 'three';

class Player {
    constructor(sceneState, data) {
        this.sceneState = sceneState;
        this.data = data;
        data.render = this.render;
        if(!this.sceneState.playerKeysCount) {
            this.sceneState.players = {};
            this.sceneState.playerKeys = [];
            this.sceneState.playerKeysCount = 0;
        }
    }

    create() {
        const data = this.data;
        this.sceneState.players[data.id] = data;
        this.sceneState.playerKeys.push(data.id);
        this.sceneState.playerKeysCount += 1;
        const pGeo = new THREE.BoxBufferGeometry(0.8, 1.82, 0.4);
        const pMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const pMesh = new THREE.Mesh(pGeo, pMat);
        pMesh.position.set(data.position[0], data.position[1], data.position[2]);
        data.mesh = pMesh;
        this.sceneState.scenes[this.sceneState.curScene].add(pMesh);
    }

    move(dir, time) {
        if(time === 0) {
            this.data.moveKeysPressed -= 1;
        } else {
            this.data.moveKeysPressed += 1;
        }
        switch(dir) {
        case 'left':
            this.data.movingLeft = time;
            break;
        case 'right':
            this.data.movingRight = time;
            break;
        case 'up':
            this.data.movingUp = time;
            break;
        case 'down':
            this.data.movingDown = time;
            break;
        }
        console.log('keys pressed', this.data.moveKeysPressed);
    }

    render = () => {
        const data = this.data;
        const speed = data.moveKeysPressed > 1 ? data.moveSpeed * 1.25 : data.moveSpeed;
        if(data.moveKeysPressed === 1) {
            if(data.movingLeft) {
                data.position[0] += speed;
                data.position[2] -= speed;
            }
            if(data.movingRight) {
                data.position[0] -= speed;
                data.position[2] += speed;
            }
            if(data.movingUp) {
                data.position[0] += speed;
                data.position[2] += speed;
            }
            if(data.movingDown) {
                data.position[0] -= speed;
                data.position[2] -= speed;
            }
        } else {
            if(data.movingLeft && data.movingUp) {
                data.position[0] += speed;
            }
            if(data.movingLeft && data.movingDown) {
                data.position[2] -= speed;
            }
            if(data.movingRight && data.movingUp) {
                data.position[2] += speed;
            }
            if(data.movingRight && data.movingDown) {
                data.position[0] -= speed;
            }
            // if(data.movingRight) data.position[0] -= speed;
            // if(data.movingUp) data.position[2] += speed;
            // if(data.movingDown) data.position[2] -= speed;
        }
        data.mesh.position.set(data.position[0], data.position[1], data.position[2]);
    }
}

export default Player;