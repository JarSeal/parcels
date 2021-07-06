
const addFloorShape = (data, sceneState) => {
    if(!data || !sceneState) {
        sceneState.logger.error('Could not find data and/or sceneState at physics/levelTypes addFloorShape.');
        return;
    }
    const colors = [0xff4400, 0xff0000, 0x44ee00, 0xccaa00, 0xaa00cc, 0xf200a9];
    sceneState.physicsClass.addShape({
        id: 'floorShape_' + 'f' + data.floor + '_' + data.moduleData.id + '_' + data.moduleIndex + '_' + data.floorIndex,
        compoundParentId: data.compId,
        type: 'box',
        size: [data.x / 2, 0.5 / 2, data.z / 2],
        position: [
            data.x / 2 + data.moduleData.pos[2] + data.startX,
            -0.25,
            data.z / 2 + data.moduleData.pos[1] + data.startZ,
        ],
        sleep: {
            allowSleep: true,
            sleeSpeedLimit: 0.1,
            sleepTimeLimit: 1,
        },
        helperColor: colors[data.floorIndex > 5 ? 0 : data.floorIndex],
    });
};

const addWallShape = (data, sceneState) => {
    if(!data || !sceneState) {
        sceneState.logger.error('Could not find data and/or sceneState at physics/levelTypes addWallShape.');
        return;
    }
    const colors = [0xff4400, 0xff0000, 0x44ee00, 0xccaa00, 0xaa00cc, 0xf200a9];
    sceneState.physicsClass.addShape({
        id: 'wallShape1_' + 'f' + data.floor + '_' + data.moduleData.id + '_' + data.moduleIndex + '_' + data.wallIndex,
        compoundParentId: data.compId,
        type: 'box',
        size: data.horisontal
            ? [data.wallLength / 2, 3 / 2, 0.5]
            : [0.5, 3 / 2, data.wallLength / 2],
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
    sceneState.physicsClass.addShape({
        id: 'wallShape2_' + 'f' + data.floor + '_' + data.moduleData.id + '_' + data.moduleIndex + '_' + data.wallIndex,
        compoundParentId: data.compId,
        type: 'box',
        rotation: createWallTilt(data),
        size: data.horisontal
            ? [data.wallLength / 2, 3 / 2, 0.5]
            : [0.5, 3 / 2, data.wallLength / 2],
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
        helperColor: 0xcc7700,
    });
};

const createWallTilt = (data) => {
    let tilt = 1;
    if(data.floorNeighbors.top || data.floorNeighbors.right) {
        tilt = 4;
    } else if(data.floorNeighbors.bottom || data.floorNeighbors.left) {
        tilt = -4;
    } else {
        return null;
    }
    return data.horisontal
        ? [Math.PI / tilt, 0, 0]
        : [0, 0, Math.PI / tilt];
};

const level1Physics = (type, section, sceneState, data) => {
    if(section === 'wall') {
        addWallShape(data, sceneState);
    } else if(section === 'floor') {
        addFloorShape(data, sceneState);
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