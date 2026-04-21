# Conception UI/UX : AD Services

Cette conception vise à offrir une expérience **Premium**, **Intuitive** et **Efficace** pour les artisans sur le terrain. L'interface est pensée pour être utilisée d'une seule main avec une lisibilité maximale, même en plein soleil.

---

## 1. Identité Visuelle (Design System)

### Palette de Couleurs
Nous utilisons une palette moderne "Midnight Professional" avec des contrastes élevés pour l'accessibilité.

| Couleur | Code Hex | Usage |
| :--- | :--- | :--- |
| **Primary (Slate Blue)** | `#4F46E5` | Boutons principaux, indicateurs d'étape, liens. |
| **Success (Emerald)** | `#10B981` | Factures payées, statuts validés, totaux positifs. |
| **Warning (Amber)** | `#F59E0B` | Devis en attente, rappels. |
| **Danger (Rose)** | `#E11D48` | Factures impayées, suppression, erreurs. |
| **Background Light** | `#F8FAFC` | Fond de l'application (Mode Clair). |
| **Background Dark** | `#0F172A` | Fond de l'application (Mode Sombre). |

### Typographie
*   **Titres** : `Inter` ou `System Default` (Bold) - Pour une clarté immédiate.
*   **Corps de texte** : `Inter` (Regular) - Taille minimale 14pt pour la lisibilité sur le terrain.
*   **Chiffres/Prix** : `JetBrains Mono` ou `Roboto Mono` (Medium) - Pour un alignement parfait des montants.

---

## 2. Composants Clés

### A. Les "Smart Cards"
Les documents (devis/factures) sont présentés sous forme de cartes avec :
*   Un badge de statut coloré en haut à droite.
*   Le nom du client en gras.
*   Le montant total mis en avant.
*   Une barre de progression discrète pour les paiements partiels.

### B. Le Stepper de Création (4 Étapes)
L'interface de création occupe tout l'écran pour éviter les distractions :
1.  **Haut** : Barre de progression horizontale avec icônes (`User` -> `Tool` -> `Box` -> `Check`).
2.  **Milieu** : Zone de formulaire avec de larges champs tactiles.
3.  **Bas** : Barre d'action fixe avec boutons "Précédent" (Outlined) et "Suivant" (Contained).

### C. Accordéons de Prestations
Pour gérer de longues listes de services sur un petit écran :
*   Vue réduite : Titre + Prix total de la ligne.
*   Vue étendue : Description complète + Input Quantité/Prix Unitaire.

---

## 3. Structure des Écrans (Wireframes Conceptuels)

### Écran : Tableau de Bord (Dashboard)
*   **Header** : Message de bienvenue ("Bonjour, AD Services") + Icône Profil.
*   **Statistiques (Horizontal Scroll)** :
    *   Carte Bleue : CA du mois.
    *   Carte Rouge : Total Impayés.
    *   Carte Verte : Devis signés à convertir.
*   **Actions Rapides** : Deux gros boutons flottants "Nouveau Devis" et "Nouvelle Facture".
*   **Documents Récents** : Liste simplifiée des 5 derniers mouvements.

### Écran : Création de Document (Step 2 - Prestations)
*   Bouton "Ajouter une prestation" avec une animation de rebond (Spring).
*   Liste de cartes rétractables.
*   Swipe à gauche pour supprimer une ligne (geste naturel sur mobile).
*   Total dynamique mis à jour en temps réel en bas de l'écran.

---

## 4. Expérience Utilisateur (UX Micro-interactions)

*   **Haptic Feedback** : Vibration légère lors de la validation d'une étape ou de l'ajout d'un article.
*   **Squeleton Screens** : Affichage de formes grises animées pendant le chargement des PDF ou de la liste des clients.
*   **Empty States** : Illustrations simples ("Aucun document pour le moment") avec un bouton d'action clair au centre.
*   **Recherche Intuitive** : Filtrage en temps réel dès la première lettre saisie dans la liste client.

---

## 5. Mode Sombre (Dark Mode)
L'interface bascule automatiquement selon les réglages du téléphone.
*   Le fond devient noir profond (`#000000`) pour économiser la batterie (écrans OLED).
*   Les textes passent en blanc cassé (`#E2E8F0`) pour éviter la fatigue oculaire.
*   Les cartes utilisent un gris très foncé (`#1E293B`) avec une bordure fine pour la profondeur.
