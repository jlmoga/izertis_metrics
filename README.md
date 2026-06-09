# Com llançar l'aplicació amb un Servidor Local

Aquesta aplicació guarda dades al navegador. Perquè funcioni correctament i no es perdin les dades en fer F5 (especialment en Chrome/Edge), es recomana executar-la mitjançant un servidor local en lloc d'obrir el fitxer directament.

## Instruccions

1. Assegura't de tenir **Node.js** instal·lat.
2. Obre una terminal a la carpeta del projecte.
3. Executa la següent ordre per instal·lar i llançar el servidor:
   ```bash
   npm start
   ```
4. L'aplicació s'obrirà automàticament a `http://localhost:8080`.

Si no tens Node.js, també pots utilitzar Python:
```bash
python -m http.server 8080
```
A continuació, obre el navegador a `http://localhost:8080`.

---

# config.json — Documentació

Fitxer de configuració de clients i projectes per a la facturació.

## Estructura

```jsonc
{
    "customers": [
        {
            "customer_id": "",           // Identificador del client provinent del sistema d'imputacions (ha de coincidir exactament)
            "customer_name": "",         // Nom oficial del client (usat únicament per mostrar en pantalla)
            "projects": [
                {
                    "project_id": "",                // Identificador del projecte provinent del sistema d'imputacions (ha de coincidir exactament)
                    "project_description": "",        // Descripció llarga del projecte
                    "cost_calculation": "hours|days", // Unitat de càlcul del cost: "hours" o "days"
                    "hours_per_day": 8,               // Hores per jornada (només rellevant si cost_calculation = "days")
                    "project_navision_code": "",      // Codi Navision del projecte
                    "is_time_materials": true,        // El projecte està en modalitat time & materials
                    "ok_required": true,              // El client requereix OK previ per emetre facturació
                    "list_mails_validation": "",      // Llista de correus (separats per comes) als quals s'envia la validació de facturació
                    "OMO_list_mails": "",             // Llista de destinataris de les ordres de facturació (separats per comes)
                    "validation_intro": "",           // Text previ a les dades a l'enviament de validació
                    "validation_observations": "",    // Text posterior a les dades a l'enviament de validació
                    "OMO_intro": "",                  // Text previ a les dades a l'ordre de facturació
                    "OMO_observations": ""            // Text posterior a les dades a l'ordre de facturació
                }
            ]
        }
    ]
}
```

## Notes

- `cost_calculation`: el valor `"hours|days"` indica que el camp accepta `"hours"` o `"days"`.
- `list_mails_validation` i `OMO_list_mails`: múltiples adreces separades per comes, p. ex. `"joan@izertis.com,maria@izertis.com"`.
- El fitxer `config_template.json` conté la plantilla neta per afegir nous registres.
