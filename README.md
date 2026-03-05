# Controlybot - Discord Bot Manager

Un gestionnaire de bots Discord avec interface moderne et auto-update.

## 🚀 Fonctionnalités

- Gestion complète de bots Discord
- Interface utilisateur moderne inspirée de Discord
- Système de mise à jour automatique
- Support des messages, embeds et réponses automatiques
- Gestion vocale
- Multi-plateforme (Windows, macOS, Linux)

## 📦 Installation

### Téléchargement

1. Allez sur la [page des releases](https://github.com/liloulap/controlybot/releases)
2. Téléchargez la dernière version pour votre plateforme
3. Installez l'application

### Mise à jour automatique

L'application vérifie automatiquement les mises à jour au démarrage. 
Une notification s'affichera lorsqu'une mise à jour est disponible.

## 🔧 Configuration pour les développeurs

### Prérequis

- Node.js 18+
- npm ou yarn

### Installation des dépendances

```bash
npm install
```

### Développement

```bash
npm run dev
```

### Build

```bash
npm run build
```

## 🔄 Auto-Update Configuration

Le système d'auto-update est configuré pour fonctionner avec GitHub Releases.

### Configuration GitHub

1. Créez un repository sur GitHub
2. Ajoutez un tag avec le numéro de version :
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
3. Activez GitHub Actions dans votre repository
4. Les builds seront automatiquement créés pour Windows, macOS et Linux

### Configuration Package.json

Le système est configuré avec :
- `electron-updater` pour les mises à jour
- `electron-log` pour les logs
- Configuration GitHub Releases dans `publish`

### Workflow GitHub Actions

Le fichier `.github/workflows/build.yml` automatise :
- Le build multi-plateforme
- La création de releases GitHub
- L'upload des artefacts

## 📝 Notes importantes

- Assurez-vous que votre repository est public ou que le token GitHub a les permissions nécessaires
- Les mises à jour ne fonctionnent qu'avec les versions signées/packagées
- En développement, les mises à jour ne seront pas disponibles

## 🐛 Dépannage

### La mise à jour ne fonctionne pas

1. Vérifiez que l'application est bien packagée (pas en mode dev)
2. Vérifiez la configuration dans `package.json`
3. Consultez les logs dans `~/Library/Logs/{appName}` (macOS) ou `%LOCALAPPDATA%/{appName}/logs` (Windows)

### GitHub Actions échoue

1. Vérifiez que les secrets sont configurés
2. Vérifiez que le tag est correctement formaté (vX.X.X)
3. Consultez les logs de l'action GitHub

## 📄 Licence

MIT
