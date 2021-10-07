import * as THREE from 'three';
import { TimelineMax, Sine } from 'gsap-ssr';
import projectileWeapon from '../data/weapons/projectile01';

class Player {
    constructor(sceneState, data) {
        this.sceneState = sceneState;
        this.rotatationTL = null;
        this.skinAnimTLs = {};
        this.skinAnimPhasesRunning = {};
        this.twoPI = sceneState.utils.getCommonPIs('twoPi');
        this.halfPI = sceneState.utils.getCommonPIs('half');
        this.data = data;
        this.curWeapon = projectileWeapon;
        this.rayshooter = new THREE.Raycaster();
        this.previousPos = {
            x: 0,
            z: 0,
        };
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
        if(!this.sceneState.mixers) {
            this.sceneState.mixers = [];
            this.sceneState.mixersCount = 0;
        }
    }

    create() {
        this._createPlayerCharacter();
        this._addPushableBox(); // TEMPORARY
    }

    _createPlayerCharacter() {
        const id = this.data.id;
        this.sceneState.players[id] = this.data;
        this.sceneState.userPlayerId = id;
        this.sceneState.userPlayerIndex = null;
        this.sceneState.playerKeys.push(id);
        this.sceneState.playerKeysCount += 1;

        const mainMeshName = id + '-' + 'mainchild';
        const model = this.data.gltf.scene.children[0];
        const mixer = new THREE.AnimationMixer(model);
        const fileAnimations = this.data.gltf.animations,
            idleAnim = THREE.AnimationClip.findByName(fileAnimations, 'Idle'),
            idle = mixer.clipAction(idleAnim),
            runAnim = THREE.AnimationClip.findByName(fileAnimations, 'Run2'),
            run = mixer.clipAction(runAnim);
        this.sceneState.mixers.push(mixer);
        this.sceneState.mixersCount++;
        this.data.anims = {
            idle, run
        };

        const pos = this.data.position;
        const group = new THREE.Group();
        model.children[1].material.dispose();
        model.children[1].material = new THREE.MeshLambertMaterial({
            map: this.data.texture,
            skinning: true,
            side: THREE.DoubleSide,
            color: new THREE.Color(0xbbbbbb)
        });
        model.children[1].material.map.flipY = false;
        model.position.y = this.data.createValues.yOffset;
        model.rotation.z = this.data.createValues.zRotation;
        model.scale.set(this.data.createValues.scale, this.data.createValues.scale, this.data.createValues.scale);

        const pGeo = new THREE.BoxBufferGeometry(0.7, this.data.charHeight, 0.8);
        const pMesh = new THREE.Mesh(pGeo, new THREE.MeshBasicMaterial({ visible: false }));
        pMesh.position.set(pos[0], pos[1], pos[2]);
        pMesh.name = mainMeshName;
        pMesh.add(model);
        group.name = id;
        group.add(pMesh);
        this.data.mesh = group;
        this.sceneState.scenes[this.sceneState.curScene].add(group);

        this.sceneState.physicsClass.addShape({
            id: mainMeshName,
            type: 'compound',
            moving: true,
            mass: 70,
            position: [pos[0], pos[1], pos[2]],
            startPosition: [pos[0], pos[1], pos[2]],
            rotation: [0, 0, 0],
            material: { friction: 0.2 },
            movingShape: true,
            updateFn: (shape) => {
                if(this.sceneState.settings.debug.cameraFollowsPlayer) {
                    const camera = this.sceneState.cameras[this.sceneState.curScene];
                    camera.position.set(
                        camera.userData.followXOffset+shape.mesh.position.x,
                        camera.userData.followYOffset+shape.mesh.position.y,
                        camera.userData.followZOffset+shape.mesh.position.z
                    );
                    camera.lookAt(new THREE.Vector3(
                        shape.mesh.position.x,
                        shape.mesh.position.y,
                        shape.mesh.position.z
                    ));
                }
                // Temp death...
                if(shape.mesh.position.y < -50 && !shape.mesh.userData.reload) {
                    console.log('WASTED!');
                    this.sceneState.additionalPhysicsData.push({
                        phase: 'resetPosition',
                        data: {
                            bodyIndex: shape.characterData.bodyIndex,
                            position: shape.startPosition,
                            sleep: false,
                        },
                    });
                }

                const startX = shape.characterData.moveStartTimes.startX;
                const startZ = shape.characterData.moveStartTimes.startZ;
                // Check if change in in the air property
                if(shape.inTheAir) {
                    // Jumping or dropping
                    if(startX !== 0 || startZ !== 0) {
                        if(!this.skinAnimPhasesRunning.runToIdle) {
                            this.skinAnimPhasesRunning.idleToRun = false;
                            if(this.skinAnimTLs.run) this.skinAnimTLs.run.kill();
                            this.skinAnimTLs.run = new TimelineMax().to(this.data.anims.run, 0.4, {
                                weight: 0,
                                ease: Sine.easeInOut,
                                onUpdate: () => {
                                    this.data.anims.idle.weight = 1 - this.data.anims.run.weight; // Change this to dropping animation
                                },
                                onComplete: () => {
                                    this.skinAnimPhasesRunning.runToIdle = false; // Change to runToDropping = false
                                },
                            });
                            this.skinAnimPhasesRunning.runToIdle = true; // Change to runToDropping = true
                        }
                    }
                } else {
                    // On the ground, stopping or moving (running)
                    if(startX === 0 && startZ === 0) {
                        if(!this.skinAnimPhasesRunning.runToIdle) {
                            this.skinAnimPhasesRunning.idleToRun = false;
                            if(this.skinAnimTLs.run) this.skinAnimTLs.run.kill();
                            this.skinAnimTLs.run = new TimelineMax().to(this.data.anims.run, 0.4, {
                                weight: 0,
                                ease: Sine.easeInOut,
                                onUpdate: () => {
                                    this.data.anims.idle.weight = 1 - this.data.anims.run.weight;
                                },
                                onComplete: () => {
                                    this.skinAnimPhasesRunning.runToIdle = false;
                                },
                            });
                            this.skinAnimPhasesRunning.runToIdle = true;
                        }
                    } else {
                        if(!this.skinAnimPhasesRunning.idleToRun) {
                            this.skinAnimPhasesRunning.runToIdle = false;
                            if(this.skinAnimTLs.run) this.skinAnimTLs.run.kill();
                            this.skinAnimTLs.run = new TimelineMax().to(this.data.anims.run, 0.2, {
                                weight: 1,
                                ease: Sine.easeInOut,
                                onUpdate: () => {
                                    this.data.anims.idle.weight = 1 - this.data.anims.run.weight;
                                },
                                onComplete: () => {
                                    this.skinAnimPhasesRunning.idleToRun = false;
                                },
                            });
                            this.skinAnimPhasesRunning.idleToRun = true;
                        }
                    }
                }
                if(shape.inTheAirUpdateTime + 1000 > this.sceneState.atomClock.getTime()) {
                    if(shape.inTheAir) {
                        // console.log(shape);
                        // if(this.skinAnimTLs.run) this.skinAnimTLs.run.kill();
                        // this.skinAnimTLs.run = new TimelineMax().to(this.data.anims.run, 0.2, {
                        //     weight: 0,
                        //     ease: Sine.easeInOut,
                        //     onUpdate: () => {
                        //         this.data.anims.idle.weight = 1 - this.data.anims.run.weight;
                        //     },
                        // });
                    }
                }
            },
            mesh: pMesh,
            fixedRotation: true,
            sleep: {
                allowSleep: true,
                sleeSpeedLimit: 0.1,
                sleepTimeLimit: 1,
            },
            characterData: this.data,
        });

        this.sceneState.consClass.addEntity({
            id: mainMeshName,
            type: 'box',
            size: [this.data.charHeight / 2, this.data.charHeight, this.data.charHeight / 2],
            position: pos,
        });

        // Make the actual capsule shape
        this.sceneState.physicsClass.addShape({
            id: id + '_comp_cylinder',
            compoundParentId: mainMeshName,
            type: 'cylinder',
            radiusTop: this.data.charHeight / 4,
            radiusBottom: this.data.charHeight / 4,
            height: this.data.charHeight / 2,
            numSegments: 32,
            position: [0, 0, 0],
            helperColor: 0xcc1122,
        });
        this.sceneState.physicsClass.addShape({
            id: id + '_comp_sphereLower',
            compoundParentId: mainMeshName,
            type: 'sphere',
            radius: this.data.charHeight / 4,
            position: [0, -this.data.charHeight / 4, 0],
            helperColor: 0xcc1122,
        });
        this.sceneState.physicsClass.addShape({
            id: id + '_comp_sphereUpper',
            compoundParentId: mainMeshName,
            type: 'sphere',
            radius: this.data.charHeight / 4,
            position: [0, this.data.charHeight / 4, 0],
            helperColor: 0xcc1122,
        });

        this.data.anims.idle.play();
        this.data.anims.idle.weight = 1;
        this.data.anims.run.play();
        this.data.anims.run.weight = 0;
        this.data.anims.run.timeScale = this.data.runAnimScale;
        this.skinAnimTLs.idle = null;
        this.skinAnimTLs.run = null;
        console.log(this.data.anims);
    }

    _addPushableBox() { // TEMPORARY
        let position = [21, 2, 9];

        const geo = new THREE.BoxBufferGeometry(1, 1, 1);
        const mat = new THREE.MeshLambertMaterial({ color: 0xcc5522 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(position[0], position[1], position[2]);
        this.sceneState.scenes[this.sceneState.curScene].add(mesh);

        const id = 'dummy-box-01';
        mesh.name = id;
        this.sceneState.physicsClass.addShape({
            id: id,
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
        this.sceneState.consClass.addEntity({
            id: id,
            type: 'box',
            size: [1, 1, 1],
            position: position,
        });

        position = [14, 2, 6];
        const id2 = 'dummy-box-02';
        const geo2 = new THREE.BoxBufferGeometry(1, 1, 1);
        const mat2 = new THREE.MeshLambertMaterial({ color: 0xe27412 });
        const mesh2 = new THREE.Mesh(geo2, mat2);
        mesh2.name = id2;
        mesh2.position.set(position[0], position[1], position[2]);
        this.sceneState.scenes[this.sceneState.curScene].add(mesh2);
        this.sceneState.physicsClass.addShape({
            id: id2,
            type: 'box',
            moving: true,
            mass: 50,
            size: [0.5, 0.5, 0.5],
            position,
            rotation: [0, 0, 0],
            material: { friction: 0.2 },
            mesh: mesh2,
            sleep: {
                allowSleep: true,
                sleeSpeedLimit: 0.1,
                sleepTimeLimit: 1,
            },
        });
        this.sceneState.consClass.addEntity({
            id: id2,
            type: 'box',
            size: [1, 1, 1],
            position: position,
        });
    }

    getPlayerData() {
        return this.data;
    }

    getDirection() {
        return this.data.direction;
    }

    rotatePlayer(toDir) {
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
                this.sceneState.consClass.updateEntityData(
                    [mesh.position.x, mesh.position.y, mesh.position.z],
                    [mesh.quaternion.x, mesh.quaternion.y, mesh.quaternion.z, mesh.quaternion.w],
                    mesh.name
                );
            },
            onComplete: () => {
                this.rotationTL = null;
                this.data.direction = this._bringRotationToRange(toDir);
                this.data.direction = this._makeRotationPositive(this.data.direction);
                mesh.rotation.y = this.data.direction;
                this.data.rotatingY = false;
                this.sceneState.consClass.updateEntityData(
                    [mesh.position.x, mesh.position.y, mesh.position.z],
                    [mesh.quaternion.x, mesh.quaternion.y, mesh.quaternion.z, mesh.quaternion.w],
                    mesh.name
                );
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
        this.rotatePlayer(dir);
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

    shoot(pos) {
        const data = this.data;
        const shotHeight = data.mesh.children[0].position.y;
        const maxDistance = this.curWeapon.maxDistance;

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
        this.rotatePlayer(a);

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
                point: new THREE.Vector3(targetPos[0], shotHeight, targetPos[1]),
                distance: maxDistance,
            });
        }

        const point = intersectsLevel[0].point;
        const distance = intersectsLevel[0].distance;

        // Debugging projectiles with lines/streaks:
        if(this.sceneState.settings.debug.showProjectileStreaks) {
            const material = new THREE.LineBasicMaterial({ color: 0xff2ccc });
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
        }

        this.sceneState.projectiles.newProjectile(
            new THREE.Vector3(curPosX, shotHeight, curPosZ),
            point,
            distance,
            this.curWeapon,
            intersectsLevel[0]
        );
    }
}

export default Player;