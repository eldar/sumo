define([
    "dojo"
], function(dojo) {
    return {
        makeUnique: function(obj, prefix) {
            obj.id = _.uniqueId(prefix);
        },
        
        setVisible: function(elem, visible) {
            dojo.style(elem, { display: (visible ? "block" : "none")});
        },
        
        setWidgetVisible: function(widget, visible) {
            var node = widget.domNode;
            var parent = this.getParent(widget);
            if(!visible) {
                if(this.isWidgetVisible(widget)) { // hide if visible
                    widget.__sumo_display = dojo.getComputedStyle(node).display;
                    dojo.style(node, { display: "none"});
                    if(parent)
                        parent.childVisibilityChanged(this);
                }
            } else {
                if(!this.isWidgetVisible(widget)) { // show if hidden
                    var display = widget.__sumo_display || "block";
                    dojo.style(node, { display: display });
                    if(parent)
                        parent.childVisibilityChanged(this);
                }
            }
        },
        
        isWidgetVisible: function(widget) {
            var cs = dojo.getComputedStyle(widget.domNode);
            return cs.display != "none";
        },
        
		getParent: function(widget) {
			// summary:
			//		Returns the parent widget of this widget, assuming the parent
			//		specifies isContainer
			var parent = dijit.getEnclosingWidget(widget.domNode.parentNode);
			return parent && parent.isContainer ? parent : null;
		},        
        
        Horizontal: 1,
        Vertical: 2,
        
        opposite: function(ori) {
            return (ori === this.Horizontal) ? this.Vertical : this.Horizontal;
        }
    };
});
