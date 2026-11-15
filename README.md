# Adaptive Question Catalog

Adaptiver Fragenkatalog mit Vue-Frontend und TypeScript-/Express-Backends.
Dieses Repository übernimmt das bisherige Modul `feedbacksystem/modules/fbs-qcm`
aus dem Branch `1797-qcm-bachelorarbeit`.

## Übernommener Stand

- Quellcommit: `37e3d6b2468d0082baf069ad14e220b44dc8c04f`
- Die Moduldateien wurden unverändert an die Repository-Wurzel übertragen.
  Die bisherige Modul-README liegt unter [docs/upstream-qcm-README.md](docs/upstream-qcm-README.md).
- Diese Überführung ergänzt Repository-Dokumentation und GitHub-Workflows.
  Sie enthält keine fachlichen Codeänderungen und führt keine Deployments aus.
- Herkunft, unveränderte Integrationsgrenzen und Workflow-Details stehen in
  [docs/migration.md](docs/migration.md).

## Struktur

| Pfad | Inhalt |
| --- | --- |
| `web/` | Vue-/Vite-Frontend, Tests, Evaluation und bestehende Fachdokumentation |
| `api/backend/` | Ursprüngliches Backend einschließlich bestehendem Dockerfile |
| `api/backend/v2/` | Backend v2, Tests, Seeds und lokales MongoDB-Compose-Setup |
| `.github/workflows/` | CI und Veröffentlichung des bestehenden Web-Container-Images |
| `.github/ISSUE_TEMPLATE/` | Vorlagen für Fehlerberichte und Feature-Anfragen |

Die bisherige Verzeichnisstruktur innerhalb des Moduls bleibt erhalten,
damit relative Imports und die Verbindung zu Frontend-Testdaten bestehen bleiben.

## Lokale Entwicklung

Die Workflows verwenden Node.js 22. Es gibt drei getrennte npm-Projekte;
Befehle jeweils im angegebenen Verzeichnis ausführen.

Frontend (`web/`):

```sh
npm ci
npm run dev
```

Backend v2 (`api/backend/v2/`):

```sh
npm ci
```

Konfiguration und Datenbank-Setup beschreibt die übernommene
[Backend-v2-Anleitung](api/backend/v2/README.md). Dortige Pfade mit
`modules/fbs-qcm/` sind jetzt relativ zur Wurzel dieses Repositories zu lesen;
der Backend-Ordner lautet hier `api/backend/v2/`.
Die vorhandenen `.env.example`-Dateien sind Konfigurationsvorlagen.
Lokale `.env`-Dateien und Datenbankdateien werden nicht versioniert.

Das Frontend verwendet weiterhin die übernommenen API- und Authentifizierungswege.
Die Herauslösung der Dateien ist noch keine vollständige funktionale Entkopplung
vom Feedbacksystem; siehe [Integrationsgrenzen](docs/migration.md#integrationsgrenzen).

## Prüfungen

Frontend (`web/`):

```sh
npm test
npm run type-check:tests
npm run build
```

Backend v2 (`api/backend/v2/`):

```sh
npm test
npm run build
npx --no-install tsc --noEmit -p tsconfig.seed.json
```

Legacy-Backend (`api/backend/`): `npm ci` und `npm run build`.
Die v2-Tests verwenden temporäre MongoMemoryServer-Datenbanken.

## Mitarbeit und Lizenz

Siehe [CONTRIBUTING.md](CONTRIBUTING.md).
Die [Apache License 2.0 samt Copyright-Hinweis](LICENSE) wurde aus dem
Feedbacksystem übernommen. Bereits enthaltene Paket-Metadaten und
Fremdmaterialien bleiben unverändert; die Kopie enthält auch die bisherigen
Literatur- und Lehrmaterialdateien unter `web/docs/`.
