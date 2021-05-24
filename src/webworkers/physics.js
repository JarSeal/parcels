let world,
    CANNON,
    lastCallTime = performance.now() / 1000,
    staticShapes = [],
    movingShapes = [],
    movingShapesCount = 0;
self.importScripts('/webworkers/cannon-es.js');

self.addEventListener('message', (e) => {

    const init = e.data.init;
    let returnAdditionals = [];

    if(!init) {
        if(e.data.additionals) {
            const a = e.data.additionals;
            for(let i=0; i<a.length; i++) {
                if(a[i].phase === 'moveChar') {
                    moveChar(a[i].data);
                } else if(a[i].phase === 'jumpChar') {
                    jumpChar(a[i].data);
                } else if(a[i].phase === 'addShape') {
                    const newShape = a[i].shape.compoundParentId
                        ? addShapeToCompound(a[i].shape)
                        : addShape(a[i].shape);
                    if(newShape.shapeAdded) {
                        a[i].shape = newShape.shape;
                        returnAdditionals.push(a[i]);
                    } else {
                        self.postMessage({ error: newShape.error });
                    }
                } else if(a[i].phase === 'removeShape') {
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
        const body = movingShapes[i];
        positions[i * 3 + 0] = body.position.x;
        positions[i * 3 + 1] = body.position.y;
        positions[i * 3 + 2] = body.position.z;
        quaternions[i * 4 + 0] = body.quaternion.x;
        quaternions[i * 4 + 1] = body.quaternion.y;
        quaternions[i * 4 + 2] = body.quaternion.z;
        quaternions[i * 4 + 3] = body.quaternion.w;
        if(body.movingShape) {
            _addMovementToShape(body);
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
    self.postMessage(returnMessage, [data.positions.buffer, data.quaternions.buffer]);
    lastCallTime = time;
};

const moveChar = (data) => {
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
    if(shape.fixedRotation) {
        body.fixedRotation = true;
        body.updateMassProperties();
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
    world.allowSleep = params.allowSleep;
    world.gravity.set(params.gravity[0], params.gravity[1], params.gravity[2]);
    world.iterations = params.iterations;
    world.solver.iterations = params.iterations;
    world.solver.tolerance = params.solverTolerance;
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
