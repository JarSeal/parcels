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
            id: 'floor',
            section: 'floor',
            type: 'box',
            size: [8, 0.5, 5],
            position: [4, -0.25, 2.5],
            helperColor: 0xffcc00,
        },
        {
            id: 'wall01',
            section: 'wall',
            type: 'box',
            size: [8, 2.8, 0.3],
            position: [4, 1.4, 0.37],
            helperColor: 0xcc0044,
        },
        {
            id: 'wall02',
            section: 'wall',
            type: 'box',
            size: [0.3, 2.8, 5],
            position: [0.37, 1.4, 2.5],
            helperColor: 0xcc0000,
        },
        {
            id: 'wall03',
            section: 'wall',
            type: 'box',
            size: [0.3, 2.8, 5],
            position: [7.63, 1.4, 2.5],
            helperColor: 0xcc0000,
        },
        {
            id: 'wall04',
            section: 'wall',
            type: 'box',
            size: [3.6, 2.8, 0.3],
            position: [1.8, 1.4, 4.63],
            helperColor: 0xccff00,
        },
        {
            id: 'wall05',
            section: 'wall',
            type: 'box',
            size: [2.6, 2.8, 0.3],
            position: [6.7, 1.4, 4.63],
            helperColor: 0xcc3300,
        },
        {
            id: 'doorFrame01',
            section: 'wall',
            type: 'box',
            size: [0.725, 2.8, 0.775],
            position: [5.575, 1.4, 4.62],
            helperColor: 0x33cc00,
        },
        {
            id: 'doorFrame02',
            section: 'wall',
            type: 'box',
            size: [0.725, 2.8, 0.775],
            position: [3.425, 1.4, 4.62],
            helperColor: 0x33cc00,
        },
        {
            id: 'doorFrame03',
            section: 'wall',
            type: 'box',
            size: [1.5, 0.65, 0.775],
            position: [4.5, 2.5, 4.62],
            helperColor: 0xaa8800,
        },
        {
            id: 'pilar01',
            section: 'wall',
            type: 'box',
            size: [0.4, 2.8, 1],
            position: [3.5, 1.4, 0.5],
            helperColor: 0xcc00ff,
        },
        {
            id: 'table01',
            section: 'wall',
            type: 'box',
            size: [1.58, 0.075, 1],
            position: [4.87, 1.06, 1.02],
            helperColor: 0xcc77ff,
        },
        {
            id: 'table02',
            section: 'floor',
            type: 'box',
            size: [1.56, 0.075, 0.98],
            position: [4.87, 1.065, 1.02],
            helperColor: 0x0077ff,
        },
        {
            id: 'bed01',
            section: 'wall',
            type: 'box',
            size: [1.42, 0.3, 2.37],
            position: [6.5, 0.15, 2.12],
            helperColor: 0xcc77ff,
        },
        {
            id: 'bed02',
            section: 'floor',
            type: 'box',
            size: [1.25, 0.3, 2.2],
            position: [6.5, 0.215, 2.12],
            helperColor: 0x0077ff,
        },
        {
            id: 'wallDiagonal01',
            section: 'wall',
            type: 'box',
            size: [8, 1, 0.3],
            position: [4, 0.5, 0.65],
            rotation: [Math.PI / -4, 0, 0],
            helperColor: 0x002f22,
        },
        {
            id: 'wallDiagonal02',
            section: 'wall',
            type: 'box',
            size: [0.3, 1, 5],
            position: [0.65, 0.5, 2.5],
            rotation: [0, 0, Math.PI / 4],
            helperColor: 0x002f22,
        },
        {
            id: 'wallDiagonal03',
            section: 'wall',
            type: 'box',
            size: [0.3, 1, 5],
            position: [7.35, 0.5, 2.5],
            rotation: [0, 0, Math.PI / -4],
            helperColor: 0x002f22,
        },
        {
            id: 'wallDiagonal04',
            section: 'wall',
            type: 'box',
            size: [3.8, 1, 0.3],
            position: [1.9, 0.5, 4.35],
            rotation: [Math.PI / 4, 0, 0],
            helperColor: 0x002f22,
        },
        {
            id: 'wallDiagonal05',
            section: 'wall',
            type: 'box',
            size: [2.8, 1, 0.3],
            position: [6.6, 0.5, 4.35],
            rotation: [Math.PI / 4, 0, 0],
            helperColor: 0x002f22,
        },
        {
            id: 'toilet01',
            section: 'wall',
            type: 'box',
            size: [0.57, 0.6, 0.8],
            position: [2.62, 0.3, 1.12],
            helperColor: 0xffffff,
        },
        {
            id: 'toilet02',
            section: 'floor',
            type: 'box',
            size: [0.56, 0.7, 0.79],
            position: [2.615, 0.35, 1.115],
            helperColor: 0x00ffff,
        },
        {
            id: 'toilet03',
            section: 'wall',
            type: 'box',
            size: [1.6, 2.2, 0.25],
            position: [2.15, 1.1, 0.7],
            helperColor: 0x00ff00,
        },
        {
            id: 'shower01',
            section: 'wall',
            type: 'box',
            size: [0.1, 0.1, 1.3],
            position: [1.5, 2.2, 0.9],
            helperColor: 0xf0f933,
        },
        {
            id: 'shelf01',
            section: 'wall',
            type: 'box',
            size: [0.9, 2.2, 0.5],
            position: [2.5, 1.05, 4.3],
            helperColor: 0x40f9cc,
        },
        {
            id: 'sink01',
            section: 'wall',
            type: 'box',
            size: [1.5, 0.2, 0.5],
            position: [1.3, 0.93, 4.3],
            helperColor: 0x40f9cc,
        },
        {
            id: 'pipe01',
            section: 'wall',
            type: 'box',
            size: [2.2, 0.2, 0.2],
            position: [1.9, 2.35, 4.3],
            helperColor: 0xfff9cc,
        },
        {
            id: 'pipe02',
            section: 'wall',
            type: 'box',
            size: [1.75, 0.2, 0.2],
            position: [3.67, 2.35, 4.05],
            helperColor: 0xfff9cc,
        },
        {
            id: 'pipe03',
            section: 'wall',
            type: 'box',
            size: [0.2, 0.2, 2.2],
            position: [0.85, 2.35, 3.18],
            helperColor: 0xfff9cc,
        },
        {
            id: 'roof01',
            section: 'floor',
            roof: true,
            type: 'box',
            size: [8, 0.5, 5],
            position: [4, 3, 2.5],
            helperColor: 0xff00cc,
        },
    ],
};

export default moduleData;