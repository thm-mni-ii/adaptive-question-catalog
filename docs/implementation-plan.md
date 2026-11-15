# FBS-Anbindung auf dev

## Plan und Umsetzung

- [x] Aktuellen FBS-dev lesend prüfen: Remote-Commit 1c1253f662c8b5d4d5d4a8500209254334234d12.
- [x] Modeling Copilot (198b82d) als Referenz für Bridge, OIDC und Betrieb prüfen.
- [x] FBS-iFrame-Bridge und OIDC/PKCE an den Auth-Store anbinden; Entwicklertoken und URL-Login entfernen.
- [x] Backend v2: RS256/JWKS, Ausstellerprüfung, konfigurierbare Audience, Code-Austausch und Token-Erneuerung.
- [x] Lokales Compose, Web/API-Container, CI/CD und Portainer/k3s-Vorlage ergänzen.
- [x] README, Loginhilfe und Herkunft der übernommenen Dateien dokumentieren.
- [x] Builds, Typen, Tests und Konfiguration prüfen.

## Prüfergebnisse

- Frontend: Build, Test-Typprüfung und 64 Tests bestanden.
- API v2: Build, Seed-Typprüfung und 87 Tests bestanden.
- Lokale Datenbanktests: vorhandene isolierte MongoDB 6.0.14-Testbinärdatei;
  CI nutzt MongoDB 7.0.14 mit gesondertem Vorladen vor den Tests.
- Web- und API-Container erfolgreich gebaut.
- Compose-Konfiguration, Workflow-YAML und zehn Kubernetes-Ressourcen geparst.
- Web-Container: nginx-Konfiguration und Erzeugung von config.js geprüft.
- Öffentlicher Host-Header im OIDC-Token-Transport mit echtem lokalem HTTP-Server geprüft.
- FBS- und Modeling-Copilot-Arbeitsverzeichnisse unverändert; Zielbranch ist dev.

Der erste MongoDB-Testlauf scheiterte beim Download am Zeitlimit, ein weiterer
am unter Windows reservierten Zufallsport. Der abschließende vollständige Lauf
bestand alle 87 Tests. Buildwarnungen zu bestehenden ungenutzten Variablen,
Bundlegröße und älteren Abhängigkeiten wurden nicht durch fachfremde Updates behoben.

## Externe Abnahme

- [ ] Provider im FBS anhand der README registrieren; beide Loginwege mit realem Benutzer prüfen.
- [ ] Produktionsdomains, Secret und Image-Versionen in Portainer konfigurieren.
- [ ] Bei Bedarf fachliches Rollen-/Kursberechtigungsmodell separat ergänzen.

Es wurden keine Provider registriert, Images veröffentlicht, Releases gepusht
oder Deployments ausgeführt. Die lokale Containerprüfung verwendet lediglich
kurzlebige Testcontainer ohne öffentliche Ports.

## Aktualisierte Betriebsvorgaben

Keine Secret-`.env`: lokale API-Werte direkt in Compose, produktive Geheimnisse
ausschließlich in Portainer-Secrets. Hot Reload über die einzige docker-compose.yaml (nur lokale Entwicklung).
CD veröffentlicht bei jedem Push/Merge nach main beide Images als latest und
sha-<vollständiger-commit-sha>; keine Release-Tags erforderlich.
