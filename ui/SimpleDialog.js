define([
    "dojo",
    "dijit/Dialog",
    "dijit/form/Button",
    "sumo/ui/TemplatedWidget"
], function(dojo, Dialog, Button, TemplatedWidget) {
    return dojo.declare(Dialog, {
   
         buildRendering: function() {
             this.content = dojo.create("div");
             this.contentNode = dojo.create("div", {}, this.content);
             this.buttonBarNode = dojo.create("div", { "class": "dijitDialogPaneActionBar" }, this.content);
             
             var self = this;
             dojo.forEach(this.buttons, function(name, index) {
                 var node = dojo.create("div", {}, self.buttonBarNode);
                 new Button({
                     label: name,
                     onClick: function() {
                         self.onButtonClick(index);
                     }
                 },
                 node);
             });
             
             this.inherited(arguments);
         },
        
        // is invoked when the button is pressed, index is the index of button in this.buttons array 
        onButtonClick: function(index) {
        }

    });
});
