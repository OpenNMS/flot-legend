CanvasLegend.prototype = {};
CanvasLegend.prototype.constructor = CanvasLegend;
function CanvasLegend(plot, opts) {

    this.plot = plot;
    this.opts = opts;
    this.badgeSize = this.opts.legend.style.badgeSize;
    this.badgeMarginRight = this.opts.legend.style.badgeMarginRight;
    this.fontSize = this.opts.legend.style.fontSize;
    this.lineHeight = this.getLineHeight();
}
CanvasLegend.prototype.getLineHeight = function() {

    return this.opts.legend.style.lineSpacing + Math.max(this.opts.legend.style.badgeSize, this.opts.legend.style.fontSize);
};
CanvasLegend.prototype.getLegendHeight = function() {

    // Count the number of lines
    var numberOfLines = 0;
    var numberOfStatementsOnNewline = 0;

    var self = this;
    $.each(this.opts.legend.statements, function(idx) {
        var statement = self.opts.legend.statements[idx];
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

    return numberOfLines * this.lineHeight + options.legend.margin.top + options.legend.margin.bottom;
};
CanvasLegend.prototype.beforeDraw = function() {

    this.ctx = this.plot.getCanvas().getContext('2d');

    // Outer bounds
    this.xMin = this.opts.legend.margin.left;
    this.yMin = this.ctx.canvas.clientHeight - this.getLegendHeight() + this.opts.legend.margin.top;
    //this.xMax = ctx.canvasCtx.canvas.clientWidth - this.opts.legend.margin.right;
    //this.yMax = ctx.canvasCtx.canvas.clientHeight - this.opts.legend.margin.bottom;

    // Initial coordinates
    this.x = this.xMin;
    this.y = this.yMin;
};
CanvasLegend.prototype.drawText = function(text) {

    this.ctx.fillStyle = "black";
    this.ctx.font = this.fontSize + "px Monospace";
    this.ctx.textAlign = "left";
    this.ctx.fillText(text, this.x, this.y + this.fontSize);

    var textSize = this.ctx.measureText(text);
    this.x += textSize.width;
};
CanvasLegend.prototype.drawBadge = function(color) {

    this.ctx.fillStyle = color;
    this.ctx.fillRect(this.x, this.y, this.badgeSize, this.badgeSize);

    this.ctx.beginPath();
    this.ctx.lineHeight = "0.5";
    this.ctx.strokeStyle = "black";
    this.ctx.rect(this.x, this.y, this.badgeSize, this.badgeSize);
    this.ctx.stroke();

    this.x += this.badgeSize + this.badgeMarginRight;
};
CanvasLegend.prototype.drawNewline = function() {

    this.y = this.lineHeight + this.y;
    this.x = this.xMin;
};
CanvasLegend.prototype.afterDraw = function() {

    this.ctx.save();
};
