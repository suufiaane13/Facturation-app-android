# Guide de Déploiement : AD Services

Ce guide explique comment transformer ce projet Expo en applications installables sur Android (APK) et iOS.

## 1. Prérequis

Avant de commencer, assurez-vous d'avoir :
*   Un compte [Expo.dev](https://expo.dev/) (gratuit).
*   Installé **EAS CLI** sur votre ordinateur :
    ```bash
    npm install -g eas-cli
    ```
*   Connecté votre compte dans le terminal :
    ```bash
    eas login
    ```

---

## 2. Configuration du Projet (Une seule fois)

Initialisez la configuration de build pour votre projet :
```bash
eas build:configure
```
*Cela va créer un fichier `eas.json` à la racine.*

---

## 3. Générer l'application Android (.apk)

Pour tester l'application directement sur votre téléphone Android sans passer par le Play Store :

### A. Créer un build de test (APK)
Modifiez votre fichier `eas.json` pour inclure une config de preview (si ce n'est pas déjà fait) :
```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

### B. Lancer le build
```bash
eas build -p android --profile preview
```

### C. Installation
Une fois le build terminé (environ 10-15 min sur les serveurs Expo), vous recevrez un lien pour télécharger le fichier **.apk**. Transférez-le sur votre téléphone et installez-le.

---

## 4. Générer l'application iOS

*Note : Un compte Apple Developer (99$/an) est obligatoire pour générer un fichier installable sur iOS.*

### A. Lancer le build
```bash
eas build -p ios
```

### B. Suivre les instructions
EAS vous guidera pour créer vos certificats Apple automatiquement.

---

## 5. Mise en Production (Stores)

Pour soumettre l'application sur le Google Play Store ou l'App Store :

### Pour Android (Play Store) :
```bash
eas build -p android --profile production
```
*Génère un fichier .aab.*

### Pour iOS (App Store) :
```bash
eas build -p ios --profile production
```

---

## 6. Mises à jour rapides (Over-the-Air)

Si vous modifiez juste le code Javascript (sans changer les bibliothèques natives), vous n'avez pas besoin de recréer une application. Utilisez **Expo Updates** :
```bash
npx expo export
eas update --branch main
```
Vos utilisateurs recevront la mise à jour automatiquement au prochain redémarrage de l'app.

---

## 7. Résumé des commandes utiles
*   `npx expo start` : Lancer le développement local.
*   `eas build:list` : Voir l'état de vos builds.
*   `eas build:view` : Ouvrir le dernier build dans le navigateur.
