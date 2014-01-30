# Baredom

_A fast, recycling scrollable list library with no dependencies._

## Usage

### Initialization

As easy as: `baredom.createList(options)`

### Options

- `el`: the element you want to use as the scrollable list container
- `collection`: array of data objects to be represented in the list
- `subviewHeight`: the height of the list cells
- `subviewOverscroll`: the amount of list cells to prerender
- `createSubview`: a `function (div)` which creates a list cell in the given `div` element
- `renderSubview`: a `function (i, div)` which fills the given `div` element with the data at index `i`