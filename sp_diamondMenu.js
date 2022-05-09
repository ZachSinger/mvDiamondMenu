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
 * @param img
 * @type file
 * @dir img/
 * @text Image
 * @desc Filepath to image to show inside of diamond for this option. Can be left blank.
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

Scene_DMenu.prototype = Object.create(Scene_MenuBase.prototype)
Scene_DMenu.prototype.constructor = Scene_DMenu;

/**
 * ---------------------------------------------------------------------------------------------------------------------------------
 * Initialization
 * ---------------------------------------------------------------------------------------------------------------------------------
 */

Scene_DMenu.prototype.initialize = function () {
    Scene_MenuBase.prototype.initialize.call(this)
    this.setProps()
    this.loadDiamondWindows()

}

/** Initialization
 * ----Props and Prop setting functions
 */

Scene_DMenu.prototype.setProps = function () {
    this.settings = DMenuManager.menu();
    this.index = -1;
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
    this.diamondHeadings = [];
    this.popoutLines = [];
    this.titles = [];
    this.descriptions = [];

}

/** Initialization
 * ----Options
 */

Scene_DMenu.prototype.initializeOptions = function () {
    this.initializeDirections()
    this.initializeOptionValues()
    this.setOptions()
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

    this.initializeDiamondPositions()
    this.cacheInitialPositions()
    this.setMoveInterval()
    // this.setCallbackFunctions()
    this.createDiamondText()
    this.drawPopoutLines()
    this.createTitleText()
    this.createDescText()
    this.initializeTextPositions()
    // this.initializeDescPositions()
    this.stage.addChild(this.diamondContainer)
    // this.stage.addChild(this.lines)
    // this.stage.addChild(this.titles)
    this.addChild(this.stage)
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


    this.diamondContainer.position.set(Graphics.width * .5, Graphics.height * .5)
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

    for (let i = 0; i < length; i++) {
        if (list[i] >= 0) {
            let diamond = this.getDiamond(list[i])
            console.log(list[i])
            let txt = this.createTextObject(this['option' + (i + 1) + 'Settings'].diamondText, 'left')
            diamond.addChild(txt)
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

Scene_DMenu.prototype.initializeTextPositions = function(){
    let options = this.getOptions();
    let length = options.length;

    for(let i = 0; i < length; i++){
        if(options[i] >= 0){
            let diamond = this.getDiamond(options[i])
            diamond.dTitle.y -= Graphics.height * .025;
            if(!diamond.isLeftLine){
                console.log('is not left line')
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

Scene_DMenu.prototype.getOptions = function(){
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

Scene_DMenu.prototype.createPopoutLine = function (diamond, left) {
    left = left ? -1 : 1
    let line = new PIXI.Graphics;
    let style = this.popoutLineStyle;
    let color = this.settings.color == 'white' ? 0xFFFFFF : 0x000000
    let widthMod = Math.round(((this.diamondWidth() * .25) * left) + (left * Graphics.width * .002))
    let aX = widthMod + (style.xRise * Graphics.width) * left;
    let aY = widthMod + (style.yRise * Graphics.height) * -left
    let bX = aX + (style.xRun * Graphics.width) * left
    let bY = aY;

    diamond.addChild(line)
    diamond.popoutLine = line
    diamond.bX = bX
    diamond.bY = bY
    diamond.isLeftLine = left == -1 ? true : false;

    line.lineStyle(style.brushThickness, color, 1)
    line.moveTo(widthMod, widthMod)
    line.lineTo(aX, aY)
    line.lineTo(bX, bY)

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
    Scene_MenuBase.prototype.update.call(this)
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
    console.log('play sound')
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
                console.log('hit active position')
                this.diamondContainer.swapChildren(diamond, list[3])
                standardPlayer.sp_Animations.createAnimation(diamond)
                    .action(0)
                    .moveXY(this.activePosition[0], this.activePosition[1], 20, 0)
                    .then()
                    .setScale(1.5, 1.5, 20, 0)
                    .setAlpha(0, 20, 0)
                    .prepareStep()
                    .setMasterCb(() => { this[`select_${diamond.controlId}`]() })
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
        // this.removePIXIGraphics()
        // DMenuManager.popScene()
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
    let list = type == 'menu' ?
        standardPlayer.sp_diamondMenu.parameters.menus :
        standardPlayer.sp_diamondMenu.parameters.options;
    let length = list.length;
    name = name.toLocaleLowerCase()

    for (let i = 0; i < length; i++) {
        if (list[i].name.toLocaleLowerCase() == name)
            return list[i]
    }

    console.log('did not find menu')
    return false;
}

DMenuManager.loadMenu = function (name) {
    let menu = this.getSettings('menu', name)
    let options = [];
    if (menu) {
        menu.options.forEach(option => {
            options.push(this.getSettings('option', option))
        })

        menu.options = options;
        this.sceneSettings.push(menu)
        SceneManager.push(Scene_DMenu)
    }
}

DMenuManager.menu = function () {
    return this.sceneSettings[this.sceneSettings.length - 1]
}


DMenuManager.parseFunction = function (path) {
    path = path.split('.')
    let obj = path.length > 1 ? window[path.shift()] : window;
    let length = path.length;

    for (let i = 0; i < length; i++) {
        obj = obj[path[i]];
    };
    return obj;
};

DMenuManager.popScene = function () {
    this.sceneSettings.pop()
    SceneManager.pop()
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
    let scn = SceneManager._scene;

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