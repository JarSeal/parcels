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
};

export default userPlayerData;