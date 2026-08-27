# Validation du classeur Excel d’exemple

Le classeur `examples/METREXPERT_IA_PRO_exemple_V1.xlsx` a été généré avec le même générateur que les livrables de l’application. Il contient les feuilles **Couverture**, **Hypothèses**, **Géométrie**, **Contrôles**, **Métré** et **DQE**. Le total attendu pour les données fictives est de **3 129 920 FCFA**.

Le contrôle OOXML confirme que les formules de toutes les feuilles concernées sont stockées sans signe égal parasite dans la balise `<f>` : par exemple `D2*E2`, `IFERROR('Métré'!F2,0)` et `SUM(F2:F7)`. Le package XLSX passe également le test d’intégrité ZIP et le script de vérification des formules.

Une ouverture et une conversion headless par LibreOffice Calc ont réussi sans erreur ; la conversion PDF produit une page A4 pour la couverture. La revue visuelle de la page 1 montre le bandeau anthracite/or, les blocs projet/client/prestataire, le total financier dominant, les espaces de signature/tampon et l’avertissement lisible. Les valeurs longues disposent désormais d’un espace et d’une hauteur de ligne suffisants.

Microsoft Excel Desktop n’est pas installé dans le sandbox. La compatibilité Excel est donc vérifiée ici par la structure OOXML, les formules natives, le recalcul à l’ouverture et l’ouverture/conversion LibreOffice ; une ouverture finale dans Excel Desktop sur le poste de Daouda reste recommandée avant usage commercial.
