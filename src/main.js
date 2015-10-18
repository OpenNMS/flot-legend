"use strict";

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
            badgeSize: 10,
            lineSpacing: 5
        }
    }
};

var TOKENS = Object.freeze({
    'Badge': 'badge',
    'Text': 'text',
    'Unit': 'unit',
    'Lf': 'lf',
    'Newline': 'newline'
});

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

function tokenizeStatement(value) {

    var stack = [], tokens = [], types = {}, lfRegex = /^%(\d*)(\.(\d+))?lf/;

    var accountForTokenType = function(type) {
        if (types.hasOwnProperty(type)) {
            types[type] += 1;
        } else {
            types[type] = 1;
        }
    };

    var numTokensWithType = function(type) {
        return types.hasOwnProperty(type) ? types[type] : 0;
    };

    var pushToken = function(token) {
        if (stack.length > 0) {
            tokens.push({
                type: TOKENS.Text,
                value: stack.join('')
            });
            stack = [];
            accountForTokenType(TOKENS.Text);
        }

        if (token !== undefined) {
            tokens.push(token);
            accountForTokenType(token.type);
        }
    };

    for (var i = 0, len = value.length; i < len; i++) {

        var c = value[i];
        // Grab the next character, bounded by the size of the string
        var nextc = value[Math.min(i+1, len - 1)];
        var match;

        if (c === '%' && nextc === 'g') {

            pushToken({
                type: TOKENS.Badge
            });

            i++;
        } else if (c === '%' && nextc === 's') {

            pushToken({
                type: TOKENS.Unit
            });

            i++;
        } else if (c === '%' && nextc === '%') {

            stack.push('%');

            i++;
        } else if (c == '\\' && nextc == 'n') {

            pushToken({
                type: TOKENS.Newline
            });

            i++;
        } else if ( (match = lfRegex.exec(value.slice(i))) !== null) {
            var length = NaN;
            try {
                length = parseInt(match[1]);
            } catch(err) {
                // pass
            }
            var precision = NaN;
            try {
                precision = parseInt(match[3]);
            } catch(err) {
                // pass
            }

            pushToken({
                type: TOKENS.Lf,
                length: isNaN(length) ? null : length,
                precision: isNaN(precision) ? null : precision
            });

            i += match[0].length - 1;
        } else {
            stack.push(c);
        }
    }

    // Always add a space to the end of the statement if there was a badge printed
    if (numTokensWithType(TOKENS.Badge) > 0) {
        stack.push(" ");
    }

    // Add a space after the %lf statement if there is no unit
    if (numTokensWithType(TOKENS.Lf) > 0 && numTokensWithType(TOKENS.Unit) === 0 && tokens[tokens.length - 1].type === TOKENS.Lf) {
        stack.push(" ");
    }

    // Convert any remaining characters on the stack to a text token
    pushToken();

    return tokens;
}

function reduceWithAggregate(data, aggregation) {

    var i, N = data.length, total = 0, y, yMin = NaN, yMax = NaN;

    var getYFromPoint = function(point) {
        if (point === null) {
            return NaN;
        } else if (point.length === 2) {
            return point[1];
        } else if (point.length === 3) {
            return point[1] - point[2];
        } else {
            throw "Unsupported point of length " + point.length;
        }
    };

    if (aggregation === 'MIN') {

        $.each(data, function(idx) {
            y = getYFromPoint(data[idx]);
            if (isNaN(y)) {
                return;
            }
            if (isNaN(yMin) || y < yMin) {
                yMin = y;
            }
        });
        return yMin;

    } else if (aggregation === 'MAX') {

        $.each(data, function(idx) {
            y = getYFromPoint(data[idx]);
            if (isNaN(y)) {
                return;
            }
            if (isNaN(yMax)  || y > yMax) {
                yMax = y;
            }
        });
        return yMax;

    } else if (aggregation === 'AVERAGE' || aggregation === 'AVG') {

        N = 0;

        $.each(data, function(idx) {
            y = getYFromPoint(data[idx]);
            if (isNaN(y)) {
                return;
            }
            total += y;
            N++;
        });

        return N > 0 ? total / N : NaN;

    } else if (aggregation === 'LAST') {

        for(i = N-1; i >= 0; i--) {
            y = getYFromPoint(data[i]);
            if (!isNaN(y)) {
                return y;
            }
        }

        return NaN;

    } else {
        throw "Unsupported aggregation: " + aggregation;
    }
}

function drawStatement(statement, legendCtx, options, allSeries) {

    var canvasCtx = legendCtx.canvasCtx;
    var badgeSize = options.legend.style.badgeSize;
    var fontSize = options.legend.style.fontSize;

    var series = undefined;
    if (statement.metric !== undefined) {
        $.each(allSeries, function(idx) {
            if (allSeries[idx].metric === statement.metric) {
                series = allSeries[idx];
            }
        });

        if (options.hiddenSeries !== undefined) {
            $.each(options.hiddenSeries, function(idx) {
                if (options.hiddenSeries[idx].metric === statement.metric) {
                    series = options.hiddenSeries[idx];
                }
            });
        }

        if (series === undefined) {
            throw "No series with metric '" + statement.metric + "' was found.";
        }
    }

    var lastSymbol = "";
    var tokens = tokenizeStatement(statement.value);
    $.each(tokens, function(idx) {
        var token = tokens[idx];

        if (token.type === TOKENS.Text) {

            drawText(legendCtx, fontSize, token.value);

        } else if (token.type === TOKENS.Badge) {

            canvasCtx.fillStyle=series.color;
            canvasCtx.fillRect(legendCtx.x, legendCtx.y, badgeSize, badgeSize);

            canvasCtx.beginPath();
            canvasCtx.lineWidth="0.5";
            canvasCtx.strokeStyle="black";
            canvasCtx.rect(legendCtx.x, legendCtx.y, badgeSize, badgeSize);
            canvasCtx.stroke();

            legendCtx.x += badgeSize;

        } else if (token.type === TOKENS.Newline) {

            legendCtx.y += getLineWidth(options);
            legendCtx.x = legendCtx.xMin;

        } else if (token.type === TOKENS.Unit) {

            if (lastSymbol === "") {
                lastSymbol = " ";
            }

            drawText(legendCtx, fontSize, lastSymbol + " ");

        } else if (token.type === TOKENS.Lf) {

            var value = reduceWithAggregate(series.data, statement.aggregation);
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

function drawText(legendCtx, fontSize, text) {
    var canvasCtx = legendCtx.canvasCtx;

    canvasCtx.fillStyle="black";
    canvasCtx.font = fontSize + "px Monospace";
    canvasCtx.textAlign="left";
    canvasCtx.fillText(text, legendCtx.x, legendCtx.y + fontSize);

    var textSize = canvasCtx.measureText(text);
    legendCtx.x += textSize.width;
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