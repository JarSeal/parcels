import modulesData from './modulesData';
import levelDummy01 from './levels/levelDummy01';

class LevelsData {
    constructor() {
        // This class represents the back end
        // and emulates what is being done to the data
        // and how it serves the data to the front end.
    }

    getLevelsData(id) {
        const levelsData = {
            levelDummy01
        };
        return this._unpackData(levelsData[id]);
    };

    _unpackData(data) {
        let newData = { ...data };
        const modules = data.modules;
        for(let i=0; i<modules.length; i++) {
            const mParams = modules[i];
            const moduleData = modulesData[mParams.id];
            this._placeModules(moduleData, newData);
            console.log('MODULE', i, mParams, moduleData);
        }
        return newData;
    }

    _placeModules(mData, lData) {
        
    }
}

export default LevelsData;