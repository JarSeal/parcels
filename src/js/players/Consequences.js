class Consequences {
    constructor(sceneState, runMainApp) {
        this.sceneState = sceneState;
        this.consWorker = new Worker('./webworkers/consequences.js');
        this._initConsequencesWorker(runMainApp);
    }

    _initConsequencesWorker(runMainApp) {
        this.consWorker.postMessage({ init: true });
        this.consWorker.addEventListener('message', (e) => {
            console.log('Main thread', e.data);
            if(e.data.initDone) {
                runMainApp();
            } else if(e.data.error) {
                this.sceneState.logger.error('From consequences worker:', e.data.error);
                throw new Error('**Error stack:**');
            }
        });
        this.consWorker.addEventListener('error', (e) => {
            this.sceneState.logger.error('Worker event listener:', e.message);
            throw new Error('**Error stack:**');
        });
    }

    requestConsequences() {
        
    }
}

export default Consequences;