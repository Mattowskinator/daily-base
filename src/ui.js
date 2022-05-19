
class UI {
    constructor() {

    }

    static getContainer(name) {
        let container;
        switch (name) {
            case "train":
            case "trainContainer":
                container = UI.trainContainer;
                break;
            case "army":
            case "armyContainer":
                container = UI.armyContainer;
                break;
            default:
                
        }
        return container;
    }

}

UI.trainPanel = document.querySelector("#train");
UI.trainContainer = document.querySelector("#train-grid");
UI.armyContainer = document.querySelector("#army-grid");
UI.startButton = document.querySelector("#start-button");


class CardContainer {
    constructor(options) {

    }
}


class Card {
    constructor(options = {}) {
        // needs firstChildElement to prevent document fragment thing
        this.element = Card.template.content.firstElementChild.cloneNode(true);

        if (options.containerName && options.container === undefined) {
            options.container = UI.getContainer(options.containerName);
        }

        if (options.container) {
            this.setContainer(options.container);
        }

        this.removeButton = this.element.querySelector(".remove-button");
        this.infoButton = this.element.querySelector(".info-button");
        this.armyCount = this.element.querySelector(".army-count");
        this.title = this.element.querySelector(".card-title");
        this.price = this.element.querySelector(".card-price");
        this.size = undefined;
        this.imageURL;
        this.imageElement = this.element.querySelector(".card-image");
        this.buttonElement = this.element.querySelector(".army-card-button");

        if (options.hideRemoveButton) {
            this.removeButton.hidden = true;
        }

        if (options.hideInfoButton) {
            this.infoButton.hidden = true;
        }

        if (options.hideArmyCount) {
            this.armyCount.hidden = true;
        }

        
        if (options.imageURL) {
            this.setImage(options.imageURL);
        }

        // if (options.title) {
        //     this.setTitle(options.title);
        // }

        if (options.hidePrice) {
            this.price.hidden = true;
        } else {
            this.price.textContent = "$" + options.price;
        }

        if (options.isSquare) {
            this.element.classList.toggle("card-square", true);
        }

        this.data = options.data;
    }

    setSelected(bool) {
        this.element.classList.toggle("card-selected", bool);
    }

    setHidden(bool) {
        this.element.hidden = bool;
    }

    isHidden() {
        return this.element.hidden;
    }

    setContainer(container, index = undefined) {
        container.appendChild(this.element);
        if (index !== undefined) {

        }
    }

    setIndex(index) {
        // consider also using this.element.childNodes
        
        const parent = this.element.parentElement;
        const children = Array.from(parent.children); // converts HTMLCollection to Array
        const currentIndex = children.indexOf(this.element);
        if (index > currentIndex && index != children.length - 2) {
            index += 1;
        }
        const referenceElement = children.at(index);
        if (referenceElement) {
            if (index < -1) {
                parent.insertBefore(this.element, referenceElement.nextSibling);
            } else if (index === -1 || index === children.length - 1) {
                parent.appendChild(this.element);
            } else {
                parent.insertBefore(this.element, referenceElement);
            }
        }
    }

    setImage(imageURL) {
        
        this.imageURL = imageURL;
        const gradient = "linear-gradient(to top, var(--card-color) 0%, #2220 60%, #2220 100%)";
        // console.log(this.imageElement.style);
        this.imageElement.style.backgroundImage = gradient + ", url(\"" + imageURL + "\")";
        // this.imageElement.style = "background-image: url('" + imageURL + "');";
        // console.dir( this.imageElement);
        // console.log("setting image")
    }

    setTitle(title) {
        this.title.textContent = title.toString();
    }

    setArmyCount(num) {
        this.armyCount.textContent = "x" + num.toString();
    }
}


Card.template = document.querySelector("#army-card-template");


export {UI, Card};