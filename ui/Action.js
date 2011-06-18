var deps = [
    "dojo",
    "dojo/Stateful",
    "dijit/MenuItem",
    "sumo/ui/ToolButton"
];

define(deps, function (dojo, Stateful, MenuItem, ToolButton) {

    dojo.declare("Action", Stateful, {

        constructor: function(params) {
            this._params = params;
            this.label = params.label || "";
            this.disabled = params.disabled !== undefined ? params.disabled : false;
            this._widgets = [];
            this._dispatchProperty("disabled");
            this._dispatchProperty("label");
        },
        
        _dispatchProperty: function(name) {
            this.watch(name, function(name, oldValue, newValue) {
                dojo.forEach(this._widgets, function(item){
                    item.set(name, newValue);
                });
            });
        },
        
        makeMenuItem: function(params, srcNodeRef) {
            var itemParams = dojo.mixin(this._params, {
                onClick: dojo.hitch(this, "triggered")
            }, params);
            var item = new MenuItem(itemParams, srcNodeRef);
            this._widgets.push(item);
            return item;
        },
        
        makeToolButton: function(params, srcNodeRef) {
            var itemParams = dojo.mixin(this._params, {
                onClick: dojo.hitch(this, "triggered")
            }, params);
            var item = new ToolButton(dojo.mixin(itemParams, {
                showLabel: false // even turned off by default in ToolButton class, for some reason it shows up, thus enforce it
            }), srcNodeRef);
            this._widgets.push(item);
            return item;
        },
        
        triggered: function() {}
    });
    return Action;
});
