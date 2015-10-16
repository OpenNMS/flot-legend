# flot-legend [![Build Status](https://travis-ci.org/j-white/flot-legend.svg)](https://travis-ci.org/j-white/flot-legend)

rrdgraph style legend support for Flot

## Motivation

Leverage the existing legend and GPRINT syntax used by rrdgraph to render customizable legends.

```
 LINE2:main#438219:"nominal Watts" \
 GPRINT:main:AVERAGE:" Avg\\: %8.2lf %s" \
 GPRINT:main:MIN:"Min\\: %8.2lf %s" \
 GPRINT:main:MAX:"Max\\: %8.2lf %s\\n" \
 LINE2:consumed#ff0000:"used Watts    " \
 GPRINT:consumed:AVERAGE:"Avg\\: %8.2lf %s" \
 GPRINT:consumed:MIN:"Min\\: %8.2lf %s" \
 GPRINT:consumed:MAX:"Max\\: %8.2lf %s\\n"
```

## Configuration

```
series = [
  {
    id: 'main',
    color: '#feeded',
    data: [[0,0,0], [0,0,0] ...]
  }
]

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
    }
  ]
}
```
