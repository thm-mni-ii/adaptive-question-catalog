> Historischer Stand der Dateiüberführung. Aktuelle FBS-Anbindung, Container und Betriebsanleitung: siehe [README](../README.md).

# Überführung aus dem Feedbacksystem

## Herkunft und Umfang

- Quellrepository: `feedbacksystem`
- Lokaler Remote-Tracking-Branch: `origin/1797-qcm-bachelorarbeit`
- Quellcommit: `37e3d6b2468d0082baf069ad14e220b44dc8c04f`
- Quellverzeichnis: `modules/fbs-qcm/`
- Ziel: Wurzel von `adaptive-question-catalog`

Übernommen wurden sämtliche im Quellcommit versionierten Moduldateien,
einschließlich Lockfiles, Tests, Beispielkonfigurationen, Skills,
Literaturdateien und extrahierter Dokumenttexte. Die ursprüngliche Modul-README
wird unverändert unter `docs/upstream-qcm-README.md` aufbewahrt;
die neue Root-README beschreibt das eigenständige Repository.
Die Quell-Git-Historie wird nicht importiert. Der Quellbranch und sein
Arbeitsverzeichnis werden nicht verändert. Lokale Datenbanken, Zugangsdaten,
`node_modules` und sonstige nicht versionierte Quelldateien werden nicht kopiert.

Die Root-Lizenz mit dem bestehenden Copyright-Hinweis stammt unverändert aus
demselben Feedbacksystem-Commit. Von `modeling-copilot` wurden die grundlegende
CI-/Container-Workflow-Struktur, Issue-Vorlagen sowie die Struktur von
CODEOWNERS und CONTRIBUTING übernommen und an dieses Projekt angepasst.
Die dortige PolyForm-Lizenz wurde bei der ursprünglichen Überführung nicht übernommen.
Inzwischen gilt für das Projekt PolyForm Noncommercial 1.0.0; der ursprüngliche
Apache-Lizenztext samt Copyright-Hinweis bleibt im Anhang der Root-`LICENSE` erhalten.

## Integrationsgrenzen

Die Anwendung wurde bei der Überführung nicht verändert:

- Das Frontend enthält weiterhin die bisherigen Routen, Proxy-Ziele und
  Authentifizierungsbezüge zum Feedbacksystem, unter anderem `/core`,
  `/api_v1` und `/api_v2`.
- Legacy-Backend und Backend v2 bleiben unter ihren bisherigen relativen Pfaden.
- Der bestehende Web-Dockerfile setzt weiterhin `VITE_BASE_URL=/questionary/`.
- Backend v2 hat noch kein Dockerfile. Der Legacy-Dockerfile ist keine
  Containerdefinition für v2 und benötigt die lokale Frontend-Abhängigkeit
  außerhalb seines bisherigen Build-Kontexts.
- Bestehende Dokumentationen enthalten teilweise noch Monorepo-Pfade und
  Beschreibungen früherer Entwicklungsstände.

Die funktionale Entkopplung, Änderungen an Dockerfiles, Produktionskonfiguration,
Datenmigrationen und Deployment-Einrichtung sind spätere Arbeiten.

## GitHub-Workflows

### CI

`.github/workflows/ci.yml` läuft auf Pull Requests sowie Pushes nach
`main` und `dev`, mit Leserechten und Abbruch überholter Läufe wie in der Vorlage.

- Web: `npm ci`, vorhandene Tests, Test-Typprüfung und Build.
- Legacy-API: `npm ci` und TypeScript-Build.
- API v2: `npm ci`, Build, vorhandene Tests und Seed-Typprüfung.
- Node.js 22 für alle Projekte; API-Jobs auf Ubuntu 22.04 mit
  `MONGOMS_VERSION=7.0.14` und `MONGOMS_IP=127.0.0.1` für MongoMemoryServer.

Es werden keine Seed- oder Datenmigrationsbefehle ausgeführt.

### Container-Veröffentlichung

`.github/workflows/cd.yml` übernimmt den Release-Ablauf aus `modeling-copilot`:
Ein gepushter Tag im Format `vX.Y.Z` muss auf einen Commit in `main` zeigen.
Danach wird ausschließlich der vorhandene Web-Container als
`ghcr.io/<owner>/<repository>-web` mit Version und `latest` veröffentlicht.

Die API-Veröffentlichung ist bis zu einer passenden Containerdefinition
ausgelassen. Der Workflow richtet keine Laufzeitumgebung ein und führt kein
Deployment aus. Bei dieser lokalen Überführung wurden weder Tags gepusht
noch Workflows gestartet oder Images veröffentlicht.

## Prüfung dieser Überführung

- Alle 235 versionierten Moduldateien wurden per Git-Blob-Hash mit dem
  Quellcommit verglichen: identisch; die ursprüngliche README wird am
  dokumentierten Archivpfad verglichen.
- Beide Workflow-Dateien wurden lokal als YAML geparst; referenzierte
  npm-Skripte und Lockfiles sind vorhanden.
- Keine übernommene Datei wird von den Gitignore-Regeln ausgeschlossen.
- Die Arbeitsverzeichnisse der beiden Quell-Repositories sind unverändert.
- Anwendungsbuilds, Tests und Container-Builds wurden bei dieser reinen
  Dateiüberführung nicht ausgeführt; die Workflow-Lauffähigkeit ist damit
  noch nicht durch einen tatsächlichen CI-Lauf bestätigt.
