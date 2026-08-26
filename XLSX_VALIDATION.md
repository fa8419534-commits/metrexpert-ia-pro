# Validation des formules XLSX

Le générateur écrit désormais les formules sans signe égal dans la propriété `f` des cellules. Par exemple, le XML interne contient `<f>D2*E2</f>`, `<f>IFERROR(&apos;Métré&apos;!F2,0)</f>` et `<f>SUM(F2:F2)</f>`.

La validation automatisée couvre deux niveaux : la relecture des formules par la bibliothèque XLSX et l’inspection directe des balises `<f>` dans les fichiers `xl/worksheets/sheet*.xml` de l’archive `.xlsx`. Le classeur de contrôle contient les feuilles `Couverture`, `Métré` et `DQE` ainsi que les formules attendues.

Microsoft Excel n’est pas installé dans cet environnement Linux : les exécutables `excel`, `microsoft-excel` et `wine` sont absents. LibreOffice est disponible, mais il n’est pas utilisé comme preuve de conformité Microsoft Excel. Une ouverture finale dans une installation réelle de Microsoft Excel reste donc à effectuer avant mise en production ; la structure XML générée est toutefois vérifiée directement et ne contient plus de signe égal initial dans les balises `<f>`.
