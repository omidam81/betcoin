CONF=dev
BUILD_ENV=dev
LOC=en_US
GULP_TASK=default
APP=betcoin

GULP=./node_modules/.bin/gulp

html: clean
	@$(GULP) $(GULP_TASK)

watch: clean
	@$(GULP)
	@$(GULP) watch

clean:
	@rm -rf build/$(APP)/$(LOC)
