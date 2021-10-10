import * as THREE from 'three';
import { TimelineMax, Sine } from 'gsap-ssr';

class Humanoid {
    constructor(sceneState, data) {
        this.sceneState = sceneState;
        this.data = data;
        this.skinAnimTLs = {};
        this.skinAnimPhasesRunning = {};
        this.fallDistanceRay = new THREE.Raycaster();

        this._create();
    }

    _create() {
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
            runAnim = THREE.AnimationClip.findByName(fileAnimations, 'Run'),
            run = mixer.clipAction(runAnim),
            fallAnim = THREE.AnimationClip.findByName(fileAnimations, 'Fall'),
            fall = mixer.clipAction(fallAnim),
            jumpStillAnim = THREE.AnimationClip.findByName(fileAnimations, 'JumpStill'),
            jumpStill = mixer.clipAction(jumpStillAnim),
            jumpMovingRightAnim = THREE.AnimationClip.findByName(fileAnimations, 'JumpMovingRight'),
            jumpMovingRight = mixer.clipAction(jumpMovingRightAnim),
            jumpMovingLeftAnim = THREE.AnimationClip.findByName(fileAnimations, 'JumpMovingLeft'),
            jumpMovingLeft = mixer.clipAction(jumpMovingLeftAnim),
            landingAnim = THREE.AnimationClip.findByName(fileAnimations, 'Landing'),
            landing = mixer.clipAction(landingAnim);
        this.sceneState.mixers.push(mixer);
        this.sceneState.mixersCount++;
        this.data.anims = {
            idle, run, fall, jumpStill, jumpMovingRight, jumpMovingLeft, landing
        };
        console.log('Debug2');

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
        console.log(this.data);

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
                if(this.data.userPlayer && this.sceneState.settings.debug.cameraFollowsPlayer) {
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

                // TODO: Move into its own 
                const startX = shape.characterData.moveStartTimes.startX;
                const startZ = shape.characterData.moveStartTimes.startZ;
                const moving = startX !== 0 || startZ !== 0;
                const inTheAir = shape.inTheAir;
                // Check if change in in the air property
                if(inTheAir) {
                    this.skinAnimPhasesRunning.idleToRun = false;
                    this.skinAnimPhasesRunning.runToIdle = false;
                    this.skinAnimPhasesRunning.idleToFall = false;
                    // this.data.anims.idle.weight = 0;
                    // this.data.anims.run.weight = 0;
                    // this.data.anims.landing.weight = 0;
                    // this.data.anims.jumpStill.weight = 0;
                    // this.data.anims.jumpMovingLeft.weight = 0;
                    // this.data.anims.jumpMovingRight.weight = 0;
                    const dist = this._getDistanceToGround();
                    if(dist > 2) {
                        this.data.fallLevel = 1;
                    } else {
                        this.data.fallLevel = dist / 2;
                    }
                    const timeInAir = this.sceneState.atomClock.getTime() - shape.inTheAirUpdateTime;
                    let multiplier = 1;
                    if(timeInAir < 100) {
                        multiplier = 0;
                    }
                    this.data.anims.fall.weight = this.data.fallLevel * multiplier;
                    this.data.anims.idle.weight = Math.max(this.data.anims.idle.weight - this.data.fallLevel, 0);
                    console.log('RUN FALL');
                    // Jumping or dropping
                    // if(moving) {
                    //     if(!this.skinAnimPhasesRunning.runToFall) {
                    //         this.skinAnimPhasesRunning.idleToRun = false;
                    //         this.skinAnimPhasesRunning.runToIdle = false;
                    //         this.skinAnimPhasesRunning.fallOnFeet = false;
                    //         this.skinAnimPhasesRunning.idleToFall = false;
                    //         if(this.skinAnimTLs.fall) this.skinAnimTLs.fall.kill();
                    //         this.skinAnimTLs.fall = new TimelineMax().to(this.data.anims.fall, 0.5, {
                    //             weight: this.data.fallLevel,
                    //             ease: Sine.easeInOut,
                    //             onUpdate: () => {
                    //                 this.data.anims.run.weight = this.data.fallLevel - this.data.anims.fall.weight;
                    //                 this.data.anims.idle.weight = this.data.anims.run.weight;
                    //             },
                    //             onComplete: () => {
                    //                 this.skinAnimPhasesRunning.runToFall = false;
                    //             },
                    //         });
                    //         this.skinAnimPhasesRunning.runToFall = true;
                    //     }
                    // } else {
                    //     if(!this.skinAnimPhasesRunning.idleToFall) {
                    //         this.skinAnimPhasesRunning.idleToRun = false;
                    //         this.skinAnimPhasesRunning.runToIdle = false;
                    //         this.skinAnimPhasesRunning.fallOnFeet = false;
                    //         this.skinAnimPhasesRunning.runToFall = false;
                    //         if(this.skinAnimTLs.fall) this.skinAnimTLs.fall.kill();
                    //         this.skinAnimTLs.fall = new TimelineMax().to(this.data.anims.fall, 0.5, {
                    //             weight: this.data.fallLevel,
                    //             ease: Sine.easeInOut,
                    //             onUpdate: () => {
                    //                 this.data.anims.idle.weight = this.data.fallLevel - this.data.anims.fall.weight;
                    //             },
                    //             onComplete: () => {
                    //                 this.skinAnimPhasesRunning.idleToFall = false;
                    //             },
                    //         });
                    //         this.skinAnimPhasesRunning.idleToFall = true;
                    //     }
                    // }
                } else {
                    if(this.sceneState.atomClock.getTime() < shape.inTheAirUpdateTime + 100) {
                        const lastIntTheAirUpdate = this.sceneState.atomClock.getTime() - shape.inTheAirUpdateTime;
                        // console.log('last update time', lastIntTheAirUpdate);
                        // Landing
                        if(!this.skinAnimPhasesRunning.fallOnFeet) {
                            this.skinAnimPhasesRunning.runToFall = false;
                            this.skinAnimPhasesRunning.idleToFall = false;
                            if(this.skinAnimTLs.fall) this.skinAnimTLs.fall.kill();
                            this.skinAnimTLs.fall = new TimelineMax().to(this.data.anims.fall, 0.1, {
                                weight: 0,
                                ease: Sine.easeInOut,
                            });
                            if(this.skinAnimTLs.landing) this.skinAnimTLs.landing.kill();
                            this.data.anims.landing.time = 0.3;
                            this.data.anims.landing.timeScale = 1;
                            this.data.anims.landing.weight = 0.5;
                            this.data.anims.landing.play();
                            console.log('RUN LANDING');
                            this.skinAnimTLs.landing = new TimelineMax().to(this.data.anims.landing, 0.1, {
                                weight: 0.8,
                                ease: Sine.easeInOut,
                                onUpdate: () => {
                                    this.data.anims.idle.weight = 0;
                                    this.data.anims.run.weight = 0;
                                },
                                onComplete: () => {
                                    this.skinAnimTLs.landing = new TimelineMax().to(this.data.anims.landing, 0.2, {
                                        weight: 0,
                                        ease: Sine.easeInOut,
                                        onUpdate: () => {
                                            this.data.anims.idle.weight = 1 - this.data.anims.landing.weight;
                                        },
                                        onComplete: () => {
                                            this.skinAnimPhasesRunning.fallOnFeet = false;
                                            this.data.anims.landing.stop();
                                        },
                                    });
                                },
                            });
                            this.skinAnimPhasesRunning.fallOnFeet = true;
                        }
                    }
                    // On the ground, stopping or moving (running)
                    if(!moving) {
                        // Stop
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
                        // Run
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
        this.data.anims.fall.play();
        this.data.anims.fall.weight = 0;
        this.data.anims.jumpStill.weight = 0;
        this.data.anims.jumpStill.setLoop(THREE.LoopOnce);
        this.data.anims.jumpStill.timeScale = 2;
        this.data.anims.jumpMovingRight.weight = 0;
        this.data.anims.jumpMovingRight.timeScale = 2;
        this.data.anims.jumpMovingRight.setLoop(THREE.LoopOnce);
        this.data.anims.jumpMovingLeft.weight = 0;
        this.data.anims.jumpMovingLeft.timeScale = 2;
        this.data.anims.jumpMovingLeft.setLoop(THREE.LoopOnce);
        this.data.anims.landing.weight = 0;
        this.data.anims.landing.setLoop(THREE.LoopOnce);
        this.skinAnimTLs.idle = null;
        this.skinAnimTLs.run = null;
        this.skinAnimTLs.fall = null;
        this.skinAnimTLs.jumpStill = null;
        this.skinAnimTLs.jumpMoving = null;
        this.skinAnimTLs.landing = null;
        console.log(this.data.anims);
    }

    jump() {
        const standingStill = this.data.moveStartTimes.startX === 0 && this.data.moveStartTimes.startZ === 0;
        let timeOut = 0;
        const bodyIndex = this.data.bodyIndex;
        const inTheAir = this.sceneState.physics.movingShapes[bodyIndex].inTheAir;
        if(standingStill && !this.skinAnimPhasesRunning.jumpStill && !inTheAir) {
            this.skinAnimPhasesRunning.jumpStill = true;
            timeOut = 200;
            if(this.skinAnimTLs.jumpStill) this.skinAnimTLs.jumpStill.kill();
            this.data.anims.jumpStill.stop();
            this.data.anims.jumpStill.time = 0;
            this.data.anims.jumpStill.play();
            this.data.anims.fall.weight = 0;
            this.skinAnimTLs.jumpStill = new TimelineMax().to(this.data.anims.jumpStill, 0.225, {
                weight: 1.0,
                ease: Sine.easeInOut,
                onUpdate: () => {
                    this.data.anims.idle.weight = 0;
                    this.data.anims.fall.weight = Math.min(this.data.anims.jumpStill.weight, 0.5);
                },
                onComplete: () => {
                    this.skinAnimTLs.jumpStill = new TimelineMax().to(this.data.anims.jumpStill, 0.2, {
                        weight: 0,
                        ease: Sine.easeInOut,
                        onUpdate: () => {
                            this.data.anims.fall.weight = Math.min(1 - this.data.anims.jumpStill.weight, 0.5);
                        },
                        onComplete: () => {
                            this.data.anims.jumpStill.weight = 0;
                            this.data.anims.jumpStill.stop();
                            this.skinAnimPhasesRunning.jumpStill = false;
                        },
                    });
                },
            });
        } else if(!standingStill && !this.skinAnimPhasesRunning.jumpMoving && !inTheAir) {
            this.skinAnimPhasesRunning.jumpMoving = true;
            if(this.skinAnimTLs.jumpMoving) this.skinAnimTLs.jumpMoving.kill();
            this.data.anims.jumpMovingLeft.weight = 0;
            this.data.anims.jumpMovingRight.weight = 0;
            let jumpMovingAnim = this.data.anims.jumpMovingLeft;
            if(this.data.anims.run.time > 0.275 && this.data.anims.run.time < 0.69) jumpMovingAnim = this.data.anims.jumpMovingRight;
            jumpMovingAnim.stop();
            jumpMovingAnim.time = 0;
            jumpMovingAnim.play();
            this.skinAnimTLs.jumpMoving = new TimelineMax().to(jumpMovingAnim, 0.1, {
                weight: 1.0,
                ease: Sine.easeInOut,
                onUpdate: () => {
                    this.data.anims.run.weight = 1 - jumpMovingAnim.weight;
                    this.data.anims.idle.weight = 0;
                    this.data.anims.fall.weight = 0;
                },
                onComplete: () => {
                    this.skinAnimTLs.jumpMoving = new TimelineMax().to(jumpMovingAnim, 0.45, {
                        weight: 0,
                        ease: Sine.easeInOut,
                        onUpdate: () => {
                            this.data.anims.fall.weight = Math.min(1 - jumpMovingAnim.weight, 0.5);
                        },
                        onComplete: () => {
                            jumpMovingAnim.weight = 0;
                            jumpMovingAnim.stop();
                            this.skinAnimPhasesRunning.jumpMoving = false;
                        },
                    });
                },
            });
        }

        return timeOut;
    }

    _getDistanceToGround() {
        const fromPos = this.data.mesh.children[0].position;
        const direction = new THREE.Vector3();
        direction.subVectors(
            new THREE.Vector3(
                fromPos.x,
                fromPos.y - 100,
                fromPos.z
            ),
            fromPos
        ).normalize();
        this.fallDistanceRay.set(fromPos, direction);
        let intersectsLevel = this.fallDistanceRay.intersectObjects(
            this.sceneState.levelAssets.lvlMeshes,
            true
        );
        const dist = intersectsLevel.length ? intersectsLevel[0].distance - this.data.charHeight / 2 : 9999999;
        return dist;
    }
}

export default Humanoid;