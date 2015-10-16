(function ($) {
    var options = {
        legend: {
            statements: [],
            margin: {
                left: 5,
                right: 0,
                top: 0,
                bottom: 0
            },
            style: {
                fontSize: 10,
                spaceWidth: 5,
                badgeSize: 10,
                lineSpacing: 5
            }
        }
    };

    function getLineWidth(options) {
        return options.legend.style.lineSpacing + Math.max(options.legend.style.badgeSize, options.legend.style.fontSize);
    }

    function calculateLegendHeight(options) {
        var lineWidth = getLineWidth(options);

        // Count the number of lines
        var numberOfLines = 0;
        var numberOfStatementsOnNewline = 0;

        $.each(options.legend.statements, function(idx) {
            var statement = options.legend.statements[idx];
            if (statement.value.indexOf("\\n") > -1) {
                numberOfLines++;
                numberOfStatementsOnNewline = 0;
            } else {
                numberOfStatementsOnNewline++;
            }
        });

        if (numberOfStatementsOnNewline > 0) {
            numberOfLines++;
        }

        return numberOfLines * lineWidth + options.legend.margin.top + options.legend.margin.bottom;
    }

    function tokenizeStatement(statement) {

        var hasBadgeToken = false;
        var hasLfToken = false;
        var hasUnitToken = false;

        var state = 0, stack = [], tokens = [];

        for (var i = 0, len = statement.value.length; i < len; i++) {

            // The next index, bounded by the size of the string
            var nexti = Math.min(i+1, len - 1);

            var c = statement.value[i];
            var nextc = statement.value[nexti];

            if (c === '%' && nextc === 'g') {

                if (stack.length > 0) {
                    tokens.push({
                        type: 'text',
                        value: stack.join('')
                    });
                    stack = [];
                }
                tokens.push({
                    type: 'badge'
                });

                hasBadgeToken = true;

                i++;
            } else if (c === '%' && nextc === 's') {

                if (stack.length > 0) {
                    tokens.push({
                        type: 'text',
                        value: stack.join('')
                    });
                    stack = [];
                }
                tokens.push({
                    type: 'unit'
                });

                hasUnitToken = true;

                i++;
            } else if (c === '%' && nextc === '%') {

                stack.push('%');

                i++;
            } else if (c == '\\' && nextc == 'n') {
                if (stack.length > 0) {
                    tokens.push({
                        type: 'text',
                        value: stack.join('')
                    });
                    stack = [];
                }
                tokens.push({
                    type: 'newline'
                });

                i++;
            } else if (statement.value.slice(i).match(/^%(\d*)\.\d+lf/) !== null) {
                var slice = statement.value.slice(i);

                var regex = /^%(\d*)\.(\d+)lf/;

                var match = regex.exec(slice);

                var length = match[1];
                var precision = match[2];

                if (stack.length > 0) {
                    tokens.push({
                        type: 'text',
                        value: stack.join('')
                    });
                    stack = [];
                }

                tokens.push({
                    type: 'lf',
                    length: length !== null ? parseInt(length) : -1,
                    precision: parseInt(precision)
                });

                hasLfToken = true;

                i += match[0].length - 1;
            } else {
                stack.push(c);
            }
        }

        // Always add a space to the end of the statement if there was a badge printed
        if (hasBadgeToken) {
            stack.push(" ");
        }

        // Add a space after the %lf statement if there is no unit
        if (hasLfToken && !hasUnitToken && tokens[tokens.length - 1].type === "lf") {
            stack.push(" ");
        }

        if (stack.length > 0) {
            tokens.push({
                type: 'text',
                value: stack.join('')
            });
        }

       // console.log("'" + statement.value + "'");
       // console.log(JSON.stringify(tokens));

        return tokens;
    }

    function drawText(legendCtx, fontSize, text) {
        var canvasCtx = legendCtx.canvasCtx;

        canvasCtx.fillStyle="black";
        canvasCtx.font = fontSize + "px Monospace";
        canvasCtx.textAlign="left";
        canvasCtx.fillText(text, legendCtx.x, legendCtx.y + fontSize);

        var textSize = canvasCtx.measureText(text);
        legendCtx.x += textSize.width;
    }

    function reduceWithAggregate(aggregation, series) {

        var N = series.data.length, total = 0, y, yMin = NaN, yMax = NaN, last = NaN;

        var getYFromPoint = function(point) {
            if (point.length === 2) {
                return point[1];
            } else if (point.length === 3) {
                return point[1] - point[2];
            } else {
                throw "Unsupported point of length " + point.length;
            }
        };

        if (aggregation === 'MIN') {

            $.each(series.data, function(idx) {
                y = getYFromPoint(series.data[idx]);
                if (isNaN(y)) {
                    return;
                }
                if (isNaN(yMin) || y < yMin) {
                    yMin = y;
                }
            });
            return yMin;

        } else if (aggregation === 'MAX') {

            $.each(series.data, function(idx) {
                y = getYFromPoint(series.data[idx]);
                if (isNaN(y)) {
                    return;
                }
                if (isNaN(yMax)  || y > yMax) {
                    yMax = y;
                }
            });
            return yMax;

        } else if (aggregation === "AVERAGE" || aggregation === "AVG") {

            N = 0;

            $.each(series.data, function(idx) {
                y = getYFromPoint(series.data[idx]);
                if (isNaN(y)) {
                    return;
                }
                total += y;
                N++;
            });

            return N > 0 ? total / N : NaN;

        } else if (aggregation === "LAST") {

            $.each(series.data, function(idx) {
                y = getYFromPoint(series.data[idx]);
                if (!isNaN(y)) {
                    last = y;
                }
            });

            return last;

        } else {
            throw "Unsupported aggregation: " + aggregation;
        }
    }

    function drawStatement(statement, legendCtx, options, allSeries) {

        var canvasCtx = legendCtx.canvasCtx;
        var spaceWidth = options.legend.style.spaceWidth;
        var badgeSize = options.legend.style.badgeSize;
        var fontSize = options.legend.style.fontSize;

        var series = undefined;
        if (statement.metric !== undefined) {
            $.each(allSeries, function(idx) {
                if (allSeries[idx].metric === statement.metric) {
                    series = allSeries[idx];
                }
            });

            $.each(options.hiddenSeries, function(idx) {
                if (options.hiddenSeries[idx].metric === statement.metric) {
                    series = options.hiddenSeries[idx];
                }
            });

            if (series === undefined) {
                throw "No series with metric '" + statement.metric + "' was found.";
            }
        }

        var lastSymbol = "";
        var tokens = tokenizeStatement(statement);
        $.each(tokens, function(idx) {
            var token = tokens[idx];

            if (token.type === 'text') {

                drawText(legendCtx, fontSize, token.value);

            } else if (token.type === 'badge') {

                canvasCtx.fillStyle=series.color;
                canvasCtx.fillRect(legendCtx.x, legendCtx.y, badgeSize, badgeSize);

                canvasCtx.beginPath();
                canvasCtx.lineWidth="0.5";
                canvasCtx.strokeStyle="black";
                canvasCtx.rect(legendCtx.x, legendCtx.y, badgeSize, badgeSize);
                canvasCtx.stroke();

                legendCtx.x += badgeSize;

            } else if (token.type === 'newline') {

                legendCtx.y += getLineWidth(options);
                legendCtx.x = legendCtx.xMin;

            } else if (token.type === 'unit') {

                if (lastSymbol === "") {
                    lastSymbol = " ";
                }

                drawText(legendCtx, fontSize, lastSymbol + " ");

            } else if (token.type === 'lf') {

                var value = reduceWithAggregate(statement.aggregation, series);
                var scaledValue = value;
                lastSymbol = "";

                if (!isNaN(value)) {
                    var prefix = d3.formatPrefix(value, token.precision);
                    lastSymbol = prefix.symbol;
                    scaledValue = prefix.scale(value);
                }

                var format = "";
                if (!isNaN(token.length)) {
                    format += token.length;
                }
                if (!isNaN(token.precision)) {
                    format += "." + token.precision;
                }
                format += "f";

                format = d3.format(format);

                drawText(legendCtx, fontSize, format(scaledValue));

            } else {
                throw "Unsupported token: " + JSON.stringify(token);
            }
        });
    }

    function init(plot) {
        plot.hooks.processOptions.push(function (plot, options) {
            // Don't do anything if there are no statements in the legend
            if (options.legend.statements.length < 1) {
                return;
            }

            // Hide the existing legend
            options.legend.show = false;

            var legendHeight = calculateLegendHeight(options);
            options.grid.margin.bottom += legendHeight;

            plot.hooks.draw.push(function (plot) {
                // Build a context that contains everything we need to draw the statements
                var ctx = {};
                ctx.canvasCtx = plot.getCanvas().getContext('2d');

                // Outer bounds
                ctx.xMin = options.legend.margin.left;
                ctx.yMin = ctx.canvasCtx.canvas.clientHeight - legendHeight + options.legend.margin.top;
                ctx.xMax = ctx.canvasCtx.canvas.clientWidth - options.legend.margin.right;
                ctx.yMax = ctx.canvasCtx.canvas.clientHeight - options.legend.margin.bottom;

                // Initial coordinates
                ctx.x = ctx.xMin;
                ctx.y = ctx.yMin;

                // Draw!
                var allSeries = plot.getData();
                $.each(options.legend.statements, function(idx) {
                    var statement = options.legend.statements[idx];
                    drawStatement(statement, ctx, options, allSeries);
                });

                ctx.canvasCtx.save();
            });
        });
    }

    $.plot.plugins.push({
        init: init,
        options: options,
        name: 'legend',
        version: '1.0.0'
    });
})(jQuery);
