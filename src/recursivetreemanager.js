/**
 * Created by Christophe on 02/06/2016.
 */
(function(factory) {
    var root = (typeof self == 'object' && self.self === self && self) ||
        (typeof global == 'object' && global.global === global && global);

    if (typeof define === 'function' && define.amd) {
        define(["underscore", "dynamicpoint"], function(_, DynamicPoint) {
            return factory(_, DynamicPoint);
        });
    } else {
        root.RecursiveTreeManager = factory(root._, root.DynamicPoint);
    }
})(function(_, DynamicPoint) {

    return function(config) {

        var manager = this;

        var Node = function(nodeData) {
            var t = this;
            this.parent = null;
            this.children = [];

            this.attributes = {};

            this.dynamicAttributes = new DynamicPoint({
                x: 0,
                y: 0
            });


            this.getNodeLeavesNumber = function(originalDepth, depth) {

                if (!depth) depth = 1;
                if (!originalDepth) originalDepth = 1;

                if (this.children.length > 0) {

                    var leavesCount = 0;

                    _.each(this.children, function(child) {
                        leavesCount += child.getNodeLeavesNumber(originalDepth, depth + 1);
                    });

                    //var ponderatedDepth = getPonderatedDepth(depth, options.radiusList, originalDepth);
                    var ponderatedDepth = depth;

                    return leavesCount / ponderatedDepth;

                } else {
                    return 1;
                }
            };


            this.getSetting = function(name) {
                if (this.attributes.settings && this.attributes.settings[name]) {
                    return this.attributes.settings[name];
                } else {
                    return null;
                }
            };


            this.getNodeDivision = function(originalDepth, fromAngle, toAngle) {

                var division = {};
                division.angles = [];

                if (!fromAngle) fromAngle = 0;
                if (!toAngle) toAngle = Math.PI * 2;

                var margin = config.angularMargin;
                var overValue = this.getSetting("angularMargin");

                if (overValue) margin = overValue;

                var fromAngularMargin = this.getSetting("fromAngularMargin");
                fromAngularMargin = null ? 0 : fromAngularMargin;

                var toAngularMargin = this.getSetting("toAngularMargin");
                toAngularMargin = null ? 0 : toAngularMargin;

                if (toAngle > fromAngle) {
                    fromAngle += margin + fromAngularMargin;
                    toAngle -= margin + toAngularMargin;
                } else {
                    fromAngle -= margin + fromAngularMargin;
                    toAngle += margin + toAngularMargin;
                }

                var amplitude = toAngle - fromAngle;

                var nodeLeavesCount = this.getNodeLeavesNumber(originalDepth, 1);

                var currentAngle = fromAngle;

                if (this.children.length > 0) {

                    _.each(this.children, function(child) {

                        var childLeavesCount = child.getNodeLeavesNumber(2, 2);

                        var angle = currentAngle + (childLeavesCount / nodeLeavesCount) * amplitude;
                        var can = (angle + currentAngle) / 2;

                        division.angles.push({
                            node: child,
                            angle: can,
                            amplitude: {from: currentAngle, to: angle}
                        });

                        currentAngle = angle;
                    });
                }

                return division;
            };


            this.recursiveGeneratePositions = function(basePoint, tpoint, angle, stack) {

                var t = this;
                if (!stack) stack = [];

                var radius = config.radiusList[stack.length];

                var overVal = this.getSetting("radius");
                if (overVal) radius = overVal;

                var divPoints = this.generatePositions(angle.from, angle.to, stack);

                stack.push(divPoints);

                if (divPoints.length > 0) {

                    _.each(divPoints, function(divPoint) {
                        divPoint.node.recursiveGeneratePositions(basePoint, divPoint.point, divPoint.angle, _.clone(stack));
                    });
                }
            };


            this.getChildIndex = function(node) {
                return this.children.lastIndexOf(node);
            };


            this.deleteChildReference = function(node) {
                var index = this.getChildIndex(node);

                if (index !== -1) {
                    delete this.children[index];
                }
            };


            this.delete = function() {

                _.each(this.children, function(child) {
                    child.delete();
                });

                if (this.parent) {
                    this.parent.deleteChildReference(this);
                }
            };


            this.swapWithBrother = function(node) {
                this.parent.swapChildren(this, node);
            };


            this.swapChildren = function(node1, node2) {
                var index1 = this.getChildIndex(node1);
                var index2 = this.getChildIndex(node2);

                this.children[index1] = node2;
                this.children[index2] = node1;
            };


            this.createChildNode = function(datas) {
                var node = new Node(datas);
                node.parent = this;
                config.nodeAdded(node);
                config.addedFinished([node], manager);
                return node;
            };


            this.addChildAfter = function(datas) {
                var node = this.createChildNode(datas);
                this.children.push(node);
            };


            this.addChildBefore = function(datas) {
                var node = this.createChildNode(datas);
                //this.children.
            };


            this.generatePositions = function(fromAngle, toAngle, stack) {
                var t = this;

                if (!fromAngle) fromAngle = 0;
                if (!toAngle) toAngle = Math.PI * 2;

                if (!stack) stack = [];

                var circleCenter = {
                    x: this.dynamicAttributes.get("x"),
                    y: this.dynamicAttributes.get("y")
                };

                var overFrom = this.getSetting("fromAngle");
                var overTo = this.getSetting("toAngle");

                fromAngle = overFrom ? overFrom : fromAngle;
                toAngle = overTo ? overTo : toAngle;

                var rotation = this.getSetting("rotation");
                rotation = null ? 0 : rotation;

                fromAngle += rotation;
                toAngle += rotation;

                var div;
                if (fromAngle < toAngle) {
                    div = this.getNodeDivision(stack.length, fromAngle, toAngle);
                } else {
                    div = this.getNodeDivision(stack.length, toAngle, fromAngle - Math.PI * 2);
                }

                var divPoints = [];
                var views = [];
                var circleRadius;

                _.each(div.angles, function(item, i) {

                    circleRadius = config.radiusList[stack.length];
                    var overVal = item.node.getSetting("radius");
                    if (overVal) circleRadius = overVal;

                    var xOffset = item.node.getSetting("xOffset");
                    xOffset = null ? 0 : xOffset;

                    var yOffset = item.node.getSetting("yOffset");
                    yOffset = null ? 0 : yOffset;

                    var xpos = Math.cos(item.angle) * circleRadius + circleCenter.x + xOffset;
                    var ypos = Math.sin(item.angle) * circleRadius + circleCenter.y + yOffset;

                    item.node.dynamicAttributes.set("x", xpos);
                    item.node.dynamicAttributes.set("y", ypos);

                    var from;
                    var to;

                    // TODO : cette logique ne tient pas compte de l'angle avec le tracé d'origine du node
                    // TODO : donc du coup gros fix à faire

                    if (i > 0) {
                        from = div.angles[i - 1].angle;
                    } else {
                        // pas valable dans tous les cas
                        from = div.angles[div.angles.length - 1].angle;
                    }

                    if (i < div.angles.length - 1) {
                        to = div.angles[i + 1].angle;
                    } else {
                        // pas valable dans tous les cas
                        to = div.angles[0].angle;
                    }


                    var angle = {from: from, to: to};

                    divPoints.push({
                        node: item.node,
                        point: {x: xpos, y: ypos},
                        angle: angle
                    });
                });

                return divPoints;
            };


            this.getNodes = function() {
                var nodes = [this];

                if (this.children.length > 0) {
                    _.each(this.children, function(child) {
                        nodes = nodes.concat(child.getNodes());
                    });
                }

                return nodes;
            };


            _.each(nodeData, function(data, key) {
                if (key !== "children") {
                    t.attributes[key] = data;
                }
            });
        };


        this.getNodesList = function() {
            return rootNode.getNodes();
        };


        this.generateTreePositions = function() {
            rootNode.recursiveGeneratePositions({x: 400, y: 300}, {x: 400, y: 300}, {}, []);
        };


        function parseNodes(nodesDatas) {
            var node = new Node(nodesDatas);

            if (nodesDatas.children) {
                _.each(nodesDatas.children, function(child) {
                    var childNode = parseNodes(child);
                    childNode.parent = node;
                    node.children.push(childNode);
                });
            }

            config.nodeAdded(node);

            return node;
        }



        $("#test").on("click", function() {
            rootNode.addChildAfter({
                text: "test",
                id: "id_test"
            });

            //rootNode.recursiveGeneratePositions({x: 400, y: 300}, {x: 400, y: 300}, {}, []);
        });


        // Initialization
        var rootNode = parseNodes(config.datas);
        config.addedFinished(rootNode.getNodes(), this);


        //console.log(rootNode.getNodes());
    }
});