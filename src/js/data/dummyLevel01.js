const levelData = {
    model: 'dummyLevelObject01.glb',
    path: '/models/dummyLevelObject01/',
    textureSizes: [512, 1024, 2048, 4096],
    textures: ['AO_AND_DIFFUSE', 'DIFFUSE', 'AO'],
    ext: 'png',
    size: [10, 2.6, 10],
    position: [0, -0.125, 0],
    floorThickness: 0.25,
    physics: [
        {
            name: 'floor',
            type: 'box',
            size: [20, 0.25, 20],
            position: [0, -0.125, 0],
            material: { friction: 0.3 },
            isGroundMesh: true,
        },
    ],
};

export default levelData;