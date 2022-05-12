/*:
* @plugindesc standardPlayer MZ core script
* @author standardplayer
* @target MZ
*/

var Imported = Imported || {};
Imported.sp_Core = 'sp_Core';

var standardPlayer = standardPlayer || { params: {} };
standardPlayer.sp_Core = standardPlayer.sp_Core || {};

standardPlayer.sp_Core.Parameters = PluginManager.parameters('standardPlayer.sp_Core');


// /* ===================================================================================================
//         Update Handlers
//  ===================================================================================================*/
standardPlayer.sp_Core.updateContainer = {
    _sceneBaseUpdatesPre: [],
    _sceneMenuUpdatesPre: [],
    _sceneMapUpdatesPre: [],
    _sceneBaseUpdatesPost: [],
    _sceneMenuUpdatesPost: [],
    _sceneMapUpdatesPost: [],
}

standardPlayer.sp_Core._aliasSceneBase = Scene_Base.prototype.update;
standardPlayer.sp_Core._aliasSceneMenu = Scene_MenuBase.prototype.update;
standardPlayer.sp_Core._aliasSceneMap = Scene_Map.prototype.update;

standardPlayer.sp_Core.addBaseUpdate = function (method, post, index) {
    let updates = post ?
        this.updateContainer._sceneBaseUpdatesPost :
        this.updateContainer._sceneBaseUpdatesPre;

    this.addUpdate(updates, method, index)
}

standardPlayer.sp_Core.addMapUpdate = function (method, post, index) {
    let updates = post ?
        this.updateContainer._sceneMapUpdatesPost :
        this.updateContainer._sceneMapUpdatesPre;

    this.addUpdate(updates, method, index)
}

standardPlayer.sp_Core.addMenuUpdate = function (method, post, index) {
    let updates = post ?
        this.updateContainer._sceneMenuUpdatesPre :
        this.updateContainer._sceneMenuUpdatesPost;

    this.addUpdate(updates, method, index)
}

standardPlayer.sp_Core.addUpdate = function (location, method, index) { // [location, method, index]
    let args = [location, method, index]
    index = typeof args[2] !== 'undefined' ?
        args[1] <= args[0].length ?
            args[1] :
            args[0].length :
        args[0].length;

    args[0].splice(args[2], 0, args[1]);
}

standardPlayer.sp_Core.removeBaseUpdate = function (method, post) {
    let updates = post ?
        '_sceneBaseUpdatesPost' :
        '_sceneBaseUpdatesPre';

    this.removeUpdate(updates, method)
}

standardPlayer.sp_Core.removeMapUpdate = function (method, post) {
    let updates = post ?
        '_sceneMapUpdatesPost' :
        '_sceneMapUpdatesPre';

    this.removeUpdate(updates, method)
}

standardPlayer.sp_Core.removeMenuUpdate = function (method, post) {
    let updates = post ?
        '_sceneMenuUpdatesPost' :
        '_sceneMenuUpdatesPre';

    this.removeUpdate(updates, method)
}

standardPlayer.sp_Core.removeUpdate = function (locationName, method) {
    let location = this.updateContainer[locationName];

    this.updateContainer[locationName] = location.filter(item => item != method);

}

Scene_Base.prototype.update = function () {
    standardPlayer.sp_Core.updateContainer._sceneBaseUpdatesPre.forEach(
        item => item()
    )

    standardPlayer.sp_Core._aliasSceneBase.call(this);

    standardPlayer.sp_Core.updateContainer._sceneBaseUpdatesPost.forEach(
        item => item()
    )
}


Scene_Map.prototype.update = function () {
    let thisObject = this;

    standardPlayer.sp_Core.updateContainer._sceneMapUpdatesPre.forEach(
        item => item()
    )

    standardPlayer.sp_Core._aliasSceneMap.call(this);

    standardPlayer.sp_Core.updateContainer._sceneMapUpdatesPost.forEach(
        item => item()
    )
}

Scene_MenuBase.prototype.update = function () {
    let thisObject = this;

    standardPlayer.sp_Core.updateContainer._sceneMenuUpdatesPre.forEach(
        item => item()
    )

    standardPlayer.sp_Core._aliasSceneMenu.call(this);

    standardPlayer.sp_Core.updateContainer._sceneMenuUpdatesPost.forEach(
        item => item()
    )
}


/* ===================================================================================================
        DataManager
 ===================================================================================================*/

standardPlayer.sp_Core._aliasDataManagerLoad = DataManager.loadDatabase;
standardPlayer.sp_Core._aliasDatamanagerMakeSaveContents = DataManager.makeSaveContents;
standardPlayer.sp_Core._databaseLoadFiles = [];
standardPlayer.sp_Core._databaseSaveFiles = [];



DataManager.loadDatabase = function () {
    let databaseFiles = this._databaseFiles;
    let addedFiles = standardPlayer.sp_Core._databaseLoadFiles;

    this._databaseFiles = addedFiles.length ? databaseFiles.concat(addedFiles) : databaseFiles;
    standardPlayer.sp_Core._aliasDataManagerLoad.call(this)
}

DataManager.makeSaveContents = function () {
    let contents = standardPlayer.sp_Core._aliasDatamanagerMakeSaveContents();
    return Object.assign({}, contents, standardPlayer.sp_Core._databaseSaveFiles)
}

standardPlayer.sp_Core.addDatabaseFile = function (objName, src, save) {
    let obj = { name: objName, src: src };
    this._databaseLoadFiles.push(obj)

    if (save)
        this._databaseSaveFiles.push(obj)
}


/* ===================================================================================================
        Movement Handlers
 ===================================================================================================*/

standardPlayer.sp_Core.allowPlayerMovement = true;
standardPlayer.sp_Core.allowEventMovement = true;
standardPlayer.sp_Core.aliasPlayerCanMove = Game_Player.prototype.canMove;
standardPlayer.sp_Core.aliasEventSelfMovement = Game_Event.prototype.updateSelfMovement;

Game_Player.prototype.canMove = function () {
    if (standardPlayer.sp_Core.allowPlayerMovement)
        return standardPlayer.sp_Core.aliasPlayerCanMove.call(this);
}

Game_Event.prototype.canMove = function () {
    return standardPlayer.sp_Core.allowEventMovement;
}

Game_Event.prototype.updateSelfMovement = function () {
    if (this.canMove())
        standardPlayer.sp_Core.aliasEventSelfMovement.call(this);
}

standardPlayer.sp_Core.togglePlayerMovement = function (canMove) {
    this.allowPlayerMovement = typeof canMove != 'undefined' ?
        canMove :
        !this.allowPlayerMovement;
}

standardPlayer.sp_Core.toggleEventMovement = function (canMove) {
    this.allowEventMovement = typeof canMove != 'undefined' ?
        canMove :
        !this.allowEventMovement;
}


/* ===================================================================================================
        Input Handlers
 ===================================================================================================*/

standardPlayer.sp_Core.inputCache = JSON.parse(JSON.stringify(Input.keyMapper));

standardPlayer.sp_Core.toggleAction = function (action, enable) {
    let keys = Object.keys(Input.keyMapper);
    let vals = Object.values(Input.keyMapper);
    let disabled = 'temp' + action;
    let process = typeof enable == 'undefined' ? 2 : enable ? 0 : 1;

    for (i in keys) {
        if (process == 0) {
            //enabled
            if (vals[i] == disabled)
                Input.keyMapper[keys[i]] = action;
        } else if (process == 1) {
            //disabled
            if (vals[i] == action)
                Input.keyMapper[keys[i]] = disabled;
        } else {
            //toggled
            if (vals[i] == disabled)
                Input.keyMapper[keys[i]] = action;
            else if (vals[i] == action)
                Input.keyMapper[keys[i]] = disabled;
        }


    }
}

standardPlayer.sp_Core.toggleInput = function (enable) {
    let vals = ["ok", "cancel", "shift", "control", "pageup", "pagedown", "up", "down", "right", "left", "tab", "escape"];
    this.toggleKeys(vals, enable);
}

standardPlayer.sp_Core.toggleMovementKeys = function (enable) {
    let vals = ["up", "down", "left", "right"];
    this.toggleKeys(vals, enable);
}

standardPlayer.sp_Core.toggleSelectKey = function (enable) {
    this.toggleKeys(["ok"], enable)
}

standardPlayer.sp_Core.toggleKeys = function (vals, enable) {
    vals.forEach(item => this.toggleAction(item, enable));
}

standardPlayer.sp_Core.reassignKey = function (keyToReplace, replacement) {
    let keys = Object.keys(Input.keyMapper)
    let length = keys.length;

    for (let i = 0; i < length; i++) {
        if (Input.keyMapper[keys[i]] == keyToReplace)
            Input.keyMapper[keys[i]] = replacement
    }
}


/* ===================================================================================================
       Character Sprite tools
===================================================================================================*/

standardPlayer.sp_Core.getCharactersSpriteset = function () {
    return SceneManager._scene._spriteset.children[0].children[2].children;
}

standardPlayer.sp_Core.getCharacterFromSpriteset = function (character) {
    let spriteset = this.getCharactersSpriteset();

    for (sprite of spriteset) {
        if (sprite._character == character) {
            return sprite
        }

    }
}

standardPlayer.sp_Core.setSpriteReferences = function () {
    let evs = $gameMap.events().concat($gamePlayer._followers._data);

    evs.forEach(ev => standardPlayer.sp_Core.getCharacterFromSpriteset(ev))
}

Game_CharacterBase.prototype.sprite = function () {
    return standardPlayer.sp_Core.getCharacterFromSpriteset(this)
}

Game_CharacterBase.prototype.setRow = function (row) {
    let sprite = this.sprite();
    let singleHeight = sprite.height;
    let singleWidth = sprite.width;

    if (!this.gridData)
        this.gridData = { row: 0, col: 0, rowMax: 3, colMax: 2 }
    console.log(Math.min(row, this.gridData.rowMax))
    row = Math.max(Math.min(row, this.gridData.rowMax), 0);
    this.gridData.row = row;

    sprite.texture.frame = new Rectangle(sprite.texture.frame.x, singleHeight * row, singleWidth, singleHeight)
}

Game_CharacterBase.prototype.setCol = function (col) {
    let sprite = this.sprite();
    let singleHeight = sprite.height;
    let singleWidth = sprite.width;

    if (!this.gridData)
        this.gridData = { row: 0, col: 0, rowMax: 3, colMax: 2 }
    console.log(Math.min(col, this.gridData.colMax))
    col = Math.max(Math.min(col, this.gridData.colMax), 0);
    this.gridData.col = col;

    sprite.texture.frame = new Rectangle(singleWidth * col, sprite.texture.frame.y, singleWidth, singleHeight)
}

Game_CharacterBase.prototype.setRowCol = function (row, col) {
    this.setRow(row);
    this.setCol(col);
}

Game_CharacterBase.prototype.setGridData = function (rows, cols) {
    let sprite = this.sprite();

    if (!this.gridData)
        this.gridData = { row: 0, col: 0, rowMax: rows - 1, colMax: cols - 1 }

    sprite.texture.frame = new Rectangle(0, 0, sprite.texture.baseTexture.width / cols, sprite.texture.baseTexture.height / rows)
    return this;
}



/* ===================================================================================================
       Common Utility Functions
===================================================================================================*/

standardPlayer.sp_Core.plotLinearPath = function (orig, dest, frames, pad) {
    let dist = dest - orig;
    let inc = dist / frames;
    let result = [];

    pad = pad ? pad : 0;
    for (let i = 0; i < pad; i++) {
        result[i] = orig;
    }


    let length = result.length - 1;
    for (let i = 1; i <= frames; i++) {
        result[length + i] = orig + inc * i
    }

    return result
}

standardPlayer.sp_Core.retrieveFromList = function (list, condition) {
    let length = list.length;

    for (let i = 0; i < length; i++) {
        if (condition(list[i])) {
            return [i, list[i]]
        }
    }

    return false;
}

standardPlayer.sp_Core.collision = function (spriteA, spriteB) {
    if (!spriteB)
        spriteB = { x: TouchInput.x, y: TouchInput.y, width: 1, height: 1 }
    return !(
        ((spriteA.y + spriteA.height) < (spriteB.y)) ||
        (spriteA.y > (spriteB.y + spriteB.height)) ||
        ((spriteA.x + spriteA.width) < spriteB.x) ||
        (spriteA.x > (spriteB.x + spriteB.width))
    );
}

standardPlayer.sp_Core.rndBetween = function (min, max, includingMax) {
    max = includingMax ? max + 1 : max;
    return Math.floor(Math.random() * (max - min)) + min;
}

standardPlayer.sp_Core.angle = function (cx, cy, ex, ey) {
    let dy = 0;
    let dx = 0;

    if (arguments.length < 3) {
        dy = cy.y - cx.y;
        dx = cy.x - cx.x;
    } else {
        dy = ey - cy;
        dx = ex - cx;
    }
    let theta = Math.atan2(dy, dx); //to radians

    theta *= 180 / Math.PI; //to degrees
    //if (theta < 0) theta = 360 + theta; // range [0, 360)
    return theta;
}

standardPlayer.sp_Core.angleToward = function(obj, targ, adj){
    obj.angle = this.angle(obj.x, obj.y, targ.x, targ.y)
    obj.rotation -= - (adj ? Math.PI * .5 : 0)
}

standardPlayer.sp_Core.calculateTurnAngle = function(obj, targ, adj){
    let angle = this.angle(obj.x, obj.y, targ.x, targ.y);
    let adjRadians = (Math.PI * .5) * 2
    let adjDegrees = adjRadians * 180 / Math.PI
    if(adj){
        angle -=  adjDegrees
    }

    return angle;
}

standardPlayer.sp_Core.turnToward = function(obj, targ, adj, spd){
    let angle = this.calculateTurnAngle(obj, targ, adj)
    spd = spd || 1;

    if(angle > obj.angle){
        obj.angle = Math.min(obj.angle + spd, angle)
    } else {
        obj.angle = Math.max(obj.angle - spd, angle)
    }
}


standardPlayer.sp_Core.moveByAngle = function (obj, spd, adj) {
    let angle = obj.rotation - (adj ? Math.PI * .5 : 0)
    let dx = Math.cos(angle) * spd;
    let dy = Math.sin(angle) * spd;

    obj.x += dx;
    obj.y += dy;
}

//Convert Graphics Object to Sprite
standardPlayer.sp_Core.GraphToSprite = function (g) {
    let t = new PIXI.Texture(this.GraphToTexture(g))

    return new PIXI.Sprite(t)
}

//convert Bitmap to Sprite * uses function base64ArrayBuffer, credit and license listed below
standardPlayer.sp_Core.BmpToSprite = function (b) {
    let t = new PIXI.Texture.from(b.__canvas)

    return new PIXI.Sprite(t)
}

//Convert Graphics Object to Texture
standardPlayer.sp_Core.GraphToTexture = function (g) {
    let r = Graphics.app.renderer;

    return r.generateTexture(g)
}

standardPlayer.sp_Core.fullUnpack = function (obj, stack) {
    let keys = Object.keys(obj)
    let vals = Object.values(obj)
    let len = keys.length;
    let i = 0;
    let res = false;
    stack = stack || 0

    for (i = 0; i < len; i++) {
        if (!isNaN(obj[keys[i]])) {
            obj[keys[i]] = Number(obj[keys[i]])
        }

        if (standardPlayer.sp_Core.isObject(vals[i])) {
            obj[keys[i]] = standardPlayer.sp_Core.fullUnpack(vals[i])
            continue
        }

        //If the value is NOT an object, this point in the code is reached
        //If the value is a JSON escaped array or object, parse it
        if (standardPlayer.sp_Core.isJSON(vals[i])) {
            res = true
            obj[keys[i]] = JsonEx.parse(vals[i])


            //If the current value being examined is an array, iterate through
            //to check for further parsing
            if (Array.isArray(obj[keys[i]])) {
                obj[keys[i]].forEach((item) => {
                    if (standardPlayer.sp_Core.isJSON(item)) {
                        item = JsonEx.parse(item)
                        if (standardPlayer.sp_Core.isObject(item)) {
                            standardPlayer.sp_Core.fullUnpack(item)
                        }
                    } //end isJSON condition

                    if (!isNaN(item))
                        item = Number(item)
                })
            } //end isArray condition

            //If the current value is a number in string form, convert it


        }


    }
    if (res)
        this.fullUnpack(obj)
    return obj
}

standardPlayer.sp_Core.isJSON = function (str) {
    if (!Number.isNaN(Number(str)))
        return false

    try {
        JSON.parse(str)
    }
    catch (e) {
        return false
    }
    return true
}

standardPlayer.sp_Core.isFunction = function (functionToCheck) {
    return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
}

standardPlayer.sp_Core.isObject = function (x) {
    return (x === Object(x));
};

/*
    The below methods, unWrapStringOrNumber and areEquivalent are taken, unaltered, from
    https://stackoverflow.com/questions/1068834/object-comparison-in-javascript
    submitted by user 
    https://stackoverflow.com/users/42921/eamon-nerbonne
*/
standardPlayer.sp_Core.unwrapStringOrNumber = function (obj) {
    return (obj instanceof Number || obj instanceof String
        ? obj.valueOf()
        : obj);
}
standardPlayer.sp_Core.areEquivalent = function (a, b) {
    a = this.unwrapStringOrNumber(a);
    b = this.unwrapStringOrNumber(b);
    if (a === b) return true; //e.g. a and b both null
    if (a === null || b === null || typeof (a) !== typeof (b)) return false;
    if (a instanceof Date)
        return b instanceof Date && a.valueOf() === b.valueOf();
    if (typeof (a) !== "object")
        return a == b; //for boolean, number, string, xml

    var newA = (a.areEquivalent_Eq_91_2_34 === undefined),
        newB = (b.areEquivalent_Eq_91_2_34 === undefined);
    try {
        if (newA) a.areEquivalent_Eq_91_2_34 = [];
        else if (a.areEquivalent_Eq_91_2_34.some(
            function (other) { return other === b; })) return true;
        if (newB) b.areEquivalent_Eq_91_2_34 = [];
        else if (b.areEquivalent_Eq_91_2_34.some(
            function (other) { return other === a; })) return true;
        a.areEquivalent_Eq_91_2_34.push(b);
        b.areEquivalent_Eq_91_2_34.push(a);

        var tmp = {};
        for (var prop in a)
            if (prop != "areEquivalent_Eq_91_2_34")
                tmp[prop] = null;
        for (var prop in b)
            if (prop != "areEquivalent_Eq_91_2_34")
                tmp[prop] = null;

        for (var prop in tmp)
            if (!this.areEquivalent(a[prop], b[prop]))
                return false;
        return true;
    } finally {
        if (newA) delete a.areEquivalent_Eq_91_2_34;
        if (newB) delete b.areEquivalent_Eq_91_2_34;
    }
}

standardPlayer.sp_Core.findFilesInDir = function (includeDir, currentPath) {
    let fs = require('fs');
    let currentFile;
    let stats;
    let files;
    let result = [];
    let i = 0;

    files = fs.readdirSync(currentPath);
    for (i in files) {
        currentFile = currentPath + '/' + files[i];
        stats = fs.statSync(currentFile);
        if (stats.isFile()) {
            result.push(currentFile);
        }
        else if (stats.isDirectory() && includeDir) {
            result = result.concat(TestFileManager.findFilesInDir(true, currentFile));
        }


    }
    return result
}

standardPlayer.sp_Core.readTextFile = function (path) {

    var xhr = new XMLHttpRequest();
    xhr.open("GET", path, false);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200 || xhr.status == 0) {
                var allText = xhr.responseText;
                window.allText = allText
            }
        }
    }
    xhr.send(null);
}

standardPlayer.sp_Core.loadFile = function (filePath, success, onError) {

    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            if (xhr.status == 200 || xhr.status == 0) {
                try {
                    eval(xhr.responseText);
                } catch (e) {
                    onError(e, filePath);
                    return;
                }
                success();
            } else {
                onError(xhr.status, filePath);
            }
        }
    }.bind(this);

    try {
        xhr.open("GET", filePath, true);
        xhr.send();
    } catch (e) {
        onError(e, filePath);
    }
}

standardPlayer.sp_Core.writeTextFile = function(relativeFilePath, content){
    let fs = require("fs");
    fs.readFile(`${relativeFilePath}.txt`, (content) => {
        let textByLine = text.split("\n");
});
}

standardPlayer.sp_Core.getAllFunctionNames = function (obj) {
    let props = new Set()
    let currentObj = obj

    do {
        Object.getOwnPropertyNames(currentObj).map(item => props.add(item))
    } while ((currentObj = Object.getPrototypeOf(currentObj)))
    return [...props.keys()].filter(item => typeof obj[item] === 'function')

}

standardPlayer.sp_Core.combineFunctionsAlpha = function (left, right) {
    let f = (...args) => {
        left.apply(null, args)
        right.apply(null, args)
    }

    return f
}


standardPlayer.sp_Core.combineFunctionsBeta = function (scope, left, right) {
    let f = (...args) => {
        left.apply(scope, args)
        right.apply(scope, args)
    }

    return f
}

standardPlayer.sp_Core.combineObjectsAlpha = function (left, right, scope) {
    let functionNames = this.getAllFunctionNames(right)
    let length = functionNames.length;

    for (let i = 0; i < length; i++) {
        if (typeof left[functionNames[i]] == undefined) {
            left[functionNames[i]] = right[functionNames[i]].bind(left)
        } else {
            left[functionNames[i]] = scope ?
                this.combineFunctionsBeta(scope, left[functionNames[i]], right[functionNames[i]]) :
                this.combineFunctionsAlpha(left[functionNames[i]], right[functionNames[i]])
        }
    }
}


standardPlayer.sp_Core.hasReturnValue = function(func){
    return  typeof func() !== 'undefined'
}

standardPlayer.sp_Core.generateUUID = function(){
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
        });
    return uuid
}

standardPlayer.sp_Core.getEventByName = function(name){
    let list = $dataEvents;
    let length = list.length;

    for(let i = 0; i < length; i++){
        if(list[i].name == name)
            return list[i]
    }
} 
