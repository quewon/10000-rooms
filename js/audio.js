var _audio = [];

function load_audio(files) {
    var promises = [];

    for (let filename of files) {
        promises.push(new Promise(resolve => {
            let audio = new Audio(filename);
            audio.loop = true;
            audio.preload = "auto";
            audio.oncanplaythrough = function() {
                console.log("loaded " + filename);
                _audio.push(audio);
                resolve();
            };
        }))
    }

    return Promise.all(promises);
}