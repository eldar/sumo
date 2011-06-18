define([
    "dojo",
    "dijit/form/Button",
], function (dojo, Button) {

    return dojo.declare("sumo.ui.ToolButton", Button, {
        showLabel: false,
        style: {margin: "0px"},
        baseClass: "dijitToolButton"
    });
});
