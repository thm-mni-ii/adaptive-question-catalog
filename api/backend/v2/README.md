# QCM Backend v2

Lokale Einrichtung, FBS-Registrierung und Portainer:
siehe [Repository-README](../../../README.md).

Für lokale Entwicklung aus der Repository-Wurzel:

```sh
docker compose up --build
```

Die API läuft mit Hot Reload. Alle lokalen Werte stehen direkt in
`docker-compose.yaml`; keine Secret-`.env` anlegen.
Produktionsgeheimnisse werden ausschließlich über Portainer-Secrets injiziert.

Prüfungen im API-Verzeichnis: `npm ci`, `npm test`, `npm run build`
und `npx --no-install tsc --noEmit -p tsconfig.seed.json`.
Tests verwenden isolierte MongoMemoryServer-Datenbanken und nur im
Testprozess aktivierte HS256-Fixtures. Im Betrieb werden FBS-RS256-Tokens
mit Ablauf und Nutzer-ID geprüft.

`npm run seed` importiert manuell in eine leere Datenbank; es ist kein Reset.
Aus dem Hot-Reload-Setup: `docker compose exec api npm run seed`.
`npm run migrate:matching-questions` ist eine separate manuelle Datenmigration.
CI und Deployment starten diese Befehle nicht.
