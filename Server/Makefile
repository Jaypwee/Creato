FORCE:

tests: FORCE
	python3 manage.py test

prod: FORCE
	- pip freeze > requirements.txt
	git add .
	git commit -am "Testing makefile"
	git push origin master

dev_env: FORCE
	python3 -m pip install -r requirements.txt
	python3 manage.py runserver

docs: FORCE

