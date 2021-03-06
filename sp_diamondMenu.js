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
 * @param highlightSE
 * @type file
 * @dir audio/se
 * @text Highlight SE
 * @desc Name of SE file to play when an option is highlighted 
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
    this.popoutLineStyle = { brushThickness: 2, xRise: .03, xRun: .15, yRise: -0.02, color: this.txtColor }
    this.setAnimationValues()
    this.initializeAudioSettings()
    this.initializeOptions()
    this.createGraphicsContainers()
}

Scene_DMenu.prototype.setAnimationValues = function(){
    let settings = this.settings; 

    this.moveInterval = settings.animFrames;
    this.distanceMultiplier = settings.distanceMod;
    this.scaleMultiplier = settings.scaleMod;
}

Scene_DMenu.prototype.initializeAudioSettings = function(){
    let settings = this.settings; 

    this.highlightSE = settings.highlightSE;
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

Scene_DMenu.prototype.initializeOptions = function(){
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
            break;
        case 3:
            this.setThreeOptions()
            break;
        case 4:
            this.setFourOptions()
            break;
        default:

    }
}

Scene_DMenu.prototype.setFourOptions = function () {
    this.option1 = this.up;
    this.option2 = this.left;
    this.option3 = this.right;
    this.option4 = this.down;
}

Scene_DMenu.prototype.setThreeOptions = function () {
    this.option1 = this.up;
    this.option2 = this.left;
    this.option3 = this.right;
}

Scene_DMenu.prototype.setTwoOptions = function () {
    this.option1 = this.left;
    this.option2 = this.right;
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
    // this.setMoveInterval()
    // this.setCallbackFunctions()
    this.createDiamondText()
    // this.createTitleText()
    // this.createDescText()
    // this.drawPopoutLines()
    // this.initializeTextPositions()
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
    let height = width

    diamonds[this.down].position.set(0, (height * .5));
    diamonds[this.down].controlId = "down"
    diamonds[this.up].position.set(0, (height * .5) * -1)
    diamonds[this.up].controlId = "up"
    diamonds[this.right].position.set(width * .5, 0)
    diamonds[this.right].controlId = "right"
    diamonds[this.left].position.set((width * .5) * -1, 0)
    diamonds[this.left].controlId = "left"


    this.diamondContainer.position.set(Graphics.width * .5, Graphics.height * .7)
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
        this.diamondContainer.children[this.left],
        this.diamondContainer.children[this.up],
        this.diamondContainer.children[this.right],
        this.diamondContainer.children[this.down]
    ]
    let length = 4;

    for (let i = 0; i < length; i++) {
        let thisOption = this['option' + (i + 1)]
        
        if(thisOption >= 0){
            console.log(thisOption)
            let txt = this.createTextObject('Option ' + thisOption, 'left')
            list[i].addChild(txt)
            txt.pivot.set(txt.width / 2, txt.height / 2)
            list[i].optionText = txt;

        }
        
    }
}



/**
 * ---------------------------------------------------------------------------------------------------------------------------------
 * Utility Functions
 * ---------------------------------------------------------------------------------------------------------------------------------
 */
Scene_DMenu.prototype.fontStyle = function (align) {
    let settings = this.settings;
    align = align || 'left'
    return new PIXI.TextStyle({
        fontSize: 14,
        fill: settings.fill,
        wordWrap: true,
        wordWrapWidth: this.popoutLineStyle.xRun * Graphics.width,
        align: align
    })
}

Scene_DMenu.prototype.createTextObject = function(txt, align){
    let text = new PIXI.Text(txt, this.fontStyle(align))
    let met = PIXI.TextMetrics.measureText(txt, this.fontStyle(align))
    text.met = met;

    return text;
}

Scene_DMenu.prototype.diamondWidth = function () {
    return this.diamondContainer.children[0].width;
}



Scene_DMenu.prototype.update = function () {
    if (!this._diamondsInitialized) {
        return this._diamondsInitialized = this.diamondsLoaded()
    }
    Scene_MenuBase.prototype.update.call(this)
    // this.dMenuUpdate()
}









function DMenuManager() {
    throw new Error('This is a static class')
}

DMenuManager.sceneSettings = [];
// DMenuControl.selectedOptions = [];

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
        menu.options.forEach(option =>{
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