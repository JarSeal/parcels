import modulesData from './modulesData';
import ship01 from './levels/ship01';

// This class mocks the data received from the server (loadLevelsData)

class LevelsData {
    constructor(sceneState) {
        this.sceneState = sceneState;
        this.halfPi = sceneState.utils.getCommonPIs('half');
        this.threeHalvesPi = sceneState.utils.getCommonPIs('threeHalves');
    }

    loadLevelsData(id, callBack) {
        // Temp mock data, load the data here eventually with async/await
        const levelsData = {
            ship01
        };
        const level = levelsData[id];
        if(!level) {
            this.sceneState.logger.error('Unknown level id: ' + id);
            return null;
        }
        const data = this._unpackData(level);
        callBack(data);
    }

    _unpackData(data) {
        let newData = { ...data, tiles: [] },
            smallestY = 0,
            smallestX = 0;
        const modules = data.modules;
        // Get and save smallest position values (will be used as the offset for the ship's position)
        for(let i=0; i<modules.length; i++) {
            console.log('MODULE', modules[i]);
            const module = modules[i];
            if(module.pos[1] < smallestY) smallestY = module.pos[1];
            if(module.pos[2] < smallestX) smallestX = module.pos[2];
        }
        for(let i=0; i<modules.length; i++) {
            const mParams = modules[i];
            mParams.pos[1] += smallestY;
            mParams.pos[2] += smallestX;
            const moduleData = modulesData[mParams.id];
            if(!moduleData) {
                this.sceneState.logger.error('Unknown module: ' + mParams.id);
                return null;
            }
            data.modules[i] = Object.assign(data.modules[i], moduleData);
            this._turnModule(data.modules[i]);
            this._placeModule(data.modules[i], mParams.pos, newData);
            // console.log('DATA HERE', data.modules[i], mParams.pos, newData);
            // 1. normalise (set to start from zero, zero) the minus values and keep them in memory for later usage
            // 2. start to create ship
            // 3. offset the ship position by the normalising value..
            // this._createPhysicsElems();
        }
        newData.pos[1] = smallestY;
        newData.pos[2] = smallestX;
        return newData;
    }

    _turnModule(data) {
        data.turnRadians = 0;
        if(data.turn === 1) {
            data.turnRadians = this.halfPi;
            data.boundingDims = [
                data.boundingDims[0],
                data.boundingDims[2],
                data.boundingDims[1],
            ];
        } else if(data.turn === 2) {
            data.turnRadians = Math.PI;
        } else if(data.turn === 3) {
            data.turnRadians = this.threeHalvesPi;
            data.boundingDims = [
                data.boundingDims[0],
                data.boundingDims[2],
                data.boundingDims[1],
            ];
        }
        data.tiles = this.sceneState.utils.turnTiles(data.tiles, data.turn);
    }

    _placeModule(mData, mPos, lData) {
        const lDims = lData.boundingDims;
        const mDims = mData.boundingDims;
        const tiles = mData.tiles;
        let nextTile = [0, 0, 0];
        for(let floor=0; floor<lDims[0]; floor++) {
            if(!lData.tiles[floor]) lData.tiles.push([]);
            nextTile[1] = 0;
            for(let row=0; row<lDims[1]; row++) {
                if(!lData.tiles[floor][row]) lData.tiles[floor].push([]);
                nextTile[2] = 0;
                for(let col=0; col<lDims[2]; col++) {
                    if (floor < mPos[0] + mDims[0] && floor >= mPos[0] &&
                        row < mPos[1] + mDims[1] && row >= mPos[1] &&
                        col < mPos[2] + mDims[2] && col >= mPos[2]) {
                        if(lData.tiles[floor][row][col] && lData.tiles[floor][row][col].t > 0) {
                            this.sceneState.logger.error('Tile at [' + row + ', ' + col + '] (floor: ' + floor + ') already has an assigned tile.');
                        }
                        lData.tiles[floor][row].push(tiles[nextTile[0]][nextTile[1]][nextTile[2]]);
                        nextTile[2]++;
                    } else {
                        if(!lData.tiles[floor][row][col]) {
                            lData.tiles[floor][row].push({t:0});
                        }
                    }
                }
                if (floor < mPos[0] + mDims[0] && floor >= mPos[0] &&
                    row < mPos[1] + mDims[1] && row >= mPos[1]) {
                    nextTile[1]++;
                }
            }
            if (floor < mPos[0] + mDims[0] && floor >= mPos[0]) {
                nextTile[0]++;
            }
        }
    }
}

export default LevelsData;