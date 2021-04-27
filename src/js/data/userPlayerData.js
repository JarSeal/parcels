const userPlayerData = {
    id: 'some-unique-player-id',
    name: 'Keijo',
    position: [0, 0.91, 0],
    direction: 0,
    moveSpeed: 0.25,
    maxSpeed: 2.5,
    speed: 2.8,
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

        sceneState.physicsClass.addShape({
            id,
            type: 'box',
            moving: true,
            mass: 70,
            size: [0.8 / 2, 0.8 / 2, 0.8 / 2],
            position: [pos[0], pos[1], pos[2]],
            quaternion: null,
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
            sleep: {
                allowSleep: true,
                sleeSpeedLimit: 0.1,
                sleepTimeLimit: 1,
            },
            characterData: data,
        });
    },
};

export default userPlayerData;