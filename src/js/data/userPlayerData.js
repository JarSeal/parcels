const userPlayerData = {
    id: 'some-unique-player-id',
    name: 'Keijo',
    position: [0, 0.91, 0],
    direction: 0,
    moveSpeed: 0.25,
    maxSpeed: 2.5,
    curMovementSpeed: 0,
    moveKeysPressed: 0,
    userPlayer: true,
    createPlayerFn: (data, sceneState, THREE, CANNON) => {
        // const data = this.data;
        const id = data.id;
        sceneState.players[id] = data;
        sceneState.userPlayerId = id;
        sceneState.playerKeys.push(id);
        sceneState.playerKeysCount += 1;
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
        sceneState.scenes[sceneState.curScene].add(pMesh);

        // Add physics
        const boxMaterial = new CANNON.Material();
        boxMaterial.friction = 0.01;
        const boxBody = new CANNON.Body({
            mass: 70,
            position: new CANNON.Vec3(pos[0], 1.45, pos[2]),
            shape: new CANNON.Box(new CANNON.Vec3(0.8 / 2, 0.8 / 2, 0.8 / 2)),
            material: boxMaterial,
        });
        boxBody.allowSleep = true;
        boxBody.sleepSpeedLimit = 0.1;
        boxBody.sleepTimeLimit = 1;
        boxBody.bodyID = id;
        data.body = boxBody;
        sceneState.physics.world.addBody(boxBody);
        sceneState.physics.shapesLength = sceneState.physics.shapes.length;
        if(sceneState.settings.physics.showPhysicsHelpers) {
            sceneState.physics.helper.addVisual(boxBody, 0xFFFF00);
        }
    },
    renderFn: (data, sceneState, THREE) => {
        if(!data.xPosMulti) data.body.velocity.x = 0;
        if(!data.zPosMulti) data.body.velocity.z = 0;
        data.body.velocity.x += data.xPosMulti * data.moveSpeed;
        data.body.velocity.z += data.zPosMulti * data.moveSpeed;
        const maxSpeed = data.maxSpeed * data.maxSpeedMultiplier;
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
        if(data.userPlayer && sceneState.settings.debug.cameraFollowsPlayer) {
            const camera = sceneState.cameras[sceneState.curScene];
            camera.position.set(
                camera.userData.followXOffset+data.body.position.x,
                camera.userData.followYOffset+data.body.position.y,
                camera.userData.followZOffset+data.body.position.z
            );
            camera.lookAt(new THREE.Vector3(
                data.body.position.x,
                data.body.position.y,
                data.body.position.z
            ));
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
    },
};

export default userPlayerData;