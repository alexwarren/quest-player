Quest Player
============

A cross-platform player for [Quest](http://textadventures.co.uk/quest/) games. Under development.

Building Quest Player:
- `npm install`

Then, start the web version:
- `npm run web`
- navigate to `http://localhost:8080/?file=blank.aslx`

Or, start the desktop version:
- `npm start`

## Development notes

ASL5 is built by Webpack. ASL4 is a slower build, built as part of `npm install` - if you make changes there, rebuild manually with `npm run build-asl4`.