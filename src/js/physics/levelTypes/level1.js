
const addFloorShape = (data, sceneState, section) => {
    if(!data || !sceneState) {
        sceneState.logger.error('Could not find data and/or sceneState at physics/levelTypes addFloorShape.');
        return;
    }
    const colors = [0xff4400, 0xff0000, 0x44ee00, 0xccaa00, 0xaa00cc, 0xf200a9];
    let idShapeName = 'floorShape';
    if(section === 'roof') idShapeName = 'roofShape';
    sceneState.physicsClass.addShape({
        id: idShapeName + '_f' + data.floor + '_' + data.moduleData.id + '_' + data.moduleIndex + '_' + data.floorIndex,
        compoundParentId: data.compId,
        type: 'box',
        size: [
            data.x / 2,
            section === 'roof' ? 0.1 : 0.25,
            data.z / 2
        ],
        position: [
            data.x / 2 + data.moduleData.pos[2] + data.startX,
            section === 'roof' ? 3.08 : -0.25,
            data.z / 2 + data.moduleData.pos[1] + data.startZ,
        ],
        sleep: {
            allowSleep: true,
            sleeSpeedLimit: 0.1,
            sleepTimeLimit: 1,
        },
        wireframe: section === 'roof',
        helperColor: colors[data.floorIndex > 5 ? 0 : data.floorIndex],
    });
};

const addWallShape = (data, sceneState) => {
    if(!data || !sceneState) {
        sceneState.logger.error('Could not find data and/or sceneState at physics/levelTypes addWallShape.');
        return;
    }
    if(!data.doorTile) {
        setDoorFrameSizeAndPosition(data);
    } else {
        data.wallLength += 0.4;
        if(data.horisontal) {
            data.startX -= 0.2;
        } else {
            data.startZ -= 0.2;
        }
    }
    const colors = [0xff4400, 0xff0000, 0x44ee00, 0xccaa00, 0xaa00cc, 0xf200a9];
    if(data.special) {
        addSpecialWall(data, sceneState, colors);
        return;
    }
    const doorTopData = {
        height: data.cargoDoor ? 0.25 : 0.37,
        width: data.cargoDoor ? 0.2 : 0.27,
        yPos: data.cargoDoor ? 2.7 : 2.65,
    };
    sceneState.physicsClass.addShape({
        id: createWallID(data),
        compoundParentId: data.compId,
        type: 'box',
        size: data.horisontal
            ? [
                data.wallLength / 2,
                data.doorTile ? doorTopData.height : 1.5,
                data.doorTile ? doorTopData.width : 0.15
            ]
            : [
                data.doorTile ? doorTopData.width : 0.15,
                data.doorTile ? doorTopData.height : 1.5,
                data.wallLength / 2
            ],
        position: data.horisontal
            ? [
                data.wallLength / 2 + data.moduleData.pos[2] + data.startX,
                data.doorTile ? doorTopData.yPos : 1.5,
                0.5 + data.moduleData.pos[1] + data.startZ + addWallPosOffset(data.floorNeighbors),
            ]
            : [
                0.5 + data.moduleData.pos[2] + data.startX + addWallPosOffset(data.floorNeighbors),
                data.doorTile ? doorTopData.yPos : 1.5,
                data.wallLength / 2 + data.moduleData.pos[1] + data.startZ,
            ],
        sleep: {
            allowSleep: true,
            sleeSpeedLimit: 0.1,
            sleepTimeLimit: 1,
        },
        helperColor: colors[data.wallIndex > 5 ? 0 : data.wallIndex],
    });
    if(data.doorTile) return;
    const sectionHeight = 0.36;
    sceneState.physicsClass.addShape({
        //id: 'wallShape2_' + 'f' + data.floor + '_' + data.moduleData.id + '_' + data.moduleIndex + '_' + data.wallIndex,
        id: createWallID(data, '2'),
        compoundParentId: data.compId,
        type: 'box',
        rotation: createWallTilt(data),
        size: data.horisontal
            ? [data.wallLength / 2, sectionHeight, 0.3]
            : [0.3, sectionHeight, data.wallLength / 2],
        position: data.horisontal
            ? [
                data.wallLength / 2 + data.moduleData.pos[2] + data.startX,
                0.32,
                0.5 + data.moduleData.pos[1] + data.startZ,
            ]
            : [
                0.5 + data.moduleData.pos[2] + data.startX,
                0.32,
                data.wallLength / 2 + data.moduleData.pos[1] + data.startZ,
            ],
        sleep: {
            allowSleep: true,
            sleeSpeedLimit: 0.1,
            sleepTimeLimit: 1,
        },
        helperColor: 0xcc7700,
    });
};

const createWallTilt = (data) => {
    let tilt = 1;
    if(data.floorNeighbors.top || data.floorNeighbors.right) {
        tilt = 3.56;
    } else if(data.floorNeighbors.bottom || data.floorNeighbors.left) {
        tilt = -3.56;
    } else {
        return null;
    }
    return data.horisontal
        ? [Math.PI / tilt, 0, 0]
        : [0, 0, Math.PI / tilt];
};

const addWallPosOffset = (neighbors) => {
    const amount = 0.2;
    let offset = 0;
    if(neighbors.top || neighbors.left) offset += amount;
    if(neighbors.bottom || neighbors.right) offset -= amount;
    return offset;
};

const setDoorFrameSizeAndPosition = (data) => {
    if(data.cargoDoor) return;
    if(data.doorNeighbor.top) {
        data.wallLength = 1.8;
        data.startZ += 0.2;
    } else if(data.doorNeighbor.bottom) {
        data.wallLength = 1.8;
    } else if(data.doorNeighbor.left) {
        data.wallLength = 1.8;
        data.startX += 0.2;
    } else if(data.doorNeighbor.right) {
        data.wallLength = 1.8;
    }
};

const addSpecialWall = (data, sceneState, colors) => {
    if(data.special === 1) {
        // Engine block
        sceneState.physicsClass.addShape({
            id: createWallID(data),
            compoundParentId: data.compId,
            type: 'box',
            size: data.horisontal
                ? [
                    data.wallLength / 2,
                    1.5,
                    0.5
                ]
                : [
                    0.5,
                    1.5,
                    data.wallLength / 2
                ],
            position: data.horisontal
                ? [
                    data.wallLength / 2 + data.moduleData.pos[2] + data.startX,
                    1.5,
                    0.5 + data.moduleData.pos[1] + data.startZ,
                ]
                : [
                    0.5 + data.moduleData.pos[2] + data.startX,
                    1.5,
                    data.wallLength / 2 + data.moduleData.pos[1] + data.startZ,
                ],
            sleep: {
                allowSleep: true,
                sleeSpeedLimit: 0.1,
                sleepTimeLimit: 1,
            },
            helperColor: colors[data.wallIndex > 5 ? 0 : data.wallIndex],
        });
    } else if(data.special === 2) {
        // Power source cylinder
        sceneState.physicsClass.addShape({
            id: createWallID(data),
            compoundParentId: data.compId,
            type: 'cylinder',
            radiusTop: 0.9,
            radiusBottom: 0.9,
            height: 2.5,
            numSegments: 16,
            position: [
                data.startX + data.moduleData.pos[2] + 0.5,
                1.25,
                data.startZ + data.moduleData.pos[1] + 0.5,
            ],
            helperColor: 0xcc1122,
        });
    }
};

const createWallID = (data, nameNumber) => {
    let nameExt = '0';
    if(!nameNumber) nameExt = nameNumber;
    return 'wallShape' + nameExt + '_f' +
        data.floor + '_' +
        data.moduleData.id + '_' +
        data.moduleIndex + '_' +
        data.wallIndex;
};

const level1Physics = (type, section, sceneState, data) => {
    if(section === 'wall') {
        addWallShape(data, sceneState);
    } else if(section === 'floor' || section === 'roof') {
        addFloorShape(data, sceneState, section);
    } else {
        sceneState.logger.error('Level section not defined or unknown (at physics/levelTypes): ' + (section
            ? section
            : '[SECTION]'
            + ', type: ' + (type
                ? type
                : '[SECTION]')));
    }
};

export default level1Physics;