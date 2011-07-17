define([
    "dojo",
    "dojo/touch",
    "sumo",
    "dijit/layout/_LayoutWidget",
    "dijit/_TemplatedMixin"
], function(dojo, touch, sumo, _LayoutWidget) {

    var dimDef = {
        "pl": "paddingLeft",
        "pr": "paddingRight",
        "pt": "paddingTop",
        "pb": "paddingBottom",
        "bl": "borderLeftWidth",
        "br": "borderRightWidth",
        "bt": "borderTopWidth",
        "bb": "borderBottomWidth",
        "ml": "marginLeft",
        "mr": "marginRight",
        "mt": "marginTop",
        "mb": "marginBottom",
        "w": "width",
        "h": "height",
        "t": "top",
        "b": "bottom",
        "l": "left",
        "r": "right",
    };

    var getDims = function(widget) {
        var cs = dojo.getComputedStyle(widget.domNode);
        var res = {};
        for (var key in dimDef) {
            res[key] = parseInt(cs[dimDef[key]]);
        }
        return res;
    };

    var allMargins = function(d, orient) {
        if (orient === sumo.Horizontal) return d.pl + d.pr + d.bl + d.br + d.ml + d.mr;
        else return d.pt + d.pb + d.bt + d.bb + d.mt + d.mb;
    };

    var fullSize = function(d, orient) {
        var m = allMargins(d, orient);
        return (orient === sumo.Horizontal) ? m + d.w : m + d.h;
    };

    sumo.setPos = function(widget, prop, value) {
        widget.domNode.style[prop] = value + "px";
    };
    
    var Oriented = dojo.declare("sumo.ui.Oriented", null, {
        orientation: sumo.Horizontal,

        isHorizontal: function() {
            return this.orientation === sumo.Horizontal;
        },
    });

    var Box = dojo.declare("sumo.ui.Box", [_LayoutWidget, Oriented], {

        buildRendering: function() {
            this.inherited(arguments);
            this.domNode.style.position = "absolute";
        },

        getChildren: function() {
            // Override _LayoutWidget.getChildren() to only return real children, not the splitters.
            return dojo.filter(this.inherited(arguments), function(widget) {
                return true;
            });
        },

        startup: function() {
            if (this._started) {
                return;
            }
            dojo.forEach(this.getChildren(), this._setupChild, this);
            this.inherited(arguments);
        },

        layout: function() {
            this._layoutChildren();
        },
        
        _setLength: function(child, len) {
            sumo.setPos(child, this.isHorizontal() ? "width" : "height", len);
        },

        _setWidth: function(child, len) {
            sumo.setPos(child, this.isHorizontal() ? "height" : "width", len);
        },

        addChild: function(child, stretchFactor) {
            child.domNode.style.position = "absolute";
            child.stretchFactor = stretchFactor !== undefined ? stretchFactor : 0;

            this.inherited(arguments);

            // set the new height for the widget
            var kids = this.getChildren();
            if (kids.length > 1) {
                var d = getDims(child);
                // collective length of all widgets except new one, we have to subract it because
                // it's already added
                var sizeOfOld = this._collectiveLength() - fullSize(d, this.orientation);
                var newSize = Math.round(sizeOfOld / (kids.length - 1));
                this._setLength(child, newSize - allMargins(d, this.orientation));
                d = getDims(child);
            }

            if (this._started) {
                this.layout(); //OPT
            }
        },

        resize: function(newSize, currentSize) {
            // Overrides _LayoutWidget.resize().
            // resetting potential padding to 0px to provide support for 100% width/height + padding
            // TODO: this hack doesn't respect the box model and is a temporary fix
            if (!this.cs || !this.pe) {
                var node = this.domNode;
                this.cs = dojo.getComputedStyle(node);
                this.pe = dojo._getPadExtents(node, this.cs);
                this.pe.r = dojo._toPixelValue(node, this.cs.paddingRight);
                this.pe.b = dojo._toPixelValue(node, this.cs.paddingBottom);

                dojo.style(node, "padding", "0px");
            }

            this.inherited(arguments);
        },

        _collectiveLength: function() {
            var kids = this.getChildren();
            var result = 0;
            var self = this;
            dojo.forEach(kids, function(child) {
                var d = getDims(child);
                result += fullSize(d, self.orientation);
            });
            return result;
        },

        minimumChildSize: function(child) {
            return 10;
        },

        _layoutChildren: function() {
            var kids = this.getChildren();

            var isHoriz = this.isHorizontal();
            var lenAcross = parseInt(isHoriz ? this.cs.height : this.cs.width); //dojo.position(this.domNode, true).w;
            var lenAlong = parseInt(isHoriz ? this.cs.width: this.cs.height);

            var self = this;

            // first set the length across the box to match its dimension
            dojo.forEach(kids, function(child) {
                var d = getDims(child);
                self._setWidth(child, lenAcross - allMargins(d, self.orientation));
            });

            var collectiveLength = this._collectiveLength();

            if ((collectiveLength !== lenAlong) && kids.length) {
                // do rescale
                var factor = lenAlong / collectiveLength;
                var remainingLen = lenAlong;
                // we iterate over all but last element because we do scaling
                // and there might be rounding issues, so the last one we don't scale
                // but assign the remaining available lenght
                for (var i = 0; i < kids.length - 1; i++) {
                    var child = kids[i];
                    var d = getDims(child);
                    var newLen = Math.round(fullSize(d, this.orientation) * factor);
                    this._setLength(child, newLen - allMargins(d, this.orientation));
                    child.resize();
                    remainingLen -= newLen;
                }
                child = kids[kids.length - 1];
                d = getDims(child);
                this._setLength(child, remainingLen - allMargins(d, this.orientation));
                child.resize();
            }

            // now setting positions
            var currentPos = 0;

            dojo.forEach(kids, function(child, i) {
                // position child
                var d = getDims(child);
                self._setPos(child, "start", currentPos);

                // go to the next pos
                currentPos += fullSize(d, self.orientation);
            });
        },

        _setPos: function(child, srcKey, value) {
            var horiz = this.isHorizontal();
            var key = "";
            switch(srcKey) {
                case "start":
                    key = horiz ? "left" : "top"; break;
                case "end":
                    key = horiz ? "right" : "bottom"; break;
                case "length":
                    key = horiz ? "width" : "height"; break;
                case "width":
                    key = horiz ? "height" : "width"; break;
            }
            sumo.setPos(child, key, value);
        },

        childVisibilityChanged: function() {
            
        }
    });


    return Box;
});
