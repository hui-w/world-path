/** 
 * @author Wang, Hui (huiwang@qlike.com) 
 * @repo https://github.com/hui-w/world-path/
 * @licence MIT
 */

function Map() {
    this.frame = null;
    this.parent = null;
    //size of the map
    this.width = 1000;
    this.height = 400;
    this.scale = 1;
    this.left = 0;
    this.top = 0;
    this.svg = null;
    this.mapGroup = null;
    this.extraGroup = null;

    /* Events */
    this.onScaleChanged = null;
    this.onPositionChanged = null;
};

Map.prototype = {
    renderInto: function(parent, renderComplete) {
        var that = this;
        this.parent = parent;
        this.svg = this.parent.createChildNS("svg", {
            "id": "svg",
            "width": this.width,
            "height": this.height
        });
        /*
        this.svg.addEventListener("click", function(e) {
            var x = (e.pageX - that.left) / that.scale;
            var y = (e.pageY - that.top) / that.scale;
            console.log({
                x: x,
                y: y,
                scale: that.scale
            });
        }, false);
*/
        this.mapGroup = this.svg.createChildNS("g");
        this.extraGroup = this.svg.createChildNS("g");

        //render countries
        this.renderCountries(this.mapGroup);

        //render routes
        this.renderFlightsAndRoutes(this.mapGroup);

        //render pois
        this.renderPois(this.mapGroup);

        //update the transform
        //this.updateTransform();

        if (typeof renderComplete == "function") {
            renderComplete();
        }
    }, //end of renderInto

    resize: function(width, height) {
        this.svg.style.width = width + "px";
        this.svg.style.height = height + "px";
        this.svg.attr("width", width);
        this.svg.attr("height", height);
    },

    getExtraGroup: function() {
        return this.extraGroup;
    },

    updateTransform: function() {
        this.mapGroup.attr({
            "transform": Util.format_str("translate({left}, {top}) scale({scale}, {scale})", {
                "left": this.left,
                "top": this.top,
                "scale": this.scale
            })
        });

        //Countries: stroke width always equals 1px
        var pathes = this.mapGroup.querySelectorAll("path.country");
        for (var i = 0; i < pathes.length; i++) {
            pathes[i].attr("stroke-width", 1 / this.scale);
        }

        //Border
        var border = this.mapGroup.querySelector("path.border");
        border.attr("stroke-width", 1 / this.scale);
        border.attr("stroke-dasharray", Util.format_str("{size},{size}", {
            size: 5 / this.scale
        }));

        //Circle and labels 
        var circles = this.mapGroup.querySelectorAll("circle.poi-circle");
        for (var i = 0; i < circles.length; i++) {
            var r = 1 / this.scale * 4;
            if (this.scale < 1) {
                r /= 2;
            }
            circles[i].attr("r", r);
        }

        var labels = this.mapGroup.querySelectorAll("text.poi-label");
        for (var i = 0; i < labels.length; i++) {
            var label = labels[i];
            var labelLevel = label.attr("data-level");
            if (Util.isNull(labelLevel)) {
                labelLevel = 0;
            }
            if (this.scale >= labelLevel) {
                //show labels
                if (label.getStyle("display") == "none") {
                    label.updateStyle("display", "");
                }
                //set the label size
                var fontSize = 1 / this.scale * 12;
                label.attr("font-size", fontSize);
            } else {
                //hide labels
                if (label.getStyle("display") != "none") {
                    label.updateStyle("display", "none");
                }
            }
        }

        //Routes: stroke width always equals 1px
        var routes = this.mapGroup.querySelectorAll("path.route, path.flight");
        for (var i = 0; i < routes.length; i++) {
            routes[i].attr("stroke-width", 1 / this.scale);
            if (routes[i].attr("stroke-dasharray") != null) {
                routes[i].attr("stroke-dasharray", "{0},{0}".format(2 / this.scale));
            }
        }
    }, //end of updateTransform

    renderCountries: function(g) {
        for (var country in worldmap.shapes) {
            var path = g.createChildNS("path", {
                "d": worldmap.shapes[country],
                "stroke": "#333333",
                "fill": "#f0efeb",
                "stroke-opacity": 0.6,
                "stroke-width": 1,
                "class": "country"
            });
            /*
            path.addEventListener("mouseover", function() {
                this.attr("fill", "#fefefe");
            }, false);
            path.addEventListener("mouseout", function() {
                this.attr("fill", "#f0efeb");
            }, false);
*/
        }

        //Ghost countries
        this.renderGhostCountry(this.mapGroup, "US", this.width);
        this.renderGhostCountry(this.mapGroup, "CA", this.width);
        this.renderGhostCountry(this.mapGroup, "CN", -this.width);
        this.renderGhostCountry(this.mapGroup, "TW", -this.width);

        //render the border
        g.createChildNS("path", {
            "d": Util.format_str("M0,0 H{width} V{height} H0 Z", {
                width: this.width,
                height: this.height
            }),
            "stroke": "#000000",
            "fill": "none",
            "stroke-width": 1,
            "stroke-opacity": 0.2,
            "stroke-dasharray": "5,5",
            "class": "border"
        });
    },

    renderGhostCountry: function(g, key, offsetLeft) {
        var that = this;
        var path = g.createChildNS("path", {
            "d": worldmap.shapes[key],
            "stroke": "RGBA(127,127,127, 0.4)",
            "fill": "RGBA(255,255,255,0.1)",
            "stroke-opacity": 0.6,
            "stroke-width": 1,
            //"stroke-dasharray": "4,1",
            "class": "country",
            "transform": Util.format_str("translate({left},0)", {
                left: offsetLeft
            })
        });

        var goToReality = function() {
            that.frame.moveMapTo(that.left + (offsetLeft * that.scale), that.top, null);
        };

        path.addEventListener("mousedown", function() {
            goToReality();
        }, false);
        path.addEventListener("touchstart", function() {
            goToReality();
        }, false);
    },

    renderPois: function(g) {
        var that = this;
        mapdata.pois.forEach(function(item) {
            that.renderPoi(g, item, 0);

            //POI ghosts
            //if (item[Consts.CountryIndex] == "US" || item[Consts.CountryIndex] == "CA") {
            //    that.renderPoi(g, item, that.width);
            //}
            if (item[Consts.KeyIndex] == "ORD" || item[Consts.KeyIndex] == "LAX" || item[Consts.KeyIndex] == "SFO" || item[Consts.KeyIndex] == "YVR") {
                that.renderPoi(g, item, that.width);
            }
            if (item[Consts.KeyIndex] == "SHA") {
                that.renderPoi(g, item, -that.width);
            }
        });
    },

    renderPoi: function(g, item, offsetLeft) {
        var label = item[Consts.LabelIndex];
        var latLon = item[Consts.LatLonIndex];
        var level = item[Consts.LevelIndex];
        var attr = this.parseLatLon(latLon);
        var x = attr.x;
        var y = attr.y;
        if (offsetLeft != null && offsetLeft != 0) {
            x += offsetLeft;
        }
        var dot = g.createChildNS("circle", {
            "cx": x,
            "cy": y,
            "r": 0,
            "fill": "#E66C0F",
            "stroke": "none",
            "class": "poi-circle"
        });

        var lbl = g.createChildNS("text", {
            "x": x,
            "y": y,
            "fill": "#000000",
            "stroke": "none",
            "font-size": 1 / this.scale * 12,
            "class": "poi-label",
            "style": "display: none",
            "data-level": level
        }, label);
    },

    /**
     *
     * @param pos 1 or -1, if 1, the result point will display on the left of vector from p1 to p2, or right
     */
    getControlPoint: function(p1, p2, r, pos) {
        // middle point
        var p0 = {
            x: (p1.x + p2.x) / 2,
            y: (p1.y + p2.y) / 2
        };

        var dtm = Math.sqrt(Math.pow(p1.x - p0.x, 2) + Math.pow(p1.y - p0.y, 2));
        r *= dtm;
        var res1 = {
            x: (p1.y - p0.y) * r / dtm + p0.x,
            y: (p0.x - p1.x) * r / dtm + p0.y
        };
        var res2 = {
            x: (p0.y - p1.y) * r / dtm + p0.x,
            y: (p1.x - p0.x) * r / dtm + p0.y
        };

        // validate
        var v = Math.atan2(res1.y - p0.y, res1.x - p0.x) * pos;
        return v > 0 ? res1 : res2;
    },

    /* direction: -1, 0 (both), 1 */
    drawFlightLine: function(g, ptFrom, ptTo, direction) {
        if (direction == 0) {
            this.drawFlightLine(g, ptFrom, ptTo, -1);
            this.drawFlightLine(g, ptFrom, ptTo, 1);
        } else {
            var controller = this.getControlPoint(ptFrom, ptTo, 0.6, direction);
            g.createChildNS("path", {
                "d": Util.format_str("M{from.x},{from.y} Q{control.x},{control.y} {to.x},{to.y}", {
                    from: {
                        x: ptFrom.x,
                        y: ptFrom.y
                    },
                    control: {
                        x: controller.x,
                        y: controller.y
                    },
                    to: {
                        x: ptTo.x,
                        y: ptTo.y
                    }
                }),
                "fill": "none",
                "stroke": Config.colors[Config.colorIndex % Config.colors.length],
                "stroke-width": 1,
                "class": "flight"
            });
        }
    },

    renderFlight: function(g, fromKey, toKey, useVirtualPoint, direction) {
        var ptFrom = this.getPoiPosition(fromKey);
        var ptTo = this.getPoiPosition(toKey);
        var stroke = "#0099cc";

        if (useVirtualPoint) {
            var vPtFrom = {
                x: ptFrom.x > ptTo.x ? ptFrom.x - this.width : this.width + ptFrom.x,
                y: ptFrom.y
            };
            var vPtTo = {
                x: ptFrom.x > ptTo.x ? this.width + ptTo.x : ptTo.x - this.width,
                y: ptTo.y
            };
            this.drawFlightLine(g, ptFrom, vPtTo, direction);
            this.drawFlightLine(g, vPtFrom, ptTo, direction);
        } else {
            this.drawFlightLine(g, ptFrom, ptTo, direction);
        }
    },

    renderRouteGroup: function(g, drivingGroup) {
        var that = this;
        var d = "";
        drivingGroup.forEach(function(drivingInfo) {
            var pt = null;

            //get the point
            if (drivingInfo.indexOf(",") > 0) {
                //lat and lon value
                pt = that.parseLatLon(drivingInfo);
            } else {
                //city key
                pt = that.getPoiPosition(drivingInfo);
            }

            //append the path string
            if (d.length > 0) {
                //line to
                d += " L{0},{1}".format(pt.x, pt.y);
            } else {
                //first point
                d += "M{0},{1}".format(pt.x, pt.y);
            }
        });

        g.createChildNS("path", {
            "d": d,
            "fill": "none",
            "stroke": "#ff0000",
            "stroke-width": 1,
            "stroke-dasharray": "2,2",
            "class": "route"
        });
    },

    renderFlightsAndRoutes: function(g) {
        var that = this;
        mapdata.flights.forEach(function(flightGroup) {
            //each route group
            flightGroup.forEach(function(flightInfo) {
                var from = flightInfo[0];
                var to = flightInfo[1];
                var crossPacafic = flightInfo[2];
                var direction = flightInfo[3];
                that.renderFlight(g, from, to, crossPacafic, direction);
            });

            //next color
            mapdata.colorIndex++;
        });

        mapdata.routes.forEach(function(drivingGroup) {
            //each route group
            that.renderRouteGroup(g, drivingGroup);
        });
        return;
    },

    zoom: function(scaleRatio, point) {
        if ((this.scale < Config.Map.minScale && scaleRatio < 1) ||
            (this.scale > Config.Map.maxScale && scaleRatio > 1)) {
            //maximum zoom reached
            return false;
        }

        //align to the current point
        var dx = 0,
            dy = 0;
        dx = point.x * (1 - scaleRatio);
        dy = point.y * (1 - scaleRatio);
        this.scale *= scaleRatio;

        if (!this.move(dx, dy)) {
            //updateTransform() will be triggerred in move() 
            //In case map is zoomed at [x:0, y:0] of SVG, no position changing will be applied,
            //then trigger the transform update manully
            this.updateTransform();
        }

        if (typeof this.onScaleChanged == "function") {
            this.onScaleChanged();
        }

        //console.log("scale - ", this.scale.toFixed(2));

        return true;
    }, //end of zoom

    zoomTo: function(scale, point) {
        return this.zoom(scale / this.scale, point);
    },

    move: function(dx, dy) {
        if (dx == 0 && dy == 0) {
            return false;
        }

        this.moveTo(this.left + dx, this.top + dy, null);
        return true;
    },

    moveTo: function(x, y) {
        /*
        moveTo: function(x, y, callback) {
           var that = this;
           if (animation) {
               var steps = Config.Map.moveDuration / Config.Map.moveTimerDelay;
               var speedX = (x - this.left) / steps;
               var speedY = (y - this.top) / steps;
               var moveStep = function() {
                   var dx = (Math.abs(x - that.left) <= Math.abs(speedX)) ? x - that.left : speedX;
                   var dy = (Math.abs(y - that.top) <= Math.abs(speedY)) ? y - that.top : speedY;
                   that.move(dx, dy);

                   if (that.left != x || that.top != y) {
                       setTimeout(moveStep, Config.Map.moveTimerDelay);
                   } else {
                       if (typeof callback == "function") {
                           callback();
                       }
                   }};

               moveStep();
               return;
           }
           */

        this.left = x;
        this.top = y;
        this.updateTransform();

        if (typeof this.onPositionChanged == "function") {
            this.onPositionChanged();
        }
    },

    showFlights: function(show) {
        var pathes = this.mapGroup.querySelectorAll("path.flight");
        for (var i = 0; i < pathes.length; i++) {
            pathes[i].updateStyle("display", show ? null : "none");
        }
    },

    showRoutes: function(show) {
        var pathes = this.mapGroup.querySelectorAll("path.route");
        for (var i = 0; i < pathes.length; i++) {
            pathes[i].updateStyle("display", show ? null : "none");
        }
    },

    getPoi: function(key) {
        for (var i = 0; i < mapdata.pois.length; i++) {
            if (mapdata.pois[i][Consts.KeyIndex] == key) {
                return mapdata.pois[i];
            }
        }
        return null;
    },

    getPoiPosition: function(key) {
        var poi = this.getPoi(key);
        if (poi != null) {
            return this.parseLatLon(poi[Consts.LatLonIndex]);
        } else {
            return {
                x: 0,
                y: 0
            };
        }
    },

    getXY: function(lat, lon) {
        return {
            x: lon * 2.6938 + 465.4,
            y: lat * -2.6938 + 227.066
        };
    },

    getLatLon: function(x, y) {
        return {
            lat: (y - 227.066) / -2.6938,
            lon: (x - 465.4) / 2.6938
        };
    },

    parseLatLon: function(latlon) {
        var latlonrg = /(\d+(?:\.\d+)?)[\xb0\s]?\s*(?:(\d+(?:\.\d+)?)['\u2019\u2032\s])?\s*(?:(\d+(?:\.\d+)?)["\u201d\u2033\s])?\s*([SNEW])?/i;
        var m = String(latlon).split(latlonrg),
            lat = m && +m[1] + (m[2] || 0) / 60 + (m[3] || 0) / 3600;
        if (m[4].toUpperCase() == "S") {
            lat = -lat;
        }
        var lon = m && +m[6] + (m[7] || 0) / 60 + (m[8] || 0) / 3600;
        if (m[9].toUpperCase() == "W") {
            lon = -lon;
        }
        return this.getXY(lat, lon);
    },

    getScreenCeterPointOnMap: function() {
        console.log(this.parent.width)
    }
};
