import PhysicsHelpers from './PhysicsHelpers';

class Physics {
    constructor(sceneState, runMainApp) {
        this.sceneState = sceneState;
        this.mainWorkerSendTime = 0;
        this.secondaryWorkerSendTime = 0;
        this.mainWorker = new Worker('./webworkers/physics.js');
        this.secondaryWorker = new Worker('./webworkers/physics.js');
        this.secPositions = new Float32Array(this.sceneState.physics.positions.length);
        this.secQuaternions = new Float32Array(this.sceneState.physics.quaternions.length);
        this.tempShapes = {};
        sceneState.additionalPhysicsData = [];
        sceneState.additionalPhysicsData2 = [];
        this.helpers = new PhysicsHelpers(sceneState);
        this.stats = this.sceneState.settingsClass.createStats(true);
        this.zpsCounter = {
            counter: 0,
            highestCount: 0,
            startTime: 0,
            elemZPS: document.getElementById('zps-counter'),
            elemFPS: document.getElementById('fps-counter'),
            fpsCounter: 0,
            fpsHighestCount: 0,
            fpsStartTime: 0,
        };
        this._initPhysicsWorker(runMainApp);
    }

    _initPhysicsWorker(runMainApp) {
        const initParams = {
            allowSleep: true,
            gravity: [0, -9.82, 0],
            iterations: 10,
            solverTolerance: 0.1,
            particlesCount: this.sceneState.physics.particlesCount,
            particlesIdPrefix: 'physParticle_',
            particlesIdlePosition: [0, 2000, 0],
            positionsLength: this.sceneState.physics.positions.length,
            quaternionsLength: this.sceneState.physics.quaternions.length,
        };
        this._createParticles(initParams);
        this.mainWorker.postMessage({
            init: true,
            initParams,
            mainWorker: true,
        });
        this.mainWorker.addEventListener('message', (e) => {
            if(e.data.loop) {
                this._updateRenderShapes(e.data);
            } else if(e.data.additionals && e.data.additionals.length) {
                this._handleAdditionalsForMainThread(e.data.additionals);
                this._updateRenderShapes(e.data);
            } else if(e.data.initPhysicsDone) {
                this.sceneState.physics.initiated = true;
                runMainApp();
            } else if(e.data.error) {
                this.sceneState.logger.error('From physics worker:', e.data.error);
                throw new Error('**Error stack:**');
            }
            if(this.sceneState.settings.debug.showPhysicsStats) this.stats.update(); // Debug statistics
        });
        this.mainWorker.addEventListener('error', (e) => {
            this.sceneState.logger.error('Worker event listener:', e.message);
            throw new Error('**Error stack:**');
        });

        if(this.sceneState.physics.particlesCount) {
            this.secondaryWorker.postMessage({
                init: true,
                initParams,
                mainWorker: false,
            });
            this.secondaryWorker.addEventListener('message', (e) => {
                if(e.data.loop) {
                    this._updateRenderShapes(e.data);
                } else if(e.data.additionals && e.data.additionals.length) {
                    this._updateRenderShapes(e.data);
                } else if(e.data.error) {
                    this.sceneState.logger.error('From secondary physics worker:', e.data.error);
                    throw new Error('**Error stack:**');
                }
            });
            this.secondaryWorker.addEventListener('error', (e) => {
                this.sceneState.logger.error('Worker event listener (secondary physics):', e.message);
                throw new Error('**Error stack:**');
            });
        }
    }

    requestPhysicsFromWorker = (isThisMainWorker) => {
        let sendObject;
        if(this.sceneState.physics.particlesCount) {
            this.sceneState.additionalPhysicsData2.push(...this.sceneState.additionalPhysicsData);
        }
        if(isThisMainWorker) {
            sendObject = {
                timeStep: this.sceneState.physics.timeStep,
                positions: this.sceneState.physics.positions,
                quaternions: this.sceneState.physics.quaternions,
            };
            const additionals = this.sceneState.additionalPhysicsData;
            if(additionals.length) {
                sendObject.additionals = [ ...additionals ];
                this.sceneState.additionalPhysicsData = [];
            }
            this.mainWorker.postMessage(
                sendObject,
                [this.sceneState.physics.positions.buffer, this.sceneState.physics.quaternions.buffer]
            );
            this.mainWorkerSendTime = performance.now();
        } else {
            sendObject = {
                timeStep: this.sceneState.physics.timeStep,
                positions: this.secPositions,
                quaternions: this.secQuaternions,
            };
            const additionals = this.sceneState.additionalPhysicsData2;
            if(additionals.length) {
                sendObject.additionals = [ ...additionals ];
                this.sceneState.additionalPhysicsData2 = [];
            }
            this.secondaryWorker.postMessage(
                sendObject,
                [this.secPositions.buffer, this.secQuaternions.buffer]
            );
            this.secondaryWorkerSendTime = performance.now();
        }
    }

    _updateRenderShapes(data) {
        const positions = data.positions;
        const quaternions = data.quaternions;
        let sendTime;
        if(data.isThisMainWorker) {
            this.sceneState.physics.positions = positions;
            this.sceneState.physics.quaternions = quaternions;
            sendTime = this.mainWorkerSendTime;
        } else {
            this.secPositions = positions;
            this.secQuaternions = quaternions;
            sendTime = this.secondaryWorkerSendTime;
        }
        const shapes = this.sceneState.physics.movingShapes;
        const shapesL = this.sceneState.physics.movingShapesLength;
        let i;
        for(i=0; i<shapesL; i++) {
            const s = shapes[i];
            const pos = [
                positions[i * 3],
                positions[i * 3 + 1],
                positions[i * 3 + 2],
            ];
            if(!data.isThisMainWorker) {
                this.sceneState.physicsParticles.updatePosition(i, pos);
            } else if(s.mesh) {
                s.mesh.position.set(pos[0], pos[1], pos[2]);
                let qua;
                if(!s.fixedRotation) {
                    qua = [
                        quaternions[i * 4],
                        quaternions[i * 4 + 1],
                        quaternions[i * 4 + 2],
                        quaternions[i * 4 + 3],
                    ];
                    s.mesh.quaternion.set(qua[0], qua[1], qua[2], qua[3]);
                } else {
                    qua = [0, 0, 0, 1];
                }
                this.sceneState.consClass.updateEntityData(pos, qua, s.mesh.name);
            }
            this.helpers.updatePhysicsHelpers(positions, quaternions, i);
            if(s.updateFn) s.updateFn(s);
        }

        // Rescale the Float32Arrays (double their sizes), if shapes' count is half of positions and quaternions counts
        if(positions.length + quaternions.length <= shapesL * 14) { // shapesL * (3 + 4) * 2 = shapesL * 14
            this.sceneState.physics.positions = new Float32Array(positions.length * 2);
            this.sceneState.physics.quaternions = new Float32Array(quaternions.length * 2);
            this.secPositions = new Float32Array(positions.length * 2);
            this.secQuaternions = new Float32Array(quaternions.length * 2);
        }

        const delay = this.sceneState.physics.timeStep * 1000 - (performance.now() - sendTime);
        this._zpsCounter(delay);
        if(delay < 0) {
            this.requestPhysicsFromWorker(data.isThisMainWorker);
        } else {
            setTimeout(() => {
                this.requestPhysicsFromWorker(data.isThisMainWorker);
            }, delay);
        }
    }

    _zpsCounter(delay) {
        if(!this.sceneState.settings.debug.showPhysicsStats) return;
        if(performance.now() - this.zpsCounter.startTime > 1000) {
            this.zpsCounter.elemZPS.innerText = 'ZPS: ' + this.zpsCounter.counter + ' (' + this.zpsCounter.highestCount + ')';
            this.zpsCounter.startTime = performance.now();
            this.zpsCounter.counter = 0;
            this.zpsCounter.fpsCounter = 0;
        }
        if(delay < 0) this.zpsCounter.counter++;
        if(this.zpsCounter.counter > this.zpsCounter.highestCount) this.zpsCounter.highestCount++;
        this.zpsCounter.fpsCounter++;
        if(this.zpsCounter.fpsCounter > this.zpsCounter.fpsHighestCount) this.zpsCounter.fpsHighestCount++;
    }

    _handleAdditionalsForMainThread(additionals) {
        const aLength = additionals.length;
        let i;
        for(i=0; i<aLength; i++) {
            const a = additionals[i];
            if(a.phase === 'addShape') {
                const s = this.tempShapes[a.shape.id];
                if(s.moving) {
                    if(s.characterData) {
                        if(s.characterData.userPlayer) {
                            this.sceneState.userPlayerIndex = this.sceneState.physics.movingShapesLength;
                        }
                        s.characterData.bodyIndex = this.sceneState.physics.movingShapesLength;
                    }
                    this.sceneState.physics.movingShapes.push(s);
                    this.sceneState.physics.movingShapesLength = this.sceneState.physics.movingShapes.length;
                } else {
                    this.sceneState.physics.staticShapes.push(s);
                    this.sceneState.physics.staticShapesLength = this.sceneState.physics.staticShapes.length;
                }
                delete this.tempShapes[a.shape.id];
            } else if(a.phase === 'removeShape') {
                if(a.moving) {
                    this.sceneState.physics.movingShapes = this.sceneState.physics.movingShapes.filter(
                        shape => a.id !== shape.id
                    );
                    this.sceneState.physics.movingShapesLength = this.sceneState.physics.movingShapes.length;
                } else {
                    this.sceneState.physics.staticShapes = this.sceneState.physics.staticShapes.filter(
                        shape => a.id !== shape.id
                    );
                    this.sceneState.physics.staticShapesLength = this.sceneState.physics.staticShapes.length;
                }
            }
        }
    }

    addShape = (shapeData) => {
        if(!shapeData) {
            this.sceneState.logger.error('Trying to add new shape, but shapeData is missing.');
            throw new Error('**Error stack:**');
        }
        let id = shapeData.id;
        if(!id) {
            id = 'phyShape_' + performance.now().toString().replace('.', '_');
            shapeData.id = id;
        }
        this.tempShapes[id] = shapeData;
        this.sceneState.additionalPhysicsData.push({
            phase: 'addShape',
            shape: {
                type: shapeData.type,
                id: shapeData.id,
                compoundParentId: shapeData.compoundParentId,
                moving: shapeData.moving,
                mass: shapeData.mass,
                size: shapeData.size,
                radius: shapeData.radius,
                radiusTop: shapeData.radiusTop,
                radiusBottom: shapeData.radiusBottom,
                height: shapeData.height,
                numSegments: shapeData.numSegments,
                movingShape: shapeData.movingShape,
                position: shapeData.position,
                quaternion: shapeData.quaternion,
                rotation: shapeData.rotation,
                velocity: shapeData.velocity,
                fixedRotation: shapeData.fixedRotation,
                material: shapeData.material,
                particles: shapeData.particles,
                sleep: shapeData.sleep,
                roof: shapeData.roof,
                characterData: shapeData.characterData
                    ? {
                        speed: shapeData.characterData.speed,
                        direction: shapeData.characterData.direction,
                        userPlayer: shapeData.characterData.userPlayer,
                    } : null
            },
        });
        this.helpers.createShape(shapeData);
    }

    removeShape = (data) => {
        if(typeof data === 'string') {
            this.sceneState.additionalPhysicsData.push({
                phase: 'removeShape',
                id: data,
            });
            this.helpers.removeShape({ id: data });
        } else {
            this.sceneState.additionalPhysicsData.push({
                phase: 'removeShape',
                id: data.id,
                moving: data.moving,
            });
            this.helpers.removeShape(data);
        }
    }

    _createParticles(params) {
        for(let i=0; i<params.particlesCount; i++) {
            const shape = {
                type: 'particle',
                id: params.particlesIdPrefix + i,
                position: [params.particlesIdlePosition[0]+i, params.particlesIdlePosition[1], params.particlesIdlePosition[2]],
                particles: true,
                moving: true,
            };
            this.sceneState.physics.movingShapes.push(shape);
            this.sceneState.physics.movingShapesLength++;
            this.helpers.createShape(shape);
        }
    }
}

export default Physics;