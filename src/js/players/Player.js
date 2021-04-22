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
        data.direction = 0;
        data.maxSpeedMultiplier = 1;
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
        const geo = new THREE.BoxBufferGeometry(1, 1, 1);
        const mat = new THREE.MeshLambertMaterial({ color: 0xcc5522 });
        const mesh = new THREE.Mesh(geo, mat);
        this.sceneState.scenes[this.sceneState.curScene].add(mesh);

        const boxMaterial = new CANNON.Material();
        boxMaterial.friction = 0.06;
        const boxBody = new CANNON.Body({
            mass: 20,
            position: new CANNON.Vec3(pos[0]-2, 2, pos[2]-2),
            shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5)),
            material: boxMaterial,
        });
        boxBody.allowSleep = true;
        boxBody.sleepSpeedLimit = 0.1;
        boxBody.sleepTimeLimit = 1;
        const updateFn = (shape) => {
            mesh.position.copy(shape.body.position);
            mesh.quaternion.copy(shape.body.quaternion);
        };
        const id = 'dummy-box-01';
        this.sceneState.physics.world.addBody(boxBody);
        this.sceneState.physics.shapes.push({ id, mesh, body: boxBody, updateFn, data: {} });
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
        this.data.direction = dir;
    }

    movePlayer2(xPosMulti, zPosMulti, dir, maxSpeedMultiplier) {
        this.data.body.wakeUp();
        this._rotatePlayer(dir);
        this.data.xPosMulti = xPosMulti;
        this.data.zPosMulti = zPosMulti;
        this.data.maxSpeedMultiplier = maxSpeedMultiplier;
        // this.data.direction = dir;
    }

    render = () => {
        const data = this.data;
        if(!data.xPosMulti) data.body.velocity.x = 0;
        if(!data.zPosMulti) data.body.velocity.z = 0;
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
        data.mesh.position.copy(data.body.position);
        // data.mesh.quaternion.copy(data.body.quaternion);
        data.body.quaternion.setFromEuler(
            data.mesh.rotation.x,
            data.direction,
            data.mesh.rotation.z,
            'XYZ'
        );
        data.mesh.rotation.y = data.direction;
        if(data.userPlayer && this.sceneState.settings.debug.cameraFollowsPlayer) {
            const camera = this.sceneState.cameras[this.sceneState.curScene];
            camera.position.set(
                camera.userData.followXOffset+data.body.position.x,
                camera.userData.followYOffset+data.body.position.y,
                camera.userData.followZOffset+data.body.position.z
            );
            camera.lookAt(new THREE.Vector3(data.body.position.x, data.body.position.y, data.body.position.z));
        }

        // Temp death...
        if(data.body.position.y < -50) {
            alert('WASTED!');

            // position
            data.body.position.y = 10;
            data.body.position.x = 0;
            data.body.position.z = 0;

            // orientation
            data.body.quaternion.set(0,0,0,1);
            data.body.initQuaternion.set(0,0,0,1);
            data.body.previousQuaternion.set(0,0,0,1);
            data.body.interpolatedQuaternion.set(0,0,0,1);

            // Velocity
            data.body.velocity.setZero();
            data.body.initVelocity.setZero();
            data.body.angularVelocity.setZero();
            data.body.initAngularVelocity.setZero();
        }
    }
}

export default Player;