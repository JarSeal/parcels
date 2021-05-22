const moduleData = {
    id: 'dummyModule01',
    name: 'Dummy module 01',
    boundingDims: [1, 5, 8],
    tiles: [
        [
            [{t:1},{t:1},{t:1},{t:1},{t:1},{t:1},{t:1},{t:1},],
            [{t:1},{t:2},{t:2},{t:2},{t:2},{t:2},{t:2},{t:1},],
            [{t:1},{t:2},{t:2},{t:2},{t:2},{t:2},{t:2},{t:1},],
            [{t:1},{t:2},{t:2},{t:2},{t:2},{t:2},{t:2},{t:1},],
            [{t:1},{t:1},{t:1},{t:1},{t:2},{t:1},{t:1},{t:1},],
        ],
    ],
    path: '/models/modules/cabin001/',
    models: [
        {
            exterior: 'cabin_exterior_001.glb',
            interior: 'cabin_interior_001.glb',
            roof: null,
            bottom: null, // maybe..
            details: null, // maybe..
        },
    ],
    textures: [
        {
            exterior: 'cabin-exterior001',
            interior: 'cabin-interior001',
            roof: null,
            bottom: null, // maybe..
            details: null, // maybe..
        },
    ],
    textureExt: 'png',
    textureSizes: [512, 1024, 2048, 4096],
    physics: [
        {
            id: 'tempFloor',
            section: 'floor',
            type: 'box',
            size: [5, 0.5, 8],
            position: [2.5, -0.25, 4],
            helperColor: 0xffcc00,
        },
        {
            id: 'tempWall01',
            section: 'wall',
            type: 'box',
            size: [5, 2, 0.3],
            position: [2.5, 1, 0.5],
            helperColor: 0xcc0044,
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

export default moduleData;