# Goforblob

Pre-built binary downloader

## Installation

```
yarn -D add goforblob
```

## Usage

Setup Goreleaser to build and release your binaries.

Create a `"goforblob"` property in your `package.json`:

```json
"goforblob": {
    "name": "my-cool-program",
    "url": "https://github.com/username/my-cool-program/releases/download/v{version}/{name}_{version}_{platform}_{arch}.tar.gz",
}
```

```json
"scripts": {
    "install": "goforblob install",
    "uninstall": "goforblob uninstall"
}
```
## Example

https://github.com/harnyk/go-npm-example