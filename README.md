# plex-sync

A simple command-line utility to synchronize watched / seen status between different [Plex Media Servers](https://plex.tv).

## Features

* Syncs watch status between different Plex servers.

## Requirements

* NodeJS 4+

## Installation

`plex-sync` is installed via NPM:

```shell
$ npm install -g plex-sync
```

## Usage

There are two available configuration environment variables:

Variable | Description
-------- | -----------
`PLEX_TOKEN` | The API token used to access your Plex server.  To locate this token, visit a media item page (like for a movie or TV episode), click on the **Info** link in the item menu (the **...**), then choose "View XML" at the bottom of the info dialog.  Look in the URL bar at the very end of the URL for something like `X-Plex-Token=xxxYOUR_TOKEN_HERExxx`.  That is your authentication token.
`DRY_RUN` | Set this environment variable to make `plex-sync` print out what it was planning to do rather than actually perform the synchronization.

Sync watched status between two servers, using the default port (`32400`), using library ID `1` for the first server and library `3` for the second:

```shell
$ plex-sync 10.0.1.5/1 10.0.1.10/3
```

Sync three servers, with different ports:

```shell
$ plex-sync 10.0.1.5:32401/1 10.0.1.5:32402/1 10.0.1.10/3
```

For more complex strategies, like syncing between multiple different library mappings, just run the tool multiple times.  If you need to run the synchronization on a schedule, use another scheduling tool like cron.  These more advanced features may be added in the future, but currently `plex-sync` is very simple.

## Contributing

Contributions are welcome.  Open a pull request or issue to contribute.

## License

MIT license.  See `LICENSE` for more information.
