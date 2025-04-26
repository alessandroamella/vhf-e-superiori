# VHF e superiori

Il frontend va su 8904

## Setup Monorepo

Questo progetto utilizza pnpm per gestire un monorepo con frontend, backend, e server frontend.

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

Per avviare solo il server frontend:

```
pnpm dev:frontend-server
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

### Produzione

Per buildare il frontend e servirlo con il server frontend:

```
pnpm serve-frontend
```

Per avviare solo il server frontend (dopo aver buildato il frontend):

```
pnpm start:frontend-server
```

Per avviare il backend:

```
pnpm start:backend
```
