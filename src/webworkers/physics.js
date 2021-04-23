self.addEventListener('message', (event) => {
    let sampleText = event.data;
    console.log('WORKER', event.data);

    sampleText += ' and then some..';

    self.postMessage(sampleText);
});