# summarize bot

```sh
nvm use
pnpm

pnpm dev
```

Deploy to production

```sh
pnpm build
pnpm serverless:deploy
pnpm serverless:info
pnpm webhook:set

# or just run

pnpm release
```

Clear resource and reset

```sh
pnpm purge
pnpm webhook:remove
```
