/*:
 * 
 * @param options
 * @type struct<OPTION>[]
 * @text Options List
 * @desc A list of settings for individual Options
 * 
 * @param menus
 * @type struct<MENU>[]
 * @text Menus List
 * @desc A list of settings for individual Menus
 * 
 */

/*~struct~OPTION:
 * @param name
 * @type text
 * @text Name
 * @desc Used to identify this Option when setting up Menus
 * 
 * @param diamondText
 * @type text
 * @text Diamond Text
 * @desc The text that will display inside of the diamond
 * 
 * @param callback
 * @type text
 * @text Callback
 * @desc Function name or path to call when User hits 'OK' with this option highlighted
 * 
 * 
 * @param title
 * @type text
 * @text Title
 * @desc Text to display for this option. eg Menu or Equipment
 * 
 * @param desc
 * @type note
 * @text Description
 * @desc Text to appear as description below this option's title
 * 
 */

/*~struct~MENU:
 * @param name
 * @type text
 * @text Name
 * @desc Used to identify this specific menu with a script call
 * 
 * @param options
 * @type text[]
 * @text Options
 * @desc List of Option names. These names correlate to the names in the Option settings
 * 
 * @param diamondGraphic
 * @type file
 * @dir img/
 * @text Diamond Graphic
 * @desc Filepath for Diamond Graphic to use for this menu
 * 
 * @param yPosition
 * @type number
 * @decimals 2
 * @text Relative Height Position
 * @desc Factor to multiply by Screen Height to get y position. .5 is centered
 * @default .5
 * 
 * @param animFrames
 * @type number
 * @text Animation Frames
 * @desc Number of frames for the diamond selection movement animation to complete
 * 
 * @param distanceMod
 * @type number
 * @decimals 3
 * @text Distance Modifier
 * @desc Distance to move a diamond when selected, relative to its width/height.
 * 
 * @param scaleMod
 * @type number
 * @decimals 3
 * @text Scale Modifier
 * @desc Decimal to scale by each frame. .02 means it should be 1.02 scale on frame 1
 * 
 * @param color
 * @type select
 * @text Color
 * @option white
 * @option black
 * @default white
 * 
 * @param releaseSE
 * @type file
 * @dir audio/se
 * @text Release SE
 * @desc Name of SE file to play when an option is released
 * 
 * @param selectionSE
 * @type file
 * @dir audio/se
 * @text Selection SE
 * @desc Name of SE file to play when an option is selected/activated
 * 
 * @param cancelSE
 * @type file
 * @dir audio/se
 * @text Cancel SE
 * @desc Name of SE file to play when cancel is pressed 
 */



var Imported = Imported || {};
Imported.sp_diamondMenu = 'sp_diamondMenu';

var standardPlayer = standardPlayer || { params: {} };
standardPlayer.sp_diamondMenu = standardPlayer.sp_diamondMenu || {};

standardPlayer.sp_diamondMenu.parameters = standardPlayer.sp_Core.fullUnpack(PluginManager.parameters('sp_diamondMenu'));

function Scene_DMenu() {
    this.initialize.apply(this, arguments)
}


/**
 * ---------------------------------------------------------------------------------------------------------------------------------
 * Initialization
 * ---------------------------------------------------------------------------------------------------------------------------------
 */

Scene_DMenu.prototype.initialize = function () {
    this.setProps()
    this.loadDiamondWindows()

}

/** Initialization
 * ----Props and Prop setting functions
 */

Scene_DMenu.prototype.setProps = function () {
    this.settings = DMenuManager.menu();
    this.index = -1;
    this.yPosition = this.settings.yPosition;
    this.diamondImagePath = `img/${this.settings.diamondGraphic}.png`
    this.popoutLineStyle = { brushThickness: 2, xRise: .03, xRun: .15, yRise: -0.02 }
    this.setAnimationValues()
    this.initializeAudioSettings()
    this.initializeOptions()
    this.createGraphicsContainers()
}

Scene_DMenu.prototype.setAnimationValues = function () {
    let settings = this.settings;

    this.moveInterval = settings.animFrames;
    this.distanceMultiplier = settings.distanceMod;
    this.scaleMultiplier = settings.scaleMod;
}

Scene_DMenu.prototype.initializeAudioSettings = function () {
    let settings = this.settings;

    this.releaseSE = settings.releaseSE;
    this.selectionSE = settings.selectionSE;
    this.cancelSE = settings.cancelSE;
}

Scene_DMenu.prototype.createGraphicsContainers = function () {
    this.stage = new PIXI.Container
    this.diamondContainer = new PIXI.Container
    this.dataContainer = new PIXI.Container;
}

/** Initialization
 * ----Options
 */

Scene_DMenu.prototype.initializeOptions = function () {
    this.initializeDirections()
    this.initializeOptionValues()
    this.setOptions()
    this.validateCallbacks()
}

Scene_DMenu.prototype.initializeDirections = function () {
    this.down = 3;
    this.up = 0;
    this.right = 2;
    this.left = 1;
}

Scene_DMenu.prototype.initializeOptionValues = function () {
    this.option1 = -1;
    this.option2 = -1;
    this.option3 = -1;
    this.option4 = -1;
}

Scene_DMenu.prototype.setOptions = function () {
    let length = this.settings.options.length

    switch (length) {
        case 2:
            this.setTwoOptions()
            this.menuOptionCount = 2;
            break;
        case 3:
            this.setThreeOptions()
            this.menuOptionCount = 3;
            break;
        case 4:
            this.setFourOptions()
            this.menuOptionCount = 4;
            break;
        default:
            this.menuOptionCount = 1;

    }
}

Scene_DMenu.prototype.setFourOptions = function () {
    let options = this.settings.options;

    this.option1 = this.up;
    this.option1Settings = options[0]
    this.select_up = DMenuManager.parseFunction(options[0].callback)
    this.option2 = this.left;
    this.option2Settings = options[1]
    this.select_left = DMenuManager.parseFunction(options[1].callback)
    this.option3 = this.right;
    this.option3Settings = options[2]
    this.select_right = DMenuManager.parseFunction(options[2].callback)
    this.option4 = this.down;
    this.option4Settings = options[3]
    this.select_down = DMenuManager.parseFunction(options[3].callback)
}

Scene_DMenu.prototype.setThreeOptions = function () {
    let options = this.settings.options;

    this.option1 = this.up;
    this.option1Settings = options[0]
    this.select_up = DMenuManager.parseFunction(options[0].callback)
    this.option2 = this.left;
    this.option2Settings = options[1]
    this.select_left = DMenuManager.parseFunction(options[1].callback)
    this.option3 = this.right;
    this.option3Settings = options[2]
    this.select_right = DMenuManager.parseFunction(options[2].callback)
}

Scene_DMenu.prototype.setTwoOptions = function () {
    let options = this.settings.options;

    this.option1 = this.left;
    this.option1Settings = options[0]
    this.select_left = DMenuManager.parseFunction(options[0].callback)
    this.option2 = this.right;
    this.option2Settings = options[1]
    this.select_right = DMenuManager.parseFunction(options[1].callback)
}

Scene_DMenu.prototype.validateCallbacks = function () {
    if (!typeof this.select_left == 'function')
        this.select_left = () => { }

    if (!typeof this.select_right == 'function')
        this.select_left = () => { }

    if (!typeof this.select_up == 'function')
        this.select_left = () => { }

    if (!typeof this.select_down == 'function')
        this.select_left = () => { }
}

/** Initialization
 * ----Diamonds
 */

Scene_DMenu.prototype.loadDiamondWindows = function () {
    let cont = this.diamondContainer

    for (let i = 0; i < 4; i++) {
        cont.addChild(this.createDiamondSprite())
    }
    this._diamondsInitialized = false;
}

Scene_DMenu.prototype.createDiamondSprite = function () {
    let spr = new PIXI.Sprite.from(this.diamondImagePath)

    spr.anchor.set(.5)
    return spr
}

Scene_DMenu.prototype.diamondsLoaded = function () {
    let list = this.diamondContainer.children;;
    let length = list.length;

    for (let i = 0; i < length; i++) {
        if (list[i].width <= 1 && list[i].height <= 1)
            return false;
    }

    this.stage.addChild(this.diamondContainer)
    this.stage.addChild(this.dataContainer)
    this.initializeDiamondPositions()
    this.cacheInitialPositions()
    this.setMoveInterval()
    this.createDiamondText()
    this.drawPopoutLines()
    this.createTitleText()
    this.createDescText()
    this.initializeTextPositions()
    this.dataContainer.position.set(this.diamondContainer.x, this.diamondContainer.y)
    // this.dataContainer.pivot.set(this.dataContainer.width / 2, this.dataContainer.height / 2)
    SceneManager._scene.addChild(this.stage)
    return true;
}

Scene_DMenu.prototype.initializeDiamondPositions = function () {
    let diamonds = this.diamondContainer.children;
    let width = this.diamondWidth()
    let adj = width * .05

    this.activePosition = [diamonds[this.down].x, diamonds[this.down].y]

    diamonds[this.down].position.set(0, (width * .5) + adj);
    diamonds[this.down].controlId = "down"
    diamonds[this.up].position.set(0, ((width * .5) * -1) - adj)
    diamonds[this.up].controlId = "up"
    diamonds[this.right].position.set(width * .5 + adj, 0)
    diamonds[this.right].controlId = "right"
    diamonds[this.left].position.set(((width * .5) * -1) - adj, 0)
    diamonds[this.left].controlId = "left"


    this.diamondContainer.position.set(Graphics.width * .5, Graphics.height * this.yPosition)
}

Scene_DMenu.prototype.cacheInitialPositions = function () {
    let list = this.diamondContainer.children;
    let length = list.length;

    for (let i = 0; i < length; i++) {
        list[i].cachedDiamondPosition = [list[i].x, list[i].y]
        list[i].moveInterval = 0;
    }
}

Scene_DMenu.prototype.createDiamondText = function () {
    let list = [
        this.option1,
        this.option2,
        this.option3,
        this.option4
    ]
    let length = 4;
    let cont = this.dataContainer;

    for (let i = 0; i < length; i++) {
        if (list[i] >= 0) {
            let diamond = this.getDiamond(list[i])
            let txt = this.createTextObject(this['option' + (i + 1) + 'Settings'].diamondText, 'left')
            cont.addChild(txt)
            txt.pivot.set(txt.width / 2, txt.height / 2)
            diamond.optionText = txt;

        }

    }
}

Scene_DMenu.prototype.setMoveInterval = function () {
    let diamonds = this.diamondContainer.children;
    let width = this.diamondWidth()
    let xMod = width / this.moveInterval * this.distanceMultiplier
    let yMod = width / this.moveInterval * this.distanceMultiplier

    diamonds[this.down].moveData = ['y', yMod]
    diamonds[this.up].moveData = ['y', yMod * -1]
    diamonds[this.right].moveData = ['x', xMod]
    diamonds[this.left].moveData = ['x', xMod * -1]
}

Scene_DMenu.prototype.drawPopoutLines = function () {
    let diamonds = this.diamondContainer.children;
    let length = this.menuOptionCount;

    switch (length) {
        case 4:
            this.createPopoutLine(diamonds[this.up], true)
            this.createPopoutLine(diamonds[this.left], true)
            this.createPopoutLine(diamonds[this.right])
            this.createPopoutLine(diamonds[this.down])
            break
        case 3:
            this.createPopoutLine(diamonds[this.up], true)
            this.createPopoutLine(diamonds[this.left], true)
            this.createPopoutLine(diamonds[this.right])
            break;
        case 2:
            this.createPopoutLine(diamonds[this.left], true)
            this.createPopoutLine(diamonds[this.right])
            break;
        default:
    }
}

Scene_DMenu.prototype.createTitleText = function () {
    let titles = []
    let list = [
        this.option1,
        this.option2,
        this.option3,
        this.option4
    ]
    let length = 4;

    for (let i = 0; i < length; i++) {
        if (list[i] >= 0) {
            let diamond = this.getDiamond(list[i])
            let option = this['option' + (i + 1) + 'Settings']
            let title = this.createTextObject(option.title)
            titles.push(title)
            diamond.dTitle = title;
            diamond.popoutLine.addChild(title)
            title.position.set(diamond.bX, diamond.bY)
        }
    }

    this.titles = titles;
}

Scene_DMenu.prototype.createDescText = function () {
    let descriptions = []
    let list = [
        this.option1,
        this.option2,
        this.option3,
        this.option4
    ]
    let length = 4;

    for (let i = 0; i < length; i++) {
        if (list[i] >= 0) {
            let diamond = this.getDiamond(list[i])
            let option = this['option' + (i + 1) + 'Settings']
            let desc = this.createTextObject(option.desc)
            descriptions.push(desc)
            list[i].dDesc = desc;
            diamond.dDesc = desc;
            diamond.popoutLine.addChild(desc);
            desc.position.set(diamond.bX, diamond.bY)
        }
    }

    this.descriptions = descriptions;
}

Scene_DMenu.prototype.initializeTextPositions = function () {
    let options = this.getOptions();
    let length = options.length;

    for (let i = 0; i < length; i++) {
        if (options[i] >= 0) {
            let diamond = this.getDiamond(options[i])
            diamond.dTitle.y -= Graphics.height * .025;
            diamond.optionText.position.set(diamond.x, diamond.y)
            diamond.popoutLine.position.set(diamond.bX, diamond.bY)
            if (!diamond.isLeftLine) {
                diamond.dTitle.x -= diamond.dTitle.met.width
                diamond.dDesc.x -= diamond.dDesc.met.width
            }
        }
    }


}


/**
 * ---------------------------------------------------------------------------------------------------------------------------------
 * Utility Functions
 * ---------------------------------------------------------------------------------------------------------------------------------
 */

Scene_DMenu.prototype.getOptions = function () {
    return [
        this.option1,
        this.option2,
        this.option3,
        this.option4
    ]
}

Scene_DMenu.prototype.fontStyle = function (align) {
    let settings = this.settings;
    align = align || 'left'
    return new PIXI.TextStyle({
        fontSize: 14,
        fill: settings.color,
        wordWrap: true,
        wordWrapWidth: this.popoutLineStyle.xRun * Graphics.width,
        align: align
    })
}

Scene_DMenu.prototype.createTextObject = function (txt, align) {
    let text = new PIXI.Text(txt, this.fontStyle(align))
    let met = PIXI.TextMetrics.measureText(txt, this.fontStyle(align))
    text.met = met;

    return text;
}

Scene_DMenu.prototype.createPopoutLine = function (diamond, left, perc) {
    perc = perc || 1
    left = left ? -1 : 1
    let line = new PIXI.Graphics;
    let style = this.popoutLineStyle;
    let color = this.settings.color == 'white' ? 0xFFFFFF : 0x000000
    let widthMod = Math.round(((this.diamondWidth() * .25) * left) + (left * Graphics.width * .002))
    let aX = widthMod + (style.xRise * Graphics.width) * left;
    let aY = widthMod + (style.yRise * Graphics.height) * -left
    let bX = aX + (style.xRun * Graphics.width) * left
    let bY = aY;
    let cont = this.dataContainer;

    diamond.popoutLine = line
    cont.addChild(line)
    diamond.bX = bX
    diamond.bY = bY
    diamond.isLeftLine = left == -1 ? true : false;

    line.lineStyle(style.brushThickness, color, 1)
    line.moveTo(widthMod, widthMod)
    line.lineTo(aX, aY)
    line.lineTo(bX * perc, bY)

    line.alpha = 0;
}

Scene_DMenu.prototype.diamondWidth = function () {
    return this.diamondContainer.children[0].width;
}

Scene_DMenu.prototype.getDiamond = function (index) {
    return this.diamondContainer.children[index]
}

Scene_DMenu.prototype.update = function () {
    if (!this._diamondsInitialized) {
        return this._diamondsInitialized = this.diamondsLoaded()
    }
    this.dMenuUpdate()
}


Scene_DMenu.prototype.dMenuUpdate = function () {
    this.checkPositions()
    this.checkInput()
    this.checkSEPlay()
}

Scene_DMenu.prototype.checkSEPlay = function () {
    if (this.playSE && this[`${this.playSE}SE`]) {
        this.playSound(this[`${this.playSE}SE`])
    }
    this.playSE = false;
}

Scene_DMenu.prototype.playSound = function (name) {
    let options = {
        name: name,
        pitch: 50,
        volume: 100,
        pan: 0
    }
    AudioManager.playSe(options)
}

Scene_DMenu.prototype.checkPositions = function () {
    let list = this.diamondContainer.children;
    let length = list.length;

    for (let i = 0; i < length; i++) {
        let diamond = list[i];
        if (diamond.popoutLine)
            // diamond.popoutLine.visible = false;
            diamond.popoutLine.alpha = diamond.moveInterval / this.moveInterval

        if (diamond.isActive) {
            if (!this.triggered) {
                this.playSE = 'release'
                this.triggered = true;
                let dir = this[diamond.controlId];
                DMenuManager.selected = this['option' + (dir + 1) + 'Settings'].name
                this.diamondContainer.swapChildren(diamond, list[3])
                diamond.popoutLine.destroy(true)
                standardPlayer.sp_Animations.createAnimation(diamond)
                    .action(0)
                    .moveXY(this.activePosition[0], this.activePosition[1], 20, 0)
                    .then()
                    .setScale(1.5, 1.5, 20, 0)
                    .setAlpha(0, 20, 0)
                    .prepareStep()
                    .setMasterCb(() => { this[`select_${diamond.controlId}`](); this.removeScene() })
                    .activate()
                this.fadeNonSelected(diamond)
                continue

            }


        } else
            if (DMenuControl.isPressed(list[i].controlId)) {
                if (!this.isInSelectedPosition(i)) {
                    this.moveDiamond(diamond)
                    this.playSE = diamond.sePlayed ? false : 'selection'
                    diamond.sePlayed = true

                } else {

                    // diamond.popoutLine.visible = true;
                }

            } else if (!this.isInitialPosition(i)) {
                this.returnDiamond(diamond)
                diamond.sePlayed = false;
            }
    }
}

Scene_DMenu.prototype.removeScene = function () {
    this.removePIXIGraphics();
    DMenuManager.popScene()
    DMenuManager.revertUpdate()
}

Scene_DMenu.prototype.fadeNonSelected = function (diamond) {
    let list = this.diamondContainer.children;
    let length = list.length;

    for (let i = 0; i < length; i++) {
        if (diamond == list[i])
            continue

        standardPlayer.sp_Animations.createAnimation(list[i])
            .action(0)
            .setAlpha(0, 15, 0)
            .prepareStep()
            .activate()
    }
}

Scene_DMenu.prototype.removePIXIGraphics = function () {
    let scn = SceneManager._scene
    scn.removeChild(this.diamondContainer)
    this.diamondContainer.destroy(true);
    this.diamondContainer = undefined;
    this.stage.destroy(true);
    this.stage = undefined;
}


Scene_DMenu.prototype.isInSelectedPosition = function (index) {
    let diamond = this.getDiamond(index);

    return diamond.moveInterval == this.moveInterval;
}

Scene_DMenu.prototype.isInActivePosition = function (diamond) {
    let activePosition = this.activePosition;
    return (diamond.x == activePosition[0] && diamond.y == activePosition[1])
}

Scene_DMenu.prototype.isInitialPosition = function (index) {
    let diamond = this.getDiamond(index)
    return !diamond.moveInterval;
}

Scene_DMenu.prototype.moveDiamond = function (diamond) {
    diamond.moveInterval++
    diamond[diamond.moveData[0]] += diamond.moveData[1]
    diamond.scale.set(1 + diamond.moveInterval * this.scaleMultiplier)
}



Scene_DMenu.prototype.returnDiamond = function (diamond) {
    diamond.moveInterval--
    diamond[diamond.moveData[0]] -= diamond.moveData[1]
    diamond.scale.set(1 + diamond.moveInterval * this.scaleMultiplier)
}


Scene_DMenu.prototype.checkInput = function () {
    if (Input.isTriggered('cancel')) {
        return this.removeScene()
    }

    DMenuControl.pollControls()

    if (Input.isTriggered('ok') && DMenuControl.selectedOptions.length == 1) {
        this.getDiamond(this[DMenuControl.selectedOptions[0]]).isActive = true;
    }

    DMenuControl.setActiveSelections()
}






function DMenuManager() {
    throw new Error('This is a static class')
}

DMenuManager.sceneSettings = [];

DMenuManager.getSettings = function (type, name) {
    console.log(type, name)
    let list = type == 'menu' ?
        standardPlayer.sp_diamondMenu.parameters.menus :
        standardPlayer.sp_diamondMenu.parameters.options;
    let length = list.length;
    console.log(name)
    console.log(typeof name)
    name = name.toLocaleLowerCase()

    for (let i = 0; i < length; i++) {
        if (list[i].name.toLocaleLowerCase() == name)
            return list[i]
    }

    console.log('did not find menu')
    return false;
}

DMenuManager.loadMenu = function (name) {
    let menu = Object.assign({}, this.getSettings('menu', name))
    let options = [];
    if (menu) {
        menu.options.forEach(option => {
            options.push(this.getSettings('option', option))
        })

        menu.options = options;
        this.sceneSettings.push(menu)
        this.scene = new Scene_DMenu()
        this.alias_SceneUpdate = SceneManager._scene.update;
        SceneManager._scene.update = function () {
            DMenuManager.alias_SceneUpdate.call(this)
            DMenuManager.scene.update.call(DMenuManager.scene)
        }
        // standardPlayer.sp_Core.toggleInput(false)
        this.active = true;
    }
}

DMenuManager.menu = function () {
    return this.sceneSettings[this.sceneSettings.length - 1]
}


DMenuManager.parseFunction = function (path) {
    path = path.split('.')
    let obj = path.length > 1 ? window[path.shift()] : window;
    let length = path.length;

    console.log(obj, path)
    for (let i = 0; i < length; i++) {
        obj = obj[path[i]];
    };
    return obj;
};

DMenuManager.popScene = function () {
    this.sceneSettings.pop()

}

DMenuManager.revertUpdate = function () {
    let scn = SceneManager._scene;

    scn.update = this.alias_SceneUpdate
    // standardPlayer.sp_Core.toggleInput(true)
    this.active = false;
    this.isClosing = true;
    this._shouldProceed = true;
}

DMenuManager.proceed = function(){
    if(this._shouldProceed){
        this._shouldProceed = false;
        return true;
    }
    return false;
}


function DMenuControl() {
    throw new Error('This is a static class')
}

DMenuControl.controls = { left: false, right: false, up: false, down: false }
DMenuControl.selectedOptions = [];

DMenuControl.isPressed = function (direction) {
    direction = direction ? [this.controls[direction]] : Object.values(this.controls)
    return direction.indexOf(true) != -1
}

DMenuControl.pollControls = function () {
    this.pollDirections()
}

DMenuControl.pollDirections = function () {
    let list = Object.keys(this.controls)
    let length = 4;
    let scn = DMenuManager.scene

    for (let i = 0; i < length; i++) {
        if (Input.isPressed(list[i]) && scn['option' + (i + 1)] >= 0) {
            this.controls[list[i]] = true;
        } else {
            this.controls[list[i]] = false;
        }
    }
}

DMenuControl.setActiveSelections = function () {
    let list = this.controls
    let keys = Object.keys(list)
    let length = 4;
    let pressed = []

    for (let i = 0; i < length; i++) {
        if (list[keys[i]])
            pressed.push(keys[i])
    }
    this.selectedOptions = pressed;
}

let aliasTitleWindow = Window_TitleCommand.prototype.makeCommandList;
Window_TitleCommand.prototype.makeCommandList = function () {
    aliasTitleWindow.call(this)
    this.addCommand("Test Diamond", "dMenu")
}

let aliasSceneTitle = Scene_Title.prototype.createCommandWindow;
Scene_Title.prototype.createCommandWindow = function () {
    aliasSceneTitle.call(this)
    this._commandWindow.setHandler("dMenu", () => { DMenuManager.loadMenu("MenuA") })
}


DMenuCB = {}
DMenuCB.attack = function () { console.log('attack') }
DMenuCB.defend = function () { console.log('defend') }
DMenuCB.insult = function () { console.log('insult') }
DMenuCB.blink = function () { console.log('blink') }

Window_Base.prototype.convertEscapeCharacters = function (text) {
    /* eslint no-control-regex: 0 */
    text = text.replace(/\\/g, "\x1b");
    text = text.replace(/\x1b\x1b/g, "\\");
    text = text.replace(/\x1bV\[(\d+)\]/gi, (_, p1) =>
        $gameVariables.value(parseInt(p1))
    );
    text = text.replace(/\x1bV\[(\d+)\]/gi, (_, p1) =>
        $gameVariables.value(parseInt(p1))
    );
    text = text.replace(/\x1bN\[(\d+)\]/gi, (_, p1) =>
        this.actorName(parseInt(p1))
    );
    text = text.replace(/\x1bP\[(\d+)\]/gi, (_, p1) =>
        this.partyMemberName(parseInt(p1))
    );
    text = text.replace(/\x1bZ\[(\D+)\]/gi, (_, p1) => {
        DMenuManager.loadMenu(p1)
        return ""
    }

    );
    text = text.replace(/\x1bG/gi, TextManager.currencyUnit);
    return text;
}

Window_Message.prototype.updateInput = function() {
    if (this.isAnySubWindowActive()) {
        return true;
    }
    if (this.pause) {
        if (this.isTriggered() && !DMenuManager.active) {
            console.log('in here')
            Input.update();
            this.pause = false;
            if (!this._textState) {
                this.terminateMessage();
            }
        }
        return true;
    }
    return false;
};

Window_Message.prototype.isTriggered = function() {
    return (
        Input.isRepeated("ok") ||
        Input.isRepeated("cancel") ||
        TouchInput.isRepeated() || 
        DMenuManager.proceed()
    );
};
