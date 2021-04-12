import { GUI } from 'three/examples/jsm/libs/dat.gui.module.js';
import * as Stats from '../vendor/stats.min.js';
import defaultSettings from './defaultSettings';

class Settings {
    constructor(sceneState) {
        this.sceneState = sceneState;
        this.userSettings = {};
        this._initSettings(sceneState);
        this._debugSettings(sceneState);
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

    _debugSettings(sceneState) {
        const settings = sceneState.settings;

        if(!settings.debug.showAxesHelper) sceneState.axesHelper.visible = false;
        this.addGuiElem(
            'boolean',
            settings.debug,
            'showAxesHelper',
            'Show axes helper',
            'Debug',
            (value) => {
                sceneState.axesHelper.visible = value;
            }
        );
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
            this.addGuiElem(
                'boolean',
                this.sceneState.settings.debug,
                'showStats',
                'Show stats',
                'Debug',
                (value) => {
                    document.getElementById('debug-stats-wrapper').style.display = value ? 'block' : 'none';
                }
            );
        }
        return stats;
    }

    addGuiElem(type, setting, settingKey, name, folder, onChange) {
        const ss = this.sceneState;
        if(!ss.settings.enableGui) return;
        let target;
        folder ? target = this.addGuiFolder(folder) : target = ss.gui;
        switch(type) {
        case 'boolean':
            target.add(setting, settingKey).name(name).onChange(onChange);
            break;
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