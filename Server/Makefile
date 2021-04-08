FORCE:

tests: FORCE
	cd $(API); make tests

prod: FORCE
	- pip3 freeze > requirements.txt
	git add .
	git commit -am "Testing makefile"
	git push origin master

dev_env: FORCE
	python3 -m pip install -r dev.txt