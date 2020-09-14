/**
 * @author Wang, Hui (huiwang@qlike.com)
 * @repo https://github.com/hui-w/world-path/
 * @licence MIT
 */

/** @this {Element} */

function Frame(map, width, height, fullscreen) {
  this.map = map;
  this.map.frame = this;
  this.width = width;
  this.height = height;
  this.toolbar = null;
  this.fullscreen = fullscreen;
  if (fullscreen) {
    this.width = document.documentElement.clientWidth;
    this.height = document.documentElement.clientHeight;
  }

  /* Fields */
  this.frameObj = null;
  this.statusLabel = null;
  this.isHolding = false;

  //where the mouse was down or last action
  this.mousePoint = {
    x: -1,
    y: -1,
  };

  //the distance for multi-touch
  this.startDistance = -1;

  //from 0000 to 1111 (Keys: left-up-right-bottom)
  this.arrowKeyStatus = 0;
  this.keyboardTimer = null;

  /*
        //the speed by which the mouse moves
        this.moveSpeed = {
            x: 0,
            y: 0
        };

        //the timer to reach inertial stopping distance
        this.inertiaTimer = null;
    */

  this.inMotion = false;
}

Frame.prototype = {
  moveMapTo: function (targetLeft, targetTop, callback) {
    var that = this;
    if (this.inMotion) {
      return;
    } else {
      this.inMotion = true;
    }

    var steps = Config.WorldMap.moveDuration / Config.WorldMap.moveTimerDelay;
    var dLeft = Math.round((targetLeft - this.map.left) / steps);
    var dTop = Math.round((targetTop - this.map.top) / steps);

    var stepPosition = function () {
      //motion done
      if (that.map.left == targetLeft && that.map.top == targetTop) {
        that.inMotion = false;
        if (typeof callback == "function") {
          callback();
        }
        return;
      }

      //position
      var nextLeft = that.map.left + dLeft,
        nextTop = that.map.top + dTop;

      //left overflow
      if (dLeft == 0 || (dLeft > 0 && nextLeft > targetLeft) || (dLeft < 0 && nextLeft < targetLeft)) {
        nextLeft = targetLeft;
      }

      //top overflow
      if (dTop == 0 || (dTop > 0 && nextTop > targetTop) || (dTop < 0 && nextTop < targetTop)) {
        nextTop = targetTop;
      }
      that.map.moveTo(nextLeft, nextTop, null);

      //next round
      setTimeout(stepPosition, Config.WorldMap.moveTimerDelay);
    };
    stepPosition();
  },

  scaleMapTo: function (targetScale, callback) {
    var that = this;

    if (this.inMotion) {
      return;
    } else {
      this.inMotion = true;
    }

    //overflow the max or min value
    if (targetScale < Config.WorldMap.minScale) {
      targetScale = Config.WorldMap.minScale;
    } else if (targetScale > Config.WorldMap.maxScale) {
      targetScale = Config.WorldMap.maxScale;
    }

    var ratio = targetScale > this.map.scale ? 1.1 : 0.9;

    var stepScale = function () {
      //motion done
      if (that.map.scale == targetScale) {
        that.inMotion = false;
        if (typeof callback == "function") {
          callback();
        }
        return;
      }

      //scale
      var nextScale = that.map.scale * ratio;
      if ((ratio < 1 && nextScale < targetScale) || (ratio > 1 && nextScale > targetScale)) {
        nextScale = targetScale;
      }

      var point = that.convertFramePointToMap(that.width / 2, that.height / 2);
      that.map.zoomTo(nextScale, point);

      //next round
      setTimeout(stepScale, Config.WorldMap.zoomTimerDelay);
    };
    stepScale();
  },

  setCenterAndScale: function (targetCx, targetCy, targetScale, callback) {
    var that = this;
    this.scaleMapTo(1, function () {
      //callback: zoom to best perspective
      that.setCenterPoint(targetCx, targetCy, true, function () {
        //callback: move done
        that.scaleMapTo(targetScale, function () {
          //callback: zoom to the target scale
          if (typeof callback == "function") {
            callback();
          }
        });
      });
    });
  },

  setCenterPoint: function (targetCx, targetCy, animation, callback) {
    var x = this.width / 2 - targetCx * this.map.scale;
    var y = this.height / 2 - targetCy * this.map.scale;
    if (animation) {
      this.moveMapTo(x, y, callback);
    } else {
      this.map.moveTo(x, y);
      if (typeof callback == "function") {
        callback();
      }
    }
  },

  getCenterPoint: function () {
    var cx = (this.width / 2 - this.map.left) / this.map.scale;
    var cy = (this.height / 2 - this.map.top) / this.map.scale;
    return {
      cx: cx,
      cy: cy,
    };
  },

  /* Methods */
  renderInto: function (parent, renderComplete) {
    var that = this;
    this.frameObj = document.createElement("div");
    var cssStyle = Util.format_str(
      "width: {width}px; height: {height}px; cursor: pointer; overflow: hidden; border: none; background-color: RGBA(100, 100, 100, 0.2);",
      {
        width: this.width,
        height: this.height,
      }
    );
    this.frameObj.setAttribute("style", cssStyle);
    parent.appendChild(this.frameObj);

    //toolbar
    this.toolbar = new Toolbar(this);

    /* render the inside map */
    this.map.renderInto(this.frameObj, function () {
      /* attach the events */
      that.enableInteractive();

      /* render the toolbar */
      that.toolbar.renderInto(that.map.getExtraGroup());

      /* render the status label */
      that.statusLabel = that.map.getExtraGroup().createChildNS("text", {
        fill: "#666",
        class: "no-select",
        x: 4,
        y: 10,
        "font-size": 8,
      });

      /* position and scale */
      var cx = Util.getUrlHash("cx");
      var cy = Util.getUrlHash("cy");
      var s = Util.getUrlHash("s");
      if (cx != null && cy != null) {
        //initiate from url hash
        that.setCenterPoint(cx, cy, false, function () {
          if (s != null) {
            var point = that.convertFramePointToMap(that.width / 2, that.height / 2);
            that.map.zoomTo(s, point);
          }
        });
      } else {
        //default: align to center
        that.setCenterPoint(that.map.width / 2, that.map.height / 2, false, null);
        that.updateStatusLabel();
      }

      /* routes and flight */
      var r = Util.getUrlHash("r");
      var f = Util.getUrlHash("f");
      if (r == 0) {
        that.toolbar.showRoutes(false);
      }
      if (f == 0) {
        that.toolbar.showFlights(false);
      }

      //render complete call back
      if (typeof renderComplete == "function") {
        renderComplete();
      }
    });

    this.toolbar.onZoom = function (scaleRatio) {
      var point = that.convertFramePointToMap(that.width / 2, that.height / 2);
      return that.map.zoom(scaleRatio, point);
    };

    this.toolbar.onZoomRestore = function () {
      that.scaleMapTo(1, null);
    };

    this.toolbar.onNavigate = function (dx, dy) {
      that.map.move(dx, dy);
    };

    this.toolbar.onNaviRestore = function () {
      that.setCenterPoint(that.map.width / 2, that.map.height / 2, true, null);
    };

    this.map.onScaleChanged = function () {
      that.updateStatusLabel();
    };

    this.map.onPositionChanged = function () {
      that.updateStatusLabel();
    };

    /* check the windows size and resize the frame */
    if (this.fullscreen) {
      function adjustPosition() {
        //console.log("adjust positions");
        that.map.resize(that.width, that.height);
        that.toolbar.adjustPosition(that.width, that.height);
      }

      function checkWindowsize(e) {
        var nwidth = document.documentElement.clientWidth;
        var nheight = document.documentElement.clientHeight;
        if (nwidth != that.width || nheight != that.height) {
          that.width = nwidth;
          that.height = nheight;
          that.frameObj.style.width = that.width + "px";
          that.frameObj.style.height = that.height + "px";
          adjustPosition();
        }
      }
      setInterval(checkWindowsize, 200);
      adjustPosition();
    } else {
      //adjust toe toolbar position for non-fullscreen mode
      this.toolbar.adjustPosition(this.width, this.height);
    }
  }, //end of render

  updateStatusLabel: function () {
    this.statusLabel.textContent = "[{0}, {1}] x {2}".format(this.map.left.toFixed(1), this.map.top.toFixed(1), this.map.scale.toFixed(1));

    var cp = this.getCenterPoint();
    Util.setUrlHash("cx", cp.cx.toFixed(3));
    Util.setUrlHash("cy", cp.cy.toFixed(3));
    Util.setUrlHash("s", this.map.scale.toFixed(3));
  },

  enableInteractive: function () {
    var that = this;

    /* touch event */
    this.handleTouchEvent = function (e) {
      if (that.inMotion) {
        return;
      }
      e.preventDefault();
      switch (e.type) {
        case "touchstart":
          if (e.touches.length == 1) {
            that.eventDown(e.targetTouches[0]);
          } else if (e.touches.length == 2) {
            var e1 = e.targetTouches[0];
            var e2 = e.targetTouches[1];
            that.startDistance = that.getDistance(e1.pageX, e1.pageY, e2.pageX, e2.pageY);
          }
          break;
        case "touchmove":
          if (e.changedTouches.length == 1) {
            that.eventMove(e.changedTouches[0]);
          } else if (e.touches.length == 2) {
            var e1 = e.targetTouches[0];
            var e2 = e.targetTouches[1];
            var newDistance = that.getDistance(e1.pageX, e1.pageY, e2.pageX, e2.pageY);
            that.map.zoom(newDistance > that.startDistance ? 1 : -1);
            that.startDistance = newDistance;
          }
          break;
        case "touchend":
          if (e.changedTouches.length == 1) {
            that.eventUp(e.changedTouches[0]);
          }
          break;
      }
    };

    this.frameObj.addEventListener("touchstart", this.handleTouchEvent, false);
    this.frameObj.addEventListener("touchend", this.handleTouchEvent, false);
    this.frameObj.addEventListener("touchmove", this.handleTouchEvent, false);

    /* mouse event */
    this.handleMouseEvent = function (e) {
      if (that.inMotion) {
        return;
      }
      e.preventDefault();
      switch (e.type) {
        case "mousedown":
          that.eventDown(e);
          break;
        case "mousemove":
          that.eventMove(e);
          break;
        case "mouseup":
          that.eventUp(e);
          break;
        case "mouseleave":
          that.isHolding = false;
          break;
        case "dblclick":
          //var point = that.getEventPositionOnMap(e, that.frameObj);
          //that.map.zoom(2, point);
          break;
        case "mousewheel":
          var point = that.getEventPositionOnMap(e, that.frameObj);
          that.map.zoom(e.wheelDelta > 0 ? 1.1 : 0.9, point);
          break;
      }
    };
    this.frameObj.addEventListener("mousedown", this.handleMouseEvent, false);
    this.frameObj.addEventListener("mousemove", this.handleMouseEvent, false);
    this.frameObj.addEventListener("mouseup", this.handleMouseEvent, false);
    this.frameObj.addEventListener("mouseleave", this.handleMouseEvent, false);
    this.frameObj.addEventListener("dblclick", this.handleMouseEvent, false);
    this.frameObj.addEventListener("mousewheel", this.handleMouseEvent, false);

    /* key event */
    this.handleKeyEvent = function (e) {
      if (that.inMotion) {
        return;
      }
      that.handleKey(e, that);
    };
    document.addEventListener("keydown", this.handleKeyEvent, false);
    document.addEventListener("keyup", this.handleKeyEvent, false);
  }, //end of enableInteractive

  eventDown: function (e) {
    this.isHolding = true;
    this.mousePoint.x = e.pageX;
    this.mousePoint.y = e.pageY;

    //break moving inertia
    /*
                if (this.inertiaTimer) {
                    clearInterval(this.inertiaTimer);
                }
        */
  }, //end of eventDown

  eventUp: function (e) {
    var that = this;
    /*
                this.inertiaTimer = setInterval(function() {
                    if (Math.abs(that.moveSpeed.x) < 1 && Math.abs(that.moveSpeed.y) < 1) {
                        clearInterval(that.inertiaTimer);
                        that.inertiaTimer = null;
                    } else {
                        this.map.move(that.moveSpeed.x, that.moveSpeed.y);

                        that.moveSpeed.x *= 0.75;
                        that.moveSpeed.y *= 0.75;
                    }
                }, 30);
        */

    this.isHolding = false;
  }, //end of eventUp

  eventMove: function (e) {
    if (this.isHolding) {
      //fix the touch move bug in iOS
      if (e.layerX != undefined && (Browser.versions.iPhone || Browser.versions.iPad)) {
        return;
      }

      //move map
      this.map.move(e.pageX - this.mousePoint.x, e.pageY - this.mousePoint.y);

      //save current moving speed
      /*
                        this.moveSpeed.x = e.pageX - this.mousePoint.x;
                        this.moveSpeed.y = e.pageY - this.mousePoint.y;
            */

      //save current position
      this.mousePoint.x = e.pageX;
      this.mousePoint.y = e.pageY;
    }
  }, //end of eventMove

  /* keyboard events */
  handleKey: function (e) {
    var that = this;
    var keyCode = e.keyCode;
    //console.log(keyCode);

    switch (e.type) {
      case "keydown":
        function keyboardTimerHandler() {
          var changeUnit = Config.keyboard.changeUnit;
          var dx = 0,
            dy = 0;
          if ((that.arrowKeyStatus & 1) > 0) {
            dx += changeUnit;
          }

          if ((that.arrowKeyStatus & (1 << 1)) > 0) {
            dy += changeUnit;
          }

          if ((that.arrowKeyStatus & (1 << 2)) > 0) {
            dx -= changeUnit;
          }

          if ((that.arrowKeyStatus & (1 << 3)) > 0) {
            dy -= changeUnit;
          }

          if (that.arrowKeyStatus > 0) {
            that.map.move(dx, dy);

            //set-up the timer for next round
            that.keyboardTimer = setTimeout(keyboardTimerHandler, Config.keyboard.timerDelay);
          } else {
            that.keyboardTimer = null;
          }
        }

        switch (keyCode) {
          case 37:
          case 65:
            //left
            this.arrowKeyStatus |= 1;
            break;
          case 38:
          case 87:
            //up
            this.arrowKeyStatus |= 1 << 1;
            break;
          case 39:
          case 68:
            //right
            this.arrowKeyStatus |= 1 << 2;
            break;
          case 40:
          case 83:
            //down
            this.arrowKeyStatus |= 1 << 3;
            break;
        }
        if (this.arrowKeyStatus > 0 && this.keyboardTimer == null) {
          keyboardTimerHandler();
        }
        break;
      case "keyup":
        switch (keyCode) {
          case 37:
          case 65:
            that.arrowKeyStatus &= ~1;
            break;
          case 38:
          case 87:
            that.arrowKeyStatus &= ~(1 << 1);
            break;
          case 39:
          case 68:
            that.arrowKeyStatus &= ~(1 << 2);
            break;
          case 40:
          case 83:
            that.arrowKeyStatus &= ~(1 << 3);
            break;
        }
        if (that.arrowKeyStatus == 0) {
          if (that.keyboardTimer != null) {
            clearTimeout(that.keyboardTimer);
            that.keyboardTimer = null;
          }
        }
        break;
    }
  },

  getDistance: function (x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1)) * -1;
  },

  getEventPositionOnMap: function (e) {
    return {
      x: e.pageX - this.frameObj.offsetLeft - this.map.left,
      y: e.pageY - this.frameObj.offsetTop - this.map.top,
    };
  },

  convertFramePointToMap: function (x, y) {
    return {
      x: x - this.frameObj.offsetLeft - this.map.left,
      y: y - this.frameObj.offsetLeft - this.map.top,
    };
  },

  home: function () {
    var position = this.map.getPoiPosition("SHA");
    this.setCenterAndScale(position.x, position.y, Config.WorldMap.maxScale, function () {
      console.log("DONE");
    });
  },

  addCustomButton: function (svgPath, targetCx, targetCy, targetScale) {
    if (!this.toolbar) {
      return;
    }

    this.toolbar.renderCustomButton(svgPath, targetCx, targetCy, targetScale);
  },
};
