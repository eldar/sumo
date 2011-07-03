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

    var Splitter = dojo.declare("sumo.ui.Splitter", [_LayoutWidget, Oriented], {
        _splitterClass: "sumo.ui._Splitter",

        buildRendering: function() {
            this.inherited(arguments);
            this.domNode.style.position = "absolute";
        },

        getChildren: function() {
            // Override _LayoutWidget.getChildren() to only return real children, not the splitters.
            return dojo.filter(this.inherited(arguments), function(widget) {
                return !widget.isSplitter;
            });
        },

        getSplitters: function() {
            return dojo.filter(_LayoutWidget.prototype.getChildren.call(this), function(widget) {
                return widget.isSplitter;
            });
        },

        startup: function() {
            if (this._started) {
                return;
            }
            dojo.forEach(this.getChildren(), this._setupChild, this);
            this.inherited(arguments);
        },

        _setupChild: function( /*dijit._Widget*/ child) {
            // Override _LayoutWidget._setupChild().
            this.inherited(arguments);

            // don't add splitters if this one is the first in a row
            if (dojo.indexOf(this.getChildren(), child) === 0) return;

            var _Splitter = dojo.getObject(this._splitterClass);
            var splitter = new _Splitter({
                container: this,
                child: child,
                orientation: sumo.opposite(this.orientation)
            });
            splitter.isSplitter = true;

            dojo.place(splitter.domNode, child.domNode, "before");
            // Splitters aren't added as Contained children, so we need to call startup explicitly
            splitter.startup();
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

        addChild: function( /*dijit._Widget*/ child, /*Integer?*/ insertIndex) {
            child.domNode.style.position = "absolute";

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

            // first set the lenght across the splitter to match the dimension of the latter
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
            var splitters = this.getSplitters();

            dojo.forEach(kids, function(child, i) {
                // position child
                var d = getDims(child);
                self._setPos(child, "start", currentPos);

                // position splitter
                if (i !== 0) {
                    var splitter = splitters[i - 1];
                    var ds = getDims(splitter);
                    var splitterWidth = splitter.isHorizontal() ? ds.h : ds.w;
                    self._setPos(splitter, "start", currentPos - Math.round(splitterWidth / 2));
                }

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

        _startDrag: function(splitter, start) {
            var horiz = this.isHorizontal();
            
            var d = getDims(splitter);
            var splitterStart = horiz ? d.l : d.t;

            var idx = dojo.indexOf(this.getSplitters(), splitter);
            var kids = this.getChildren();
            var prev = kids[idx];
            var prevD = getDims(prev);
            var prevStart = horiz ? prevD.r : prevD.b;
            var prevLength = horiz ? prevD.w : prevD.h;

            var next = kids[idx + 1];
            var nextD = getDims(next);
            var nextStart = horiz ? nextD.l : nextD.t;
            var nextLength = horiz ? nextD.w : nextD.h;

            var minSize = this.minimumChildSize();

            var self = this;
            
            return function(pos) {
                var delta = pos - start;
                var prevNewSize = prevLength + delta;
                var nextNewSize = nextLength - delta;
                if (prevNewSize > minSize && nextNewSize > minSize) {
                    self._setPos(splitter, "start", splitterStart + delta);

                    self._setPos(prev, "end", prevStart - delta);
                    self._setPos(prev, "length", prevLength + delta);
                    prev.resize();

                    self._setPos(next, "start", nextStart + delta);
                    self._setPos(next, "length", nextLength - delta);
                    next.resize();
                }
            }
        },
        
        childVisibilityChanged: function() {
            
        }
    });

    var SplitterWidget = dojo.declare("sumo.ui._Splitter", [dijit._Widget, dijit._TemplatedMixin, Oriented], {
        live: true,

        templateString: '<div class="dijitSplitter" dojoAttachEvent="press:_startDrag" tabIndex="0" role="separator"></div>',

        isSplitter: true,

        buildRendering: function() {
            this.inherited(arguments);

            dojo.addClass(this.domNode, "dijitSplitter" + (this.isHorizontal() ? "H" : "V"));
            dojo.style(this.domNode, {
                border: "1px solid red",
                outline: "none",
                position: "absolute"
            });
            var propName = this.isHorizontal() ? "width" : "height";
            dojo.style(this.domNode, propName, "100%");
        },
        
        _startDrag: function(e) {
            var factor = 1,
                isHorizontal = this.isHorizontal(),
                axis = isHorizontal ? "pageY" : "pageX",
                pageStart = e[axis],
                de = dojo.doc,
                container = this.container;

            var dragHandler = this.container._startDrag(this, pageStart);

            this._handlers = (this._handlers || []).concat([
                dojo.connect(de, touch.move, this._drag = function(e, forceResize) {
                    dragHandler(e[axis]);
                }),
                dojo.connect(de, "ondragstart", dojo.stopEvent),
                dojo.connect(dojo.body(), "onselectstart", dojo.stopEvent),
                dojo.connect(de, touch.release, this, "_stopDrag")
            ]);
        },

        _stopDrag: function(e) {
            this._cleanupHandlers();
        },

        _cleanupHandlers: function() {
            dojo.forEach(this._handlers, dojo.disconnect);
            delete this._handlers;
        },

        _onMouse: function() {}

    });

    return Splitter;
});
