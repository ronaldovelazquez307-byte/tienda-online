"""
Actualiza products.json con el precio del día del oro y la plata + 200% de margen.

Fuentes usadas (ambas gratuitas, SIN necesidad de API key):
  - https://api.gold-api.com/price/XAU   -> precio del oro, USD por onza troy
  - https://api.gold-api.com/price/XAG   -> precio de la plata, USD por onza troy
  - https://api.frankfurter.dev/v1/latest?base=USD&symbols=MXN -> tipo de cambio USD->MXN

Fórmula (igual a la que hemos usado a mano, ahora automática):
  precio_onza_usd -> precio_gramo_usd (÷31.1035) -> precio_gramo_mxn (×tipo de cambio)
  -> precio_gramo_mxn_por_pureza (×0.417 para 10K, ×0.585 para 14K, ×0.925 para plata .925)
  -> precio_final_con_margen (×3.0, o sea +200%)

Pensado para correr una vez al día vía GitHub Actions (ver
.github/workflows/actualizar-precios.yml). También se puede correr a mano:
    python actualizar_precios.py
"""

import json
import sys
import urllib.request

OZ_A_GRAMOS = 31.1035
MARGEN = 3.0  # 200% de margen = precio x3

PUREZA = {
    "oro-10k": 0.417,
    "oro-14k": 0.585,
    "plata-925": 0.925,
}


def obtener_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": "AurumLey/1.0"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode("utf-8"))


def precio_onza_usd(symbol):
    """Consulta gold-api.com y busca el campo de precio sin importar el nombre exacto."""
    data = obtener_json(f"https://api.gold-api.com/price/{symbol}")
    for campo in ("price", "rate", "value", "price_usd"):
        if campo in data:
            return float(data[campo])
    raise RuntimeError(f"No encontré el precio en la respuesta de {symbol}: {data}")


def tipo_cambio_usd_mxn():
    data = obtener_json("https://api.frankfurter.dev/v1/latest?base=USD&symbols=MXN")
    return float(data["rates"]["MXN"])


def main():
    print("Consultando precio del oro (XAU)...")
    oro_oz_usd = precio_onza_usd("XAU")
    print(f"  -> ${oro_oz_usd:,.2f} USD/oz")

    print("Consultando precio de la plata (XAG)...")
    plata_oz_usd = precio_onza_usd("XAG")
    print(f"  -> ${plata_oz_usd:,.2f} USD/oz")

    print("Consultando tipo de cambio USD -> MXN...")
    tc = tipo_cambio_usd_mxn()
    print(f"  -> ${tc:,.4f} MXN por USD")

    oro_gramo_puro_mxn = (oro_oz_usd / OZ_A_GRAMOS) * tc
    plata_gramo_puro_mxn = (plata_oz_usd / OZ_A_GRAMOS) * tc

    precio_gramo = {
        "oro-10k": round(oro_gramo_puro_mxn * PUREZA["oro-10k"] * MARGEN, 2),
        "oro-14k": round(oro_gramo_puro_mxn * PUREZA["oro-14k"] * MARGEN, 2),
        "plata-925": round(plata_gramo_puro_mxn * PUREZA["plata-925"] * MARGEN, 2),
    }

    print("\nPrecio por gramo hoy (con margen del 200%):")
    for material, precio in precio_gramo.items():
        print(f"  {material}: ${precio:,.2f} MXN/g")

    with open("products.json", "r", encoding="utf-8") as f:
        products = json.load(f)

    variantes_actualizadas = 0
    for producto in products:
        for variante in producto["variantes"]:
            precio_g = precio_gramo[variante["material"]]
            variante["precio"] = round(variante["peso"] * precio_g / 10) * 10
            variantes_actualizadas += 1

    with open("products.json", "w", encoding="utf-8") as f:
        json.dump(products, f, ensure_ascii=False, indent=2)

    print(f"\n{variantes_actualizadas} variantes actualizadas en products.json")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"ERROR al actualizar precios: {e}", file=sys.stderr)
        sys.exit(1)
