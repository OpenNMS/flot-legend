# flot-legend [![Build Status](https://travis-ci.org/j-white/flot-legend.svg)](https://travis-ci.org/j-white/flot-legend)

rrdgraph style legend support for Flot

![](https://raw.githubusercontent.com/j-white/flot-legend/gh-pages/example.png)

## About

flot-legend can be used to render customizable legends to the chart canvas using syntax similar to rrdgraph's GPRINT.

## Configuration

```javascript
var series = [
    {
        metric: 'main',
        color: '#feeded',
        data: [[0,0,0], [0,0,0], ...]
    }
];

var hiddenSeries = [
    {
        metric: 'other',
        data: [[0,0,0], [0,0,0], ...]
    }
];

var options = {
    legend: {
        statements: [
            {
                metric: 'main',
                value: '%g nominal Watts'
            },
            {
                metric: 'main',
                aggregation: 'AVERAGE',
                value: 'Avg: %8.2lf %s'
            },
            {
                metric: 'main',
                aggregation: 'MIN',
                value: 'Min: %8.2lf %s'
            },
            {
                metric: 'main',
                aggregation: 'MAX',
                value: 'Max: %8.2lf %s\n'
            },
            {
                metric: 'other',
                aggregation: 'AVERAGE',
                value: 'Other - Avg: %8.2lf %s\n'
            },
        ]
    },
    hiddenSeries: hiddenSeries
};

$.plot('#placeholder', series, options);
```
