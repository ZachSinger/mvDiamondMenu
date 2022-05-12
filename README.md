### sp_diamondMenu.js
## Version 0.5

# Installation  
To install this plugin, you'll need the following plugins, in the following order
-sp_Core
-sp_Animations
-sp_DiamondMenu



# Configuring parameters
**Options**
The parameters allow you to set up individual options, that can be put into any menu configuration.   

 -Name: Your own name for this option. You use this to identify it in menus, the player will never see this name  

 -Diamond Text: Text that displays inside a diamond using this Option  

 -Callback: The name or path of a function to run when this option is selected, 
 after the selection animation completes  

 -Title:  This is the text that will appear above the popout line for this diamond  

 -Description:  This is the text that will appear below the popout line.   
 Supports newline /n characters, but will auto wordwrap itself anyway  

**Menus**
 -Name: Your own name for this menu. You use this to specify this menu in script calls and text boxes

 -Options: A list of just the names you set for Options. For example, if you have an Option you configured with Talk  as the Option Name, simply enter Talk as one of the rows here, and this menu will use that name to find that option. Be sure not to leave any extra empty rows in this array

 -Diamond Graphic:  The image path for the diamond graphic to use for this menu

 -Relative Height Position: Number to multiply by Screen Height to get y position for the diamond menu. Menu is drawn from the center, so .5 will be perfectly centered on screen

 -Animation Frames:  The number of frames it will take for this diamond to move into it's selected position, when selecting it with a direction button

 -Distance Modifier:   The decimal representing percentage of this diamond's width to move. .5 means this diamond should be move 50% of it's width when selected

 -Scale Modifier:   Decimal to scale by each frame. .02 means it should be 1.02 scale on frame 1, and 1.04 on frame 2, etc up until value specified for Animation Frames

 -Color:  Currently lets you choose black or white. Text and popout lines will be drawn with this color

 -Sounds: release is when you actually select something with ok, selection is when you use the direction key to select/browse an option, and cancel is when you hit cancel to exit the menu. 



## Commands and script calls.
