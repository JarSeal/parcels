let world,
    CANNON,
    lastCallTime = performance.now() / 1000,
    staticShapes = [],
    movingShapes = [],
    movingShapesCount = 0,
    movingShapesIndexes = {},
    particlesCount = 0,
    isThisMainWorker = false,
    secondaryWorker,
    secPositions, // used for the secondary worker
    secQuaternions,  // used for the secondary worker
    particlePos,
    particleQua,
    particleIndexes = { start: 0, end: 0 };
self.importScripts('/webworkers/cannon-es.js');

self.addEventListener('message', (e) => {

    const init = e.data.init;
    let returnAdditionals = [];

    if(!init) {
        if(isThisMainWorker) {
            secPositions = new Float32Array(e.data.positions.length);
            secPositions.set(e.data.positions.slice(0));
            secQuaternions = new Float32Array(e.data.quaternions.length);
            secQuaternions.set(e.data.quaternions.slice(0));
            const sendObject = e.data;
            sendObject.positions = secPositions;
            sendObject.quaternions = secQuaternions;
            secondaryWorker.postMessage(sendObject);
        }
        if(e.data.additionals) {
            const a = e.data.additionals;
            for(let i=0; i<a.length; i++) {
                const phase = a[i].phase;
                if(phase === 'moveChar') {
                    moveChar(a[i].data);
                } else if(phase === 'jumpChar') {
                    jumpChar(a[i].data);
                } else if(phase === 'moveParticle') {
                    moveParticle(a[i].data);
                } else if(phase === 'applyForce') {
                    applyForce(a[i].data);
                } else if(phase === 'resetPosition') {
                    resetBody(a[i].data.bodyIndex, a[i].data.position, a[i].data.sleep);
                } else if(phase === 'addShape') {
                    const newShape = a[i].shape.compoundParentId
                        ? addShapeToCompound(a[i].shape)
                        : addShape(a[i].shape);
                    if(newShape.shapeAdded) {
                        a[i].shape = newShape.shape;
                        returnAdditionals.push(a[i]);
                    } else {
                        self.postMessage({ error: newShape.error });
                    }
                } else if(phase === 'removeShape') {
                    const removedShape = removeShape(a[i]);
                    if(removedShape.removed) {
                        returnAdditionals.push(removedShape);
                    } else {
                        self.postMessage({ error: removedShape.error });
                    }
                }
            }
        }
        stepTheWorld(e.data, returnAdditionals);
    } else {
        if(e.data && e.data.initParams && CANNON) {
            const params = e.data.initParams;
            if(e.data.mainWorker) {
                isThisMainWorker = true;
                secPositions = new Float32Array(params.positionsLength);
                secQuaternions = new Float32Array(params.quaternionsLength);
                particlePos = new Float32Array(params.particlesCount * 3);
                particleQua = new Float32Array(params.particlesCount * 4);
                secondaryWorker = new Worker('/webworkers/physics.js');
                secondaryWorker.addEventListener('message', (event) => {
                    if(event.data.loop) {
                        particlePos = event.data.positions;
                        particleQua = event.data.quaternions;
                    } else if(event.data.error) {
                        self.postMessage({ error: 'From secondary physics worker: ' + event.data.error });
                        throw new Error('**Error stack:**');
                    }
                });
                secondaryWorker.postMessage({
                    init: true,
                    initParams: params,
                    mainWorker: false,
                });
            }
            initPhysics(params);
        } else {
            self.postMessage({
                initPhysicsDone: false,
                error: 'Web worker physics could not init CANNON world.'
            });
        }
    }
});

const stepTheWorld = (data, returnAdditionals) => {
    const time = performance.now() / 1000;
    const dt = time - lastCallTime;
    const { positions, quaternions, timeStep } = data;
    let i;
    world.step(timeStep, dt);
    for(i=0; i<movingShapesCount; i++) {
        if(isThisMainWorker && i >= particleIndexes.start && i <= particleIndexes.end) {
            positions[i * 3] = particlePos[i * 3];
            positions[i * 3 + 1] = particlePos[i * 3 + 1];
            positions[i * 3 + 2] = particlePos[i * 3 + 2];
            quaternions[i * 4] = particleQua[i * 4];
            quaternions[i * 4 + 1] = particleQua[i * 4 + 1];
            quaternions[i * 4 + 2] = particleQua[i * 4 + 2];
            quaternions[i * 4 + 3] = particleQua[i * 4 + 3];
        } else {
            const body = movingShapes[i];
            positions[i * 3] = body.position.x;
            positions[i * 3 + 1] = body.position.y;
            positions[i * 3 + 2] = body.position.z;
            quaternions[i * 4] = body.quaternion.x;
            quaternions[i * 4 + 1] = body.quaternion.y;
            quaternions[i * 4 + 2] = body.quaternion.z;
            quaternions[i * 4 + 3] = body.quaternion.w;
            if(body.movingShape) {
                _addMovementToShape(body);
            }
        }
    }
    let returnMessage = {
        positions,
        quaternions,
        loop: true,
    };
    if(returnAdditionals.length) {
        returnMessage.additionals = returnAdditionals;
        returnMessage.loop = false; // Because we want the additionals to be handled in the main thread (returns to normal loop after that)
    }
    if(isThisMainWorker) {
        self.postMessage(returnMessage, [data.positions.buffer, data.quaternions.buffer]);
    } else {
        self.postMessage(returnMessage);
    }
    lastCallTime = time;
};

const moveChar = (data) => {
    if(data.bodyIndex === undefined) return;
    const veloX = data.xPosMulti * data.speed;
    const veloZ = data.zPosMulti * data.speed;
    movingShapes[data.bodyIndex].moveValues.veloX = veloX;
    movingShapes[data.bodyIndex].moveValues.veloZ = veloZ;
    let multi = 1.5;
    if(veloX && veloZ) multi = 1;
    movingShapes[data.bodyIndex].moveValues.speed = data.speed * multi;
    const onTheMove = veloX === 0 && veloZ === 0 ? false : true;
    movingShapes[data.bodyIndex].moveValues.onTheMove = onTheMove;
};

const jumpChar = (data) => {
    movingShapes[data.bodyIndex].moveValues.veloY = data.jump;
    movingShapes[data.bodyIndex].moveValues.onTheMove = true;
};

const applyForce = (data) => {
    const id = data.id;
    const index = movingShapesIndexes[id];
    const shape = movingShapes[index];
    const force = 4000;
    shape.applyForce(
        new CANNON.Vec3(
            data.direction[0] * force,
            data.direction[1] * force,
            data.direction[2] * force
        ),
        new CANNON.Vec3(
            data.point[0] - shape.position.x,
            data.point[1] - shape.position.y,
            data.point[2] - shape.position.z
        )
    );
};

const moveParticle = (data) => {
    if(isThisMainWorker) return;
    const body = movingShapes[data.bodyIndex];
    body.wakeUp();
    body.position.x = data.position[0];
    body.position.y = data.position[1];
    body.position.z = data.position[2];
    body.velocity.x = data.velocity[0];
    body.velocity.y = data.velocity[1];
    body.velocity.z = data.velocity[2];
};

const addShape = (shape) => {
    let body;
    if(shape.type === 'box') {
        body = new CANNON.Body({
            mass: shape.mass,
            shape: new CANNON.Box(new CANNON.Vec3(shape.size[0], shape.size[1], shape.size[2])),
        });
    } else if(shape.type === 'sphere') {
        body = new CANNON.Body({
            mass: shape.mass,
            shape: new CANNON.Sphere(shape.radius),
        });
    } else if(shape.type === 'cylinder') {
        body = new CANNON.Body({
            mass: shape.mass,
            shape: new CANNON.Cylinder(
                shape.radiusTop,
                shape.radiusBottom,
                shape.height,
                shape.numSegments
            ),
        });
    } else if(shape.type === 'particle') {
        body = new CANNON.Body({ mass: shape.mass, shape: new CANNON.Particle() });
    } else if(shape.type === 'compound') {
        body = new CANNON.Body({ mass: shape.mass });
    } else {
        return {
            shapeAdded: false,
            error: 'Shape could not be added to the physics, type unknown (type: ' + shape.type + ').',
        };
    }
    body.shapeData = shape;
    body.material = new CANNON.Material(shape.material);
    body.position = new CANNON.Vec3(shape.position[0], shape.position[1], shape.position[2]);
    body.allowSleep = shape.sleep.allowSleep;
    body.sleepSpeedLimit = shape.sleep.sleepSpeedLimit;
    body.sleepTimeLimit = shape.sleep.sleepTimeLimit;
    body.bodyId = shape.id;
    body.movingShape = shape.movingShape;
    if(body.movingShape) {
        _setUpCollisionDetector(body);
    }
    body.platformVelocity = {
        x: 0,
        z: 0,
    };
    if(shape.rotation) {
        body.quaternion.setFromEuler(shape.rotation[0], shape.rotation[1], shape.rotation[2], 'XYZ');
    }
    if(shape.fixedRotation) {
        body.fixedRotation = true;
        body.updateMassProperties();
    }
    if(shape.velocity) {
        body.velocity = new CANNON.Vec3(shape.velocity[0], shape.velocity[1], shape.velocity[2]);
    }
    world.addBody(body);
    if(shape.moving) {
        body.moveValues = {
            speed: 0,
            veloX: 0,
            veloY: 0,
            veloZ: 0,
            onTheMove: false,
        };
        movingShapesIndexes[shape.id] = movingShapesCount;
        movingShapes.push(body);
        movingShapesCount++;
    } else {
        staticShapes.push(body);
    }
    shape.quaternions = [
        body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w,
    ];
    return { shapeAdded: true, shape };
};

const addShapeToCompound = (shape) => {
    let cShape;
    if(shape.type === 'box') {
        cShape = new CANNON.Box(new CANNON.Vec3(shape.size[0], shape.size[1], shape.size[2]));
    } else if(shape.type === 'sphere') {
        cShape = new CANNON.Sphere(shape.radius);
    } else if(shape.type === 'cylinder') {
        cShape = new CANNON.Cylinder(
            shape.radiusTop,
            shape.radiusBottom,
            shape.height,
            shape.numSegments
        );
    } else {
        return {
            shapeAdded: false,
            error: 'Compound child shape could not be added to the physics, type unknown (type: ' + shape.type + ').',
        };
    }
    let quaternion = new CANNON.Quaternion(0, 0, 0, 1);
    if(shape.rotation) {
        quaternion.setFromEuler(shape.rotation[0], shape.rotation[1], shape.rotation[2], 'XYZ');
    }
    const parent = getShapeById(shape.compoundParentId, shape.moving);
    if(parent) {
        parent.addShape(
            cShape,
            new CANNON.Vec3(shape.position[0], shape.position[1], shape.position[2]),
            quaternion
        );
    } else {
        return {
            shapeAdded: false,
            error: 'Compound parent was not found (compoundParentId: "' + shape.compoundParentId + '", child id: "' + shape.id + '").',
        };
    }
    return { shapeAdded: true, shape };
};

const removeShape = (data) => {
    let shapeRemoved = false,
        moving;
    if(data.moving === undefined) {
        movingShapes = movingShapes.filter(shape => {
            if(data.id === shape.bodyId) {
                world.removeBody(shape);
                shapeRemoved = true;
                moving = true;
            }
            return data.id !== shape.bodyId;
        });
        movingShapesCount = movingShapes.length;
        if(!shapeRemoved) {
            staticShapes = staticShapes.filter(shape => {
                if(data.id === shape.bodyId) {
                    world.removeBody(shape);
                    shapeRemoved = true;
                    moving = false;
                }
                return data.id !== shape.bodyId;
            });
        }
    } else {
        if(data.moving) {
            movingShapes = movingShapes.filter(shape => {
                if(data.id === shape.bodyId) {
                    world.removeBody(shape);
                    shapeRemoved = true;
                    moving = true;
                }
                return data.id !== shape.bodyId;
            });
            movingShapesCount = movingShapes.length;
        } else {
            staticShapes = staticShapes.filter(shape => {
                if(data.id === shape.bodyId) {
                    world.removeBody(shape);
                    shapeRemoved = true;
                    moving = false;
                }
                return data.id !== shape.bodyId;
            });
        }
    }
    return {
        id: data.id,
        removed: shapeRemoved,
        moving,
        phase: data.phase,
        error: shapeRemoved
            ? null
            : 'Could not find shape/body to remove in physics worker with id: "' + data.id + '" (moving: ' + data.moving + ')',
    };
};

const initPhysics = (params) => {
    world = new CANNON.World();
    world.broadphase = new CANNON.NaiveBroadphase();
    world.broadphase.useBoundingBoxes = true;
    world.allowSleep = params.allowSleep;
    world.gravity.set(params.gravity[0], params.gravity[1], params.gravity[2]);
    world.iterations = params.iterations;
    world.solver.iterations = params.iterations;
    world.solver.tolerance = params.solverTolerance;

    if(params.particlesCount) {
        let i;
        particlesCount = params.particlesCount;
        for(i=0; i<particlesCount; i++) {
            let body = {
                bodyId: null
            };
            if(!isThisMainWorker) {
                body = new CANNON.Body({ mass: 120, shape: new CANNON.Particle() });
                let shape = {
                    material: { friction: 0.1 },
                    position: [params.particlesIdlePosition[0]+i, params.particlesIdlePosition[1], params.particlesIdlePosition[2]],
                    id: params.particlesIdPrefix + i,
                    type: 'particle',
                    moving: true,
                    sleep: {
                        allowSleep: true,
                        sleeSpeedLimit: 0.1,
                        sleepTimeLimit: 0.3,
                    },
                };
                body.shapeData = shape;
                body.material = new CANNON.Material(shape.material);
                body.position = new CANNON.Vec3(shape.position[0], shape.position[1], shape.position[2]);
                body.allowSleep = shape.sleep.allowSleep;
                body.sleepSpeedLimit = shape.sleep.sleepSpeedLimit;
                body.sleepTimeLimit = shape.sleep.sleepTimeLimit;
                body.bodyId = shape.id;
                body.movingShape = true;
                body.moving = true;
                body.moveValues = {
                    speed: 0,
                    veloX: 0,
                    veloY: 0,
                    veloZ: 0,
                    onTheMove: false,
                };
                body.sleep();
                world.addBody(body);
            }
            if(i === 0) particleIndexes.start = movingShapesCount;
            movingShapes.push(body);
            movingShapesCount++;
        }
        particleIndexes.end = particleIndexes.start + params.particlesCount - 1;
    }

    self.postMessage({ initPhysicsDone: true });
};

const getShapeById = (id, moving) => {
    let i;
    if(moving === undefined) {
        for(i=0; i<movingShapesCount; i++) {
            if(movingShapes[i].bodyId === id) {
                return movingShapes[i];
            }
        }
        for(i=0; i<staticShapes.length; i++) {
            if(staticShapes[i].bodyId === id) {
                return staticShapes[i];
            }
        }
    } else {
        if(moving) {
            for(i=0; i<movingShapesCount; i++) {
                if(movingShapes[i].bodyId === id) {
                    return movingShapes[i];
                }
            }
        } else {
            for(i=0; i<staticShapes.length; i++) {
                if(staticShapes[i].bodyId === id) {
                    return staticShapes[i];
                }
            }
        }
    }
    return null;
};

const _addMovementToShape = (body) => {
    if(body.moveValues.onTheMove) {
        const belowContact = _findBelowContactBody(body.bodyId);
        let airDivision = 1;
        if(belowContact.inTheAir) airDivision = 2;
        body.velocity.x += body.moveValues.veloX / airDivision + belowContact.velocity.x;
        body.velocity.z += body.moveValues.veloZ / airDivision + belowContact.velocity.z;
        if(belowContact.cannotJump) body.moveValues.veloY = 0;
        body.velocity.y += body.moveValues.veloY;
        if(body.moveValues.veloY) body.moveValues.veloY = 0;
        const speedWithMulti = body.moveValues.speed;
        const maxMoveVeloX = speedWithMulti + belowContact.velocity.x;
        const maxMoveVeloZ = speedWithMulti + belowContact.velocity.z;
        if(body.velocity.x > maxMoveVeloX) { body.velocity.x = maxMoveVeloX; }
        else if(body.velocity.x < -maxMoveVeloX) { body.velocity.x = -maxMoveVeloX; }
        if(body.velocity.z > maxMoveVeloZ) { body.velocity.z = maxMoveVeloZ; }
        else if(body.velocity.z < -maxMoveVeloZ) { body.velocity.z = -maxMoveVeloZ; }
        const onTheMove = body.moveValues.veloX === 0 && body.moveValues.veloZ === 0 ? false : true;
        body.moveValues.onTheMove = onTheMove;
    } else {
        body.moveValues = {
            veloX: 0,
            veloY: 0,
            veloZ: 0,
        };
    }
};

const _findBelowContactBody = (id) => {
    const contacts = world.contacts,
        contactsL = contacts.length,
        upAxis = new CANNON.Vec3(0, 1, 0);
    let i, foundContact = {}, contactNormal = new CANNON.Vec3();
    for(i=0; i<contactsL; i++) {
        if(contacts[i].bi.bodyId === id) {
            contacts[i].ni.negate(contactNormal);
            if(contactNormal.dot(upAxis) > 0.5) {
                foundContact = contacts[i].bj;
                break;
            }
        } else if(contacts[i].bj.bodyId === id) {
            contactNormal.copy(contacts[i].ni);
            if(contactNormal.dot(upAxis) > 0.5) {
                foundContact = contacts[i].bi;
                break;
            }
        }
    }
    if(!Object.keys(foundContact).length) {
        foundContact.velocity = { x: 0, y: 0, z: 0 };
        foundContact.cannotJump = true;
        foundContact.inTheAir = true;
    }
    return foundContact;
};

const _setUpCollisionDetector = (body) => {
    let contactNormal = new CANNON.Vec3(); // Normal in the contact, pointing *out* of whatever the player touched
    const upAxis = new CANNON.Vec3(0, 1, 0);
    body.addEventListener('collide', (e) => {
        const contact = e.contact;
        // contact.bi and contact.bj are the colliding bodies, and contact.ni is the collision normal.
        // We do not yet know which one is which! Let's check.
        if(contact.bi.id == body.id) { // bi is the player body, flip the contact normal
            contact.ni.negate(contactNormal);
        } else {
            contactNormal.copy(contact.ni); // bi is something else. Keep the normal as it is
        }
        // If contactNormal.dot(upAxis) is between 0 and 1, we know that the contact normal is somewhat in the up direction.
        if(contactNormal.dot(upAxis) > 0.5) { // Use a "good" threshold value between 0 and 1 here!
            // console.log('HARD contact', contact);
        }
    });
};

const resetBody = (i, newPosition, sleep) => {
    if(isThisMainWorker && i >= particleIndexes.start && i <= particleIndexes.end) return;
    const body = movingShapes[i];
    body.position.setZero();
    body.previousPosition.setZero();
    body.interpolatedPosition.setZero();
    body.initPosition.setZero();
    body.quaternion.set(0,0,0,1);
    body.initQuaternion.set(0,0,0,1);
    body.previousQuaternion.set(0,0,0,1);
    body.interpolatedQuaternion.set(0,0,0,1);
    body.velocity.setZero();
    body.initVelocity.setZero();
    body.angularVelocity.setZero();
    body.initAngularVelocity.setZero();
    body.force.setZero();
    body.torque.setZero();

    if(newPosition) {
        body.position.x = newPosition[0];
        body.position.y = newPosition[1];
        body.position.z = newPosition[2];
    }

    if(sleep) body.sleep();
};
