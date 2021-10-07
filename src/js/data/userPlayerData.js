const userPlayerData = {
    id: 'some-unique-player-id',
    name: 'Keijo',
    position: [15, 2, 4],
    direction: 0,
    speed: 2.5,
    runAnimScale: 1.15,
    jump: 4.8,
    charHeight: 1.82,
    path: '/models/characters/spacesuit_human_male/',
    model: 'spacesuit_human_male.glb',
    modelTexture: 'spacesuit3_human_male',
    textureSizes: [512, 1024],
    textureExt: 'png',
    createValues: {
        yOffset: -0.94,
        zRotation: -Math.PI / 2,
        scale: 0.0068,
    },
    curMovementSpeed: 0,
    moveKeysPressed: 0,
    userPlayer: true,
    shotHeights: {
        handgun: [0.2], // index 0 = standing normally, 1 = kneeled, 2 = crouching / crawling
    },
};

export default userPlayerData;