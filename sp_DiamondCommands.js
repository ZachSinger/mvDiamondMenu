var ocDialogue = {}

ocDialogue.swapCharacters = function(){
    let choice = DMenuManager.selected; //Name of the Option you chose gets stored here after choosing it in menu
    let charId = -1

    switch(choice){
        case 'Reid':
            charId = 1;
        break;
        case 'Priscilla':
            charId = 2;
        break;
        case 'Gale':
            charId = 3;
        break;
        case 'Michelle':
            charId = 4;
        break;
    }

    if(charId == -1 || charId == $gameParty._actors[0])
        return

    $gameParty.addActor(charId)
    $gameParty.removeActor($gameParty._actors[0])
    $gameParty.swapOrder(charId, 0)
}

