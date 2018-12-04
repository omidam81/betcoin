
ROOTDIR=$(PWD)

push:
	cd dockerfiles; for proj in *; do echo $(proj) && \
		if [ -d $(proj) ] && grep '^push:' $(proj)/Makefile; then \
		cd $(proj) && make push; cd $(ROOTDIR); \
		fi; \
	done;

pull:
	cd dockerfiles; for proj in *; do \
		if [ -d $(proj) ] && grep '^pull:' $(proj)/Makefile; then \
		cd $(proj) && make pull; cd $(ROOTDIR); \
		fi; \
	done;

