Cahier des Charges : AD Services (Facturation Mobile)
1. Concept Global
Une application mobile légère et intuitive destinée aux artisans et micro-entrepreneurs pour gérer leur facturation (devis et factures) directement depuis leur téléphone. L'application fonctionne en local (offline first) avec une base de données SQLite.

2. Architecture Technique
Framework : Expo (React Native) avec TypeScript.
Navigation : Expo Router (Tabs & Stack).
Base de données : SQLite géré via Drizzle ORM.
Design System : Vanilla CSS/StyleSheet avec un mode sombre (Dark Mode) automatique.
PDF : Génération de fichiers PDF professionnels via expo-print et partage via expo-sharing.
3. Fonctionnalités Principales
A. Gestion des Clients
Liste des clients avec recherche par nom/téléphone.
Fiche client : Nom, Adresse, Email, Téléphone.
Historique des documents liés à chaque client.
B. Création de Documents (Workflow Stepper)
Le processus de création (Devis ou Facture) est divisé en 4 étapes synchronisées :

Client : Sélection d'un client existant.
Prestations : Ajout de lignes de services (Titre, Description, Prix unitaire, Quantité). Cartes repliables (Accordion) pour optimiser l'espace.
Matériels : Section dédiée pour les fournitures (Nom et Prix fixe), sans gestion de stock complexe.
Récapitulatif : Application d'une remise, ajout de notes, et calcul automatique du Total Net.
C. Gestion des Documents
Devis : États (Brouillon, Envoyé, Signé, Refusé, Facturé).
Factures : États (Brouillon, En attente, Partielle, Payée, En retard).
Conversion : Transformer un devis signé en facture en un seul clic.
Numérotation : Génération automatique des numéros (ex: DEV-2024-001).
D. Export & PDF
Génération d'un PDF professionnel incluant :
En-tête de l'entreprise (nom, logo, contact).
Détails du client et du document.
Section distincte pour les Prestations et les Matériels.
Totaux (Brut, Remise, Net).
Partage immédiat (WhatsApp, Email, etc.).
E. Catalogue de Services
Possibilité de pré-enregistrer des prestations types pour les ajouter rapidement lors de la création d'un document.
4. Structure des Pages (Screens)
Navigation par Onglets (Tabs)
Tableau de Bord : Statistiques (Chiffre d'affaires, devis en attente, factures impayées).
Documents : Liste des devis et factures avec filtres par statut.
Clients : Gestion de l'annuaire client.
Paramètres : Configuration de l'entreprise (Nom, SIRET, logo, adresse).
Écrans de Flux (Stack)
Nouveau Devis / Nouvelle Facture : L'interface avec le stepper en 4 étapes.
Détail du Document : Visualisation complète d'un devis/facture avec les boutons d'actions (Exporter PDF, Changer le statut, Enregistrer un paiement).
Nouveau Paiement : Enregistrer un règlement pour une facture.
5. Modèle de Données (Schéma DB)
Clients : id, name, address, email, phone, is_archived.
Quotes (Devis) : id, quote_number, client_id, status, subtotal, discount, total, materials (JSON), notes.
Invoices (Factures) : id, invoice_number, client_id, quote_id, status, total, amount_paid, balance_due, materials (JSON).
LineItems : id, doc_id, title, description, unit_price, quantity, total.
Catalog : id, title, description, default_price.