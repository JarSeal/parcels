import modulesData from './modulesData';
import levelDummy01 from './levels/levelDummy01';

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
            levelDummy01
        };
        const data = this._unpackData(levelsData[id]);
        callBack(data);
    }

    _unpackData(data) {
        let newData = { ...data, tiles: [] };
        const modules = data.modules;
        for(let i=0; i<modules.length; i++) {
            const mParams = modules[i];
            const moduleData = modulesData[mParams.id];
            data.modules[i] = Object.assign(data.modules[i], moduleData);
            this._turnModule(data.modules[i]);
            this._placeModule(data.modules[i], mParams.pos, newData);
        }
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