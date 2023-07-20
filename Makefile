node_modules/@financial-times/n-gage/index.mk:
	npm install @financial-times/n-gage
	touch $@

-include node_modules/@financial-times/n-gage/index.mk

NODE_VERSION := $(shell node --version)
NODE_MAJOR_VERSION := $(shell echo $(NODE_VERSION) | cut -c2-3)
ifeq ($(NODE_MAJOR_VERSION),18)
	NODE_OPTS := "--openssl-legacy-provider --dns-result-order=ipv4first"
endif

$(info NODE_OPTIONS -> $(NODE_OPTS))
$(info NODE_OPTIONS -> $(NODE_OPTS))

demo-build:
	@NODE_OPTIONS=$(NODE_OPTS) webpack
	@NODE_OPTIONS=$(NODE_OPTS) sass demos/src/demo.scss public/main.css --load-path node_modules
	@$(DONE)

demo: demo-build
	@NODE_OPTIONS=$(NODE_OPTS) node demos/app

a11y: demo-build
	@NODE_OPTIONS=$(NODE_OPTS) node .pa11yci.js
	@NODE_OPTIONS=$(NODE_OPTS) PA11Y=true node demos/app
	@$(DONE)

test:
	make verify
	make a11y
