const levelData = {
    models: {
        interior: {
            model: 'cabin_interior_001.glb',
            textureMapName: 'cabin-interior001',
        },
        exterior: {
            model: 'cabin_exterior_001.glb',
            textureMapName: 'cabin-exterior001',
            textureNormalMapName: 'cabin-exterior001_normal',
        },
    },
    path: '/models/modules/cabin001/',
    textureSizes: [512, 1024, 2048, 4096],
    ext: 'png',
    size: [10, 2.6, 10],
    position: [0, -0.5, 0],
    floorThickness: 0.25,
    physics: [
        {
            id: 'tempFloor',
            section: 'floor',
            type: 'box',
            size: [20, 0.25, 20],
            position: [0, -0.125, 0],
            helperColor: 0xcc00cc,
        },
        {
            id: 'tempWall01',
            section: 'wall',
            type: 'box',
            size: [20, 2, 1],
            position: [0, 1, -9.5],
            helperColor: 0xcc0000,
        },
        {
            id: 'tempWall02',
            section: 'wall',
            type: 'box',
            size: [20, 2, 1],
            position: [0, 1, 9.5],
            helperColor: 0xcc0000,
        },
        {
            id: 'tempWall03',
            section: 'wall',
            type: 'box',
            size: [1, 2, 20],
            position: [9.5, 1, 0],
            helperColor: 0xcc0000,
        },
        {
            id: 'tempWall04',
            section: 'wall',
            type: 'box',
            size: [1, 2, 20],
            position: [-9.5, 1, 0],
            helperColor: 0xccff00,
        },
    ],
};

export default levelData;