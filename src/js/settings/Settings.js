import { GUI } from 'three/examples/jsm/libs/dat.gui.module.js';
import * as Stats from '../vendor/stats.min.js';
import defaultSettings from './defaultSettings';

class Settings {
    constructor(sceneState) {
        this.sceneState = sceneState;
        this._initSettings(sceneState);
    }

    _initSettings(sceneState) {
        sceneState.settings = defaultSettings;
        sceneState.defaultSettings = defaultSettings;

        // GUI setup [START]
        if(sceneState.settings.enableGui) {
            const gui = new GUI();
            gui.close();
            sceneState.gui = gui;
        }
        // GUI setup [/END]
    }

    createStats() {
        const stats = new Stats();
        stats.setMode(0);
        stats.domElement.id = 'debug-stats-wrapper';
        document.body.appendChild(stats.domElement);
        if(!this.sceneState.settings.debug.showStats) {
            document.getElementById('debug-stats-wrapper').style.display = 'none';
        }
        if(this.sceneState.settings.enableGui) {
            const debugFolder = this.sceneState.gui.addFolder('Debug');
            debugFolder.add(this.sceneState.settings.debug, 'showStats').name('Show stats').onChange((value) => {
                document.getElementById('debug-stats-wrapper').style.display = value ? 'block' : 'none';
            });
        }
        return stats;
    }
}

export default Settings;