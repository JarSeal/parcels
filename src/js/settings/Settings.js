import { GUI } from 'three/examples/jsm/libs/dat.gui.module.js';
import * as Stats from '../vendor/stats.min.js';
import defaultSettings from './defaultSettings';

class Settings {
    constructor(sceneState) {
        this.sceneState = sceneState;
        this.userSettings = {};
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

    addGuiElem(type, setting, settingKey, folder, onChange) {
        const ss = this.sceneState;
        if(ss.settings.enableGui) {
            let target;
            switch(type) {
            case 'boolean':
                folder ? target = folder : target = ss.gui;
                target.add(setting, settingKey).name('Use FXAA').onChange(onChange);
                break;
            }
        }
    }

    addGuiFolder(name) {
        const ss = this.sceneState;
        if(ss.settings.enableGui) {
            const folders = Object.keys(ss.gui.__folders);
            if(folders.includes(name)) return ss.gui.__folders[name];
            return ss.gui.addFolder(name);
        }
        return null;
    }

    addUserSetting(args) {
        args;
        // TODO
        // args is an object and needs to be defined..
    }
}

export default Settings;