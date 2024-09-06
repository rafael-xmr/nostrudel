<p align="center">
  <img src="public/mostard_sat.png" alt="Project Logo" width="21%">
</p>

# moStard

moStard is a web app for exploring the [nostr](https://github.com/nostr-protocol) protocol.

The goal of this project is to build a nostr client that lets a user explore the nostr protocol by showing as much information as possible and letting the user view the underlying events.

Live Instance: [mostard.org](https://mostard.org)

There are many features missing from this client and I wont get around to implementing everything. but if you like the client you are welcome to use it.

You can find more clients with more features on [nostrapps.com](https://www.nostrapps.com/) or in the [awesome-nostr](https://github.com/aljazceru/awesome-nostr) repo.

## Please don't trust my app with your nsec

While logging in with a secret key is supported. please don't. This is a web client, so there is always a chance of XXS attacks that could steal your secret key.

I would recommend you use a browser extension like [Alby](https://getalby.com/) or [Nos2x](https://github.com/fiatjaf/nos2x)

## Running with docker

```bash
docker run --rm -p 8080:80 ghcr.io/rafael-xmr/nostrudel:mostard
```

## Docker compose and other services

moStards docker image has a few options for connecting to other services running locally

- `CACHE_RELAY`: if set the client will use the relay to cache all of its events instead of storing them in the browser cache
- `IMAGE_PROXY`: can be set to a local [imageproxy](https://github.com/willnorris/imageproxy) instance so the app can resize profile images
- `CORS_PROXY`: can be set to a local [cors-anywhere](https://github.com/Rob--W/cors-anywhere) instance so the app can proxy http request

You can find a full example of all these services in the [docker-compose.yaml](./docker-compose.yaml)

## Running locally

```bash
git clone git@github.com:rafael-xmr/nostrudel.git --branch mostard
cd nostrudel
yarn install
yarn dev
```

## Contributing

This is only a personal project, so if you open any PRs please keep them small. thanks
