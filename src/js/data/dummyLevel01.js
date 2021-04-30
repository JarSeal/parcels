const floorFriction = 0.35;
const wallFriction = 0.05;
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
            id: 'tempFloor',
            name: 'floor',
            type: 'box',
            size: [20, 0.25, 20],
            position: [0, -0.125, 0],
            material: { friction: floorFriction },
            helperColor: 0xcc00cc,
        },
        {
            id: 'tempWall01',
            name: 'wall',
            type: 'box',
            size: [20, 2, 1],
            position: [0, 1, -9.5],
            material: { friction: wallFriction },
            helperColor: 0xcc0000,
        },
        {
            id: 'tempWall02',
            name: 'wall',
            type: 'box',
            size: [20, 2, 1],
            position: [0, 1, 9.5],
            material: { friction: wallFriction },
            helperColor: 0xcc0000,
        },
        {
            id: 'tempWall03',
            name: 'wall',
            type: 'box',
            size: [1, 2, 20],
            position: [9.5, 1, 0],
            material: { friction: wallFriction },
            helperColor: 0xcc0000,
        },
        {
            id: 'tempWall04',
            name: 'wall',
            type: 'box',
            size: [1, 2, 20],
            position: [-9.5, 1, 0],
            material: { friction: wallFriction },
            helperColor: 0xccff00,
        },
    ],
};

export default levelData;