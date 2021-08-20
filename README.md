# Creato
A sideproject intended to try out django/python and design SVG based financial charts.

# WIP

This is a trading platform that allows Youtuber as a tradable digital assets. Users will be able to subscribe to tokens that are on public offerings, and each token will represent an approximate value of a Youtuber based on its revenue, subscribers, and average video views.

# Client

This project will be a web-app. The frontend will be based on React from the CRA v5 boilerplate. Additional packages such as redux, react-router, styled-components, and more will be used. Also, a charting library based on SVG, D3, will be used for creating graphs.

A websocket will be used to communicate between the client and the trading engine(WIP)

Rest of the APIs will be throught HTTPS protocol.

# Instructions

Use `git clone ${address} --recursive` to clone our repository. You must put the --recursive tag to properly clone the submodule directories.

### Client

The client requires NPM installed in the computer to run. After installing npm, run the following code.

```
  cd creato-web
  yarn install
  yarn start 
```

OR if you have make installed,

```
  cd creato-web
  make dev_env
```

This will open up a development server in localhost port 3000.


### Server

A makefile is given for the Server repository. The following are the make targets.

***tests***

Django will run tests that are identified in the api/tests.py file. After the tests are ran, it will report how many tests have succeeded.

***prod***

Heroku will be looking at the `release` branch in our remote repository. When there is a new commit pushed in the release branch, Heroku will automatically find the diff and deploy the new release.

***docs***

It will create a documentation HTML file in the /doc directory.

***dev_env***

Installs all the necessary files and then runs the django server. The port will be by default 8000.

# Server

 Python and Django as API server. The servers will be deployed through Heroku.

 Database uses Django's internal sqlite DB.

# Requirements

The Creato API Server will have the following requirements:

### Authentication

- Creato users will be able to sign up to Creato

- Creato users will be able to sign in.

- Creato users will be able to sign out.

- Creato users can delete their account.


### Trading

- Users can check the orderbook in real-time.

- Users are able to place buy and sell orders

- Users are able to cancel their orders.

- Users are able to check their order histories.

### Subscriptions

- Creato users can subscribe to tokens currently open for public offerings

- Creato users can view lists of current available offerings.


### Banking

- Creato users can deposit money into their Creato Account.

- Creato users can withdraw money into their Creato Account.
