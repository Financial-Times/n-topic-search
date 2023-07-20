# n-topic-search

Search for topics and equities based on a keyword

## Usage

```js
const topicSearch = require('n-topic-search');

new topicSearch(containerEl)
```

- containerEl:  element containing the search input and element to put suggestions in

### Markup

```
<form data-typeahead data-typeahead-categories="concepts,equities" data-typeahead-view-all>
	<input data-typeahead-input>
	<button type="submit">
		Search
	</button>
</form>

```

#### data attribute options
- categories: which categories of results to return
- view-all: whether to include 'view all' links

### Experimental
The constructor also accepts a second parameter'

- listComponent a function implementing the following interface

	parameters
	- element
	- opts {
			categories: this.categories,
			itemTag: this.itemTag,
			includeViewAllLink: this.includeViewAllLink,
			searchEl: this.searchEl
		}

		returns an object implementing the following methods

		setState

		handleSelection


test