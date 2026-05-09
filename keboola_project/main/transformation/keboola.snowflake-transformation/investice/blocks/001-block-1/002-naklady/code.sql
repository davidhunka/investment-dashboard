DELETE
FROM HLAVNI_UCET
WHERE "Datum_zauctovani" = '';

DELETE
FROM KREDITKA
WHERE "Datum_zauctovani" = '';

CREATE OR REPLACE TABLE TRANSAKCE_DATA AS
SELECT 'Hlavni účet'                               AS TYP_UCTU,
       (ROK || '-' || MESIC || '-' || DEN) :: DATE AS DATUM_ZUCTOVANI,
       "Nazev_protiuctu"                           AS NAZEV_PROTIUCTU,
       IBAN,
       "Protiucet",
       "Bankovni_kod_protiuctu",
       "Prichozi_castka",
       "Odchozi_castka",
       "Mena",
       "Konstantni_symbol",
       "Specificky_symbol",
       "Variabilni_symbol",
       "Typ_transakce",
       "Zprava_pro_me",
       "Zprava_pro_prijemce",
       "Adresa_prijemce",
       "Kategorie",
       "ID_transakce",
       "Cislo_karty",
       "Misto_pouziti_karty",
       "Nazev_prikazu_souhlasu"
FROM HLAVNI_UCET
UNION ALL
SELECT 'Kreditka'                                  AS TYP_UCTU,
       (ROK || '-' || MESIC || '-' || DEN) :: DATE AS DATUM_ZUCTOVANI,
       "Nazev_protiuctu"                           AS NAZEV_PROTIUCTU,
       IBAN,
       "Protiucet",
       "Bankovni_kod_protiuctu",
       "Prichozi_castka",
       "Odchozi_castka",
       "Mena",
       "Konstantni_symbol",
       "Specificky_symbol",
       "Variabilni_symbol",
       "Typ_transakce",
       "Zprava_pro_me",
       "Zprava_pro_prijemce",
       "Adresa_prijemce",
       "Kategorie",
       "ID_transakce",
       "Cislo_karty",
       "Misto_pouziti_karty",
       "Nazev_prikazu_souhlasu"
FROM KREDITKA;
