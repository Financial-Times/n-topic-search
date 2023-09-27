import Delegate from 'ftdomdelegate';
import { debounce } from 'n-ui-foundations';
import suggestionList from './src/renderers/search-suggestions';

let defaultHostName = 'www.ft.com';

// Check if developing locally, if we are then proxy the search api through
// the demo application.
const hostname = window.location.hostname;
if (hostname === 'localhost' || hostname === 'local.ft.com') {
	defaultHostName = window.location.host;
}

function getNonMatcher (container) {
	if (typeof container === 'string') {
		return function (el) {
			return el && el !== document && !el.matches(container);
		};
	}

	return function (el) {
		return el && el !== document && el !== container;
	};
}

function isOutside (el, container) {
	const doesntMatch = getNonMatcher(container);

	while (doesntMatch(el)) {
		el = el.parentNode;
	}

	return !el || el === document;
}

class TopicSearch {
	constructor (containerEl, {
		listComponent = suggestionList,
		preSuggest = a => a,
		hostName = defaultHostName,
		errorCallback = null,
	} = {}) {
		this.container = containerEl;
		this.listComponent = listComponent;
		this.preSuggest = preSuggest;
		this.searchEl = this.container.querySelector('[data-n-topic-search-input]');
		this.dataSrc = `//${hostName}/search-api/suggestions?partial=`;
		this.categories = (this.container.getAttribute('data-n-topic-search-categories') || 'tags').split(',');
		this.itemTag = this.container.getAttribute('data-n-topic-search-item-tag') || 'a';
		this.includeViewAllLink = this.container.hasAttribute('data-n-topic-search-view-all');
		this.minLength = 2;
		this.errorCallback = errorCallback;
		this.init();
	}

	init () {
		this.suggestions = [];
		this.suggestionListContainer = document.createElement('div');
		this.searchEl.parentNode.insertBefore(this.suggestionListContainer, this.searchEl.nextSibling);

		this.suggestionsView = this.listComponent(this.suggestionListContainer, {
			categories: this.categories,
			itemTag: this.itemTag,
			includeViewAllLink: this.includeViewAllLink,
			searchEl: this.searchEl
		});
		this.searchTermHistory = [];

		this.bodyDelegate = new Delegate(document.body);
		this.onType = debounce(this.onType, 150).bind(this);
		this.onFocus = this.onFocus.bind(this);

		// prevent scrolling when pressing up and down arrows
		this.searchEl.addEventListener('keydown', ev => {
			if (ev.which === 40 || ev.which === 38) {
				ev.preventDefault();
			}
		});

		this.searchEl.addEventListener('keyup', ev => {
			switch(ev.which) {
				case 13 : return; // enter
				case 9 : return; // tab
				case 27: //esc
					this.hide();
					break;
				case 40 :
					this.onDownArrow(ev);
					break;
			}
		});

		this.searchEl.addEventListener('input', this.onType);
		this.searchEl.addEventListener('focus', this.onFocus);
		this.searchEl.addEventListener('click', this.onFocus);

		// prevent scrolling when pressing up and down arrows
		this.suggestionListContainer.addEventListener('keydown', ev => {
			if (ev.which === 40 || ev.which === 38) {
				ev.preventDefault();
			}
		});

		this.suggestionListContainer.addEventListener('keyup', ev => {
			switch(ev.which) {
				case 27 : // esc
					this.hideAndFocusInput();
					break;
				case 13 :
					this.onSelect(ev);
					break;
				case 9 : return; // tab
				case 40 :
					this.onDownArrow(ev);
					break;
				case 38 :
					this.onUpArrow(ev);
					break;
				default :
					break;
			}
		});

		this.suggestionListContainer.addEventListener('click', ev => this.onSelect(ev));

	}

	// EVENT HANDLERS
	onType () {
		this.searchTerm = this.searchEl.value.trim();
		this.searchTermHistory.push(this.searchTerm);
		this.getSuggestions(this.searchTerm);
		[].forEach.call(this.suggestionListContainer.querySelectorAll('li'), function (el) {
			el.setAttribute('data-trackable-meta', '{"search-term":"' + this.searchTerm + '"}');
		}.bind(this));
	}

	onFocus (ev) {
		// select all of the current text
		ev.target.setSelectionRange ? ev.target.setSelectionRange(0, ev.target.value.length) : ev.target.select();

		// If the input is programmatically focussed we may not want to show the suggestions list
		// e.g. when intentionally closing the suggestions list.
		if (this.preventShowOnFocus) {
			this.preventShowOnFocus = false;
		} else {
			this.show();
		}
	}

	onDownArrow (ev) {
		if (this.suggestionTargets.length) {
			const position = (this.suggestionTargets.indexOf(ev.target) + 1) % this.suggestionTargets.length;
			this.suggestionTargets[position].focus();
		}
		ev.preventDefault(); //disable page scrolling
	}

	onTab (ev) {
		if (this.suggestionTargets.length) {
			this.onDownArrow(ev); // functionally the same as hitting the down arrow.
		}
	}

	onSelect (ev) {
		let target = ev.target;
		while (!target.classList.contains('n-topic-search__target')) {
			target = target.parentNode;
			if (target.classList.contains('n-topic-search')) {
				// click was not on an item
				return;
			}
		}
		this.suggestionsView.handleSelection(target, ev, this);
	}

	onUpArrow (ev) {
		if (this.suggestionTargets.length) {
			const oldPosition = this.suggestionTargets.indexOf(ev.target);
			if (oldPosition === 0) {
				this.searchEl.focus();
			} else {
				this.suggestionTargets[(oldPosition - 1) % this.suggestionTargets.length].focus();
			}
		}
		ev.preventDefault(); //disable page scrolling
	}

	// INTERNALS
	getSuggestions (value) {
		if (value.length >= this.minLength) {
			fetch(this.dataSrc + encodeURIComponent(value))
				.then((response) => {
					if (!response.ok) {
						throw new Error(response.statusText);
					}
					return response.json();
				})
				.then(suggestions => this.suggest(this.preSuggest(suggestions)))
				.catch((err) => {
					this.errorCallback && this.errorCallback(err);
					setTimeout(() => {
						throw err;
					});
				});
		} else {
			this.unsuggest();
		}
	}

	isTimelyResponse (term) {
		// handle race conditions between e.g. TRU returning slower than TRUMP
		const index = this.searchTermHistory.indexOf(term);
		if (index > -1) {
			this.searchTermHistory = this.searchTermHistory.slice(index);
			return true;
		}
		return false;
	}

	suggest (suggestions) {

		if (!suggestions.query || !this.isTimelyResponse(suggestions.query.partial)) {
			return;
		}
		this.suggestions = suggestions;
		this.suggestionsView.setState({
			searchTerm: this.searchTerm,
			suggestions: this.suggestions
		});
		this.show();
		this.suggestionTargets = Array.from(this.suggestionListContainer.querySelectorAll('.n-topic-search__target'));
	}

	unsuggest () {
		this.hide();
	}

	hide () {
		this.suggestionListContainer.setAttribute('hidden', '');
		this.bodyDelegate.off();
	}

	hideAndFocusInput () {
		// This flag is used to prevent .show() being called after shifting focus back to
		// the input element when intending to .hide() the suggestions list.
		this.preventShowOnFocus = true;
		this.hide();
		this.searchEl.focus();
	}

	reset () {
		this.hide();
		this.suggestions = [];
		this.suggestionTargets = [];
		this.suggestionsView.setState({
			suggestions: {
				tags: [],
				equities: []
			},
			searchTerm: ''
		});
		this.searchTermHistory = [];
		this.searchTerm = '';
		this.searchEl.value = '';
	}

	show () {
		this.suggestionListContainer.removeAttribute('hidden');
		['focus', 'touchstart', 'mousedown']
			.forEach(type => {
				this.bodyDelegate.on(type, (ev) => {
					if (isOutside(ev.target, this.container)) {
						this.hide();
					}
				});
			});
	}
}

export default TopicSearch;
