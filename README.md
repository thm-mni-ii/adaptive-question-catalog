# Adaptive Question Catalog

Adaptiver Fragenkatalog zum Erstellen und Bearbeiten von Fragen sowie zum
Üben und Auswerten von Lernversuchen. Das Projekt besteht aus einem
Vue-3-/Vuetify-Frontend mit Vite, einer TypeScript-/Express-API und MongoDB.
Die Anmeldung erfolgt über das Feedbacksystem (FBS): direkt per OpenID Connect
mit PKCE oder innerhalb des FBS per iFrame-Token-Bridge.

## Projektstruktur

| Pfad | Inhalt |
| --- | --- |
| `web/` | Frontend und nginx-Produktionsimage |
| `api/backend/v2/` | Aktuell verwendetes Backend |
| `api/backend/` | Legacy-Backend; wird nicht durch Compose oder das Produktionsmanifest gestartet |
| `docker-compose.yaml` | Lokale API und MongoDB |
| `k3s-portainer.yaml` | Kubernetes-Manifest für Portainer / k3s |

## Lokal einrichten

Voraussetzungen sind Node.js 22 mit npm, Docker mit Docker Compose und für
die Anmeldung eine laufende FBS-Instanz mit Web Shell und Identity-Service.
Die lokale Konfiguration erwartet die FBS-Web-Shell unter
`http://localhost:8083` und den Identity-Service unter `http://localhost:8080`.
Das FBS wird separat gemäß seiner eigenen Installationsanleitung eingerichtet.

### 1. Backend und Datenbank mit Docker Compose starten

Im Root-Verzeichnis dieses Repositories:

```sh
docker compose up -d --build
docker compose ps
```

Compose baut API v2 und startet sie mit Hot Reload. Der Quellcode ist in den
Container eingebunden; Node-Abhängigkeiten und MongoDB-Daten liegen in
benannten Volumes. Die lokale MongoDB läuft ohne Passwortschutz und ist wie
die API nur an die Loopback-Adresse des Hosts gebunden.

| Dienst | Lokale Adresse |
| --- | --- |
| API v2 | http://localhost:3001/api_v2/ |
| API-Healthcheck | http://localhost:3001/health |
| MongoDB | `mongodb://localhost:27019`, Datenbank `QCM_v2` |

Die Backend-Konfiguration steht in [docker-compose.yaml](docker-compose.yaml).
Aus dem API-Container wird das FBS über `host.docker.internal` erreicht;
`JWT_ISSUER` bleibt die öffentliche FBS-Adresse `http://localhost:8083`.

Logs anzeigen und Dienste stoppen:

```sh
docker compose logs -f api
docker compose down
```

`docker compose down` behält die Datenbank-Volumes bei.

### 2. Webprojekt starten

In einem weiteren Terminal, ausgehend vom Repository-Root:

```sh
cd web
npm ci
npm run dev
```

Die Anwendung ist unter **http://localhost:8086** erreichbar. Vite leitet
`/api_v2` an das Backend auf Port 3001 weiter. Port 8086 muss frei sein;
Vite wechselt nicht automatisch auf einen anderen Port.

Die öffentlichen Entwicklungseinstellungen stehen in
[web/vite.config.ts](web/vite.config.ts). Nach Änderungen Vite neu starten.
Für die lokale Entwicklung ist keine `.env`-Datei erforderlich.

### 3. Anwendung im FBS registrieren

Als FBS-Administrator unter `http://localhost:8083/admin/apps` einen Provider
mit diesen Einstellungen anlegen:

| Einstellung | Lokaler Wert |
| --- | --- |
| ID / OIDC-Client-ID | `adaptive-question-catalog` |
| Titel | Adaptive Question Catalog |
| Icon | `mdi-school` |
| Entry-URL | `http://localhost:8086/` |
| Einbettung | `IFRAME` oder `EXTERNAL` |
| OIDC | aktiviert |
| Client-Typ | `PUBLIC` mit PKCE |
| Redirect-URI | `http://localhost:8086/oauth2/callback` |
| Scopes | `openid`, `profile`, `email` |
| Aktiv / Navigation | aktiviert |
| Benötigte globale Rolle | `USER` |

Diese Werte passen zu Compose und Vite; `OIDC_CLIENT_SECRET` bleibt leer.
Die Redirect-URI muss im FBS und in `OIDC_REDIRECT_URIS` exakt übereinstimmen.
Anschließend die Anwendung auf Port 8086 öffnen und den Anmeldebutton nutzen
oder sie in der FBS-Navigation öffnen. Passwörter werden beim FBS eingegeben.

### Optionale Beispieldaten

Neue Datenbanken sind zunächst leer. Für eine leere lokale Datenbank kann
der Seed manuell gestartet werden:

```sh
docker compose exec api npm run seed
```

Der Seed verweigert nicht leere Datenbanken. Er wird weder beim Start noch
in CI oder beim Deployment automatisch ausgeführt.

## Webprojekt bauen

Ausgehend vom Repository-Root:

```sh
cd web
npm ci
npm run build
```

Der Befehl führt die Vue-/TypeScript-Typprüfung und den Vite-Produktionsbuild
aus. Das Ergebnis liegt in `web/dist/`.

Das Produktionsimage aus dem Repository-Root bauen:

```sh
docker build -t aqc-web:local ./web
```

Das Image baut das Frontend und liefert es anschließend mit nginx auf Port 80
aus. nginx leitet `/api_v2/` an `api:3001` weiter; der Backend-Dienst muss im
Container-Netzwerk unter diesem Namen erreichbar sein.
Beim Containerstart schreibt `runtime-config.sh` die öffentlichen Variablen
`FBS_HOST_ORIGIN` und `FBS_PROVIDER_ID` in `/config.js`. Beide müssen für die
Zielumgebung gesetzt werden. Geheimnisse gehören nicht in die Webkonfiguration.

## Backend bauen

Das aktuelle Backend liegt in `api/backend/v2`. Ausgehend vom Repository-Root:

```sh
cd api/backend/v2
npm ci
npm run build
```

TypeScript kompiliert die API nach `api/backend/v2/dist/`. Das gebaute Backend
wird mit `node dist/index.js` gestartet. `npm start` baut es vor dem Start erneut.
Zum Ausführen benötigt die API eine erreichbare MongoDB sowie die Datenbank-
und FBS-Konfiguration aus Compose, bei einem Start auf dem Host mit passenden
Host-Adressen statt Container-Adressen. Der reine Build benötigt keine laufenden
Dienste.

Das Produktionsimage aus dem Repository-Root bauen:

```sh
docker build -t aqc-api:local ./api/backend/v2
```

Das Image enthält die kompilierte API mit Produktionsabhängigkeiten und startet
`node dist/index.js` auf Port 3001. Es benötigt zur Laufzeit insbesondere
`MONGODB_URL`, `MONGODB_DB_NAME`, `JWT_JWKS_URI`, `JWT_ISSUER`,
`OIDC_TOKEN_URI`, `OIDC_CLIENT_ID` und `OIDC_REDIRECT_URIS`.
`OIDC_CLIENT_SECRET` wird nur für einen `CONFIDENTIAL`-Client gesetzt.

## Tests und CI/CD

Tests werden nach `npm ci` im jeweiligen Projektverzeichnis ausgeführt:

| Verzeichnis | Befehl | Prüfung |
| --- | --- | --- |
| `web/` | `npm test` | Frontend-Tests |
| `web/` | `npm run type-check:tests` | Typprüfung der Tests |
| `api/backend/v2/` | `npm test` | Backend-Tests mit isolierten Testdatenbanken |
| `api/backend/v2/` | `npx --no-install tsc --noEmit -p tsconfig.seed.json` | Typprüfung des Seeds |

Die [CI](.github/workflows/ci.yml) prüft bei Pull Requests sowie Pushes auf
`main` und `dev` Tests, Typen, Web- und Backend-Builds einschließlich des
Legacy-Backends sowie beide Produktionsimages.
Der [Publish-Workflow](.github/workflows/cd.yml) veröffentlicht bei Pushes auf
`main` die Images `ghcr.io/<owner>/<repo>-api` und
`ghcr.io/<owner>/<repo>-web`, jeweils als `latest` und
`sha-<vollständiger-commit-sha>`. Die Veröffentlichung führt kein Deployment aus.

## Produktion mit Portainer / k3s

[k3s-portainer.yaml](k3s-portainer.yaml) stellt MongoDB mit persistentem
Speicher, API und nginx-Webfrontend sowie einen Traefik-Ingress bereit.
Die Produktion verwendet die durch CI/CD gebauten Images.

1. Image-Pfade und Tags im Manifest setzen. Für reproduzierbare Deployments
   beide Images auf denselben veröffentlichten Commit-Tag festlegen.
2. `aqc.example.org` und `fbs.example.org` durch die eigenen Domains ersetzen.
   Die ConfigMap `aqc-config` enthält die öffentlichen FBS-, OIDC- und
   Datenbankeinstellungen. `JWT_ISSUER` muss dem FBS-Aussteller entsprechen.
3. Im Namespace `adaptive-question-catalog` über Portainer das Secret
   `aqc-secrets` mit `MONGO_USER`, `MONGO_PASSWORD` und `MONGODB_URL` anlegen.
   Die URL lautet `mongodb://<user>:<URL-kodiertes-passwort>@mongo:27017/?authSource=admin`
   und muss zu den MongoDB-Zugangsdaten passen. Bei `CONFIDENTIAL` zusätzlich
   `OIDC_CLIENT_SECRET` hinterlegen. Produktionsgeheimnisse bleiben in Portainer.
4. DNS, TLS-Secret `aqc-tls` und passenden persistenten Speicher bereitstellen.
   Bei privaten Images den Registry-Zugang konfigurieren.
5. Im produktiven FBS einen Provider mit der produktiven Entry-URL und
   `https://<aqc-domain>/oauth2/callback` registrieren. Client-ID und Client-Typ
   müssen zur API-Konfiguration passen.
6. Das angepasste Manifest als Kubernetes-Stack in Portainer bereitstellen und
   die Anmeldung direkt sowie über die FBS-Navigation prüfen.

Vor Updates die Datenbank sichern. Geänderte Secrets ändern keine bestehenden
MongoDB-Benutzer. Nach Konfigurations- oder Imageänderungen die betroffenen
Deployments neu ausrollen.

## Lizenz

Das Projekt steht unter der **PolyForm Noncommercial License 1.0.0**.
Der vollständige Lizenztext steht in [LICENSE](LICENSE).
