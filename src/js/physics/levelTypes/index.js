import level1Physics from './level1';

const levelTypes = (type, section, sceneState, data) => {
    switch(type) {
    case 'level1':
        level1Physics(type, section, sceneState, data);
        break;
    default:
        sceneState.logger.error('levelType physics (in index.js) could not be found (type: ' + (type
            ? type
            : '[UNDEFINED]')
            + ', section: ' + (section
            ? section
            : '[UNDEFINED]')
            + ').');
        break;
    }
};

export default levelTypes;