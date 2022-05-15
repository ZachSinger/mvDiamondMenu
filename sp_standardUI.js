/*:
* @plugindesc standardPlayer Standard UI Class specification
* @author standardplayer
*/


var Imported = Imported || {};
Imported.standardUI = 'standardUI';

var standardPlayer = standardPlayer || { params: {} };
standardPlayer.standardUI = standardPlayer.standardUI || { animations: [], active: true };

standardPlayer.standardUI.Parameters = PluginManager.parameters('standardPlayer.standardUI');


/*===================================================================================================== 
  ____                 
 |  _ \                
 | |_) | __ _ ___  ___ 
 |  _ < / _` / __|/ _ \
 | |_) | (_| \__ \  __/
 |____/ \__,_|___/\___|
=====================================================================================================*/
function sp_UIFactory() {
    throw new Error('This is a static class')
}

sp_UIFactory.primaryAreaFilter = new PIXI.filters.ColorMatrixFilter;
sp_UIFactory.primaryComponentFilter = new PIXI.filters.ColorMatrixFilter;
sp_UIFactory.primaryElementFilter = new PIXI.filters.ColorMatrixFilter;

sp_UIFactory.uiProto = function () {
    return Object.create(sp_UI.prototype)
}

sp_UIFactory.containerProto = function () {
    return Object.create(sp_UIContainer.prototype)
}

sp_UIFactory.textStyle = function (width) {
    return new PIXI.TextStyle({
        wordWrap: true,
        wordWrapWidth: width || Graphics.width * .15
    })
}

sp_UIFactory.fill = function (type) {
    switch (type) {
        case 'element':
            return this.fillElement()
        case 'component':
            return this.fillComponent()
        case 'area':
            return this.fillArea()
    }
}

sp_UIFactory.lineStyle = function (type) {
    switch (type) {
        case 'element':
            return this.lineStyleElement()
        case 'component':
            return this.lineStyleComponent()
        case 'area':
            return this.lineStyleArea()
    }
}

sp_UIFactory.lineStyleElement = function () {
    return [2, 0xFFFFFF, 1]
}

sp_UIFactory.lineStyleComponent = function () {
    return [2, 0xFFFFFF, 1]
}

sp_UIFactory.lineStyleArea = function () {
    return [2, 0xFFFFFF, 1]
}

sp_UIFactory.setFill = function (graphicsStub, type) {
    let fill = this.fill(type)
    graphicsStub.stub.beginFill(fill)
}

sp_UIFactory.fillElement = function () {
    return 0x408891
}

sp_UIFactory.fillComponent = function () {
    return 0x376369
}

sp_UIFactory.fillArea = function () {
    return 0x0
}

sp_UIFactory.setLineStyle = function (graphicsStub, type) {
    let lineStyle = this.lineStyle(type)
    graphicsStub.stub.lineStyle(...lineStyle)
}



function sp_UI() {
    throw new Error('This is an abstract class')
}

sp_UI.prototype.initialize = function () {
    throw new Error('Classes extending sp_UI should implement an initialize method')
}

sp_UI.prototype.constructor = sp_UI.prototype.build;

sp_UI.prototype.build = function (args) {
    this.setProps()
    this.makeGettersAndSetters()
    this.setBackDimensions()
    this.createBackground()
    this.createTextContainer()
    this.initialize(...args)
    this.preload()
}

sp_UI.prototype.makeGettersAndSetters = function () {
    Object.defineProperty(this, 'x', {
        get: () => {
            return this._stage.stub.x
        },
        set: (value) => {
            this._stage.stub.x = value;
        }
    })

    Object.defineProperty(this, 'y', {
        get: () => {
            return this._stage.stub.y
        },
        set: (value) => {
            this._stage.stub.y = value;
        }
    })

    Object.defineProperty(this, 'width', {
        get: () => {
            return this._stage.stub.width
        },
        set: (value) => {
            this._stage.stub.width = value;
        }
    })

    Object.defineProperty(this, 'height', {
        get: () => {
            return this._stage.stub.height
        },
        set: (value) => {
            this._stage.stub.height = value;
        }
    })

    Object.defineProperty(this, 'visible', {
        get: () => {
            return this._stage.stub.visible
        },
        set: (value) => {
            this._stage.stub.visible = value;
        }
    })

    Object.defineProperty(this, 'alpha', {
        get: () => {
            return this._stage.stub.alpha
        },
        set: (value) => {
            this._stage.stub.alpha = value;
        }
    })

}

sp_UI.prototype.setProps = function () {
    this._initialized = false;
    this._stage = standardPlayer.sp_ImageCache.createContainer()
}

sp_UI.prototype.setBackDimensions = function () {
    this._backWidth = this.initialDrawWidth()
    this._backHeight = this.initialDrawHeight()
}

sp_UI.prototype.initialDrawWidth = function () {
    return typeof this._drawWidth == 'undefined' ? Graphics.width * .2 : this._drawWidth
}

sp_UI.prototype.initialDrawHeight = function () {
    return typeof this._drawHeight == 'undefined' ? Graphics.width * .2 : this._drawHeight
}

sp_UI.prototype.preload = function () {
    if (this._filepaths) {
        this.setPreloader()
    }
}

sp_UI.prototype.setPreloader = function () {
    let filepaths = this._filepaths;
    this._loadedStubs = standardPlayer.sp_ImageCache.loadBatch("preloader", filepaths, () => { this.baseOnPreloaded() })
}

sp_UI.prototype.baseOnPreloaded = function () {
    this._isPreloaded = true;
    this.onPreloaded()
}

sp_UI.prototype.onPreloaded = function () {
    throw new Error('Classes extending sp_UI that set the ._filepaths property in the initalize method should have their own .onPreloaded method')
}

sp_UI.prototype.imageCache = function () {
    return standardPlayer.sp_ImageCache
}

sp_UI.prototype.hasBackground = function () {
    return typeof this._hasBackground == 'undefined' ? true : this._hasBackground
}

sp_UI.prototype.hasBorder = function () {
    return typeof this._hasBorder == 'undefined' ? true : this._hasBorder
}

sp_UI.prototype.uiType = function () {
    return typeof this._uiType == 'undefined' ? 'element' : this._uiType
}

sp_UI.prototype.createBackground = function () {
    let back = this.imageCache().createGraphic()
    let border = this.imageCache().createGraphic()

    if (this.hasBackground()) {
        sp_UIFactory.setFill(back, this.uiType())
        back.stub.drawRect(0, 0, this._backWidth, this._backHeight)
    }

    if (this.hasBorder()) {
        sp_UIFactory.setLineStyle(border, this.uiType())
        border.stub.drawRect(0, 0, this._backWidth, this._backHeight)
    }


    this._stage.stub.filters = [sp_UIFactory.primaryElementFilter]
    this._stage.addChild(back)
    this._stage.addChild(border)
    this._back = back;
    this._border = border

}

sp_UI.prototype.textStyle = function(){
    return sp_UIFactory.textStyle()
}

sp_UI.prototype.createTextContainer = function () {
    this._text = this.imageCache().createContainer()
    this._textObjects = { main: this.imageCache().createText("", this.textStyle()) }

    this._text.addChild(this._textObjects.main)
    this._stage.addChild(this._text)
}

sp_UI.prototype.redrawBackground = function(){
    this._back.delete()
    this._border.delete()
    this.setBackDimensions()
    this.createBackground()
    this._stage.add(this._text)
}

sp_UI.prototype.setPosition = function (x, y) {
    y = typeof y == 'undefined' ? x : y;
    this.x = x;
    this.y = y;
}

sp_UI.prototype.setDimensions = function (width, height) {
    height = height || width;
    this.width = width;
    this.height = height;
}

sp_UI.prototype.showBorder = function (show) {
    show = show || !this._border.stub.visible

    this._border.stub.visible = show;
}

sp_UI.prototype.showBackground = function (show) {
    show = show || !this._back.stub.visible

    this._back.stub.visible = show;
}

sp_UI.prototype.stage = function () {
    return this._stage.stub
}

sp_UI.prototype.update = function () {

}

sp_UI.prototype.mouseCollision = function () {

    let bounds = this.stage().getBounds();

    return standardPlayer.sp_Core.collision(bounds)
}

sp_UI.prototype.isTriggered = function () {
    if (TouchInput.isTriggered()) {
        return this.mouseCollision()
    }
}

sp_UI.prototype.isPressed = function () {
    if (TouchInput.isPressed()) {
        return this.mouseCollision()
    }
}


/*=====================================================================================================
   _____            _        _                     
  / ____|          | |      (_)                    
 | |     ___  _ __ | |_ __ _ _ _ __   ___ _ __ ___ 
 | |    / _ \| '_ \| __/ _` | | '_ \ / _ \ '__/ __|
 | |___| (_) | | | | || (_| | | | | |  __/ |  \__ \
  \_____\___/|_| |_|\__\__,_|_|_| |_|\___|_|  |___/
=====================================================================================================*/

function sp_UIContainer(...args) {
    this.build(args)
}

sp_UIContainer.prototype = sp_UIFactory.uiProto()

sp_UIContainer.prototype.initialize = function (showBackground) {
    showBackground = showBackground || false;
    this.initializeMembers()
    this._back.stub.visible = showBackground
}

sp_UIContainer.prototype.initializeMembers = function () {
    this.children = [];
}

sp_UIContainer.prototype.addChild = function (...children) {
    let index = -1;
    let length = children.length;

    for (let i = 0; i < length; i++) {
        if (children[i].constructor != this._childType) {
            console.log(`Cannot add objects of type ${children[i].constructor} ${this._childType}`)
            continue
        }

        index = this.children.indexOf(children[i])
        if (index < 0) {
            this.children.push(children[i])
        }
        this._stage.addChild(children[i]._stage)
    }
}

sp_UIContainer.prototype.removeChild = function (child) {
    let index = this.children.indexOf(child)

    if (index >= 0) {
        this.children.splice(index, 1)
    }

    this._stage.removeChild(child._stage)
}

sp_UIContainer.prototype.updateChildren = function () {
    let list = this.children;
    let length = list.length;

    for (let i = 0; i < length; i++) {
        list[i].update()
    }
}

sp_UIContainer.prototype.update = function () {
    sp_UI.prototype.update.call(this)
    this.updateChildren()
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


function sp_Component(...args) {
    this._childType = sp_UI
    this._uiType = 'component'
    this.build(args)
    this._stage.stub.filters = [sp_UIFactory.primaryComponentFilter]
}

sp_Component.prototype = sp_UIFactory.containerProto()
sp_Component.prototype.constructor = sp_Component

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


function sp_Area(...args) {
    this._childType = sp_Component
    this._areaType = 'component'
    this.build(args)
    this._stage.stub.filters = [sp_UIFactory.primaryAreaFilter]
}

sp_Area.prototype = sp_UIFactory.containerProto()
sp_Area.prototype.constructor = sp_Area


/*=====================================================================================================
  ______ _                           _       
 |  ____| |                         | |      
 | |__  | | ___ _ __ ___   ___ _ __ | |_ ___ 
 |  __| | |/ _ \ '_ ` _ \ / _ \ '_ \| __/ __|
 | |____| |  __/ | | | | |  __/ | | | |_\__ \
 |______|_|\___|_| |_| |_|\___|_| |_|\__|___/ 
 =====================================================================================================*/


function sp_CheckBox(...args) {
    this.build(args)
}

sp_CheckBox.prototype = sp_UIFactory.uiProto()
sp_CheckBox.prototype.constructor = sp_UI

sp_CheckBox.prototype.initialize = function (toggled) {
    this._toggled = toggled ? true : false
    console.log(toggled, this._toggled)
    this.draw()
}

sp_CheckBox.prototype.initialDrawWidth = function () {
    return Graphics.width * .04
}

sp_CheckBox.prototype.initialDrawHeight = function () {
    return Graphics.width * .04
}

sp_CheckBox.prototype.positionText = function () {
    let txt = this._textObjects.main.stub;
    let back = this._back.stub

    txt.position.set(back.width / 2, back.height / 2)
    txt.y -= txt.height / 2
    txt.y -= txt.height / 16

    txt.x -= txt.width / 2
    txt.x -= txt.width / 16
}


sp_CheckBox.prototype.draw = function () {
    let content = this._toggled ? 'X' : '';
    this._textObjects.main.setText(content, true)

    this.positionText()
}

sp_CheckBox.prototype.update = function () {
    sp_UI.prototype.update.call(this)
    if (this.isTriggered()) {
        this.onCollision()
    }
}

sp_CheckBox.prototype.onCollision = function () {
    this._toggled = !this._toggled;
    this.draw()
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


function sp_Button(...args) {
    this.build(args)
}

sp_Button.prototype = sp_UIFactory.uiProto()
sp_Button.prototype.constructor = sp_UI

sp_Button.prototype.initialize = function (text, onClick) {
    this._textObjects.main.setText(text || "", true)
    this.positionText()
    console.log(this)

    if (onClick) {
        this.onClick = onClick.bind(this);
    }
}

sp_Button.prototype.update = function () {
    sp_UI.prototype.update.call(this)
    if (this.isTriggered()) {
        this.onCollision()
    }
}

sp_Button.prototype.positionText = function () {
    let txt = this._textObjects.main.stub;
    let back = this._back.stub

    txt.position.set(back.width / 2, back.height / 2)
    txt.y -= txt.height / 2
    txt.y -= txt.height / 16

    txt.x -= txt.width / 2
    txt.x -= txt.width / 16
}

sp_Button.prototype.initialDrawWidth = function () {
    return Graphics.width * .08
}

sp_Button.prototype.initialDrawHeight = function () {
    return Graphics.width * .04
}

sp_Button.prototype.onClick = function () {
    console.log('clicked button')
}

sp_Button.prototype.onCollision = function () {
    this.onClick()
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


function sp_ToggleButton(...args) {
    this.build(args)
}

sp_ToggleButton.prototype = Object.create(sp_Button.prototype)
sp_ToggleButton.prototype.constructor = sp_UI;

sp_ToggleButton.prototype.initialize = function (text, toggleOnCb, toggleOffCb) {
    let filter = new PIXI.filters.ColorMatrixFilter

    sp_Button.prototype.initialize.call(this, text, toggleOnCb)

    this.onToggleOff = toggleOffCb.bind(this)
    this._stage.stub.filters = [filter]
    this._toggled = false;
    this._buttonFilter = filter
}

sp_ToggleButton.prototype.onToggleOn = function () {
    return this.onClick()
}

sp_ToggleButton.prototype.onToggleOff = function () {
    console.log('toggled off')
}

sp_ToggleButton.prototype.onCollision = function () {
    this._toggled = !this._toggled;

    console.log()
    if (this._toggled) {
        this.onToggleOn()
        this._buttonFilter.brightness(.85)
        this._border.stub.lineStyle.fill = 'white'
    } else {
        this.onToggleOff()
        this._buttonFilter.brightness(1)
        this._border.stub.lineStyle.fill = 'black'
    }

}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


function sp_TextWindow(...args) {
    this.build(args)
}

sp_TextWindow.prototype = sp_UIFactory.uiProto()
sp_TextWindow.prototype.constructor = sp_UI

sp_TextWindow.prototype.initialize = function (text) {
    this._textObjects.main.setText(text, true)
    this.resetDimensions()
    this.positionText()
}

sp_TextWindow.prototype.positionText = function () {
    let txt = this._textObjects.main.stub;
    let back = this._back.stub

    console.log(back)
    console.log(txt)
    txt.position.set(back.width / 2, back.height / 2)
    txt.y -= txt.height / 2
    txt.y -= txt.height / 32
    txt.y += this.padding() / 2

    txt.x -= txt.width / 2
    txt.x -= txt.width / 32
    txt.x += this.padding()
}

sp_TextWindow.prototype.padding = function(){
    return this._back.stub.width * .03
}

sp_TextWindow.prototype.resetDimensions = function(){
    let met = this._textObjects.main.stub.met
    let tWidth = met.width;
    let tHeight = met.height;

    this._drawWidth =  tWidth + this.padding() * 2
    this._drawHeight = tHeight + this.padding() * 2
    this.redrawBackground()
    this.positionText()
}

sp_TextWindow.prototype.textStyle = function(){
    return new PIXI.TextStyle({
        wordWrap:true,
        wordWrapWidth: this._back.stub.width - this.padding() * 2,
        fontSize:14
    })
}

sp_TextWindow.prototype.setText = function(text){
    this._textObjects.main.setText(text, true)
    this.resetDimensions()
}