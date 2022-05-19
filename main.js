import { App } from "./src/app.js";

const app = new App(document.querySelector("#renderCanvas"));

const armyGridContainer = document.querySelector("#army-grid-container");
let lastScrollPosition = 0;

armyGridContainer.addEventListener("wheel", (e) => {
    lastScrollPosition = Math.max(0, Math.min(lastScrollPosition + e.deltaY * .5, armyGridContainer.clientWidth));
    armyGridContainer.scroll({left: lastScrollPosition, behavior: "instant"});
});

const trainContainer = document.querySelector("#train");
const trainButton = trainContainer.querySelector(".panel-button");
const startButton = document.querySelector("#start-button");

let trainContainerOpen = false;

trainButton.addEventListener("click", (e) => {
    if (!trainContainerOpen) {
        trainContainer.style.bottom = "25vmin";
        trainButton.textContent = "DONE";
        startButton.disabled = true;
        trainContainerOpen = true;
    } else {
        trainContainer.style.bottom = "-32vmin";
        trainButton.textContent = "TRAIN";
        startButton.disabled = false;
        trainContainerOpen = false;
    }
});

// app.canvas.addEventListener("contextmenu", (e) => {
//     // ignore context menu
//     e.preventDefault();
// });

window.addEventListener("contextmenu", (e) => {
    // ignore context menu
    e.preventDefault();
});