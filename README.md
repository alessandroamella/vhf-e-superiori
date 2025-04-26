# VHF e superiori

Il frontend va su 8904

## Setup Monorepo

Questo progetto utilizza pnpm per gestire un monorepo con frontend e backend.

### Prerequisiti

Installa ffmpeg, ImageMagick e le dependencies richieste

```
sudo apt update
sudo apt install ffmpeg libvips-dev imagemagick
```

### Installazione

```
pnpm install
```

### Sviluppo

Per avviare entrambi i progetti in modalità di sviluppo:

```
pnpm dev
```

Per avviare solo il frontend:

```
pnpm dev:frontend
```

Per avviare solo il backend:

```
pnpm dev:backend
```

### Build

Per buildare entrambi i progetti:

```
pnpm build
```

Per buildare solo il frontend:

```
pnpm build:frontend
```

Per buildare solo il backend:

```
pnpm build:backend
```
