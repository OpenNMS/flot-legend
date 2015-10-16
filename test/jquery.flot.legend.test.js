
describe('jquery.flot.legend', function () {

    var legendPlugin = null;

    // Find our plugin in the list of registered plugins
    $.each($.plot.plugins, function(idx) {
        var plugin = $.plot.plugins[idx];
        if (plugin.name === 'legend') {
            legendPlugin = plugin;
        }
    });

    it('should be registered', function() {
        expect(legendPlugin).not.toBe(null);
    });

    it('should hook into the plot', function() {
        var plot = {};
        plot.hooks = {};
        plot.hooks.processOptions = [];

        legendPlugin.init(plot);

        expect(plot.hooks.processOptions.length).toBe(1);
    });
});
