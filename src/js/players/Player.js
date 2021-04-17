import * as THREE from 'three';
import * as CANNON from 'cannon';
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
        data.maxSpeedMultiplier = 1;
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
        const id = data.id;
        this.sceneState.players[id] = data;
        this.sceneState.userPlayerId = id;
        this.sceneState.playerKeys.push(id);
        this.sceneState.playerKeysCount += 1;
        const pos = data.position;
        const pGeo = new THREE.BoxBufferGeometry(0.4, 1.82, 0.8);
        const pMat = new THREE.MeshLambertMaterial({ color: 0x002f00 });
        const pMesh = new THREE.Mesh(pGeo, pMat);
        pMesh.position.set(pos[0], pos[1], pos[2]);
        const nGeo = new THREE.BoxBufferGeometry(0.1, 0.1, 0.1);
        const nMesh = new THREE.Mesh(nGeo, new THREE.MeshLambertMaterial({ color: 0x777777 }));
        nMesh.position.set(data.position[0]+0.2, data.position[1], data.position[2]);
        pMesh.add(nMesh);
        pMesh.name = id;
        data.mesh = pMesh;
        this.sceneState.scenes[this.sceneState.curScene].add(pMesh);

        // Add physics
        const boxMaterial = new CANNON.Material();
        boxMaterial.friction = 0.025;
        const boxBody = new CANNON.Body({
            mass: 90,
            position: new CANNON.Vec3(pos[0], 1.45, pos[2]),
            shape: new CANNON.Box(new CANNON.Vec3(0.8 / 2, 0.8 / 2, 0.8 / 2)),
            material: boxMaterial,
        });
        boxBody.allowSleep = true;
        boxBody.sleepSpeedLimit = 0.1;
        boxBody.sleepTimeLimit = 1;
        boxBody.bodyID = id;
        const updateFn = (shape) => {
            // shape.mesh.position.y = shape.body.position.y + 0.51;
            shape.mesh.position.copy(shape.body.position);
            shape.mesh.position.y = shape.body.position.y + 0.51;
            shape.body.quaternion.x = 0;
            shape.body.quaternion.z = 0;
            shape.body.quaternion.setFromEuler(0, shape.mesh.rotation.y, 0, 'XYZ');
            // shape.mesh.quaternion.copy(shape.body.quaternion);
        };
        data.body = boxBody;
        this.sceneState.physics.world.addBody(boxBody);
        this.sceneState.physics.shapes.push({ id, mesh: pMesh, body: boxBody, updateFn, data });
        this.sceneState.physics.shapesLength = this.sceneState.physics.shapes.length;
        if(this.sceneState.settings.physics.showPhysicsHelpers) {
            this.sceneState.physics.helper.addVisual(boxBody, 0xFFFF00);
        }
    }

    getDirection() {
        return this.data.direction;
    }

    _rotatePlayer(toDir) {
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
                this._normaliseRotation();
                this.data.direction = toDir;
                this.data.rotatingY = false;
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

    movePlayer2(xPosMulti, zPosMulti, dir, maxSpeedMultiplier) {
        this.data.body.wakeUp();
        this._rotatePlayer(dir);
        this.data.xPosMulti = xPosMulti;
        this.data.zPosMulti = zPosMulti;
        this.data.maxSpeedMultiplier = maxSpeedMultiplier;
        this.data.direction = dir;
    }

    render = () => {
        const data = this.data;
        // OLD KEYBOARD MOVE
        // data.position[0] += data.xPosMulti * data.moveSpeed;
        // data.position[2] += data.zPosMulti * data.moveSpeed;
        // data.mesh.position.set(data.position[0], data.position[1], data.position[2]);
        data.body.velocity.x += data.xPosMulti * data.moveSpeed;
        data.body.velocity.z += data.zPosMulti * data.moveSpeed;
        const maxSpeed = data.maxSpeed * this.data.maxSpeedMultiplier;
        if(data.body.velocity.x < 0 && data.body.velocity.x < -maxSpeed) {
            data.body.velocity.x = -maxSpeed;
        } else if(data.body.velocity.x > 0 && data.body.velocity.x > maxSpeed) {
            data.body.velocity.x = maxSpeed;
        }
        if(data.body.velocity.z < 0 && data.body.velocity.z < -maxSpeed) {
            data.body.velocity.z = -maxSpeed;
        } else if(data.body.velocity.z > 0 && data.body.velocity.z > maxSpeed) {
            data.body.velocity.z = maxSpeed;
        }
        if(data.userPlayer && this.sceneState.settings.debug.cameraFollowsPlayer) {
            this.sceneState.cameras[this.sceneState.curScene].position.set(-10+data.mesh.position.x, 17+data.mesh.position.y, -10+data.mesh.position.z);
            this.sceneState.cameras[this.sceneState.curScene].lookAt(new THREE.Vector3(data.mesh.position.x, data.mesh.position.y, data.mesh.position.z));
        }

        // Temp death...
        if(data.body.position.y < -50) {
            alert('WASTED!');
            data.body.position.y = 10;
            data.body.position.x = 0;
            data.body.position.z = 0;
            data.body.velocity.x = 0;
            data.body.velocity.z = 0;
        }
    }
}

export default Player;