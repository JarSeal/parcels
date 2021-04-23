const userPlayerData = {
    id: 'some-unique-player-id',
    name: 'Keijo',
    position: [0, 0.91, 0],
    direction: 0,
    moveSpeed: 0.25,
    maxSpeed: 2.5,
    speed: 150,
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
        console.log('BODY', data.body);
    },
    renderFn: (timeStep, data, sceneState, THREE) => {
        let veloX = 0, veloZ = 0;
        // const startTimes = data.moveStartTimes;
        // const timeNow = performance.now();
        // const elapsedXTime = timeNow - startTimes.startX;
        // const elapsedZTime = timeNow - startTimes.startZ;
        // if(elapsedXTime < 350 && elapsedZTime < 350) {
        //     veloX = elapsedXTime / 350 * data.maxSpeed * data.xPosMulti;
        // } else {
        //     veloX = data.maxSpeed * data.xPosMulti;
        // }
        // if(elapsedZTime < 350 && elapsedXTime < 350) {
        //     veloZ = elapsedZTime / 350 * data.maxSpeed * data.zPosMulti;
        // } else {
        //     veloZ = data.maxSpeed * data.zPosMulti;
        // }
        veloX = data.xPosMulti * 1.5;
        veloZ = data.zPosMulti * 1.5;
        // data.body.mass = 100 * ((1/30) / timeStep);
        data.body.velocity.x = veloX;
        data.body.velocity.z = veloZ;
        data.body.previousPosition.copy(data.body.position);
        data.mesh.position.copy(data.body.interpolatedPosition);
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