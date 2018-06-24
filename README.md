# ERS Workout Booking Bot
This is a simple bot for booking workouts at my favorite gym. Because ain't nobody got time for doing that manually all the time.

It also includes an AWS Lambda function, deployable via `yarn deploy`. This function is meant to be connected to an Alexa skill so the bot can be controlled via Alexa.

## How to run the app

Just run `yarn` to install the necessary dependencies, then `cp src/config.sample.js src/config.js` and fill in the details.

Build the app via `yarn build` to build and then run `yarn start --help` to start it and display options.
