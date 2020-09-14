/**
 * @author Wang, Hui (huiwang@qlike.com)
 * @repo https://github.com/hui-w/world-path/
 * @licence MIT
 */

/** @this {Element} */
function Toolbar(frame) {
  this.frame = frame;
  this.zoomRatio = 0;
  this.naviSpeed = {
    x: 0,
    y: 0,
  };
  this.buttonCount = 0;
  this.scaleGroup = null;
  this.toolGroup = null;
  this.toolSub = null;
  this.naviGroup = null;
  this.onZoomIn = null;
  this.onZoomOut = null;
  this.onZoom = null;
  this.onZoomRestore = null;
  this.onNavigate = null;
  this.onNaviRestore = null;

  this.routesOverlay = null;
  this.flightOverlay = null;
}

Toolbar.prototype = {
  /* Methods */
  renderInto: function (parent) {
    var that = this;

    //scale buttons
    this.scaleGroup = parent.createChildNS("g");

    //plus
    var iconPlus = Util.format_str("M0,{center} H{iconSize} M{center},0 V{iconSize}", {
      center: (Config.Toolbar.buttonSize - Config.Toolbar.buttonPadding * 2) / 2,
      iconSize: Config.Toolbar.buttonSize - Config.Toolbar.buttonPadding * 2,
    });
    this.renderButton(
      this.scaleGroup,
      0,
      0,
      iconPlus,
      true,
      false,
      false,
      function (e) {
        that.zoomRatio = 1.1;
        that.startZoomTimer();
      },
      function (e) {
        that.zoomRatio = 1;
      }
    );

    //minus
    var iconMinus = Util.format_str("M0,{center} H{iconSize}", {
      center: (Config.Toolbar.buttonSize - Config.Toolbar.buttonPadding * 2) / 2,
      iconSize: Config.Toolbar.buttonSize - Config.Toolbar.buttonPadding * 2,
    });
    this.renderButton(
      this.scaleGroup,
      1,
      0,
      iconMinus,
      true,
      false,
      false,
      function (e) {
        that.zoomRatio = 0.9;
        that.startZoomTimer();
      },
      function (e) {
        that.zoomRatio = 1;
      }
    );

    //tool buttons
    this.toolGroup = parent.createChildNS("g");
    var pathRight = "M8,0 L24,16 L8,32";
    var pathleft = "M24,0 L8,16 L24,32";
    this.renderButton(
      this.toolGroup,
      0,
      0,
      pathRight,
      true,
      false,
      false,
      function (e, icon, overlay) {
        var currentStyle = that.toolSub.getStyle("display");
        if (currentStyle == null) {
          that.toolSub.updateStyle("display", "none");
          icon.attr("d", pathRight);
        } else {
          that.toolSub.updateStyle("display", null);
          icon.attr("d", pathleft);
        }
      },
      null
    );

    //tool sub items
    this.toolSub = this.toolGroup.createChildNS("g", {
      transform: "translate({0}, {1})".format(Config.Toolbar.buttonSize + Config.Toolbar.buttonSpacing, 0),
      style: "display: none",
    });

    //restore position
    this.renderButton(
      this.toolSub,
      0,
      0,
      "M0,16 H10 M14,16 H18 M22,16 H32 M16,0 V10 M16,22 V32",
      true,
      false,
      false,
      function (e) {
        if (typeof that.onNaviRestore == "function") {
          that.onNaviRestore();
        }
      },
      null
    );

    //restore scale
    this.renderButton(
      this.toolSub,
      0,
      1,
      "M4,6 V26 M16,8 V12 M16,24 V20 M28,6 V26",
      true,
      false,
      false,
      function (e) {
        if (typeof that.onZoomRestore == "function") {
          that.onZoomRestore();
        }
      },
      null
    );

    //switch flight
    var flightsIconData = "";
    flightsIconData += "M29.532,17.258c-0.584-0.985-3.159-2.277-3.602-2.488L18.155,9.53L17.53,2.608";
    flightsIconData += "C17.438,2.172,16.903,0,15.561,0c-1.376,0-1.833,2.097-1.89,2.394l-0.699,7.468l-7.103,4.973c-0.473,0.243-2.86,1.496-3.396,2.431";
    flightsIconData += "c-0.482,0.843-0.373,3.24-0.346,3.712c0.01,0.179,0.104,0.342,0.253,0.439c0.15,0.097,0.334,0.118,0.503,0.058l10.24-3.797";
    flightsIconData += "l0.898,9.151c0,0.112,0.001,0.223,0.006,0.332c-0.91,0.464-2.98,1.59-3.463,2.501c-0.227,0.435-0.134,1.352-0.059,1.859";
    flightsIconData += "c0.026,0.165,0.122,0.311,0.265,0.396C10.858,31.972,10.959,32,11.062,32c0.063,0,0.124-0.011,0.183-0.031l3.503-1.208h1.621";
    flightsIconData += "l3.593,1.131c0.159,0.047,0.328,0.029,0.467-0.06c0.14-0.088,0.236-0.231,0.26-0.393c0.083-0.554,0.141-1.291-0.061-1.67";
    flightsIconData += "c-0.527-0.975-2.805-2.152-3.796-2.629l1.165-9.719l11.15,3.674c0.165,0.055,0.349,0.03,0.495-0.071";
    flightsIconData += "c0.145-0.099,0.235-0.261,0.243-0.437C29.912,19.992,29.97,17.994,29.532,17.258z M17.845,16.188";
    flightsIconData += "c-0.055-0.02-0.115-0.029-0.176-0.029h-0.156c-0.285,0-0.525,0.213-0.558,0.496l-1.248,10.443c0,0.097-0.011,0.192-0.028,0.286";
    flightsIconData += "c-0.043,0.252,0.088,0.501,0.321,0.606c1.318,0.605,3.317,1.722,3.622,2.279c0.017,0.055,0.021,0.181,0.017,0.34l-3.013-0.948";
    flightsIconData += "c-0.054-0.017-0.111-0.026-0.168-0.026h-1.803c-0.062,0-0.124,0.012-0.183,0.03l-2.92,1.008c-0.012-0.236-0.01-0.426,0.008-0.488";
    flightsIconData += "c0.287-0.543,2.102-1.604,3.298-2.184c0.212-0.103,0.337-0.326,0.315-0.563c-0.02-0.196-0.025-0.401-0.028-0.669l-0.971-9.93";
    flightsIconData += "c-0.017-0.174-0.114-0.33-0.261-0.423c-0.09-0.058-0.194-0.087-0.298-0.087c-0.066,0-0.132,0.013-0.195,0.035L3.225,20.147";
    flightsIconData += "c-0.013-1.012,0.058-2.032,0.223-2.324c0.273-0.476,1.88-1.448,2.999-2.026l7.381-5.162c0.136-0.094,0.222-0.245,0.237-0.409";
    flightsIconData += "l0.715-7.667c0.134-0.664,0.504-1.432,0.779-1.432c0.226,0,0.669,0.792,0.858,1.652l0.643,7.155";
    flightsIconData += "c0.019,0.204,0.168,0.373,0.354,0.456l7.956,5.353c1.142,0.559,2.889,1.575,3.193,2.088c0.139,0.233,0.208,1.09,0.21,1.959";
    flightsIconData += "L17.845,16.188z";
    this.flightOverlay = this.renderButton(
      this.toolSub,
      0,
      2,
      flightsIconData,
      false,
      true,
      true,
      function (e, icon, overlay) {
        that.showFlights(overlay.attr("stroke") == "none");
      },
      null
    ).overlay;

    //switch driving
    var routesIconData = "";
    routesIconData += "M13.671,13.059c-0.588-1.381-1.096-2.574-0.763-4.564c0.606-3.606,6.876-7.688,13.74-7.338l0.059-1.135";
    routesIconData += "c-7.559-0.377-14.231,4.142-14.926,8.287c-0.389,2.315,0.234,3.778,0.837,5.193c0.455,1.066,0.924,2.168,1,3.723";
    routesIconData += "c0.12,2.441-7.298,6.35-12.002,8.242l0.429,1.053c1.322-0.531,12.915-5.309,12.717-9.352";
    routesIconData += "C14.675,15.414,14.142,14.163,13.671,13.059z M30.352,21.012c-0.238-3.152-1.9-6.189-4.211-7.736";
    routesIconData += "C22.1,10.57,21.781,9.129,22.635,7.68c1.965-3.333,7.047-3.382,7.047-3.382V3.162c0,0-5.736,0.045-8.035,3.945";
    routesIconData += "c-1.691,2.871,0.908,5.115,3.891,7.112c2.031,1.36,3.48,4.059,3.691,6.877c0.188,2.496-0.465,6.27-4.633,10.066L25.369,32";
    routesIconData += "C29.875,27.895,30.557,23.758,30.352,21.012z M14.12,28.92l0.267,1.105c0.025-0.006,0.618-0.148,1.446-0.527l-0.479-1.033";
    routesIconData += "C14.637,28.795,14.125,28.918,14.12,28.92z M17.918,13.655c0.461,0.811,0.945,1.683,1.348,2.64l1.057-0.437";
    routesIconData += "c-0.428-1.016-0.93-1.92-1.406-2.761L17.918,13.655z M17.545,7.968L16.5,7.505c-0.235,0.527-0.351,1.054-0.351,1.613";
    routesIconData += "c0,0.551,0.113,1.125,0.35,1.76l1.073-0.394c-0.188-0.505-0.279-0.952-0.279-1.366C17.293,8.722,17.377,8.346,17.545,7.968z";
    routesIconData += "M17.73,26.896l0.779,0.83c0.813-0.75,1.461-1.619,1.932-2.584l-1.029-0.496C19.004,25.484,18.438,26.242,17.73,26.896z";
    routesIconData += "M21.209,18.885l-1.129,0.182c0.055,0.342,0.096,0.689,0.119,1.033c0.018,0.266,0.027,0.523,0.027,0.775";
    routesIconData += "c0,0.359-0.018,0.717-0.055,1.059l1.139,0.119c0.039-0.383,0.061-0.779,0.061-1.178c0-0.275-0.01-0.559-0.031-0.852";
    routesIconData += "C21.314,19.645,21.27,19.26,21.209,18.885z M19.818,4.114c-0.438,0.293-0.84,0.587-1.193,0.874l0.723,0.881";
    routesIconData += "c0.326-0.265,0.701-0.539,1.109-0.813L19.818,4.114z";

    this.routesOverlay = this.renderButton(
      this.toolSub,
      0,
      3,
      routesIconData,
      false,
      true,
      true,
      function (e, icon, overlay) {
        that.showRoutes(overlay.attr("stroke") == "none");
      },
      null
    ).overlay;

    //home button
    this.renderButton(
      this.toolSub,
      1,
      0,
      "M16,0 L32,16 H28 V32 H20 V20 H12 V32 H4 V16 H0 Z",
      true,
      false,
      false,
      function (e) {
        that.frame.home();
      },
      null
    );

    //navigation buttons
    this.naviGroup = parent.createChildNS("g");
    this.renderButton(
      this.naviGroup,
      1,
      0,
      "M8,16 L20,24 V8 Z",
      true,
      false,
      false,
      function (e) {
        //left
        that.naviSpeed.x = Config.Toolbar.navUnit;
        that.startNaviTimer();
      },
      function (e) {
        that.naviSpeed.x = 0;
      }
    );
    this.renderButton(
      this.naviGroup,
      0,
      1,
      "M16,8 L8,20 H24 Z",
      true,
      false,
      false,
      function (e) {
        //top
        that.naviSpeed.y = Config.Toolbar.navUnit;
        that.startNaviTimer();
      },
      function (e) {
        that.naviSpeed.y = 0;
      }
    );
    this.renderButton(
      this.naviGroup,
      1,
      2,
      "M24,16 L12,8 V24 Z",
      true,
      false,
      false,
      function (e) {
        //right
        that.naviSpeed.x = -Config.Toolbar.navUnit;
        that.startNaviTimer();
      },
      function (e) {
        that.naviSpeed.x = 0;
      }
    );
    this.renderButton(
      this.naviGroup,
      1,
      1,
      "M16,24 L24,12 H8 Z",
      true,
      false,
      false,
      function (e) {
        //bottom
        that.naviSpeed.y = -Config.Toolbar.navUnit;
        that.startNaviTimer();
      },
      function (e) {
        that.naviSpeed.y = 0;
      }
    );
  },

  renderCustomButton: function (svgPath, targetCx, targetCy, targetScale) {
    if (!this.toolSub) {
      return;
    }
    var that = this;
    var column = ++this.buttonCount;

    this.renderButton(
      this.toolSub,
      1,
      column,
      svgPath,
      true,
      false,
      false,
      function (e) {
        that.frame.setCenterAndScale(targetCx, targetCy, targetScale, null);
      },
      null
    );
  },

  showRoutes: function (show) {
    this.frame.map.showRoutes(show);
    this.routesOverlay.attr("stroke", show ? "#333" : "none");
    Util.setUrlHash("r", show ? 1 : 0);
  },

  showFlights: function (show) {
    this.frame.map.showFlights(show);
    this.flightOverlay.attr("stroke", show ? "#333" : "none");
    Util.setUrlHash("f", show ? 1 : 0);
  },

  adjustPosition: function (width, height) {
    //scale bottons
    this.scaleGroup.attr(
      "transform",
      Util.format_str("translate({left}, {top})", {
        left: width - Config.Toolbar.marginRight - Config.Toolbar.buttonSize,
        top: height - Config.Toolbar.marginBottom - (Config.Toolbar.buttonSize * 2 + Config.Toolbar.buttonSpacing),
      })
    );

    //tool buttons
    this.toolGroup.attr(
      "transform",
      Util.format_str("translate({left}, {top})", {
        left: Config.Toolbar.marginLeft, //width - Config.Toolbar.marginRight - Config.Toolbar.buttonSize,
        top: Config.Toolbar.marginTop, //Config.Toolbar.marginTop
      })
    );

    //navigation buttons
    this.naviGroup.attr(
      "transform",
      Util.format_str("translate({left}, {top})", {
        left: Config.Toolbar.marginLeft,
        top: height - Config.Toolbar.marginBottom - (Config.Toolbar.buttonSize * 2 + Config.Toolbar.buttonSpacing),
      })
    );
  },

  /*
    row & col: the icon position in the group
    iconData: path data
    */
  renderButton: function (parent, row, col, iconData, applyStroke, applyFill, strokeOverlay, onCapture, onRelease) {
    var that = this;

    //render the group
    var top = (Config.Toolbar.buttonSize + Config.Toolbar.buttonSpacing) * row;
    var left = (Config.Toolbar.buttonSize + Config.Toolbar.buttonSpacing) * col;
    var group = parent.createChildNS("g", {
      transform: "translate({0}, {1})".format(left, top),
    });

    //render the icon
    var icon = group.createChildNS("path", {
      fill: applyFill ? "RGBA(0,0,0,1)" : "none",
      stroke: applyStroke ? "RGBA(0,0,0,1)" : "none",
      "stroke-width": 4,
      "stroke-linejoin": "round",
      d: iconData,
      transform: "translate({0}, {0})".format(Config.Toolbar.buttonPadding),
    });

    //overlay
    var overlay = group.createChildNS("rect", {
      fill: "RGBA(255,255,255,0.4)",
      stroke: strokeOverlay ? "#333" : "none",
      "stroke-width": 1,
      x: 0,
      y: 0,
      rx: Config.Toolbar.buttonSize / 8,
      ry: Config.Toolbar.buttonSize / 8,
      width: Config.Toolbar.buttonSize,
      height: Config.Toolbar.buttonSize,
    });

    //touch events
    overlay.addEventListener(
      "touchstart",
      function (e) {
        e.preventDefault();
        that.highlightIcon(this.parentNode.childNodes[0], true);
        if (typeof onCapture == "function") {
          onCapture(e, icon, overlay);
        }
        e.stopPropagation();
      },
      true
    );
    overlay.addEventListener(
      "touchend",
      function (e) {
        e.preventDefault();
        that.highlightIcon(this.parentNode.childNodes[0], false);
        if (typeof onRelease == "function") {
          onRelease(e, icon, overlay);
        }
        e.stopPropagation();
      },
      true
    );
    overlay.addEventListener(
      "touchcancel",
      function (e) {
        e.preventDefault();
        that.highlightIcon(this.parentNode.childNodes[0], false);
        if (typeof onRelease == "function") {
          onRelease(e, icon, overlay);
        }
        e.stopPropagation();
      },
      true
    );
    overlay.addEventListener(
      "touchmove",
      function (e) {
        e.preventDefault();
        e.stopPropagation();
      },
      true
    );

    //mouse events
    overlay.addEventListener(
      "mousedown",
      function (e) {
        that.highlightIcon(this.parentNode.childNodes[0], true);
        if (typeof onCapture == "function") {
          onCapture(e, icon, overlay);
        }
        e.stopPropagation();
      },
      true
    );
    overlay.addEventListener(
      "mouseup",
      function (e) {
        that.highlightIcon(this.parentNode.childNodes[0], false);
        if (typeof onRelease == "function") {
          onRelease(e, icon, overlay);
        }
        e.stopPropagation();
      },
      true
    );
    overlay.addEventListener(
      "mouseout",
      function (e) {
        that.highlightIcon(this.parentNode.childNodes[0], false);
        if (typeof onRelease == "function") {
          onRelease(e, icon, overlay);
        }
        e.stopPropagation();
      },
      true
    );
    overlay.addEventListener(
      "mousemove",
      function (e) {
        e.stopPropagation();
      },
      true
    );

    return {
      icon: icon,
      overlay: overlay,
    };
  },

  startZoomTimer: function () {
    var that = this;
    var handler = function () {
      if (that.zoomRatio != 1 && typeof that.onZoom == "function") {
        if (that.onZoom(that.zoomRatio)) {
          setTimeout(handler, Config.Toolbar.zoomTimerDelay);
        }
      }
    };
    handler();
  },

  startNaviTimer: function () {
    var that = this;
    var handler = function () {
      if ((that.naviSpeed.x != 0 || that.naviSpeed.y != 0) && typeof that.onZoom == "function") {
        that.onNavigate(that.naviSpeed.x, that.naviSpeed.y);
        setTimeout(handler, Config.Toolbar.navTimerDelay);
      }
    };
    handler();
  },

  highlightIcon: function (icon, highlight) {
    if (icon.attr("stroke") != "none") {
      icon.attr("stroke", highlight ? "#ff0000" : "#000000");
    }
    if (icon.attr("fill") != "none") {
      icon.attr("fill", highlight ? "#ff0000" : "#000000");
    }
  },
};
