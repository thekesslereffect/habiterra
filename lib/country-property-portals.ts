/**
 * Curated primary listing / portal sites by ISO 3166-1 alpha-2.
 * Not exhaustive; unknown codes fall back to a generic web search.
 * Links are home or search entry points — verify locally before relying on them.
 */
import {
  realtorCountySearchUrl,
  zillowCountyUrl,
} from "@/lib/constants"

export type PropertyPortal = { label: string; url: string }

const CURATED: Partial<Record<string, PropertyPortal[]>> = {
  US: [
    { label: "Realtor.com", url: "https://www.realtor.com/" },
    { label: "Zillow", url: "https://www.zillow.com/" },
  ],
  CA: [
    { label: "Realtor.ca", url: "https://www.realtor.ca/" },
    { label: "Zolo", url: "https://www.zolo.ca/" },
  ],
  GB: [
    { label: "Rightmove", url: "https://www.rightmove.co.uk/" },
    { label: "Zoopla", url: "https://www.zoopla.co.uk/" },
  ],
  IE: [{ label: "Daft.ie", url: "https://www.daft.ie/" }],
  AU: [
    { label: "realestate.com.au", url: "https://www.realestate.com.au/" },
    { label: "Domain", url: "https://www.domain.com.au/" },
  ],
  NZ: [{ label: "Trade Me Property", url: "https://www.trademe.co.nz/a/property" }],
  DE: [
    { label: "ImmobilienScout24", url: "https://www.immobilienscout24.de/" },
    { label: "ImmoWelt", url: "https://www.immowelt.de/" },
  ],
  AT: [{ label: "Willhaben", url: "https://www.willhaben.at/iad/immobilien" }],
  CH: [{ label: "Homegate", url: "https://www.homegate.ch/" }],
  FR: [
    { label: "SeLoger", url: "https://www.seloger.com/" },
    { label: "Leboncoin (immobilier)", url: "https://www.leboncoin.fr/ventes_immobilieres/" },
  ],
  ES: [
    { label: "Idealista", url: "https://www.idealista.com/" },
    { label: "Fotocasa", url: "https://www.fotocasa.es/" },
  ],
  PT: [{ label: "Idealista", url: "https://www.idealista.pt/" }],
  IT: [{ label: "Immobiliare.it", url: "https://www.immobiliare.it/" }],
  NL: [{ label: "Funda", url: "https://www.funda.nl/" }],
  BE: [{ label: "Immoweb", url: "https://www.immoweb.be/" }],
  LU: [{ label: "Immotop", url: "https://www.immotop.lu/" }],
  SE: [{ label: "Hemnet", url: "https://www.hemnet.se/" }],
  NO: [{ label: "FINN", url: "https://www.finn.no/realestate/homes/search.html" }],
  DK: [{ label: "Boligsiden", url: "https://www.boligsiden.dk/" }],
  FI: [{ label: "Oikotie", url: "https://asunnot.oikotie.fi/" }],
  PL: [{ label: "Otodom", url: "https://www.otodom.pl/" }],
  CZ: [{ label: "Sreality", url: "https://www.sreality.cz/" }],
  SK: [{ label: "Reality.sk", url: "https://www.reality.sk/" }],
  HU: [{ label: "Ingatlan.com", url: "https://ingatlan.com/" }],
  RO: [{ label: "Imobiliare.ro", url: "https://www.imobiliare.ro/" }],
  BG: [{ label: "Imot.bg", url: "https://www.imot.bg/" }],
  GR: [{ label: "Xe.gr", url: "https://www.xe.gr/property" }],
  TR: [{ label: "Sahibinden", url: "https://www.sahibinden.com/" }],
  IL: [{ label: "Yad2", url: "https://www.yad2.co.il/realestate/forsale" }],
  AE: [
    { label: "Bayut", url: "https://www.bayut.com/" },
    { label: "Property Finder", url: "https://www.propertyfinder.ae/" },
  ],
  SA: [{ label: "Bayut KSA", url: "https://www.bayut.sa/" }],
  IN: [
    { label: "MagicBricks", url: "https://www.magicbricks.com/" },
    { label: "99acres", url: "https://www.99acres.com/" },
  ],
  JP: [
    { label: "SUUMO", url: "https://suumo.jp/" },
    { label: "LIFULL HOME'S", url: "https://www.homes.co.jp/" },
  ],
  KR: [{ label: "Naver 부동산", url: "https://land.naver.com/" }],
  CN: [{ label: "链家 Lianjia", url: "https://lianjia.com/" }],
  TW: [{ label: "591 房屋交易", url: "https://sale.591.com.tw/" }],
  HK: [{ label: "Squarefoot", url: "https://www.squarefoot.com.hk/" }],
  SG: [{ label: "PropertyGuru", url: "https://www.propertyguru.com.sg/" }],
  MY: [{ label: "iProperty", url: "https://www.iproperty.com.my/" }],
  TH: [{ label: "DDproperty", url: "https://www.ddproperty.com/" }],
  PH: [{ label: "Lamudi", url: "https://www.lamudi.com.ph/" }],
  ID: [{ label: "Rumah123", url: "https://www.rumah123.com/" }],
  VN: [{ label: "Batdongsan", url: "https://batdongsan.com.vn/" }],
  BR: [
    { label: "ZAP Imóveis", url: "https://www.zapimoveis.com.br/" },
    { label: "VivaReal", url: "https://www.vivareal.com.br/" },
  ],
  MX: [{ label: "Inmuebles24", url: "https://www.inmuebles24.com/" }],
  AR: [{ label: "Zonaprop", url: "https://www.zonaprop.com.ar/" }],
  CL: [{ label: "Portal Inmobiliario", url: "https://www.portalinmobiliario.com/" }],
  CO: [{ label: "Finca Raíz", url: "https://www.fincaraiz.com.co/" }],
  PE: [{ label: "Adondevivir", url: "https://www.adondevivir.com/" }],
  ZA: [{ label: "Property24", url: "https://www.property24.com/" }],
  EG: [{ label: "Property Finder", url: "https://www.propertyfinder.eg/" }],
  NG: [{ label: "PropertyPro", url: "https://www.propertypro.ng/" }],
  KE: [{ label: "BuyRentKenya", url: "https://www.buyrentkenya.com/" }],
  RU: [{ label: "ЦИАН", url: "https://cian.ru/" }],
  UA: [{ label: "DomRIA", url: "https://dom.ria.com/" }],
}

function searchFallback(countryName: string): PropertyPortal[] {
  const q = encodeURIComponent(`${countryName} real estate listings buy`)
  return [
    {
      label: "Search listings (web)",
      url: `https://duckduckgo.com/?q=${q}`,
    },
  ]
}

export function getPropertyPortalsForCountry(
  iso2: string,
  countryName: string,
): PropertyPortal[] {
  const code = iso2.toUpperCase()
  const list = CURATED[code]
  if (list?.length) return list
  return searchFallback(countryName)
}

export function getPropertyPortalsForUsCounty(
  countyName: string,
  stateAbbr: string,
): PropertyPortal[] {
  return [
    { label: "Realtor.com", url: realtorCountySearchUrl(countyName, stateAbbr) },
    { label: "Zillow", url: zillowCountyUrl(countyName, stateAbbr) },
  ]
}
