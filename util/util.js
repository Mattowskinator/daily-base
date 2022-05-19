// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffle(array, rng) {
        let currentIndex = array.length,  randomIndex;
      
        // While there remain elements to shuffle...
        while (currentIndex != 0) {
        
            // Pick a remaining element...
            randomIndex = Math.floor(rng.next() * currentIndex);
            currentIndex--;
        
            // And swap it with the current element.
            [array[currentIndex], array[randomIndex]] = [
			array[randomIndex], array[currentIndex]];
        }
      
        return array;
    }

function raycast(origin, normal, scene) {
	const ray = new BABYLON.Ray(origin, normal, 1000);
	const pickInfo = scene.pickWithRay(ray);
	return pickInfo;
}

function screenToWorld(mousePosition, scene) {
	return BABYLON.Vector3.Unproject(
		mousePosition,
		scene.getEngine().getRenderWidth(),
		scene.getEngine().getRenderHeight(),
		BABYLON.Matrix.Identity(), scene.getViewMatrix(),
		scene.getProjectionMatrix()
	).normalize();
}