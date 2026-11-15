# Adaptive Question Catalog

Adaptiver Fragenkatalog mit Vue/Vite-Frontend und TypeScript-/Express-API v2.
Die Anmeldung erfolgt über das Feedbacksystem (FBS), wie im Modeling Copilot:
im FBS-iFrame per Token-Bridge und beim direkten Aufruf per OIDC Authorization
Code mit PKCE. Passwörter werden ausschließlich beim FBS eingegeben.

## Lokale Entwicklung

Voraussetzungen: Node.js 22, Docker und das separat laufende Feedbacksystem
auf dessen aktuellem dev. Die hier geprüfte FBS-Referenz ist Commit
`1c1253f6`; die Integrationsreferenz Modeling Copilot ist `198b82d`.
### 1. Feedbacksystem starten

Das [Feedbacksystem](https://github.com/thm-mni-ii/feedbacksystem) separat
auschecken und dessen aktuellen `dev` verwenden. Bei einem neuen Checkout:

```sh
git clone --branch dev https://github.com/thm-mni-ii/feedbacksystem.git
cd feedbacksystem
```

Im Root des FBS-Repositories die Web Shell mit ihren Abhängigkeiten bauen
und starten:

```sh
docker compose up -d --build web-shell
docker compose ps
```

Die Compose-Datei startet dadurch folgende Dienste; die übrigen FBS-Module
werden für die Anmeldung am eigenständigen Fragenkatalog nicht benötigt:

| Dienste | Aufgabe |
| --- | --- |
| `web-shell` | FBS-Oberfläche, Navigation und Anwendungsverwaltung |
| `identity-service`, `mysql1` | Anmeldung, OIDC-Clients und Benutzerdaten |
| `core` | Core-API; Abhängigkeit der Web Shell |
| `runner`, `mysql-checker`, `psql-checker`, `psql-sharing` | Abhängigkeiten der Core-API und des Runners |
| `mongodb`, `mongodb-playground`, `minio` | Weitere Abhängigkeiten der Core-API |

`web-shell`, `identity-service`, `core` und `runner` werden lokal gebaut;
für die Datenbank- und Speicherdienste werden Images geladen. Beim ersten
Start müssen die Builds und Healthchecks abgeschlossen sein. Der in der
FBS-Compose-Datei eingebundene Signierschlüssel
`secrets/identity-signing-key.p12` muss im FBS-Checkout vorhanden sein.

Falls bereits das gesamte FBS läuft, die beiden Dienste mit überschneidenden
Host-Ports im FBS-Repository stoppen:

```sh
docker compose stop qcm-frontend sql-playground-web
```

Sie belegen sonst die vom eigenständigen Fragenkatalog benötigten Ports
8086 bzw. 3001. Für dieses Setup nicht alle FBS-Dienste pauschal starten.

FBS über **http://localhost:8083** öffnen und mit Benutzer **`admin`** und
Passwort **`admin123`** anmelden. Dies ist der initiale lokale Testzugang
des Identity-Service; bei einer bestehenden Datenbank kann das Passwort
bereits geändert worden sein. Die FBS-Root-README nennt `https://localhost`
für den Core-Einstieg; für diese Integration wird die **Web Shell auf Port
8083** verwendet.

Unter **Anwendungsverwaltung** (**http://localhost:8083/admin/apps**) über
**Neue Anwendung registrieren** den Provider mit den
[lokalen Einstellungen](#entwicklung-lokalen-provider-registrieren) anlegen.

### 2. Fragenkatalog starten und anmelden

In einem weiteren Terminal im Root von `adaptive-question-catalog` starten:

```sh
docker compose up --build -d --remove-orphans
```

Das startet ausschließlich MongoDB und API v2 mit Hot Reload.
`--remove-orphans` entfernt beim Umstieg den früheren Webcontainer und gibt
Port 8086 frei; die Datenbank-Volumes bleiben erhalten.

Das Frontend läuft direkt auf dem Host. In einem weiteren Terminal:

```sh
cd web
npm ci
npm run dev
```

Vite lädt die öffentlichen Dev-Werte aus `web/vite.config.ts` und leitet
API-Aufrufe an `http://localhost:3001` weiter. Lokal wird kein Webimage gebaut.
Ist Port 8086 belegt, bricht Vite mit einer Meldung ab, statt unbemerkt auf
8087 auszuweichen und damit die registrierte Callback-URL zu ändern.
Öffnen: **http://localhost:8086**. API: localhost:3001, MongoDB: localhost:27019.
Für den direkten Login den Anmeldebutton verwenden und beim FBS mit
`admin` / `admin123` anmelden. Alternativ im bereits angemeldeten FBS die
Anwendung **Adaptive Question Catalog** in der Navigation öffnen; bei
`IFRAME` wird die FBS-Sitzung automatisch übernommen.
Die Docker-Ports für API und MongoDB sind lokal gebunden. Vite lauscht mit
`host: true` auch auf den Netzwerkschnittstellen. Für den FBS-Login weiterhin
`http://localhost:8086` mit der registrierten Callback-URL verwenden.
Die lokale Datenbank besitzt
keinen Passwortschutz und darf nicht öffentlich freigegeben werden.

Es gibt genau eine `docker-compose.yaml`, ausschließlich für lokale Entwicklung.
Die API verwendet einen Quellcode-Mount und ein Node-Modules-Volume.
Die lokalen API-Werte stehen direkt in dieser Datei, die öffentlichen
Frontend-Werte in der versionierten `web/vite.config.ts`. Keine Secrets in
dieser Datei ablegen. Produktion läuft ausschließlich über
`k3s-portainer.yaml` mit den in CI/CD gebauten Images und Portainer-Secrets.

Für lokale CONFIDENTIAL-Tests kann `OIDC_CLIENT_SECRET` direkt im lokalen
Compose eingetragen werden; der Standard nutzt PUBLIC mit leerem Secret.
Echte Produktionsgeheimnisse gehören ausschließlich in Portainer-Secrets.

Die öffentliche FBS-Adresse und die Provider-ID für Vite stehen als
`VITE_*` in `web/vite.config.ts`. Nach Änderungen Vite neu starten.
Die API spricht für OIDC mit derselben
FBS-Shell wie der Browser (Port 8083); JWKS kommt lokal vom Identity-Service
auf Port 8080. Der erwartete JWT-Aussteller ist die öffentliche Shell-Adresse
**http://localhost:8083**, nicht die interne Docker-Adresse. Compose setzt
dafür zusätzlich `OIDC_TOKEN_HOST`.

Neue Datenbanken sind zunächst leer. Bei Bedarf kann der Seed aus dem
Hot-Reload-Setup manuell ausgeführt werden:

```sh
docker compose exec api npm run seed
```

Er verweigert nicht leere Datenbanken. CI und Deployment führen keinen Seed
aus. Bestehende FBS-Datenbanken werden nicht übernommen.

## Anwendung im FBS registrieren

### Entwicklung: lokalen Provider registrieren

Als lokaler FBS-Admin unter **http://localhost:8083/admin/apps** einen
Provider mit diesen Werten speichern:

| Einstellung | Wert für Entwicklung |
| --- | --- |
| ID und Client-ID | adaptive-question-catalog |
| Titel | Adaptive Question Catalog |
| Icon | mdi-school |
| Entry-URL | http://localhost:8086/ |
| Einbettung | IFRAME (im FBS) oder EXTERNAL (separat öffnen) |
| OIDC | aktiviert |
| Client-Typ | PUBLIC mit PKCE |
| Redirect-URI | http://localhost:8086/oauth2/callback |
| Scopes | openid, profile, email |
| Aktiv / Navigation | aktiviert |
| Benötigte globale Rolle | USER |

Diese Werte passen zu `web/vite.config.ts` und `docker-compose.yaml`; `OIDC_CLIENT_SECRET` bleibt
leer. Für einen optionalen lokalen CONFIDENTIAL-Test den Client-Typ im FBS
ändern und das dort vergebene Secret direkt in der lokalen Compose-Datei
bei `OIDC_CLIENT_SECRET` eintragen. Danach den API-Container mit
`docker compose up -d api` neu erstellen lassen.

### Produktion: produktiven Provider registrieren

Voraussetzung ist eine betriebene FBS-Instanz mit Web Shell und
Identity-Service sowie das unten beschriebene
[Deployment über Portainer / k3s](#portainer--k3s). Die produktive
FBS-Installation wird separat verwaltet. Dort mit einem produktiven
Administratorkonto unter `https://<fbs-domain>/admin/apps` anmelden;
`admin` / `admin123` ist ausschließlich der lokale Testzugang dieser Anleitung.

Einen eigenen Provider in der produktiven FBS-Instanz anlegen. In den folgenden
Beispielen `aqc.example.org` und `fbs.example.org` durch die echten Domains
ersetzen:

| Einstellung | Wert für Produktion (Beispiel) |
| --- | --- |
| ID und Client-ID | adaptive-question-catalog |
| Titel | Adaptive Question Catalog |
| Icon | mdi-school |
| Entry-URL | https://aqc.example.org/ |
| Einbettung | IFRAME oder EXTERNAL |
| OIDC | aktiviert |
| Client-Typ | PUBLIC mit PKCE oder CONFIDENTIAL mit PKCE |
| Redirect-URI | https://aqc.example.org/oauth2/callback |
| Scopes | openid, profile, email |
| Aktiv / Navigation | aktiviert |
| Benötigte globale Rolle | nach gewünschter Sichtbarkeit, z. B. USER |

In `k3s-portainer.yaml` die zugehörigen Werte der ConfigMap `aqc-config`
setzen:

| Variable | Wert für Produktion (Beispiel) |
| --- | --- |
| `FBS_HOST_ORIGIN`, `JWT_ISSUER` | https://fbs.example.org |
| `FBS_PROVIDER_ID`, `OIDC_CLIENT_ID` | adaptive-question-catalog |
| `OIDC_REDIRECT_URIS` | https://aqc.example.org/oauth2/callback |
| `OIDC_TOKEN_URI` | https://fbs.example.org/oauth2/token |
| `JWT_JWKS_URI` | https://fbs.example.org/oauth2/jwks |

Für PUBLIC bleibt `OIDC_CLIENT_SECRET` ungesetzt bzw. leer. Für CONFIDENTIAL
das im produktiven FBS vergebene Secret ausschließlich im Portainer-Secret
`aqc-secrets` unter `OIDC_CLIENT_SECRET` hinterlegen. Keine Secret-`.env`
und keine Secrets in `VITE_*` oder im Web-Image verwenden. Nach Änderungen
an ConfigMap oder Secret die betroffenen Deployments neu ausrollen.

Anschließend `https://aqc.example.org/` öffnen, den Anmeldebutton verwenden
und sich am produktiven FBS anmelden. Zusätzlich die Anwendung aus der
produktiven FBS-Navigation öffnen und die Sitzungsübernahme prüfen.

### Gemeinsames Loginverhalten

Die Redirect-URI muss sowohl im FBS als auch in `OIDC_REDIRECT_URIS` exakt
übereinstimmen. Mehrere erlaubte Callback-URLs können dort kommagetrennt stehen.

Im FBS anmelden und die Anwendung in der Navigation öffnen: Der iFrame
fordert automatisch einen Token an, prüft dabei Absenderfenster und Ursprung
und erneuert ihn über den Host. Direkt geöffnet zeigt die Anwendung eine
Loginseite mit Button und Einrichtungshilfe. PKCE-Verifier und State werden
pro Anmeldung erzeugt und geprüft; der Token-Austausch findet in der API statt.
PUBLIC-Sitzungen erneuern per stillem PKCE-iFrame, solange die FBS-Sitzung
besteht. Blockierte Drittanbieter-Cookies können eine erneute Anmeldung nötig
machen. CONFIDENTIAL-Clients können Refresh-Tokens verwenden.

Die API prüft RS256-Signatur, Ablauf, Nutzer-ID und konfigurierten Aussteller.
`JWT_AUDIENCE` kann kommagetrennt auf die tatsächlich ausgestellten Audiences
beschränkt werden. Für eine auf diesen Provider beschränkte Installation
`adaptive-question-catalog` setzen und beide Anmeldewege prüfen. Ohne diesen
Wert entspricht die Prüfung der Copilot-Referenz ohne Audience-Einschränkung.
Tokens werden im Browser nur in der Sitzung dieses Tabs gespeichert; der alte
`jsessionid`-URL-Login und der feste Entwickler-Token wurden entfernt.

## CI/CD und Container

- PRs und Pushes auf `main`/`dev`: Web-Tests, Typprüfungen und Build,
  Legacy-API-Build, v2-Build/-Tests/Seed-Typprüfung sowie beide Container-Builds.
  Der Web-Produktionsbuild wird damit in CI geprüft, unabhängig vom lokalen
  Vite-Dev-Server.
- Jeder Push nach `main` (insbesondere ein Merge) baut und veröffentlicht
  beide Images: `ghcr.io/<owner>/<repo>-api:latest` und `-web:latest`.
  Zusätzlich erhalten beide `sha-<vollständiger-commit-sha>` als eindeutigen
  Tag. Release-Tags sind nicht erforderlich.
- Die Images verwenden API v2 und nginx. Das Web-Dockerfile führt für das
  Produktionsimage `npm run build` aus; nginx liefert anschließend `dist` aus.
  Das Web-Image liest
  `FBS_HOST_ORIGIN` und `FBS_PROVIDER_ID` beim Containerstart in
  `/config.js`; dafür muss es nicht pro Umgebung neu gebaut werden.
- Veröffentlichung und Portainer-Deployment sind getrennte Schritte.

## Portainer / k3s

`k3s-portainer.yaml` ist eine Vorlage für einen Kubernetes-Stack mit
Traefik, eigenem Namespace, MongoDB-PVC und internen API-/Mongo-Services.
Der öffentliche Einstieg liegt auf einer eigenen Domain an der Wurzel `/`;
nginx leitet API-Anfragen intern weiter. Es wird keine bestehende FBS-
Ingress-Regel verändert. Die Vorlage ist kein bereits ausgeführtes Deployment.

1. Die Vorlage verwendet `latest` mit `imagePullPolicy: Always`. Für einen
   reproduzierbaren Stand beide Image-Tags auf denselben veröffentlichten
   `sha-<vollständiger-commit-sha>` setzen; gegebenenfalls GHCR-Organisation
   anpassen. Neue Images rollen laufende Pods nicht automatisch neu aus:
   in Portainer das Deployment neu ausrollen bzw. den Image-Tag ändern.
   Für private Packages Registry-Zugang bzw. imagePullSecrets ergänzen.
2. Alle Vorkommen von `aqc.example.org` und `fbs.example.org` ersetzen.
   Die FBS-Adresse muss vom Browser und aus dem Cluster erreichbar sein.
   `JWT_ISSUER` muss exakt dem öffentlichen FBS-Aussteller entsprechen.
3. Namespace `adaptive-question-catalog` vorbereiten. Darin in Portainer
   Secret `aqc-secrets` mit Schlüsseln `MONGO_USER`, `MONGO_PASSWORD`,
   `MONGODB_URL` und bei CONFIDENTIAL `OIDC_CLIENT_SECRET` anlegen.
   Mongo-URL: `mongodb://<user>:<URL-kodiertes-passwort>@mongo:27017/?authSource=admin`.
   Die Werte müssen zu den Mongo-Initialisierungsdaten passen. Eine Änderung
   des Secrets allein ändert keine Benutzer einer bestehenden Datenbank.
4. DNS und TLS-Secret `aqc-tls` für die AQC-Domain bereitstellen; bei
   cert-manager den Ingress passend zur Clusterkonfiguration ergänzen.
   StorageClass und PVC-Größe bei Bedarf anpassen.
5. Datenbank vor Updates sichern (mongodump) und Wiederherstellung prüfen.
   Die bestehende API legt beim Start Indizes an und führt ihre vorhandene
   nicht destruktive Legacy-Attempt-Kompatibilitätsmigration aus.
6. Manifest in Portainer als Kubernetes-Stack einlesen, Konfiguration prüfen
   und dort bereitstellen. Danach FBS-Provider mit Produktiv-URL und Callback
   registrieren und beide Anmeldewege prüfen.

`/health` ist der interne API-Probe-Endpunkt. Bei Loginfehlern zuerst FBS-
Erreichbarkeit, Redirect-URI, Client-ID/-Typ, Secret und JWT-Aussteller prüfen.
Bei HTTP 401 auch JWKS-Erreichbarkeit, Tokenablauf und Audience kontrollieren.
Kein Token oder Secret soll in Tickets oder Logs kopiert werden.

## Umfang und Grenzen

Fachliche Kurs-, Fragen- und Lernlogik bleibt bestehen. Kursauswahl nutzt
weiterhin die vorhandenen Mock-Kurse; der Login synchronisiert keine FBS-Kurse.
Globale ADMIN-Navigation stammt aus dem FBS-Claim. Die bestehende v2-API hat
noch kein vollständiges Rollen-/Kursberechtigungsmodell; Frontend-Guards
ersetzen keine serverseitige fachliche Autorisierung. Diese Änderung liefert
Anmeldung und Tokenprüfung, keine neue fachliche Berechtigungsdomäne.

`api/backend` bleibt als Legacy-Code erhalten und wird nicht bereitgestellt.
Die ursprüngliche Dateiüberführung ist in [docs/migration.md](docs/migration.md)
dokumentiert; ihr damaliger Stand vor der FBS-Anbindung ist historisch.
Plan: [docs/implementation-plan.md](docs/implementation-plan.md).
Lizenz: [PolyForm Noncommercial 1.0.0](LICENSE); Mitarbeit: [CONTRIBUTING.md](CONTRIBUTING.md).

Die aus Modeling Copilot übernommenen Dateien `fbsBridge.ts` und `fbsOidc.ts`
behalten dessen [PolyForm-Noncommercial-Lizenz](LICENSE).
Der Apache-Lizenztext und Copyright-Hinweis des übernommenen FBS-Moduls
bleiben als Anhang in derselben `LICENSE` erhalten; die Rechte am ursprünglichen
Code bleiben bestehen.

Die früheren lokalen Legacy-API-Beispielwerte stehen im Compose-Block
`x-legacy-api-environment`. Dieser startet keinen Legacy-Dienst und wird
von API v2 nicht verwendet. Die alte Mongo-Adresse wurde auf den lokalen
Compose-Dienst `mongo:27017` angepasst.
