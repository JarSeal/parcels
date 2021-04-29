const userPlayerData = {
    id: 'some-unique-player-id',
    name: 'Keijo',
    position: [0, 4.91, 0],
    direction: 0,
    moveSpeed: 0.25,
    maxSpeed: 2.5,
    speed: 2.8,
    charHeight: 1.82,
    curMovementSpeed: 0,
    moveKeysPressed: 0,
    userPlayer: true,
    createPlayerFn: (data, sceneState, THREE) => {
        const id = data.id;
        sceneState.players[id] = data;
        sceneState.userPlayerId = id;
        sceneState.userPlayerIndex = null;
        sceneState.playerKeys.push(id);
        sceneState.playerKeysCount += 1;

        const pos = data.position;
        const pGeo = new THREE.BoxBufferGeometry(0.7, data.charHeight, 0.8);
        const pMat = new THREE.MeshLambertMaterial({ color: 0x002f00 });
        const pMesh = new THREE.Mesh(pGeo, pMat);
        pMesh.position.set(pos[0], pos[1], pos[2]);
        const nGeo = new THREE.BoxBufferGeometry(0.1, 0.1, 0.1);
        const nMesh = new THREE.Mesh(nGeo, new THREE.MeshLambertMaterial({ color: 0x777777 }));
        nMesh.position.set(0.2, data.charHeight / 2, 0);
        pMesh.add(nMesh);
        pMesh.name = id + '-' + 'mainchild';
        const playerGroup = new THREE.Group();
        playerGroup.add(pMesh);
        playerGroup.name = id;
        data.mesh = playerGroup;
        sceneState.scenes[sceneState.curScene].add(playerGroup);

        sceneState.physicsClass.addShape({
            id,
            type: 'compound',
            moving: true,
            mass: 70,
            position: [pos[0], pos[1], pos[2]],
            rotation: [0, 0, 0],
            material: { friction: 0.01 },
            updateFn: (shape) => {
                if(sceneState.settings.debug.cameraFollowsPlayer) {
                    const camera = sceneState.cameras[sceneState.curScene];
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
                if(shape.mesh.position.y < -50) {
                    alert('WASTED!');

                    // // position
                    // data.body.position.y = 10;
                    // data.body.position.x = 0;
                    // data.body.position.z = 0;

                    // // orientation
                    // data.body.quaternion.set(0,0,0,1);
                    // data.body.initQuaternion.set(0,0,0,1);
                    // data.body.previousQuaternion.set(0,0,0,1);
                    // data.body.interpolatedQuaternion.set(0,0,0,1);

                    // // Velocity
                    // data.body.velocity.setZero();
                    // data.body.initVelocity.setZero();
                    // data.body.angularVelocity.setZero();
                    // data.body.initAngularVelocity.setZero();
                }
            },
            mesh: pMesh,
            fixedRotation: true,
            sleep: {
                allowSleep: true,
                sleeSpeedLimit: 0.1,
                sleepTimeLimit: 1,
            },
            characterData: data,
        });

        // Make the actual capsule shape
        sceneState.physicsClass.addShape({
            id: id + '_comp_cylinder',
            compoundParentId: id,
            type: 'cylinder',
            radiusTop: data.charHeight / 4,
            radiusBottom: data.charHeight / 4,
            height: data.charHeight / 2,
            numSegments: 32,
            position: [0, 0, 0],
            helperColor: 0xcc1122,
        });
        sceneState.physicsClass.addShape({
            id: id + '_comp_sphereLower',
            compoundParentId: id,
            type: 'sphere',
            radius: data.charHeight / 4,
            position: [0, -data.charHeight / 4, 0],
            helperColor: 0xcc1122,
        });
        sceneState.physicsClass.addShape({
            id: id + '_comp_sphereUpper',
            compoundParentId: id,
            type: 'sphere',
            radius: data.charHeight / 4,
            position: [0, data.charHeight / 4, 0],
            helperColor: 0xcc1122,
        });
    },
};

export default userPlayerData;